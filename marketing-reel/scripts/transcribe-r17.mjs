import { writeFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { env } from '@huggingface/transformers';
import { canUseWhisperWebGpu, downloadWhisperModel, loadWhisperModel, transcribe, toCaptions } from '@remotion/whisper-webgpu';

env.cacheDir = new URL('../out/whisper-cache/', import.meta.url).pathname;
await mkdir(new URL('../out/', import.meta.url), { recursive: true });
const source = process.argv[2] ?? 'public/r17/voice.wav';
const output = process.argv[3] ?? 'out/r17-final-transcription.json';
const decoded = spawnSync('ffmpeg', ['-v', 'error', '-i', source, '-ar', '16000', '-ac', '1', '-f', 'f32le', 'pipe:1'], { maxBuffer: 24 * 1024 * 1024 });
if (decoded.status !== 0) throw new Error(decoded.stderr.toString());
const buffer = decoded.stdout;
const channelWaveform = new Float32Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
const support = await canUseWhisperWebGpu();
if (!support.supported) throw new Error(support.detailedReason);
// Download model weights if the local cache was cleared; the audio stays local.
let lastProgress = -1;
await downloadWhisperModel({ model: 'small', onProgress: ({ progress }) => {
  const bucket = Math.floor(progress * 10);
  if (bucket > lastProgress) { lastProgress = bucket; console.log(`Arabic model cache: ${bucket * 10}%`); }
} });
console.log('Transcribing Arabic word timestamps locally');
await using modelHandle = await loadWhisperModel({ model: 'small' });
const result = await transcribe({ channelWaveform, model: 'small', language: 'ar', task: 'transcribe', doSample: false });
const { captions } = toCaptions({ whisperWebGpuOutput: result });
await writeFile(output, JSON.stringify({ source, ...result, captions }, null, 2) + '\n');
console.log(JSON.stringify({ text: result.text, captions }, null, 2));
