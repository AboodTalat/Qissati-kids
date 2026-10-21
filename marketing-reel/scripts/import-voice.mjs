import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '@huggingface/transformers';
import { canUseWhisperWebGpu, downloadWhisperModel, loadWhisperModel, transcribe, toCaptions } from '@remotion/whisper-webgpu';

// Import a narration take you generated yourself (e.g. in the ElevenLabs app) and
// write measured captions from it (bible §7–8).
//
//   node scripts/import-voice.mjs r26 /absolute/path/take.mp3 [--duration=20] [--test]
//
//   1. keeps the untouched take as public/<reel>/voice-source.<ext>
//   2. writes public/<reel>/voice.wav — 48 kHz mono, −16 LUFS, −1 dBTP (level only,
//      timing untouched)
//   3. measures word timings on that exact WAV with local Whisper small (Arabic)
//   4. aligns the SCRIPT (public/<reel>/voiceover.txt) to Whisper's timed letters,
//      ignoring tashkeel, punctuation and alef/ya/ta-marbuta spelling variants, so
//      every script word gets the time of its own letters even when Whisper spells
//      or splits it differently; words it cannot place are reported, never invented
//   5. writes src/<reel>/captions.json (page breaks copied from captions-planned.json)
//      and src/<reel>/voice-timing.json (hashes, coverage, last-word time)
//
// --test writes everything under out/voice-test/<reel>/ instead, touching nothing
// in public/ or src/. Review the result against the waveform before delivery.

// Flags may come before or after the take path (`npm run voice:r26 -- take.mp3`).
const [reel, takePath] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!/^r\d+$/.test(reel ?? '') || !takePath) throw new Error('Usage: node scripts/import-voice.mjs r26 /absolute/path/take.mp3 [--duration=20] [--test]');
const test = process.argv.includes('--test');
const durationSeconds = Number(process.argv.find((a) => a.startsWith('--duration='))?.slice(11) ?? 20);
const project = fileURLToPath(new URL('../', import.meta.url));
const pubDir = test ? resolve(project, `out/voice-test/${reel}`) : resolve(project, `public/${reel}`);
const srcDir = test ? pubDir : resolve(project, `src/${reel}`);
mkdirSync(pubDir, { recursive: true });

const script = readFileSync(resolve(project, `public/${reel}/voiceover.txt`), 'utf8').trim();
const planned = JSON.parse(readFileSync(resolve(project, `src/${reel}/captions-planned.json`), 'utf8'));
const scriptWords = script.split(/\s+/);
if (planned.length !== scriptWords.length) throw new Error(`captions-planned.json has ${planned.length} words; the script has ${scriptWords.length}.`);

// 1–2. Keep the original; normalise a copy (two-pass loudnorm, linear, so level only).
const sourceFile = resolve(pubDir, `voice-source${extname(takePath).toLowerCase() || '.mp3'}`);
copyFileSync(takePath, sourceFile);
const wavFile = resolve(pubDir, 'voice.wav');
const measure = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', sourceFile, '-af', 'loudnorm=I=-16:TP=-1:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' });
const loud = JSON.parse(measure.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
const norm = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', sourceFile, '-af',
  `loudnorm=I=-16:TP=-1:LRA=11:measured_I=${loud.input_i}:measured_TP=${loud.input_tp}:measured_LRA=${loud.input_lra}:measured_thresh=${loud.input_thresh}:offset=${loud.target_offset}:linear=true,aresample=48000`,
  '-ac', '1', '-c:a', 'pcm_s16le', wavFile], { encoding: 'utf8' });
if (norm.status !== 0) throw new Error(`ffmpeg failed: ${norm.stderr}`);

// 3. Whisper word timings on the exact final WAV.
env.cacheDir = resolve(project, 'out/whisper-cache/');
const decoded = spawnSync('ffmpeg', ['-v', 'error', '-i', wavFile, '-ar', '16000', '-ac', '1', '-f', 'f32le', 'pipe:1'], { maxBuffer: 64 * 1024 * 1024 });
if (decoded.status !== 0) throw new Error(decoded.stderr.toString());
const raw = decoded.stdout;
const waveform = new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
const support = await canUseWhisperWebGpu();
if (!support.supported) throw new Error(support.detailedReason);
await downloadWhisperModel({ model: 'small', onProgress: () => {} });
await using modelHandle = await loadWhisperModel({ model: 'small' });
void modelHandle;
const result = await transcribe({ channelWaveform: waveform, model: 'small', language: 'ar', task: 'transcribe', doSample: false });
const { captions: heard } = toCaptions({ whisperWebGpuOutput: result });
writeFileSync(resolve(srcDir === pubDir ? pubDir : resolve(project, 'out'), `${reel}-whisper-raw.json`), `${JSON.stringify({ text: result.text, heard }, null, 2)}\n`);

