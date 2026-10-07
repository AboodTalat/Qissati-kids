import { mkdirSync, writeFileSync } from 'node:fs';

// Original 120-BPM instrumental, synthesised from oscillators. No samples,
// borrowed melody, third-party recording, or runtime randomness.
const rate = 48000;
const seconds = 12;
const left = new Float64Array(rate * seconds);
const right = new Float64Array(rate * seconds);
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

function note(midi, start, length, gain, pan = 0, pad = false) {
  const frequency = hz(midi);
  for (let i = 0; i < Math.floor(length * rate); i++) {
    const index = Math.floor(start * rate) + i;
    if (index >= left.length) break;
    const t = i / rate;
    const attack = 1 - Math.exp(-t / (pad ? 0.3 : 0.008));
    const decay = Math.exp(-t / (pad ? 2.2 : 0.75));
    const release = Math.min(1, (length - t) / 0.2);
    const tone = Math.sin(2 * Math.PI * frequency * t)
      + 0.28 * Math.sin(2 * Math.PI * frequency * 2.001 * t) * Math.exp(-t * 3)
      + 0.11 * Math.sin(2 * Math.PI * frequency * 3.997 * t) * Math.exp(-t * 7);
    const value = gain * attack * decay * release * tone;
    left[index] += value * Math.sqrt((1 - pan) / 2);
    right[index] += value * Math.sqrt((1 + pan) / 2);
  }
}

const chords = [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 62], [41, 48, 53, 57], [48, 55, 60, 64]];
chords.forEach((chord, bar) => {
  chord.forEach((pitch, index) => note(pitch, bar * 2, 3, 0.031, (index - 1.5) / 4, true));
  [0, 2, 1, 3].forEach((index, beat) => note(chord[index] + 12, bar * 2 + beat * 0.5, 1.7, 0.07, beat % 2 ? 0.28 : -0.28));
});
[[0.25, 76], [1, 79], [2, 81], [3, 79], [4, 76], [5, 72], [6, 74], [7, 79], [8, 76], [9, 79], [10, 76], [10.5, 72]].forEach(([time, pitch]) => note(pitch, time, 1.65, 0.055));

// Gentle stereo room echoes; fade the composition to silence at its exact end.
let peak = 0;
for (let i = left.length - 1; i >= 0; i--) {
  if (i > rate * 0.14) left[i] += right[i - Math.floor(rate * 0.14)] * 0.18;
  if (i > rate * 0.21) right[i] += left[i - Math.floor(rate * 0.21)] * 0.16;
  const fade = Math.min(1, i / (rate * 0.06), (left.length - 1 - i) / (rate * 0.8));
  left[i] *= fade;
  right[i] *= fade;
  peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
}
const wav = Buffer.alloc(44 + left.length * 4);
wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 4, 28);
wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36);
wav.writeUInt32LE(left.length * 4, 40);
for (let i = 0; i < left.length; i++) {
  wav.writeInt16LE(Math.round(left[i] / peak * 0.63 * 32767), 44 + i * 4);
  wav.writeInt16LE(Math.round(right[i] / peak * 0.63 * 32767), 46 + i * 4);
}
mkdirSync(new URL('../public/audio/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/r12/music.wav', import.meta.url), wav);
console.log('Created 12-second stereo score, 48 kHz, peak −4 dBFS.');
