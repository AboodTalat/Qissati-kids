import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// An original compass-world adventure score and tactile sound palette. Every sample is
// synthesized below; there are no external recordings, samples or voice takes.
const rate = 48000;
const seconds = 20;
const framesPerSecond = 30;
const count = rate * seconds;
// Source-track gains are authored here, before encoding, for reproducible mixes.
// Relative to the initial score: +5dB music, +3dB SFX; no dynamics processing.
const musicMasterGain = 2.5 * 10 ** (5 / 20);
const sfxMasterGain = 10 ** (3 / 20);
const folder = new URL('../public/r24/', import.meta.url);
mkdirSync(folder, { recursive: true });
const musicL = new Float64Array(count), musicR = new Float64Array(count);
const sfxL = new Float64Array(count), sfxR = new Float64Array(count);
const tau = Math.PI * 2;
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const smooth = (n) => { const u = clamp(n); return u * u * (3 - 2 * u); };
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

function noise(seed) {
  let state = seed >>> 0;
  return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296 * 2 - 1; };
}

function add(left, right, at, sample, pan = 0, gain = 1, width = 0) {
  const start = Math.round(at * rate);
  // Equal-power panning keeps the three tiles at the same perceived level.
  const panL = Math.cos((clamp(pan, -1, 1) + 1) * Math.PI / 4) * Math.SQRT2;
  const panR = Math.sin((clamp(pan, -1, 1) + 1) * Math.PI / 4) * Math.SQRT2;
  for (let j = 0; j < sample.length && start + j < count; j++) {
    if (start + j < 0) continue;
    left[start + j] += sample[j] * panL * gain;
    right[start + j] += sample[Math.max(0, j - width)] * panR * gain;
  }
}

function pluck(midi, length = 2.2, kind = 'marimba') {
  const sample = new Float64Array(Math.round(rate * length));
  const f = hz(midi);
  for (let i = 0; i < sample.length; i++) {
    const t = i / rate;
    const env = (1 - Math.exp(-t * (kind === 'piano' ? 250 : 700)))
      * Math.exp(-t * (kind === 'piano' ? 2.7 : 4.1));
    const fundamental = Math.sin(tau * f * t);
    const body = kind === 'piano'
      ? fundamental + Math.sin(tau * f * 2.001 * t) * 0.19 * Math.exp(-t * 2.8)
        + Math.sin(tau * f * 3.002 * t) * 0.043 * Math.exp(-t * 7)
        + Math.sin(tau * f * 0.999 * t) * 0.07
      : fundamental + Math.sin(tau * f * 3.99 * t) * 0.145 * Math.exp(-t * 14)
        + Math.sin(tau * f * 6.13 * t) * 0.015 * Math.exp(-t * 24);
    sample[i] = body * env * smooth((length - t) / 0.12);
  }
  return sample;
}

function note(at, midi, gain, pan, kind = 'marimba') {
  const sample = pluck(midi, kind === 'piano' ? 3.0 : 2.2, kind);
  add(musicL, musicR, at, sample, pan, gain);
  // Two filtered-by-instrument, short, diffuse reflections: space without a
  // prominent metronomic delay, and compatibility with a mono phone speaker.
  add(musicL, musicR, at + 0.097, sample, -pan * 0.6, gain * 0.12, 37);
  add(musicL, musicR, at + 0.229, sample, pan * 0.2, gain * 0.055, 59);
}

// 108 BPM, E-minor / C-major / G-major / A-minor / E-minor. The melody opens
// immediately, answers the three model reveals, then gives the comment hold
// a simple resolving phrase. Off-beat notes stay quiet under the tile taps.
const melody = [
  [.04,76,.067,-.1],[.56,79,.046,.1],[1.12,83,.044,-.12],[1.67,81,.048,.12],[2.22,79,.046,0],
  [3.33,76,.052,.1],[3.89,74,.044,-.1],[4.44,71,.046,0],[5.56,79,.052,-.1],[6.11,83,.043,.12],
  [6.67,86,.045,0],[7.22,83,.046,-.1],[7.78,81,.043,.1],[8.33,79,.047,0],[8.89,76,.042,-.1],
  [9.44,78,.043,.1],[10,81,.046,0],[10.56,83,.044,-.1],[11.11,86,.04,.1],[12.22,83,.045,0],
  [12.78,81,.043,-.1],[13.33,79,.045,.1],[14.44,76,.044,0],[15.56,74,.038,-.1],
  [16.67,76,.041,.1],[17.78,79,.035,0],[18.33,76,.04,0],
];
melody.forEach(([at, midi, gain, pan]) => note(at, midi, gain, pan));

const chords = [[0,[40,52,55,59,64]],[4,[48,55,60,64,67]],[8,[43,55,59,62,66]],[12,[45,57,60,64,67]],[16,[40,52,55,59,64]]];
for (const [at, pitches] of chords) {
  // A delicate broken piano chord grounds each phrase, with a tiny human-like
  // authored roll (fixed, never random at render time).
  pitches.slice(1).forEach((midi, n) => note(at + .025 + n * .023, midi, .016, (n - 1.5) * .07, 'piano'));
  const bass = pluck(pitches[0], 3.3, 'piano');
  add(musicL, musicR, at, bass, 0, at < 16 ? .049 : .038);
  if (at < 16) add(musicL, musicR, at + 2, bass, .025, .023);
}