// 4. Letter-level alignment of the script to what Whisper heard.
const fold = (s) => s
  .replace(/[ً-ْٰـ]/g, '')            // tashkeel, dagger alef, tatweel
  .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
  .replace(/[^\p{L}\p{N}]/gu, '');                         // punctuation, spaces, guillemets
// Whisper letters, each with a time interpolated across its word.
const heardLetters = [];
for (const w of heard) {
  const letters = [...fold(w.text)];
  letters.forEach((ch, i) => {
    const a = w.startMs + ((w.endMs - w.startMs) * i) / letters.length;
    const b = w.startMs + ((w.endMs - w.startMs) * (i + 1)) / letters.length;
    heardLetters.push({ ch, startMs: a, endMs: b });
  });
}
const scriptLetters = [];
scriptWords.forEach((w, wi) => [...fold(w)].forEach((ch) => scriptLetters.push({ ch, wi })));
// Levenshtein alignment (script ~150 letters → small table).
const n = scriptLetters.length, m = heardLetters.length;
const cost = Array.from({ length: n + 1 }, (_, i) => Int32Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
  const sub = cost[i - 1][j - 1] + (scriptLetters[i - 1].ch === heardLetters[j - 1].ch ? 0 : 1);
  cost[i][j] = Math.min(sub, cost[i - 1][j] + 1, cost[i][j - 1] + 1);
}
const matchOf = new Array(n).fill(-1), exact = new Array(n).fill(false);
for (let i = n, j = m; i > 0 && j > 0;) {
  const same = scriptLetters[i - 1].ch === heardLetters[j - 1].ch;
  if (cost[i][j] === cost[i - 1][j - 1] + (same ? 0 : 1)) { matchOf[i - 1] = j - 1; exact[i - 1] = same; i--; j--; }
  else if (cost[i][j] === cost[i - 1][j] + 1) i--;
  else j--;
}
const words = scriptWords.map((text, wi) => {
  const idx = scriptLetters.map((l, k) => (l.wi === wi ? k : -1)).filter((k) => k >= 0);
  const matched = idx.filter((k) => matchOf[k] >= 0);
  const coverage = idx.length ? idx.filter((k) => exact[k]).length / idx.length : 0;
  if (!matched.length) return { text, startMs: null, endMs: null, coverage };
  return { text, startMs: heardLetters[matchOf[matched[0]]].startMs, endMs: heardLetters[matchOf[matched[matched.length - 1]]].endMs, coverage };
});
// A word with no matched letters sits between its neighbours; it is flagged below.
words.forEach((w, i) => {
  if (w.startMs !== null) return;
  const prev = words.slice(0, i).reverse().find((x) => x.endMs !== null);
  const next = words.slice(i + 1).find((x) => x.startMs !== null);
  w.startMs = prev ? prev.endMs : 0;
  w.endMs = next ? next.startMs : w.startMs + 400;
});
// Keep words in order and non-overlapping.
for (let i = 1; i < words.length; i++) if (words[i].startMs < words[i - 1].endMs) words[i].startMs = words[i - 1].endMs;

const captions = words.map((w, i) => ({
  text: (i ? ' ' : '') + w.text,
  startMs: Math.round(w.startMs), endMs: Math.round(Math.max(w.endMs, w.startMs + 80)),
  timestampMs: Math.round((w.startMs + w.endMs) / 2), confidence: Number(w.coverage.toFixed(2)),
  ...(planned[i].pageBreakAfter ? { pageBreakAfter: true } : {}),
}));
writeFileSync(resolve(srcDir, 'captions.json'), `${JSON.stringify(captions, null, 2)}\n`);

// 5. Provenance and the end-of-narration rule.
const weak = words.map((w, i) => ({ i, text: w.text, coverage: w.coverage })).filter((w) => w.coverage < 0.6);
const last = captions[captions.length - 1].endMs / 1000;
const wavBytes = readFileSync(wavFile);
const timing = {
  reel: reel.toUpperCase(), status: 'measured with local Whisper small on the final WAV; review phrase edges against the waveform before delivery',
  take: { file: takePath, sourceSha256: createHash('sha256').update(readFileSync(sourceFile)).digest('hex') },
  finalSha256: createHash('sha256').update(wavBytes).digest('hex'),
  sourceLoudness: { integratedLufs: Number(loud.input_i), truePeakDbtp: Number(loud.input_tp) },
  whisperText: result.text, words: words.length,
  firstWordStartSeconds: captions[0].startMs / 1000, lastWordEndSeconds: last, mustEndBySeconds: durationSeconds - 2,
  weakWords: weak,
};
writeFileSync(resolve(srcDir, 'voice-timing.json'), `${JSON.stringify(timing, null, 2)}\n`);
console.log(JSON.stringify({ ...timing, take: undefined }, null, 2));
if (weak.length) console.warn(`${weak.length} word(s) matched under 60% of their letters; check them by ear: ${weak.map((w) => w.text).join('، ')}`);
if (last > durationSeconds - 2) { console.error(`Narration ends at ${last.toFixed(2)} s, inside the final 2 s.`); process.exitCode = 1; }
