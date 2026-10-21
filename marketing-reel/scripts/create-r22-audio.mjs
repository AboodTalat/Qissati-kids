import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { Buffer } from 'node:buffer';
import { URL } from 'node:url';
import console from 'node:console';

// Original deterministic oscillator music and foley, adapted from this
// project's R20 synthesis engine. No external samples, recordings or voice.
const rate = 48000, seconds = 18, count = rate * seconds, tau = Math.PI * 2;
const musicL = new Float64Array(count), musicR = new Float64Array(count);
const sfxL = new Float64Array(count), sfxR = new Float64Array(count);
const folder = new URL('../public/r22/', import.meta.url);
mkdirSync(folder, { recursive: true });
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const smooth = (n) => { const p = clamp(n); return p * p * (3 - 2 * p); };
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
function random(seed) {
  let n = seed >>> 0;
  return () => { n = (1664525 * n + 1013904223) >>> 0; return n / 4294967296 * 2 - 1; };
}
function add(left, right, at, source, pan = 0, gain = 1) {
  const start = Math.round(at * rate);
  const a = (clamp(pan, -1, 1) + 1) * Math.PI / 4;
  for (let i = 0; i < source.length && start + i < count; i++) {
    if (start + i < 0) continue;
    left[start + i] += source[i] * Math.cos(a) * Math.SQRT2 * gain;
    right[start + i] += source[i] * Math.sin(a) * Math.SQRT2 * gain;
  }
}
function tone(midi, kind = 'celesta', length = 2.4) {
  const source = new Float64Array(Math.round(rate * length)), f = hz(midi);
  for (let i = 0; i < source.length; i++) {
    const t = i / rate;
    const env = (1 - Math.exp(-t * (kind === 'piano' ? 180 : 540))) * Math.exp(-t * (kind === 'piano' ? 2.3 : 3.1));
    const body = Math.sin(tau * f * t)
      + Math.sin(tau * f * (kind === 'piano' ? 2.001 : 2.76) * t) * .12 * Math.exp(-t * 4.2)
      + Math.sin(tau * f * (kind === 'piano' ? 3.003 : 5.4) * t) * .018 * Math.exp(-t * 9);
    source[i] = body * env * smooth((length - t) / .16);
  }
  return source;
}
function note(at, midi, gain, pan = 0, kind = 'celesta') {
  const source = tone(midi, kind);
  add(musicL, musicR, at, source, pan, gain);
  add(musicL, musicR, at + .143, source, -pan, gain * .11);
  add(musicL, musicR, at + .31, source, pan * .6, gain * .055);
}
// 100 BPM, A minor/add9 → Fmaj7 → Cmaj9 → Gsus → Am(add9).
// A sparse celesta answers each quiet piano phrase, leaving speech room.
const melody = [
  [.03, 81, .11, -.15], [.6, 83, .064, .12], [1.2, 84, .075, -.1],
  [2.4, 88, .067, .1], [3.0, 84, .065, -.13], [3.6, 83, .06, .1],
  [4.2, 81, .075, -.14], [4.8, 79, .064, .1], [5.4, 81, .07, -.12],
  [6.0, 84, .063, .08], [6.6, 88, .067, -.1], [7.2, 86, .061, .13],
  [7.8, 84, .068, -.1], [8.4, 88, .067, .1], [9.0, 91, .058, -.1],
  [9.6, 88, .062, .1], [10.2, 86, .066, -.08], [10.8, 83, .059, .1],
  [11.4, 79, .064, -.12], [12.0, 81, .067, .1], [12.6, 84, .06, -.1],
  [13.2, 83, .057, .1], [14.4, 81, .073, -.1], [15.6, 76, .062, .1],
  [16.8, 81, .062, 0],
];
melody.forEach((n) => note(...n));
const chords = [[0, [45, 57, 60, 64, 71]], [3.6, [41, 57, 60, 64, 69]], [7.2, [48, 55, 59, 62, 64]], [10.8, [43, 55, 60, 62, 67]], [14.4, [45, 57, 60, 64, 71]]];
for (const [at, pitches] of chords) {
  pitches.forEach((p, j) => note(at + j * .055, p, j ? .033 : .095, (j - 2) * .065, 'piano'));
  pitches.slice(1, 4).forEach((p, j) => note(at + 1.8 + j * .06, p, .028, (1 - j) * .08, 'piano'));
}
for (let i = 0; i < count; i++) {
  const t = i / rate;
  for (const [at, pitches] of chords) {
    const env = smooth((t - at) / 1.15) * smooth((at + 4.4 - t) / 1.15);
    if (!env) continue;
    pitches.slice(1, 4).forEach((p, j) => {
      const f = hz(p), a = .011 / (1 + j * .4) * env;
      musicL[i] += Math.sin(tau * f * t + Math.sin(t * .4 + j) * .025) * a;
      musicR[i] += Math.sin(tau * f * t + Math.sin(t * .4 + j + .7) * .025) * a;
    });
  }
}
function click(at, seed, gain = .2, pan = 0) {
  const n = random(seed), source = new Float64Array(Math.round(rate * .22));
  let low = 0;
  for (let i = 0; i < source.length; i++) {
    const t = i / rate; low = low * .75 + n() * .25;
    source[i] = (Math.sin(tau * 662 * t) * Math.exp(-t * 75) * .35 + low * Math.exp(-t * 115) * .7)
      * (1 - Math.exp(-t * 2400)) * smooth((.22 - t) / .02);
  }
  add(sfxL, sfxR, at, source, pan, gain);
}
function paper(at, length, gain, pan, seed) {
  const n = random(seed), source = new Float64Array(Math.round(rate * length));
  let low = 0, deep = 0;
  for (let i = 0; i < source.length; i++) {
    const t = i / rate, v = n(); low = low * .8 + v * .2; deep = deep * .98 + v * .02;
    source[i] = (low - deep) * Math.sin(Math.PI * t / length) ** 2 * (.85 + Math.sin(t * 96) * .15);
  }
  add(sfxL, sfxR, at, source, pan, gain);
}
function chime(at, midi, gain, pan) { const source = tone(midi, 'celesta', 1.8); add(sfxL, sfxR, at, source, pan, gain); add(sfxL, sfxR, at + .16, source, -pan, gain * .1); }
click(2.25, 220225, .29, -.1);
paper(3, .9, .23, -.15, 220300); paper(3.18, .87, .2, .15, 220318);
paper(4.1, 1.2, .19, 0, 220410);
chime(4.15, 81, .075, -.1);
[[5.1, 84, -.12], [5.5, 88, .12], [5.9, 91, 0]].forEach(([at, midi, pan]) => chime(at, midi, .058, pan));
paper(7.4, .65, .22, -.2, 220740); click(8.16, 220816, .07, -.16);
paper(8.2, 1.1, .11, .1, 220820); chime(8.35, 88, .043, -.1); chime(9.2, 91, .045, .14);
paper(12, 1.2, .23, 0, 221200); paper(12.6, .83, .16, -.12, 221260);
click(13.3, 221330, .12); chime(13.4, 81, .056, -.1); chime(13.58, 84, .045, .1); chime(13.77, 88, .033, 0);
click(15.2, 221520, .13, .07);
for (let i = 0; i < count; i++) {
  const t = i / rate, fade = smooth(t / .012) * smooth((seconds - 1 / rate - t) / .7);
  musicL[i] *= fade * 1.18 * 10 ** (4 / 20); musicR[i] *= fade * 1.18 * 10 ** (4 / 20);
  sfxL[i] *= fade * 1.15 * 10 ** (3 / 20); sfxR[i] *= fade * 1.15 * 10 ** (3 / 20);
}
function wav(left, right) {
  const out = Buffer.alloc(44 + count * 4);
  out.write('RIFF', 0); out.writeUInt32LE(out.length - 8, 4); out.write('WAVEfmt ', 8); out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(rate, 24); out.writeUInt32LE(rate * 4, 28);
  out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(count * 4, 40);
  for (let i = 0; i < count; i++) {
    if (Math.abs(left[i]) > 1 || Math.abs(right[i]) > 1) throw new Error(`Clipping at sample ${i}`);
    out.writeInt16LE(Math.round(left[i] * 32767), 44 + i * 4); out.writeInt16LE(Math.round(right[i] * 32767), 46 + i * 4);
  }
  return out;
}
function stats(left, right) {
  let peak = 0, sum = 0;
  for (let i = 0; i < count; i++) { peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i])); sum += left[i] ** 2 + right[i] ** 2; }
  return { peakDbfs: +(20 * Math.log10(peak || Number.MIN_VALUE)).toFixed(3), rmsDbfs: +(10 * Math.log10(sum / (count * 2) || Number.MIN_VALUE)).toFixed(3) };
}
function loudness(buffer) {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', 'pipe:0', '-af', 'loudnorm=I=-16:TP=-1:LRA=11:print_format=json', '-f', 'null', '-'], { input: buffer, maxBuffer: 1024 * 1024 });
  const match = result.stderr?.toString().match(/\{\s*"input_i"[\s\S]*?\}/);
  if (result.status || !match) return { status: 'unavailable' };
  const m = JSON.parse(match[0]); return { status: 'measured', integratedLufs: +m.input_i, truePeakDbtp: +m.input_tp, loudnessRangeLu: +m.input_lra };
}
const music = wav(musicL, musicR), sfx = wav(sfxL, sfxR);
const mixL = new Float64Array(count), mixR = new Float64Array(count);
for (let i = 0; i < count; i++) { mixL[i] = musicL[i] * .85 + sfxL[i] * .92; mixR[i] = musicR[i] * .85 + sfxR[i] * .92; }
const measuredLoudness = { music: loudness(music), sfx: loudness(sfx), previewMix: loudness(wav(mixL, mixR)) };
if (measuredLoudness.previewMix.status === 'measured' && measuredLoudness.previewMix.truePeakDbtp >= -3) throw new Error('Mix lacks three decibels of headroom');
writeFileSync(new URL('music.wav', folder), music); writeFileSync(new URL('sfx.wav', folder), sfx);
const provenance = {
  reel: 'R22', origin: 'Original deterministic synthesis in scripts/create-r22-audio.mjs, adapted from the local R20 synthesis engine; no external recordings, samples or paid services.',
  music: '100 BPM A-minor/add9 celestial lullaby: sparse celesta, softly rolled piano and low common-tone sine pad.',
  sfx: 'Original oscillator/noise latch click, paired paper shutters, garden folds, star chimes, folding starboat, book settle and bookmark click.',
  voice: 'No recording exists. voiceover.txt is planned copy only; no synthetic substitute or invented measured alignment.',
  sampleRate: rate, durationSeconds: seconds, channels: 2, encoding: '16-bit PCM WAV', frameRate: 30,
  bpm: 100, key: 'A minor / add9', previewGains: { music: .85, sfx: .92 },
  cues: { latch: 2.25, shutters: [3, 3.18], garden: 4.1, stars: [5.1, 5.5, 5.9], boatFold: 7.4, sail: 8.2, bookFold: 12, bookSettle: 13.3, save: 15.2, finalHold: [14, 18] },
  analysis: { music: stats(musicL, musicR), sfx: stats(sfxL, sfxR) }, measuredLoudness,
  sha256: { music: createHash('sha256').update(music).digest('hex'), sfx: createHash('sha256').update(sfx).digest('hex') },
};
writeFileSync(new URL('audio-provenance.json', folder), `${JSON.stringify(provenance, null, 2)}\n`);
console.log(JSON.stringify({ reel: 'R22', durationSeconds: seconds, ...provenance.analysis, measuredLoudness }, null, 2));
