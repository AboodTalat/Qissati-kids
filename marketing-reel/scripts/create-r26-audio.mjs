import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// R26 · an original curious marimba theme and a soft paper/keyboard sound palette. Every sample is
// synthesized below; there are no external recordings, samples or voice takes.
const rate = 48000;
const seconds = 20;
const framesPerSecond = 30;
const count = rate * seconds;
// Source-track gains are authored here, before encoding, for reproducible mixes.
const musicMasterGain = 2.5 * 10 ** (5 / 20);
const sfxMasterGain = 10 ** (3 / 20);
const folder = new URL('../public/r26/', import.meta.url);
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

// 96 BPM in D major. A light marimba question-and-answer phrase over a soft
// string-like pad; it lifts when the page appears (8 s) and settles for the price.
const b = 0.625;
const melody = [
  [0.1,74,.05,-.1],[0.1+b,78,.042,.1],[0.1+2*b,81,.044,0],[0.1+3*b,79,.04,-.1],
  [0.1+5*b,76,.046,.1],[0.1+6*b,78,.04,0],[0.1+7*b,74,.042,-.1],
  [8.1,81,.05,.1],[8.1+b,83,.044,0],[8.1+2*b,86,.046,-.1],[8.1+3*b,85,.04,.1],[8.1+4*b,81,.044,0],
  [8.1+6*b,79,.042,-.1],[8.1+7*b,78,.04,.1],[8.1+8*b,76,.042,0],
  [14.1,78,.042,0],[14.1+b,81,.04,.1],[14.1+2*b,79,.038,-.1],
  [16.1,74,.046,0],[16.1+b,78,.04,.1],[16.1+2*b,81,.044,0],[16.1+4*b,86,.04,0],
];
melody.forEach(([at, midi, gain, pan]) => note(at, midi, gain, pan));

const chords = [[0,[38,50,54,57,62]],[5,[43,55,59,62,67]],[8,[45,57,61,64,69]],[12,[47,59,62,66,71]],[16,[38,50,54,57,62]]];
for (const [at, pitches] of chords) {
  pitches.slice(1).forEach((midi, n) => note(at + .025 + n * .023, midi, .015, (n - 1.5) * .07, 'piano'));
  const bass = pluck(pitches[0], 3.3, 'piano');
  add(musicL, musicR, at, bass, 0, .045);
}
for (let i = 0; i < count; i++) {
  const t = i / rate;
  let l = 0, r = 0;
  for (let n = 0; n < chords.length; n++) {
    const [at, pitches] = chords[n];
    const end = n < chords.length - 1 ? chords[n + 1][0] + .7 : seconds;
    const env = smooth((t - at) / .7) * smooth((end - t) / .7);
    if (env <= 0) continue;
    pitches.slice(1, 4).forEach((midi, p) => {
      const f = hz(midi);
      const gain = .007 / (1 + p * .3);
      l += Math.sin(tau * f * t + Math.sin(t * .6 + p) * .035) * gain * env;
      r += Math.sin(tau * f * t + Math.sin(t * .6 + p + .4) * .035) * gain * env;
    });
  }
  const lift = 1 + smooth((t - 8) / 1.2) * .15 - smooth((t - 17.5) / 1.5) * .1;
  musicL[i] += l * lift; musicR[i] += r * lift;
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
// Cues follow the reel's frames (30 fps): a soft key tick per typed word, a paper
// whoosh on the card → page morph, a rustle as the art is revealed, a shimmer when
// the gold line reaches the sock, a page turn, and one light chime on the price.
const keyTick = tap(260101);
[90, 102, 120, 132, 150, 158, 166, 174].forEach((f, n) => add(sfxL, sfxR, f / 30, keyTick, n % 2 ? .08 : -.08, .07));
paper(216 / 30, .9, .12, 0, 260201);
paper(244 / 30, .7, .07, .1, 260301);
chime(13.0, 86, .035, -.1);
paper(16.0, .8, .13, .15, 260401);
chime(545 / 30, 81, .04, 0);


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
  reel: 'R26',
  music: 'Original deterministic oscillator composition authored in scripts/create-r26-audio.mjs (D-major marimba theme, rolled piano chords, soft pad). No third-party audio or samples.',
  sfx: 'Original deterministic synthesis: key ticks, paper whoosh/rustle, rounded chimes. No external samples.',
  voice: 'Pending: house voice not chosen and no ElevenLabs take yet. Captions in src/r26/captions-planned.json are a planned cadence for layout only.',
  sampleRate: rate, durationSeconds: seconds, frameRate: framesPerSecond, channels: 2, encoding: '16-bit signed PCM WAV',
  bpm: 96, key: 'D major',
  mixing: { previewWithoutVoice: { music: .85, sfx: .9 }, withAlignedVoice: { music: .3, sfx: .9, voice: 1 } },
  analysis: { music: stats(musicL, musicR), sfx: stats(sfxL, sfxR) },
  measuredLoudness: { method: 'ffmpeg loudnorm input measurements; processed output discarded', ...measuredLoudness },
  sha256: { music: createHash('sha256').update(music).digest('hex'), sfx: createHash('sha256').update(sfx).digest('hex') },
};
writeFileSync(new URL('audio-provenance.json', folder), `${JSON.stringify(provenance, null, 2)}\n`);
console.log(JSON.stringify({ reel: 'R26', ...provenance.analysis, measuredLoudness }, null, 2));
