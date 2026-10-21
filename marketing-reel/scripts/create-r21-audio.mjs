import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// Original deterministic 20-second score. No samples, recordings, third-party
// music, external services, or paid generation calls are used.
const rate = 48000, seconds = 20, fps = 30, count = rate * seconds, tau = Math.PI * 2;
const folder = new URL('../public/r21/', import.meta.url); mkdirSync(folder, { recursive: true });
const musicL = new Float64Array(count), musicR = new Float64Array(count), sfxL = new Float64Array(count), sfxR = new Float64Array(count);
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const smooth = (n) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

function random(seed) { let state = seed >>> 0; return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296 * 2 - 1; }; }

function add(left, right, at, sample, gain, pan = 0, delay = 0) {
  const start = Math.round(at * rate), l = Math.cos((pan + 1) * Math.PI / 4) * Math.SQRT2, r = Math.sin((pan + 1) * Math.PI / 4) * Math.SQRT2;
  for (let i = 0; i < sample.length && start + i < count; i++) {
    if (start + i < 0) continue;
    left[start + i] += sample[i] * gain * l;
    right[start + i] += sample[Math.max(0, i - delay)] * gain * r;
  }
}

function tone(midi, length = 2.5, kind = 'bell') {
  const sample = new Float64Array(Math.round(rate * length)), f = hz(midi);
  for (let i = 0; i < sample.length; i++) {
    const t = i / rate, attack = 1 - Math.exp(-t * (kind === 'piano' ? 350 : 640));
    const body = Math.sin(tau * f * t) + Math.sin(tau * f * 2.002 * t) * (kind === 'piano' ? .19 : .12) * Math.exp(-t * 5)
      + Math.sin(tau * f * (kind === 'piano' ? 3.003 : 3.94) * t) * .045 * Math.exp(-t * 8);
    sample[i] = body * attack * Math.exp(-t * (kind === 'piano' ? 2.6 : 3.7)) * smooth((length - t) / .14);
  }
  return sample;
}

function note(at, midi, gain = .055, pan = 0, kind = 'bell') {
  const sample = tone(midi, kind === 'piano' ? 3.4 : 2.6, kind);
  add(musicL, musicR, at, sample, gain, pan);
  add(musicL, musicR, at + .134, sample, gain * .12, -pan, 43);
  add(musicL, musicR, at + .276, sample, gain * .055, pan * .3, 73);
}

// D major, 112 BPM. Rising six-note gestures follow the brass star, the
// balloon is answered by a lilting upper register, then a resolved D-add9 tail.
const beat = 60 / 112;
const melody = [
  [0, 78, .06], [.5, 81, .05], [1, 86, .065], [2, 85, .046], [3, 81, .05],
  [4, 78, .05], [5, 76, .043], [6, 74, .05], [7, 78, .047],
  [8, 79, .055], [8.5, 81, .044], [9, 83, .058], [10, 86, .05],
  [11, 85, .049], [12, 81, .052], [13, 78, .05], [14, 79, .045],
  [15, 81, .055], [16, 86, .056], [17, 85, .045], [18, 81, .048],
  [19, 83, .045], [20, 86, .055], [21, 88, .044], [22, 86, .053],
  [23, 81, .048], [24, 79, .05], [25, 78, .049], [26, 76, .044],
  [27, 74, .052], [28, 78, .045], [30, 81, .047], [32, 78, .043], [34, 74, .052],
];
melody.forEach(([step, midi, gain], n) => note(.04 + step * beat, midi, gain, n % 2 ? .14 : -.14));
const chords = [
  [0, [50, 57, 62, 66, 69]], [4 * beat, [52, 59, 62, 67, 71]],
  [8 * beat, [43, 55, 59, 62, 66]], [12 * beat, [45, 57, 62, 64, 69]],
  [16 * beat, [50, 57, 62, 66, 69]], [20 * beat, [43, 55, 59, 62, 66]],
  [24 * beat, [45, 57, 62, 64, 69]], [28 * beat, [50, 57, 62, 66, 69]], [32 * beat, [50, 57, 62, 66, 69]],
];
for (const [at, pitches] of chords) {
  pitches.slice(1).forEach((midi, n) => note(at + .025 + n * .034, midi, .024, (n - 1.5) * .10, 'piano'));
  add(musicL, musicR, at, tone(pitches[0], 3.1, 'piano'), .06, 0);
}
for (let i = 0; i < count; i++) {
  const t = i / rate; let l = 0, r = 0;
  for (let n = 0; n < chords.length; n++) {
    const [at, pitches] = chords[n], env = smooth((t - at) / .6) * smooth((at + 4 * beat + .6 - t) / .7);
    if (env <= 0) continue;
    pitches.slice(1, 4).forEach((midi, p) => {
      const f = hz(midi), gain = .009 / (1 + p * .3);
      l += Math.sin(tau * f * t + Math.sin(t * .5 + p) * .035) * gain * env;
      r += Math.sin(tau * f * t + Math.sin(t * .5 + p + .5) * .035) * gain * env;
    });
  }
  musicL[i] += l; musicR[i] += r;
}

