import { writeFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { env } from '@huggingface/transformers';
import { canUseWhisperWebGpu, loadWhisperModel, transcribe, toCaptions } from '@remotion/whisper-webgpu';

// Use the already-cached multilingual small model. No audio leaves this Mac.
env.cacheDir = new URL('../out/whisper-cache/', import.meta.url).pathname;
await mkdir(new URL('../out/', import.meta.url), { recursive: true });
const source = process.argv[2] ?? 'public/r14/voice.wav';
const output = process.argv[3] ?? 'out/r14-voice-transcription.json';
const decoded = spawnSync('ffmpeg', ['-v', 'error', '-i', source, '-ar', '16000', '-ac', '1', '-f', 'f32le', 'pipe:1'], { maxBuffer: 16 * 1024 * 1024 });
if (decoded.status !== 0) throw new Error(decoded.stderr.toString());
const buffer = decoded.stdout;
const channelWaveform = new Float32Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
const support = await canUseWhisperWebGpu();
if (!support.supported) throw new Error(support.detailedReason);
console.log('Loading cached multilingual Whisper small');
await using modelHandle = await loadWhisperModel({ model: 'small' });
console.log(`Transcribing Arabic word timestamps: ${source}`);
const result = await transcribe({ channelWaveform, model: 'small', language: 'ar', task: 'transcribe', doSample: false });
const { captions } = toCaptions({ whisperWebGpuOutput: result });
await writeFile(output, JSON.stringify({ source, ...result, captions }, null, 2) + '\n');
console.log(JSON.stringify({ text: result.text, captions }, null, 2));
