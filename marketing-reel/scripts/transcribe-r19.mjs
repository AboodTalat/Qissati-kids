import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '@huggingface/transformers';
import { canUseWhisperWebGpu, downloadWhisperModel, loadWhisperModel, transcribe, toCaptions } from '@remotion/whisper-webgpu';

const project = fileURLToPath(new URL('../', import.meta.url));
env.cacheDir = fileURLToPath(new URL('../out/whisper-cache/', import.meta.url));
const source = resolve(project, process.argv[2] ?? 'public/r19/voice.wav');
const output = resolve(project, process.argv[3] ?? 'out/r19-final-transcription.json');
await mkdir(dirname(output), { recursive: true });
const bytes = await readFile(source);
const sourceSha256 = createHash('sha256').update(bytes).digest('hex');
const decoded = spawnSync('ffmpeg', ['-v', 'error', '-i', source, '-ar', '16000', '-ac', '1', '-f', 'f32le', 'pipe:1'], { maxBuffer: 24 * 1024 * 1024 });
if (decoded.status !== 0) throw new Error(decoded.stderr.toString());
const buffer = decoded.stdout;
const channelWaveform = new Float32Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
const support = await canUseWhisperWebGpu();
if (!support.supported) throw new Error(support.detailedReason);
let lastProgress = -1;
await downloadWhisperModel({ model: 'small', onProgress: ({ progress }) => {
  const bucket = Math.floor(progress * 10);
  if (bucket > lastProgress) { lastProgress = bucket; console.log(`Arabic model cache: ${bucket * 10}%`); }
} });
console.log('Transcribing Arabic word timestamps locally on the exact supplied audio file');
await using modelHandle = await loadWhisperModel({ model: 'small' });
const result = await transcribe({ channelWaveform, model: 'small', language: 'ar', task: 'transcribe', doSample: false });
const { captions } = toCaptions({ whisperWebGpuOutput: result });
await writeFile(output, JSON.stringify({ source, sourceSha256, finalSha256: sourceSha256, model: 'small', language: 'ar', decodedDurationMs: channelWaveform.length / 16, reviewed: false, ...result, captions }, null, 2) + '\n');
console.log(JSON.stringify({ output, finalSha256: sourceSha256, text: result.text, captions }, null, 2));
