import { Buffer } from 'node:buffer';
import { URL } from 'node:url';
import console from 'node:console';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// An original paper-world score and tactile sound palette. Every sample is
// synthesized below; there are no external recordings, samples or voice takes.
const rate = 48000;
const seconds = 20;
const framesPerSecond = 30;
const count = rate * seconds;
// Source-track gains are authored here, before encoding, for reproducible mixes.
// Fixed authored harp/piano and cloth/paper gains; no dynamics processing.
const musicMasterGain = 3.5;
const sfxMasterGain = 1.15;
const folder = new URL('../public/r23/', import.meta.url);
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

function pluck(midi, length = 2.2, kind = 'harp') {
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

function note(at, midi, gain, pan, kind = 'harp') {
  const sample = pluck(midi, kind === 'piano' ? 3.0 : 2.2, kind);
  add(musicL, musicR, at, sample, pan, gain);
  // Two filtered-by-instrument, short, diffuse reflections: space without a
  // prominent metronomic delay, and compatibility with a mono phone speaker.
  add(musicL, musicR, at + 0.097, sample, -pan * 0.6, gain * 0.12, 37);
  add(musicL, musicR, at + 0.229, sample, pan * 0.2, gain * 0.055, 59);
}

// 96 BPM original G-major gift motif. A bright rolled harp opens immediately;
// sustained piano carries the lifting lid and open-book reveal.
const melody = [
  [.04,79,.070,-.13],[.36,83,.040,.10],[.67,86,.042,.16],
  [1.29,83,.045,-.11],[1.92,81,.041,.13],[2.54,79,.045,-.14],
  [3.17,74,.041,.12],[3.79,78,.040,-.12],[4.10,79,.051,.08],
  [4.73,83,.044,-.12],[5.35,86,.047,.13],[5.98,90,.042,-.08],
  [6.60,88,.042,.10],[7.23,86,.045,-.10],[7.85,83,.040,.11],
  [8.48,81,.043,-.10],[9.10,79,.051,.09],[9.42,83,.038,-.08],
  [9.73,86,.038,.13],[10.35,88,.041,-.12],[10.98,90,.046,.13],
  [11.60,91,.041,-.10],[12.23,90,.039,.09],[12.85,86,.042,-.11],
  [13.48,83,.040,.10],[14.10,81,.039,-.10],[14.73,79,.044,.09],
  [15.35,78,.037,-.08],[15.98,79,.040,.10],[16.60,83,.037,-.08],
  [17.23,81,.033,.08],[17.85,79,.042,0],
];
melody.forEach(([at,midi,gain,pan])=>note(at,midi,gain,pan));
const chords = [[0,[43,55,59,62,69]],[4,[48,55,60,64,67]],
 [8,[40,55,59,64,67]],[12,[50,57,62,66,69]],[16,[43,55,59,62,67]]];
for (const [at,pitches] of chords) {
 pitches.slice(1).forEach((midi,n)=>note(at+.028+n*.039,midi,.021,(n-1.5)*.09,'piano'));
 const bass=pluck(pitches[0],3.4,'piano');
 add(musicL,musicR,at,bass,0,at<16?.046:.038);
 if(at<16)add(musicL,musicR,at+2.5,bass,.02,.022);
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
const giftTap = tap(230404);
add(sfxL,sfxR,4.02,giftTap,0,.10);
add(sfxL,sfxR,7.72,giftTap,-.1,.035);
add(sfxL,sfxR,15.15,giftTap,0,.060);

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
// Cloth draw and release, a soft lid lift, then tactile paper/book hinges.
paper(.95, .90, .15, .14, 230101);
paper(2.05, 1.0, .17, -.11, 230202);
paper(3.25, .72, .13, .12, 230303);
paper(4.08, 1.12, .12, 0, 230404);
chime(5.52, 79, .055, -.08);
paper(6.15, 1.25, .12, -.1, 230606);
chime(8.0, 83, .038, .10);
paper(9.10, 1.12, .19, -.14, 230909);
paper(10.22, 1.20, .16, .10, 231010);
paper(11.85, .83, .13, -.06, 231212);
chime(12.12, 79, .042, -.12);
chime(12.43, 83, .038, .12);
chime(12.74, 86, .034, 0);
paper(13.05, .68, .10, .1, 231313);
paper(14.62, .75, .075, 0, 231515);
// No new sound-effect attacks in the final four-second reading hold.

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
  reel: 'R23',
  music: 'Original deterministic oscillator composition authored in scripts/create-r23-audio.mjs: plucked harp over a G-major motif, softly rolled piano, rounded bass and crossfading low pad. No third-party audio, samples or recordings.',
  sfx: 'Original deterministic synthesis authored in scripts/create-r23-audio.mjs: woven-ribbon draws, a muted solid lid lift, thick book hinges, folded paper swishes and a G-major garden reveal chord. No external samples or recordings.',
  voice: 'Pending complete user-supplied narration and reviewed final-WAV measured word alignment. voiceover.txt is approved script text only. No substitute voice or invented measured captions.',
  sampleRate: rate, durationSeconds: seconds, frameRate: framesPerSecond, channels: 2, encoding: '16-bit signed PCM WAV',
  bpm: 96, key: 'G major with C major / E minor / D major colours',
  cues: {
    ribbonPull: [1, 2.05, 3.25], lidLift: {seconds:4,frame:120},
    bookRise: {seconds:6,frame:180}, coverHinge: {seconds:9,frame:270},
    paperWorld: [12.12,12.43,12.74], settle:15.15, quietFinalHold:[16,20], cta:17,
  },
  mixing: {
    previewWithoutVoice: { music: .85, sfx: .92 },
    withAlignedVoice: { musicDuringSpeech: .22, sfxDuringSpeech: .35, voice: 1, recoverOverSeconds: .6 },
    sourceMasterGain: { music: musicMasterGain, sfx: sfxMasterGain, authoredFixedGains: true },
    note: 'Music and SFX are independent tracks. Future voice should finish before 18s. Recover the score after the measured last word; do not derive narration timing from these planned cues.',
  },
  analysis: { music: stats(musicL, musicR), sfx: stats(sfxL, sfxR) },
  measuredLoudness: { method: 'ffmpeg loudnorm input measurements; processed output discarded', ...measuredLoudness },
  sha256: { music: createHash('sha256').update(music).digest('hex'), sfx: createHash('sha256').update(sfx).digest('hex') },
};
writeFileSync(new URL('audio-provenance.json', folder), `${JSON.stringify(provenance, null, 2)}\n`);
console.log(JSON.stringify({ reel: 'R23', seconds, sampleRate: rate, channels: 2, ...provenance.analysis, measuredLoudness }, null, 2));
