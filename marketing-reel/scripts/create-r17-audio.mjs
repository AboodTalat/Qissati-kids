import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const rate = 48000, seconds = 18, count = rate * seconds;
const folder = new URL('../public/r17/', import.meta.url);
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
const left = new Float32Array(count), right = new Float32Array(count);
const sfx = new Float32Array(count), room = new Float32Array(count);
const notes = [
  [0.8, 293.665], [3.4, 440], [6.8, 349.228], [10.1, 523.251],
  [12.7, 440], [15.2, 293.665],
];
let seed = 170018, low = 0, slower = 0;
for (let i = 0; i < count; i++) {
  const t = i / rate;
  const fade = Math.min(1, t / 1.2, (seconds - t) / 2);
  const pad = [146.832, 220, 293.665].reduce((v, hz, n) => v + Math.sin(2 * Math.PI * hz * t + Math.sin(t * 0.18 + n) * 0.08) * 0.013 / (n + 1), 0);
  let l = pad, r = pad;
  for (let n = 0; n < notes.length; n++) {
    const [at, hz] = notes[n], u = t - at;
    if (u < 0 || u > 5) continue;
    const envelope = (1 - Math.exp(-u * 8)) * Math.exp(-u * 1.4);
    const note = (Math.sin(2 * Math.PI * hz * u) + Math.sin(2 * Math.PI * hz * 2.002 * u) * 0.09) * envelope * 0.06;
    const pan = n % 2 ? 0.12 : -0.12;
    l += note * (1 - pan); r += note * (1 + pan);
  }
  left[i] = l * fade; right[i] = r * fade;
  seed = (1664525 * seed + 1013904223) >>> 0;
  const noise = seed / 4294967296 * 2 - 1;
  low = low * 0.96 + noise * 0.04;
  slower = slower * 0.999 + noise * 0.001;
  room[i] = (low * 0.025 + slower * 0.014) * Math.min(1, t / 0.3, (seconds - t) / 0.3);
  for (const at of [6.04, 17.6]) {
    const u = t - at;
    if (u >= 0 && u < 0.12) sfx[i] += (Math.sin(2 * Math.PI * 410 * u) * 0.035 + low * 0.07) * Math.sin(Math.PI * u / 0.12) * Math.exp(-u * 22);
  }
  const chime = t - 8.08;
  if (chime >= 0 && chime < 2.5) sfx[i] += (Math.sin(2 * Math.PI * 1174.66 * chime) + Math.sin(2 * Math.PI * 1760 * chime) * 0.13) * (1 - Math.exp(-chime * 30)) * Math.exp(-chime * 3.5) * 0.042;
}
// Separate original short tactile click, placed on the shared visual hit frame.
const { saveClickFrame } = JSON.parse(readFileSync(new URL('../src/r17/interaction.json', import.meta.url), 'utf8'));
const click = new Float32Array(Math.round(rate * 0.22));
let clickSeed = 17432, clickLow = 0;
for (let i = 0; i < click.length; i++) {
  clickSeed = (1664525 * clickSeed + 1013904223) >>> 0;
  const noise = clickSeed / 4294967296 * 2 - 1;
  clickLow = clickLow * 0.72 + noise * 0.28;
  const t = i / rate;
  const attack = 1 - Math.exp(-t * 1800);
  const down = (clickLow * 0.14 + Math.sin(2 * Math.PI * 590 * t) * 0.11) * attack * Math.exp(-t * 85);
  const u = t - 0.045;
  const release = u >= 0 ? (clickLow * 0.055 + Math.sin(2 * Math.PI * 780 * u) * 0.028) * (1 - Math.exp(-u * 1800)) * Math.exp(-u * 120) : 0;
  click[i] = (down + release) * Math.min(1, (0.22 - t) / 0.02);
}
writeFileSync(new URL('music.wav', folder), wav(left, right));
writeFileSync(new URL('room-tone.wav', folder), wav(room));
writeFileSync(new URL('sfx.wav', folder), wav(sfx));
writeFileSync(new URL('bookmark-click.wav', folder), wav(click));
console.log(`R17: original separate 18-second music, room tone and SFX; 0.22s bookmark click at frame ${saveClickFrame}, all at 48kHz.`);
