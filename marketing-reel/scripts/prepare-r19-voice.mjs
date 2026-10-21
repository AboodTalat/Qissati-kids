import { readFileSync, writeFileSync, copyFileSync, renameSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { extname, resolve } from 'node:path';

const source = process.argv[2];
if (!source) throw new Error('Usage: npm run voice:r19 -- /absolute/complete-take.mp3\nPreserves the complete take at its original speed. Final-WAV alignment and review are required afterward.');
const root = new URL('../', import.meta.url);
const asset = (name) => fileURLToPath(new URL(`public/r19/${name}`, root));
const code = (name) => fileURLToPath(new URL(`src/r19/${name}`, root));
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr}`);
  return result;
};
const probe = (path) => JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,sample_rate,channels', '-of', 'json', path]).stdout);
const sourceProbe = probe(source);
const duration = Number(sourceProbe.format.duration);
if (!Number.isFinite(duration) || duration <= 0 || duration >= 17) throw new Error('R19 needs a complete take shorter than 17 seconds at its original speed. No words will be cut or accelerated.');
const sourceHash = hash(source);
const script = readFileSync(asset('voiceover.txt'), 'utf8').trim().split(/\s+/u);
const loudnessJson = (stderr) => JSON.parse(stderr.slice(stderr.lastIndexOf('{'), stderr.lastIndexOf('}') + 1));
const measurement = run('ffmpeg', ['-hide_banner', '-i', source, '-af', 'loudnorm=I=-18:TP=-2:LRA=7:print_format=json', '-f', 'null', '-']);
const loudness = loudnessJson(measurement.stderr);
const filter = `loudnorm=I=-18:TP=-2:LRA=7:measured_I=${loudness.input_i}:measured_TP=${loudness.input_tp}:measured_LRA=${loudness.input_lra}:measured_thresh=${loudness.input_thresh}:offset=${loudness.target_offset}:linear=true:print_format=json`;
const temporary = asset('voice-prepared.tmp.wav');
let preparedLoudness;
try {
  const prepared = run('ffmpeg', ['-hide_banner', '-y', '-i', source, '-af', filter, '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', temporary]);
  preparedLoudness = loudnessJson(prepared.stderr);
  const finalDuration = Number(probe(temporary).format.duration);
  if (!Number.isFinite(finalDuration) || finalDuration <= 0 || finalDuration >= 17) throw new Error('The complete final WAV must finish before 17 seconds.');
  const original = asset(`voice-source${extname(source).toLowerCase() || '.wav'}`);
  if (resolve(source) !== resolve(original)) copyFileSync(source, original);
  if (hash(original) !== sourceHash) throw new Error('The preserved recording does not match the supplied source.');
  renameSync(temporary, asset('voice.wav'));
} catch (error) {
  try { unlinkSync(temporary); } catch { /* no partial file */ }
  throw error;
}
const finalProbe = probe(asset('voice.wav'));
const audio = finalProbe.streams.find((stream) => stream.codec_type === 'audio');
const finalDuration = Number(finalProbe.format.duration);
if (audio?.sample_rate !== '48000' || audio?.channels !== 1) throw new Error('Prepared voice must be mono 48kHz PCM.');
const finalMeasurement = loudnessJson(run('ffmpeg', ['-hide_banner', '-i', asset('voice.wav'), '-af', 'loudnorm=I=-18:TP=-2:LRA=7:print_format=json', '-f', 'null', '-']).stderr);
writeFileSync(code('captions.json'), '[]\n');
const cuePath = code('audio-cues.json');
let cuePlan;
try { cuePlan = JSON.parse(readFileSync(cuePath, 'utf8')); } catch { cuePlan = { fps: 30, durationInFrames: 570, tickFrames: [10, 35, 64], paperHushFrame: 210 }; }
delete cuePlan.voiceWordFrames;
delete cuePlan.voiceFinalSha256;
writeFileSync(cuePath, JSON.stringify({ ...cuePlan, alignment: 'Voice prepared; final WAV not yet aligned. Fixed brief cues are planned timing only.' }, null, 2) + '\n');
writeFileSync(code('voice-timing.json'), JSON.stringify({
  aligned: false,
  status: 'Complete original-speed voice prepared. Transcribe the final WAV locally, review against the approved script and recording, then run align:r19 before enabling voice or captions.',
  approvedWordCount: script.length,
  alignedWordCount: 0,
  captionCount: 0,
  sourceDurationMs: Math.round(duration * 1000),
  voiceDurationMs: Math.round(finalDuration * 1000),
  finalWordEndMs: null,
  alignmentSource: null,
  speed: 1,
  pitchPreserved: true,
  preparation: 'Complete recording; no cuts or time stretch. Two-pass EBU loudness normalization, mono 48kHz PCM.',
  targetIntegratedLufs: -18,
  targetTruePeakDbtp: -2,
  normalizationOutputIntegratedLufs: Number(preparedLoudness.output_i),
  normalizationOutputTruePeakDbtp: Number(preparedLoudness.output_tp),
  preparedIntegratedLufs: Number(finalMeasurement.input_i),
  preparedTruePeakDbtp: Number(finalMeasurement.input_tp),
  sourceSha256: sourceHash,
  finalSha256: hash(asset('voice.wav')),
}, null, 2) + '\n');
console.log(`R19 complete voice prepared: ${script.length} approved words; ${(finalDuration).toFixed(3)}s at speed 1. Final-WAV alignment is required before voice can be enabled.`);
