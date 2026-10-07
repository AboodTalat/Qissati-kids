import { readFileSync, writeFileSync, copyFileSync, renameSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Import the actual ElevenLabs take with its measured word timestamps.
// Never turn the playbook's target cadence into purported audio alignment.
const [source, alignmentPath] = process.argv.slice(2);
if (!source || !alignmentPath) {
  throw new Error('Usage: npm run voice:r14 -- /absolute/final.wav /absolute/alignment.json\nAlignment: Remotion Caption[] or ElevenLabs forced-alignment {words:[{text,start,end}]}, in source-audio time.');
}
const root = new URL('../', import.meta.url);
const asset = (name) => fileURLToPath(new URL(`public/r14/${name}`, root));
const code = (name) => fileURLToPath(new URL(`src/r14/${name}`, root));
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr}`);
  return result.stdout.trim();
};
const duration = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', source]));
const sourceHash = createHash('sha256').update(readFileSync(source)).digest('hex');
if (!Number.isFinite(duration) || duration <= 0) throw new Error('Invalid source duration');
const speed = Math.max(1, duration / 16.85);
if (speed > 1.25) throw new Error('This take requires more than 25% acceleration. Record a shorter complete take; no words will be cut.');
const script = readFileSync(asset('voiceover.txt'), 'utf8').trim().split(/\s+/u);
const normalize = (word) => word.replace(/[\u064b-\u065f\u0670\u0640]/gu, '').replace(/[أإآ]/gu, 'ا').replace(/ى/gu, 'ي').replace(/[^\p{L}\p{N}]/gu, '');
const input = JSON.parse(readFileSync(alignmentPath, 'utf8'));
const measured = Array.isArray(input) ? input : input.words;
if (!Array.isArray(measured)) throw new Error('Missing word-level alignment');
const words = measured.filter((word) => normalize(word.text ?? '').length).map((word) => ({
  text: word.text,
  startMs: word.startMs ?? word.start * 1000,
  endMs: word.endMs ?? word.end * 1000,
}));
const measuredScript = words.flatMap((word) => word.text.trim().split(/\s+/u));
if (measuredScript.length !== script.length || measuredScript.some((word, i) => normalize(word) !== normalize(script[i]))) {
  throw new Error('Measured alignment does not match every approved script word in order. Review the alignment spelling/grouping before importing.');
}
let previousEnd = 0;
for (const word of words) {
  if (!Number.isFinite(word.startMs) || !Number.isFinite(word.endMs) || word.startMs < previousEnd - 1 || word.endMs <= word.startMs || word.endMs > duration * 1000 + 50) {
    throw new Error('Invalid/overlapping source-word timestamps');
  }
  previousEnd = word.endMs;
}
const plan = JSON.parse(readFileSync(code('captions-planned.json'), 'utf8'));
let scriptOffset = 0;
// Preserve a measured multi-word interval when ASR combines connected Arabic
// speech. Do not invent a boundary inside that interval.
const captions = words.map((word) => {
  const count = word.text.trim().split(/\s+/u).length;
  const text = script.slice(scriptOffset, scriptOffset + count).join(' ');
  scriptOffset += count;
  return {
  text,
  startMs: Math.round(word.startMs / speed),
  endMs: Math.round(word.endMs / speed),
  timestampMs: Math.round((word.startMs + word.endMs) / speed / 2),
  confidence: null,
  ...(plan[scriptOffset - 1].pageBreakAfter ? { pageBreakAfter: true } : {}),
  };
});
if (captions.at(-1).endMs >= 17000) throw new Error('Narration reaches the final two seconds');
const temp = asset('voice-prepared.tmp.wav');
try {
  run('ffmpeg', ['-hide_banner', '-y', '-i', source, '-af', `atempo=${speed.toFixed(9)},loudnorm=I=-18:TP=-2:LRA=7`, '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', temp]);
  // Source stays intact for future alignment reviews and alternate mixes.
  if (resolve(source) !== resolve(asset('voice-source.wav'))) copyFileSync(source, asset('voice-source.wav'));
  renameSync(temp, asset('voice.wav'));
} catch (error) {
  try { unlinkSync(temp); } catch { /* No partial file to clean. */ }
  throw error;
}
writeFileSync(code('captions.json'), JSON.stringify(captions, null, 2) + '\n');
writeFileSync(code('voice-timing.json'), JSON.stringify({
  aligned: true,
  status: 'Measured alignment imported; review against the final WAV in Studio',
  voiceDurationMs: Math.round(duration / speed * 1000),
  finalWordEndMs: captions.at(-1).endMs,
  alignedWordCount: script.length,
  captionCount: captions.length,
  alignmentSource: 'Measured source-audio intervals; connected words retain a shared interval',
  speed,
  sourceSha256: sourceHash,
  finalSha256: createHash('sha256').update(readFileSync(asset('voice.wav'))).digest('hex'),
}, null, 2) + '\n');
console.log(`R14 voice prepared: ${script.length} script words in ${captions.length} measured intervals; final word at ${captions.at(-1).endMs}ms. Enable voice in R14's defaultProps after listening in Studio.`);