// A warm low pad blooms toward the doorway, using two common-tone voicings
// with long crossfades. Its upper range leaves room for Arabic consonants.
for (let i = 0; i < count; i++) {
  const t = i / rate;
  let l = 0, r = 0;
  for (let n = 0; n < chords.length; n++) {
    const [at, pitches] = chords[n];
    const env = smooth((t - at) / .7) * smooth((at + 4.7 - t) / .7);
    if (env <= 0) continue;
    pitches.slice(1, 4).forEach((midi, p) => {
      const f = hz(midi);
      const gain = .0075 / (1 + p * .3);
      l += Math.sin(tau * f * t + Math.sin(t * .63 + p) * .035) * gain * env;
      r += Math.sin(tau * f * t + Math.sin(t * .63 + p + .4) * .035) * gain * env;
    });
  }
  const portal = 1 + Math.sin(Math.PI * clamp((t - 8) / 4)) * .16;
  const hold = 1 - smooth((t - 15.5) / 1) * .17;
  musicL[i] += l * portal * hold;
  musicR[i] += r * portal * hold;
}

function tap(seed = 200101) {
  const sample = new Float64Array(Math.round(rate * .28));
  const random = noise(seed);
  let low = 0, warm = 0;
  for (let i = 0; i < sample.length; i++) {
    const t = i / rate, n = random();
    low = low * .72 + n * .28;
    warm = warm * .95 + n * .05;
    const attack = 1 - Math.exp(-t * 2600);
    const wood = Math.sin(tau * (294 * t - 72 * t * t)) * Math.exp(-t * 55) * .61
      + Math.sin(tau * 731 * t) * Math.exp(-t * 92) * .22
      + (low - warm) * Math.exp(-t * 170) * .72;
    sample[i] = wood * attack * smooth((.28 - t) / .03);
  }
  return sample;
}
const tileTap = tap();
const tileTimes = [0.55, 1.38, 2.3];
tileTimes.forEach((at,n)=>add(sfxL,sfxR,at,tileTap,(n-1)*.1,.14));

function paper(at, length, gain, pan = 0, seed = 200909) {
  const sample = new Float64Array(Math.round(rate * length));
  const random = noise(seed);
  let low = 0, warm = 0;
  for (let i = 0; i < sample.length; i++) {
    const t = i / rate, n = random();
    low = low * .81 + n * .19;
    warm = warm * .98 + n * .02;
    const envelope = Math.sin(Math.PI * t / length) ** 2;
    const corrugation = .83 + Math.sin(tau * 18 * t) * .17;
    sample[i] = (low - warm) * envelope * corrugation;
  }
  add(sfxL, sfxR, at, sample, pan, gain);
}

// The reveal sounds are rounded glass/paper harmonics with no piercing top.
function chime(at, midi, gain, pan) {
  const sample = new Float64Array(Math.round(rate * 1.6));
  const f = hz(midi);
  for (let i = 0; i < sample.length; i++) {
    const t = i / rate;
    const env = (1 - Math.exp(-t * 330)) * Math.exp(-t * 4.2);
    sample[i] = (Math.sin(tau * f * t)
      + Math.sin(tau * f * 2.001 * t) * .14 * Math.exp(-t * 3)
      + Math.sin(tau * f * 2.76 * t) * .025 * Math.exp(-t * 8)) * env;
  }
  add(sfxL, sfxR, at, sample, pan, gain);
  add(sfxL, sfxR, at + .12, sample, -pan * .5, gain * .11, 31);
}
// The compass turn is followed by distinct sea, forest and space reveals.
[[3.2,76,.055,.15],[5.2,79,.052,0],[7.2,83,.055,-.15]].forEach(cue=>chime(...cue));
paper(.65,1.25,.09,0,240101);
paper(3.2,.9,.15,.12,240301);
paper(5.2,.7,.12,0,240501);
paper(7.2,.65,.10,-.12,240701);
[[9,76,.035,.12],[9.8,79,.035,0],[10.6,83,.035,-.12],[12,88,.035,0]].forEach(cue=>chime(...cue));
paper(12.3,.5,.055,0,241201);
paper(15.5,.45,.035,0,241501);

function stats(left, right) {
  let peak = 0, sum = 0;
  for (let i = 0; i < count; i++) {
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
    sum += left[i] ** 2 + right[i] ** 2;
  }
  return {
    peakDbfs: Number((20 * Math.log10(peak || Number.MIN_VALUE)).toFixed(3)),
    rmsDbfs: Number((10 * Math.log10(sum / (count * 2) || Number.MIN_VALUE)).toFixed(3)),
  };
}

