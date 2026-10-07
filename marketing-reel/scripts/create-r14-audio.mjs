import { mkdirSync, writeFileSync } from 'node:fs';

const sampleRate = 48000;
const seconds = 19;
const count = sampleRate * seconds;
const folder = new URL('../public/r14/', import.meta.url);
mkdirSync(folder, { recursive: true });

function wav(samples) {
  const bytes = Buffer.alloc(44 + samples.length * 2);
  bytes.write('RIFF', 0);
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(sampleRate, 24);
  bytes.writeUInt32LE(sampleRate * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36);
  bytes.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    bytes.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  }
  return bytes;
}

const music = new Float32Array(count);
const sfx = new Float32Array(count);
const ease = (t) => Math.max(0, Math.min(1, t));
const notes = [110, 164.81, 220, 329.63];
let seed = 140214;
for (let i = 0; i < count; i++) {
  const t = i / sampleRate;
  const envelope = Math.sin(Math.PI * ease(t / seconds)) ** 0.45;
  const shimmer = Math.sin(2 * Math.PI * 0.31 * t) * 0.06;
  music[i] = envelope * (notes.reduce((sum, hz, n) => sum + Math.sin(2 * Math.PI * hz * t + Math.sin(t * 0.13 + n) * 0.18) * (0.075 / (n + 1)), 0) + shimmer * Math.sin(2 * Math.PI * 440 * t));
  seed = (1664525 * seed + 1013904223) >>> 0;
  const noise = (seed / 0x100000000) * 2 - 1;
  const accents = [
    { at: 3.05, duration: 0.58, hz: 261.63, level: 0.11 },
    { at: 6.15, duration: 0.48, hz: 392, level: 0.07 },
    { at: 8.17, duration: 0.66, hz: 523.25, level: 0.09 },
    { at: 16.06, duration: 0.45, hz: 659.25, level: 0.055 },
  ];
  let v = 0;
  for (const accent of accents) {
    const u = t - accent.at;
    if (u >= 0 && u < accent.duration) {
      const env = Math.sin(Math.PI * u / accent.duration) ** 1.4;
      v += accent.level * env * (Math.sin(2 * Math.PI * accent.hz * u) + 0.25 * Math.sin(2 * Math.PI * accent.hz * 2.01 * u)) + noise * env * 0.008;
    }
  }
  sfx[i] = v;
}

writeFileSync(new URL('music.wav', folder), wav(music));
writeFileSync(new URL('sfx.wav', folder), wav(sfx));
