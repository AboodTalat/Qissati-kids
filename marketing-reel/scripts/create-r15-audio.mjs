import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const rate = 48000;
const length = 21;
const count = rate * length;
const folder = new URL('../public/r15/', import.meta.url);
mkdirSync(folder, { recursive: true });

function toWav(samples) {
  const out = Buffer.alloc(44 + samples.length * 2);
  out.write('RIFF', 0);
  out.writeUInt32LE(out.length - 8, 4);
  out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(rate, 24);
  out.writeUInt32LE(rate * 2, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write('data', 36);
  out.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((value, i) => out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, value)) * 32767), 44 + i * 2));
  return out;
}

const music = new Float32Array(count);
const sfx = new Float32Array(count);
const timing = JSON.parse(readFileSync(new URL('../src/r15/voice-timing.json', import.meta.url)));
const captions = JSON.parse(readFileSync(new URL('../src/r15/captions.json', import.meta.url)));
const cue = (word, fallback) => {
  const measured = captions.find((c) => c.text.trim().split(/\s+/u).includes(word));
  return timing.aligned && measured ? measured.startMs / 1000 : fallback;
};
const notes = [110, 146.83, 220, 293.66];
let seed = 151015;
const effects = [
  { at: cue('بجزمة', 4) + 0.04, dur: 0.52, hz: 170, amp: 0.12, kind: 'water' },
  { at: cue('حجر', 6) + 0.04, dur: 0.34, hz: 125, amp: 0.14, kind: 'tap' },
  { at: cue('مفتاح', 8) + 0.04, dur: 0.84, hz: 523.25, amp: 0.11, kind: 'chime' },
  { at: 13.1, dur: 0.55, hz: 215, amp: 0.07, kind: 'paper' },
];

for (let i = 0; i < count; i++) {
  const t = i / rate;
  const fade = Math.sin(Math.PI * t / length) ** 0.48;
  music[i] = fade * notes.reduce((v, hz, n) => v + Math.sin(2 * Math.PI * hz * t + Math.sin(t * 0.18 + n) * 0.16) * (0.068 / (n + 1)), 0);
  seed = (1664525 * seed + 1013904223) >>> 0;
  const noise = seed / 0x100000000 * 2 - 1;
  let accent = 0;
  for (const e of effects) {
    const u = t - e.at;
    if (u < 0 || u >= e.dur) continue;
    const env = Math.sin(Math.PI * u / e.dur) ** 1.2;
    if (e.kind === 'water') accent += e.amp * env * Math.sin(2 * Math.PI * (e.hz + 170 * u) * u) + noise * env * 0.014;
    if (e.kind === 'tap') accent += e.amp * Math.exp(-14 * u) * Math.sin(2 * Math.PI * e.hz * u) + noise * Math.exp(-18 * u) * 0.025;
    if (e.kind === 'chime') accent += e.amp * env * (Math.sin(2 * Math.PI * e.hz * u) + 0.31 * Math.sin(2 * Math.PI * e.hz * 2.03 * u));
    if (e.kind === 'paper') accent += noise * env * 0.035 + e.amp * env * Math.sin(2 * Math.PI * e.hz * u) * 0.35;
  }
  sfx[i] = accent;
}

writeFileSync(new URL('music.wav', folder), toWav(music));
writeFileSync(new URL('sfx.wav', folder), toWav(sfx));