// Fixed authored levels, no hard limiter or clipped transients. The fade reaches
// exact digital silence at both ends, so Studio seeks and replay stay click-free.
for (let i = 0; i < count; i++) {
  const t = i / rate;
  const fade = smooth(t / .012) * smooth((seconds - 1 / rate - t) / .55);
  musicL[i] *= fade * musicMasterGain; musicR[i] *= fade * musicMasterGain;
  sfxL[i] *= fade * sfxMasterGain; sfxR[i] *= fade * sfxMasterGain;
}
function wav(left, right) {
  const out = Buffer.alloc(44 + count * 4);
  out.write('RIFF', 0); out.writeUInt32LE(out.length - 8, 4); out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
  out.writeUInt32LE(rate, 24); out.writeUInt32LE(rate * 4, 28);
  out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36);
  out.writeUInt32LE(count * 4, 40);
  for (let i = 0; i < count; i++) {
    if (Math.abs(left[i]) > 1 || Math.abs(right[i]) > 1) throw new Error(`Clipping at sample ${i}`);
    out.writeInt16LE(Math.round(left[i] * 32767), 44 + i * 4);
    out.writeInt16LE(Math.round(right[i] * 32767), 46 + i * 4);
  }
  return out;
}
const music = wav(musicL, musicR), sfx = wav(sfxL, sfxR);
writeFileSync(new URL('music.wav', folder), music);
writeFileSync(new URL('sfx.wav', folder), sfx);
function loudness(buffer) {
  // loudnorm is used only as a meter. Its processed output is discarded;
  // the original PCM retains its dynamics and the authored source gains.
  const result = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', 'pipe:0',
    '-af', 'loudnorm=I=-16:TP=-1:LRA=11:print_format=json', '-f', 'null', '-'],
  { input: buffer, maxBuffer: 1024 * 1024 });
  const match = result.stderr?.toString().match(/\{\s*"input_i"[\s\S]*?\}/);
  if (result.status !== 0 || !match) return { status: 'unavailable', note: 'Install ffmpeg to regenerate integrated loudness and true-peak measurements.' };
  const measured = JSON.parse(match[0]);
  return { status: 'measured', integratedLufs: Number(measured.input_i), truePeakDbtp: Number(measured.input_tp), loudnessRangeLu: Number(measured.input_lra) };
}
const previewMixL = new Float64Array(count), previewMixR = new Float64Array(count);
for (let i = 0; i < count; i++) {
  previewMixL[i] = musicL[i] * .85 + sfxL[i] * .92;
  previewMixR[i] = musicR[i] * .85 + sfxR[i] * .92;
}
const measuredLoudness = { music: loudness(music), sfx: loudness(sfx), previewMix: loudness(wav(previewMixL, previewMixR)) };
if (measuredLoudness.previewMix.status === 'measured' && measuredLoudness.previewMix.truePeakDbtp >= -3) {
  throw new Error(`Preview mix has insufficient headroom: ${measuredLoudness.previewMix.truePeakDbtp} dBTP`);
}
const provenance = {
  reel: 'R24',
  music: 'Original deterministic oscillator composition authored in scripts/create-r24-audio.mjs: a new E-minor marimba melody, softly rolled piano, rounded bass and crossfading low pad. No third-party audio, samples or recordings.',
  sfx: 'Original deterministic synthesis authored in scripts/create-r24-audio.mjs: brass compass clicks, rounded world-reveal chimes, soft water/paper movement and a three-note choice motif. No external samples or recordings.',
  voice: 'Pending complete user-supplied narration and reviewed final-WAV measured word alignment. voiceover.txt is approved script text only. No substitute voice or invented measured captions.',
  sampleRate: rate, durationSeconds: seconds, frameRate: framesPerSecond, channels: 2, encoding: '16-bit signed PCM WAV',
  bpm: 108, key: 'E minor / C major / G major / A minor',
  cues: {
    compassClicks: tileTimes,
    seaReveal: 3.2, forestReveal: 5.2, spaceReveal: 7.2,
    choiceLights: [9,9.8,10.6], invitation: 12, comment: 15.5,
    quietFinalHold: [16,20],
  },
  mixing: {
    previewWithoutVoice: { music: .85, sfx: .92 },
    withAlignedVoice: { musicDuringSpeech: .22, sfxDuringSpeech: .35, voice: 1, recoverOverSeconds: .6 },
    sourceMasterGain: { music: musicMasterGain, sfx: sfxMasterGain, changeFromInitialSourceDb: { music: 5, sfx: 3 } },
    note: 'Music and SFX are independent tracks. Future voice should finish before 18s. Recover the score after the measured last word; do not derive narration timing from these planned cues.',
  },
  analysis: { music: stats(musicL, musicR), sfx: stats(sfxL, sfxR) },
  measuredLoudness: { method: 'ffmpeg loudnorm input measurements; processed output discarded', ...measuredLoudness },
  sha256: { music: createHash('sha256').update(music).digest('hex'), sfx: createHash('sha256').update(sfx).digest('hex') },
  tileTapBufferSha256: createHash('sha256').update(Buffer.from(tileTap.buffer)).digest('hex'),
};
writeFileSync(new URL('audio-provenance.json', folder), `${JSON.stringify(provenance, null, 2)}\n`);
console.log(JSON.stringify({ reel: 'R24', seconds, sampleRate: rate, channels: 2, ...provenance.analysis, measuredLoudness }, null, 2));
