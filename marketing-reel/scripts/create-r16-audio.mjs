import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const rate = 48000;
const seconds = 22;
const count = rate * seconds;
const folder = new URL('../public/r16/', import.meta.url);
mkdirSync(folder, { recursive: true });

function wav(left, right) {
  const channels = right ? 2 : 1;
  const out = Buffer.alloc(44 + left.length * 2 * channels);
  out.write('RIFF', 0); out.writeUInt32LE(out.length - 8, 4); out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(channels, 22);
  out.writeUInt32LE(rate, 24); out.writeUInt32LE(rate * 2 * channels, 28);
  out.writeUInt16LE(2 * channels, 32); out.writeUInt16LE(16, 34); out.write('data', 36);
  out.writeUInt32LE(left.length * 2 * channels, 40);
  for (let i = 0; i < left.length; i++) {
    out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i])) * 32767), 44 + i * 2 * channels);
    if (right) out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i])) * 32767), 46 + i * 2 * channels);
  }
  return out;
}

const left = new Float32Array(count);
const right = new Float32Array(count);
const sfx = new Float32Array(count);
const melody = [293.665, 440, 523.251, 587.33, 523.251, 440, 349.228, 293.665, 440, 587.33, 698.456, 587.33];
const notes = Array.from({ length: 27 }, (_, i) => ({ at: 0.4 + i * 0.72, hz: melody[i % melody.length], pan: Math.sin(i * 1.7) * 0.32 }));
const effects = [
  { at: 5.05, dur: 0.18, kind: 'step' }, { at: 5.48, dur: 0.18, kind: 'step' },
  { at: 6.05, dur: 1.35, kind: 'clue' },
  { at: 9.05, dur: 0.8, kind: 'leaves' },
  { at: 11.1, dur: 1.3, kind: 'clue' },
  { at: 12.08, dur: 0.65, kind: 'page' },
];
let seed = 161022;
let filtered = 0;
for (let i = 0; i < count; i++) {
  const t = i / rate;
  const fade = Math.min(1, t / 1.2, (seconds - t) / 1.3);
  const pad = [146.832, 220, 293.665].reduce((v, hz, n) => v + Math.sin(2 * Math.PI * hz * t + Math.sin(t * 0.21 + n) * 0.19) * 0.025 / (n + 1), 0);
  let l = pad, r = pad;
  for (const note of notes) {
    const u = t - note.at;
    if (u < 0 || u > 3.5) continue;
    const env = (1 - Math.exp(-u * 150)) * Math.exp(-u * 2.4);
    const pluck = (Math.sin(2 * Math.PI * note.hz * u) + Math.sin(2 * Math.PI * note.hz * 2.002 * u) * 0.22 * Math.exp(-u * 4)) * env * 0.12;
    l += pluck * (1 - note.pan); r += pluck * (1 + note.pan);
    // Original short room reflection, tied to sample time, never live delay.
    if (u > 0.17) { const echo = Math.sin(2 * Math.PI * note.hz * (u - 0.17)) * Math.exp(-(u - 0.17) * 2.8) * 0.025; l += echo; r += echo * 0.8; }
  }
  left[i] = l * fade; right[i] = r * fade;
  seed = (1664525 * seed + 1013904223) >>> 0;
  const noise = seed / 4294967296 * 2 - 1;
  filtered = filtered * 0.76 + noise * 0.24;
  for (const effect of effects) {
    const u = t - effect.at;
    if (u < 0 || u >= effect.dur) continue;
    const env = Math.sin(Math.PI * u / effect.dur) ** 1.4;
    if (effect.kind === 'step') sfx[i] += Math.sin(2 * Math.PI * 110 * u) * Math.exp(-u * 25) * 0.24 + filtered * env * 0.09;
    if (effect.kind === 'clue') sfx[i] += (Math.sin(2 * Math.PI * 880 * u) + Math.sin(2 * Math.PI * 1320 * u) * 0.23) * (1 - Math.exp(-u * 40)) * Math.exp(-u * 4) * 0.1;
    if (effect.kind === 'leaves') sfx[i] += filtered * env * (0.07 + Math.sin(u * 53) ** 2 * 0.1);
    if (effect.kind === 'page') sfx[i] += (noise - filtered) * env * 0.09 + Math.sin(2 * Math.PI * (180 + 80 * u) * u) * env * 0.03;
  }
}
writeFileSync(new URL('music.wav', folder), wav(left, right));
writeFileSync(new URL('sfx.wav', folder), wav(sfx));
// Export the same original SVG source used by the 3D cutouts.
const art = readFileSync(new URL('../src/r16/art.js', import.meta.url), 'utf8');
for (const [name, filename] of [['castleSVG', 'castle.svg'], ['trailSVG', 'treasure-trail.svg'], ['citySVG', 'city-motif.svg'], ['treeSVG', 'tree.svg']]) {
  const value = art.match(new RegExp(`export const ${name} = \u0060([\\s\\S]*?)\u0060;`))?.[1];
  if (!value) throw new Error(`Missing ${name}`);
  writeFileSync(new URL(filename, folder), value + '\n');
}
console.log('R16: separate original 22-second stereo music and mono SFX; four original SVG motifs.');
