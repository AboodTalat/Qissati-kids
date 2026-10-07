import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { env } from '@huggingface/transformers';
import { canUseWhisperWebGpu, downloadWhisperModel, loadWhisperModel, transcribe, toCaptions } from '@remotion/whisper-webgpu';

env.cacheDir = new URL('../out/whisper-cache/', import.meta.url).pathname;
await mkdir(new URL('../out/', import.meta.url), { recursive: true });
const decoded = spawnSync('ffmpeg', ['-v', 'error', '-i', 'public/r13/voice.wav', '-ar', '16000', '-ac', '1', '-f', 'f32le', 'pipe:1'], { maxBuffer: 16 * 1024 * 1024 });
if (decoded.status !== 0) throw new Error(decoded.stderr.toString());
const buffer = decoded.stdout;
const channelWaveform = new Float32Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
const support = await canUseWhisperWebGpu();
if (!support.supported) throw new Error(support.detailedReason);
const model = 'small';
let progressBucket = -1;
await downloadWhisperModel({ model, onProgress: ({ progress }) => {
  const bucket = Math.floor((progress ?? 0) / 25);
  if (bucket > progressBucket) { progressBucket = bucket; console.log(`Model download: ${bucket * 25}%`); }
} });
console.log('Loading multilingual model');
await using modelHandle = await loadWhisperModel({ model });
console.log('Transcribing Arabic word timestamps');
const result = await transcribe({ channelWaveform, model, language: 'ar', task: 'transcribe', doSample: false });
const { captions } = toCaptions({ whisperWebGpuOutput: result });
await writeFile('out/r13-voice-transcription.json', JSON.stringify({ ...result, captions }, null, 2));
console.log(JSON.stringify(result, null, 2));
// Preserve the editorial spelling and grouping when the recognition matches.
const editorial = JSON.parse(await readFile('src/r13/captions.json', 'utf8'));
console.log(`Recognized ${captions.length} timestamped tokens; editorial script has ${editorial.length} words.`);