function paper(at, length, gain, pan = 0, seed = 210301) {
  const sample = new Float64Array(Math.round(rate * length)), noise = random(seed); let low = 0, high = 0;
  for (let i = 0; i < sample.length; i++) {
    const t = i / rate, n = noise(); low = low * .83 + n * .17; high = high * .98 + n * .02;
    sample[i] = (low - high) * Math.sin(Math.PI * t / length) ** 2 * (.85 + Math.sin(tau * 16 * t) * .15);
  }
  add(sfxL, sfxR, at, sample, gain, pan);
}

function chime(at, midi, gain, pan = 0) {
  const sample = tone(midi, 1.8, 'bell'); add(sfxL, sfxR, at, sample, gain, pan);
  add(sfxL, sfxR, at + .116, sample, gain * .12, -pan, 29);
}

function tap(at, gain, pan = 0) {
  const sample = new Float64Array(Math.round(rate * .22)), noise = random(211466); let low = 0;
  for (let i = 0; i < sample.length; i++) {
    const t = i / rate; low = low * .75 + noise() * .25;
    sample[i] = (Math.sin(tau * (338 * t - 75 * t * t)) * .58 * Math.exp(-t * 48)
      + low * .45 * Math.exp(-t * 130)) * (1 - Math.exp(-t * 2700)) * smooth((.22 - t) / .03);
  }
  add(sfxL, sfxR, at, sample, gain, pan);
}

paper(.3, .9, .17, -.05); chime(.65, 86, .14, -.08);
paper(2.6, .7, .08, .1); [2.75, 3.25, 3.75].forEach((at, n) => chime(at, [78, 81, 86][n], .055, .12 - n * .12));
for (let n = 0; n < 8; n++) { paper(4.2 + n * .14, .48, .044, Math.sin(n / 8 * tau) * .3, 214200 + n); tap(5.05 + n * .14, .024); }
chime(6.1, 86, .10); paper(6.2, .85, .065, .10);
paper(10.95, .6, .10, -.1); paper(11.4, 1.55, .15, .06);
chime(12.7, 78, .065, -.1); chime(13, 81, .055); chime(13.3, 86, .055, .1);
tap(14.6, .15, .07); chime(14.6, 86, .08, .07); paper(16.5, .45, .045);

