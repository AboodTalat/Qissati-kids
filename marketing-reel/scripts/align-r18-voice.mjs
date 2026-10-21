import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const alignmentPath = process.argv[2];
if (!alignmentPath) throw new Error('Usage: npm run align:r18 -- /absolute/reviewed-final-wav-alignment.json');
const root = new URL('../', import.meta.url);
const asset = (name) => fileURLToPath(new URL(`public/r18/${name}`, root));
const code = (name) => fileURLToPath(new URL(`src/r18/${name}`, root));
const hash = createHash('sha256').update(readFileSync(asset('voice.wav'))).digest('hex');
const previous = JSON.parse(readFileSync(code('voice-timing.json'), 'utf8'));
if (previous.finalSha256 !== hash) throw new Error('The final WAV has changed. Prepare the new take before aligning it.');
const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', asset('voice.wav')], { encoding: 'utf8' });
const duration = Number(probe.stdout);
if (probe.status !== 0 || !Number.isFinite(duration) || duration <= 0 || duration >= 18) throw new Error('Final WAV must finish before 18 seconds.');
const normalize = (word) => word.replace(/[\u064b-\u065f\u0670\u0640]/gu, '').replace(/[أإآ]/gu, 'ا').replace(/ى/gu, 'ي').replace(/[^\p{L}\p{N}]/gu, '');
const script = readFileSync(asset('voiceover.txt'), 'utf8').trim().split(/\s+/u);
const input = JSON.parse(readFileSync(alignmentPath, 'utf8'));
const measured = Array.isArray(input) ? input : input.words ?? input.captions;
if (!Array.isArray(measured)) throw new Error('Missing measured final-WAV intervals.');
if (input.finalSha256 && input.finalSha256 !== hash) throw new Error('Alignment refers to a different WAV.');
const words = measured.filter((w) => normalize(w.text ?? '').length).map((w) => ({ text: w.text, startMs: w.startMs ?? w.start * 1000, endMs: w.endMs ?? w.end * 1000, pageBreakAfter: w.pageBreakAfter }));
const recognized = words.flatMap((word) => word.text.trim().split(/\s+/u));
if (recognized.length !== script.length || recognized.some((word, i) => normalize(word) !== normalize(script[i]))) throw new Error('Every approved script word must be present in order. Review recognition spellings against the final WAV first.');
let previousEnd = 0, offset = 0, pageWords = 0;
const captions = words.map((word, i) => {
  if (!Number.isFinite(word.startMs) || !Number.isFinite(word.endMs) || word.startMs < previousEnd - 1 || word.endMs <= word.startMs || word.endMs > duration * 1000 + 30 || word.endMs >= 18000) throw new Error('Invalid, overlapping or late final-WAV intervals.');
  previousEnd = word.endMs;
  const count = word.text.trim().split(/\s+/u).length;
  const text = script.slice(offset, offset + count).join(' ');
  offset += count; pageWords += count;
  const pageBreakAfter = word.pageBreakAfter ?? (pageWords >= 3 || /[،.؟]$/u.test(text) || i === words.length - 1);
  if (pageBreakAfter) pageWords = 0;
  return { text: `${i ? ' ' : ''}${text}`, startMs: Math.round(word.startMs), endMs: Math.round(word.endMs), timestampMs: Math.round((word.startMs + word.endMs) / 2), confidence: null, ...(pageBreakAfter ? { pageBreakAfter: true } : {}) };
});
if (resolve(alignmentPath) !== resolve(asset('voice-final-alignment.json'))) copyFileSync(alignmentPath, asset('voice-final-alignment.json'));
writeFileSync(code('captions.json'), JSON.stringify(captions, null, 2) + '\n');
writeFileSync(code('voice-timing.json'), JSON.stringify({ ...previous, aligned: true, status: 'Reviewed word alignment measured on the final prepared WAV; approved spelling retained.', alignmentSource: 'Measured and reviewed final WAV', alignedWordCount: script.length, captionCount: captions.length, captionPages: captions.filter((c) => c.pageBreakAfter).length, voiceDurationMs: Math.round(duration * 1000), finalWordEndMs: captions.at(-1).endMs, finalSha256: hash }, null, 2) + '\n');
// Preserve the brief's copy/split/rewind boundaries; provide measured noun and
// question onsets separately so the camera and gold trace can follow the take.
const cuePlan = JSON.parse(readFileSync(code('audio-cues.json'), 'utf8'));
const wordsToFind = { fork: 'للمفترق', bridge: 'جسر', lantern: 'لصديقه', beacon: 'مساعدة', question: 'أي', firstChoice: 'الأولى', secondChoice: 'الثانية', discussion: 'الأجمل', comment: 'يفتح', together: 'بينكم' };
const voiceWordFrames = Object.fromEntries(Object.entries(wordsToFind).map(([key, text]) => {
  const caption = captions.find((c) => c.text.trim().split(/\s+/u).some((word) => normalize(word) === normalize(text)));
  return [key, Math.round(caption.startMs / 1000 * 30)];
}));
writeFileSync(code('audio-cues.json'), JSON.stringify({ ...cuePlan, alignment: 'Reviewed final WAV; fixed schedule retained and measured voice word cues available', voiceFinalSha256: hash, voiceWordFrames }, null, 2) + '\n');
const provenance = JSON.parse(readFileSync(asset('audio-provenance.json'), 'utf8'));
writeFileSync(asset('audio-provenance.json'), JSON.stringify({ ...provenance, voice: 'Complete user-supplied ElevenLabs recording, original preserved. Normalized 48kHz mono PCM WAV with pitch-preserving preparation. Every approved script word aligned to this final WAV; no word cuts.', voiceDurationSeconds: duration, finalSpokenWordEndSeconds: captions.at(-1).endMs / 1000, voiceSpeed: previous.speed, sourceSha256: previous.sourceSha256, finalSha256: hash }, null, 2) + '\n');
console.log(`R18 final WAV aligned: ${script.length} approved words; last word ends at ${captions.at(-1).endMs}ms. Voice may now be enabled in Studio.`);
