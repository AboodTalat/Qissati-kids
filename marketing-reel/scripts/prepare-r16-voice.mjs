import { readFileSync, writeFileSync, copyFileSync, renameSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { extname, resolve } from 'node:path';

const [source, alignmentPath] = process.argv.slice(2);
if (!source || !alignmentPath) throw new Error('Usage: npm run voice:r16 -- /absolute/take.wav /absolute/measured-alignment.json\nUse source-relative Remotion Caption[] or ElevenLabs {words:[{text,start,end}]}.');
const root = new URL('../', import.meta.url);
const asset = (name) => fileURLToPath(new URL(`public/r16/${name}`, root));
const code = (name) => fileURLToPath(new URL(`src/r16/${name}`, root));
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr}`);
  return result.stdout.trim();
};
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const duration = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', source]));
if (!Number.isFinite(duration) || duration <= 0) throw new Error('Invalid recording duration');
const speed = Math.max(1, duration / 19.8);
if (speed > 1.25) throw new Error('A shorter complete take is needed: this take requires more than 25% acceleration. No words will be cut.');
const script = readFileSync(asset('voiceover.txt'), 'utf8').trim().split(/\s+/u);
const normalize = (word) => word.replace(/[\u064b-\u065f\u0670\u0640]/gu, '').replace(/[أإآ]/gu, 'ا').replace(/ى/gu, 'ي').replace(/[^\p{L}\p{N}]/gu, '');
const input = JSON.parse(readFileSync(alignmentPath, 'utf8'));
const measured = Array.isArray(input) ? input : input.words ?? input.captions;
if (!Array.isArray(measured)) throw new Error('Missing measured word alignment');
const words = measured.filter((w) => normalize(w.text ?? '').length).map((w) => ({
  text: w.text, startMs: w.startMs ?? w.start * 1000, endMs: w.endMs ?? w.end * 1000,
  pageBreakAfter: w.pageBreakAfter,
}));
const recognized = words.flatMap((w) => w.text.trim().split(/\s+/u));
if (recognized.length !== script.length || recognized.some((w, i) => normalize(w) !== normalize(script[i]))) throw new Error('Alignment must match every approved script word in order. Reconcile recognition spellings and connected-word grouping against the recording first.');
let previousEnd = 0;
for (const word of words) {
  if (!Number.isFinite(word.startMs) || !Number.isFinite(word.endMs) || word.startMs < previousEnd - 1 || word.endMs <= word.startMs || word.endMs > duration * 1000 + 50) throw new Error('Invalid or overlapping measured intervals');
  previousEnd = word.endMs;
}
let offset = 0, pageWords = 0;
const captions = words.map((word, i) => {
  const count = word.text.trim().split(/\s+/u).length;
  const text = script.slice(offset, offset + count).join(' ');
  offset += count; pageWords += count;
  const pageBreakAfter = word.pageBreakAfter ?? (pageWords >= 3 || /[،.؟]$/u.test(text) || i === words.length - 1);
  if (pageBreakAfter) pageWords = 0;
  return { text: `${i ? ' ' : ''}${text}`, startMs: Math.round(word.startMs / speed), endMs: Math.round(word.endMs / speed), timestampMs: Math.round((word.startMs + word.endMs) / speed / 2), confidence: null, ...(pageBreakAfter ? { pageBreakAfter: true } : {}) };
});
if (captions.at(-1).endMs >= 20000) throw new Error('Narration enters the final two-second question hold');
const sourceHash = hash(source);
const temp = asset('voice-prepared.tmp.wav');
try {
  run('ffmpeg', ['-hide_banner', '-y', '-i', source, '-af', `atempo=${speed.toFixed(9)},loudnorm=I=-18:TP=-2:LRA=7`, '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', temp]);
  const original = asset(`voice-source${extname(source).toLowerCase() || '.wav'}`);
  if (resolve(source) !== resolve(original)) copyFileSync(source, original);
  copyFileSync(alignmentPath, asset('voice-source-alignment.json'));
  renameSync(temp, asset('voice.wav'));
} catch (error) { try { unlinkSync(temp); } catch { /* no partial file */ } throw error; }
writeFileSync(code('captions.json'), JSON.stringify(captions, null, 2) + '\n');
const finalDuration = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', asset('voice.wav')]));
writeFileSync(code('voice-timing.json'), JSON.stringify({
  aligned: true, status: 'Measured source intervals mapped through pitch-preserving preparation. Review against final WAV before enabling voice.',
  alignedWordCount: script.length, captionCount: captions.length,
  sourceDurationMs: Math.round(duration * 1000), voiceDurationMs: Math.round(finalDuration * 1000), finalWordEndMs: captions.at(-1).endMs,
  alignmentSource: 'Measured source recording; connected words retain shared intervals',
  speed, sourceSha256: sourceHash, finalSha256: hash(asset('voice.wav')),
}, null, 2) + '\n');
console.log(`Prepared ${script.length} script words in ${captions.length} measured intervals. Final word ${captions.at(-1).endMs}ms; duration remains 660 frames. Review the final WAV in Studio, then enable voice.`);
