import { mkdirSync, writeFileSync } from 'node:fs';

const rate = 48000;
const seconds = 20;
const samples = rate * seconds;
const folder = new URL('../public/r13/', import.meta.url);
mkdirSync(folder, { recursive: true });

const encode = (data) => {
  const wav = Buffer.alloc(44 + data.length * 2);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(data.length * 2, 40);
  data.forEach((n, i) => wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, n)) * 32767), 44 + i * 2));
  return wav;
};

const music = new Float32Array(samples);
const sfx = new Float32Array(samples);
let seed = 131313;
const notes = [110, 164.81, 220, 329.63];
const effects = [
  { at: 2.1, duration: 0.38, kind: 'glint', hz: 783.99 },
  { at: 5.15, duration: 0.63, kind: 'chime', hz: 659.25 },
  { at: 7.1, duration: 0.7, kind: 'paper', hz: 180 },
  { at: 13.1, duration: 0.78, kind: 'paper', hz: 210 },
];

for (let i = 0; i < samples; i++) {
  const t = i / rate;
  const fade = Math.sin(Math.PI * t / seconds) ** 0.5;
  music[i] = fade * notes.reduce((sum, hz, n) => sum + Math.sin(2 * Math.PI * hz * t + Math.sin(t * 0.14 + n) * 0.11) * (0.06 / (n + 1)), 0);
  seed = (1664525 * seed + 1013904223) >>> 0;
  const noise = (seed / 0x100000000) * 2 - 1;
  for (const effect of effects) {
    const u = t - effect.at;
    if (u < 0 || u > effect.duration) continue;
    const envelope = Math.sin(Math.PI * u / effect.duration) ** 1.5;
    if (effect.kind === 'paper') sfx[i] += noise * envelope * 0.034 + Math.sin(2 * Math.PI * effect.hz * u) * envelope * 0.014;
    else sfx[i] += envelope * 0.055 * (Math.sin(2 * Math.PI * effect.hz * u) + 0.37 * Math.sin(2 * Math.PI * effect.hz * 2.01 * u));
  }
}

writeFileSync(new URL('music.wav', folder), encode(music));
writeFileSync(new URL('sfx.wav', folder), encode(sfx));