function stats(left, right) {
  let peak = 0, sum = 0;
  for (let i = 0; i < count; i++) { peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i])); sum += left[i] ** 2 + right[i] ** 2; }
  return { peakDbfs: +(20 * Math.log10(peak || Number.MIN_VALUE)).toFixed(3), rmsDbfs: +(10 * Math.log10(sum / (count * 2) || Number.MIN_VALUE)).toFixed(3) };
}
for (let i = 0; i < count; i++) {
  const t = i / rate, fade = smooth(t / .012) * smooth((seconds - 1 / rate - t) / .58);
  musicL[i] *= fade * 2.6; musicR[i] *= fade * 2.6; sfxL[i] *= fade * 1.25; sfxR[i] *= fade * 1.25;
}
function wav(left, right) {
  const out = Buffer.alloc(44 + count * 4); out.write('RIFF', 0); out.writeUInt32LE(out.length - 8, 4); out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(rate, 24);
  out.writeUInt32LE(rate * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(count * 4, 40);
  for (let i = 0; i < count; i++) {
    if (Math.abs(left[i]) > 1 || Math.abs(right[i]) > 1) throw new Error(`Clipping at sample ${i}`);
    out.writeInt16LE(Math.round(left[i] * 32767), 44 + i * 4); out.writeInt16LE(Math.round(right[i] * 32767), 46 + i * 4);
  }
  return out;
}
function loudness(buffer) {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', 'pipe:0', '-af', 'loudnorm=I=-16:TP=-1:LRA=11:print_format=json', '-f', 'null', '-'], { input: buffer, maxBuffer: 1024 * 1024 });
  const match = result.stderr?.toString().match(/\{\s*"input_i"[\s\S]*?\}/);
  if (result.status !== 0 || !match) return { status: 'unavailable' };
  const data = JSON.parse(match[0]); return { status: 'measured', integratedLufs: Number(data.input_i), truePeakDbtp: Number(data.input_tp), loudnessRangeLu: Number(data.input_lra) };
}
const music = wav(musicL, musicR), sfx = wav(sfxL, sfxR), mixL = new Float64Array(count), mixR = new Float64Array(count);
for (let i = 0; i < count; i++) { mixL[i] = musicL[i] * .85 + sfxL[i] * .92; mixR[i] = musicR[i] * .85 + sfxR[i] * .92; }
const measured = { music: loudness(music), sfx: loudness(sfx), previewMix: loudness(wav(mixL, mixR)) };
if (measured.previewMix.status === 'measured' && measured.previewMix.truePeakDbtp >= -3) throw new Error('Preview mix has insufficient headroom');
writeFileSync(new URL('music.wav', folder), music); writeFileSync(new URL('sfx.wav', folder), sfx);
const provenance = {
  reel: 'R21', sources: 'All samples synthesized by this script. Original composition, instruments and effects. No third-party sources or voice recording.',
  music: 'D-major star voyage, 112 BPM: bell and rolled-piano melody, softly sustained chord pad, rounded bass; original notes and dynamics.',
  sfx: 'Paper pocket fold, brass-star lift chime, golden-route notes, eight paper gores assembling, book folios opening, gentle star landing.',
  voice: 'No narration recording exists. voiceover.txt is a prepared script only; planned cues are not measured subtitles.',
  durationSeconds: seconds, sampleRate: rate, channels: 2, encoding: '16-bit signed PCM WAV', frameRate: fps, bpm: 112, key: 'D major',
  cues: { pocketFlap: .3, starLift: .65, goldenRoute: 2.6, balloonGores: Array.from({ length: 8 }, (_, n) => +(4.2 + n * .14).toFixed(2)), balloonFlight: 6.2, bookArrival: 10.95, foliosOpening: 11.4, starLanding: 14.6, cta: 16.5, quietHold: [17, 20] },
  mixing: { music: .85, sfx: .92, futureNarration: 'After an actual complete take is supplied and aligned, duck music to .22 and SFX to .35 during measured speech. Keep original speed and preserve all approved words.' },
  analysis: { music: stats(musicL, musicR), sfx: stats(sfxL, sfxR) }, measuredLoudness: measured,
  sha256: { music: createHash('sha256').update(music).digest('hex'), sfx: createHash('sha256').update(sfx).digest('hex') },
};
writeFileSync(new URL('audio-provenance.json', folder), `${JSON.stringify(provenance, null, 2)}\n`);
console.log(JSON.stringify({ reel: 'R21', seconds, analysis: provenance.analysis, measuredLoudness: measured }, null, 2));
