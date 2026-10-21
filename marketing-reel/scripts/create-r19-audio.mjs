import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

// R19's score is authored here from oscillators and deterministic noise only.
// No recording, external sample, third-party music or substitute voice is used.
const rate = 48000;
const seconds = 19;
const count = rate * seconds;
const folder = new URL('../public/r19/', import.meta.url);
mkdirSync(folder, { recursive: true });
const readJson = (url, fallback = {}) => { try { return JSON.parse(readFileSync(url, 'utf8')); } catch { return fallback; } };
const voiceTiming = readJson(new URL('../src/r19/voice-timing.json', import.meta.url));
const cues = readJson(new URL('../src/r19/audio-cues.json', import.meta.url));
const previousProvenance = readJson(new URL('audio-provenance.json', folder));
const cueRate = cues.fps ?? 30;
const paperAt = voiceTiming.aligned ? cues.paperHushFrame / cueRate : 7;
const rainStart = voiceTiming.aligned ? cues.voiceWordFrames.rain / cueRate + 0.12 : 3;
const rainEnd = voiceTiming.aligned ? paperAt + 0.4 : 6.8;
const musicL = new Float64Array(count), musicR = new Float64Array(count);
const effectsL = new Float64Array(count), effectsR = new Float64Array(count);
const tau = Math.PI * 2;
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smooth = (value) => { const u = clamp(value); return u * u * (3 - 2 * u); };
function random(seed) {
  let state = seed >>> 0;
  return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296 * 2 - 1; };
}
function add(left, right, at, sampleL, sampleR = sampleL, gain = 1) {
  const start = Math.round(at * rate);
  for (let j = 0; j < sampleL.length && start + j < count; j++) {
    if (start + j < 0) continue;
    left[start + j] += sampleL[j] * gain;
    right[start + j] += sampleR[j] * gain;
  }
}
function wav(left, right) {
  const out = Buffer.alloc(44 + left.length * 4);
  out.write('RIFF', 0); out.writeUInt32LE(out.length - 8, 4); out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
  out.writeUInt32LE(rate, 24); out.writeUInt32LE(rate * 4, 28);
  out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36);
  out.writeUInt32LE(left.length * 4, 40);
  for (let i = 0; i < left.length; i++) {
    out.writeInt16LE(Math.round(clamp(left[i], -1, 1) * 32767), 44 + i * 4);
    out.writeInt16LE(Math.round(clamp(right[i], -1, 1) * 32767), 46 + i * 4);
  }
  return out;
}

// One dry, rounded micro-tap; its SAME buffer is placed three times, centred.
// Its timbre supports either a drop on glass or a tiny paper footstep.
const tick = new Float64Array(Math.round(rate * 0.22));
const tickNoise = random(190103);
let tickLow = 0;
for (let i = 0; i < tick.length; i++) {
  const u = i / rate;
  tickLow = tickLow * 0.65 + tickNoise() * 0.35;
  const attack = 1 - Math.exp(-u * 2100);
  const tap = Math.sin(tau * (742 * u - 93 * u * u)) * Math.exp(-u * 81)
    + Math.sin(tau * 1471 * u) * Math.exp(-u * 128) * 0.25
    + Math.sin(tau * 258 * u) * Math.exp(-u * 55) * 0.36
    + tickLow * Math.exp(-u * 205) * 0.44;
  tick[i] = tap * attack * 0.29 * smooth((0.22 - u) / 0.015);
}
const tickTimes = voiceTiming.aligned ? cues.tickFrames.map((frame) => frame / cueRate) : [0.32, 1.18, 2.14];
tickTimes.forEach((at) => add(effectsL, effectsR, at, tick));

// A slow suspended D/add9 colour rather than a beat: the sound has room to lead.
// Both ends resolve to digital silence, so a replay has a clean breath.
for (let i = 0; i < count; i++) {
  const t = i / rate;
  const opening = smooth((t - 0.5) / 1.9);
  const tail = smooth((seconds - t) / 1.7);
  const recede = 1 - smooth((t - 15) / 1.0) * 0.68;
  const swell = 0.88 + Math.sin(tau * t / 19 - 0.5) * 0.12;
  let l = 0, r = 0;
  const pitches = [146.8324, 220, 293.6648, 329.6276, 369.9944];
  for (let n = 0; n < pitches.length; n++) {
    const hz = pitches[n];
    const gain = [0.032, 0.025, 0.017, 0.012, 0.011][n];
    const breath = 1 + Math.sin(tau * t * 0.11 + n * 0.83) * 0.09;
    // A warm fundamental and very quiet upper partial; no harsh saw texture.
    l += (Math.sin(tau * hz * t + Math.sin(t * 0.4 + n) * 0.019)
      + Math.sin(tau * hz * 2 * t) * 0.035) * gain * breath;
    r += (Math.sin(tau * hz * t + Math.sin(t * 0.4 + n + 0.35) * 0.019)
      + Math.sin(tau * hz * 2 * t + 0.12) * 0.035) * gain * breath;
  }
  musicL[i] += l * opening * tail * recede * swell;
  musicR[i] += r * opening * tail * recede * swell;
}

// Sparse music-box phrase. No note starts during the three question-making taps.
const notes = [
  [3.25, 369.9944, -0.13, 0.097], [4.85, 329.6276, 0.13, 0.076],
  [6.55, 293.6648, -0.08, 0.082], [9.95, 440, 0.12, 0.073],
  [11.9, 329.6276, -0.12, 0.068], [14.1, 293.6648, 0.08, 0.067],
  [16.65, 293.6648, 0, 0.024],
];
for (const [at, hz, pan, gain] of notes) {
  const l = new Float64Array(rate * 4), r = new Float64Array(rate * 4);
  for (let j = 0; j < l.length; j++) {
    const u = j / rate;
    const env = (1 - Math.exp(-u * 75)) * Math.exp(-u * 1.65);
    const sound = (Math.sin(tau * hz * u)
      + Math.sin(tau * hz * 2.003 * u) * 0.18
      + Math.sin(tau * hz * 3.98 * u) * 0.022) * env * gain;
    const tail = smooth((seconds - at - u) / 1.4);
    l[j] = sound * (1 - pan) * tail;
    r[j] = sound * (1 + pan) * tail;
  }
  add(musicL, musicR, at, l, r);
  // Diffuse echoes broaden the miniature without an obvious rhythmic delay.
  add(musicL, musicR, at + 0.19, r, l, 0.14);
  add(musicL, musicR, at + 0.41, l, r, 0.075);
}

// Rain: quiet band-limited air and tiny individually synthesized glass droplets.
const rainNoiseL = random(190301), rainNoiseR = random(190302);
let rainLowL = 0, rainLowR = 0, rainWarmL = 0, rainWarmR = 0;
for (let i = Math.round(rainStart * rate); i < Math.round(rainEnd * rate); i++) {
  const t = i / rate;
  const nL = rainNoiseL(), nR = rainNoiseR();
  rainLowL = rainLowL * 0.83 + nL * 0.17;
  rainLowR = rainLowR * 0.83 + nR * 0.17;
  rainWarmL = rainWarmL * 0.985 + nL * 0.015;
  rainWarmR = rainWarmR * 0.985 + nR * 0.015;
  const env = smooth((t - rainStart) / 0.6) * smooth((rainEnd - t) / 0.8);
  effectsL[i] += (rainLowL - rainWarmL) * env * 0.016;
  effectsR[i] += (rainLowR - rainWarmR) * env * 0.016;
}
const rainEvents = random(190305);
for (let n = 0; n < 39; n++) {
  const at = rainStart + 0.18 + n * 0.087 + (rainEvents() + 1) * 0.034;
  const hz = 1170 + (rainEvents() + 1) * 430;
  const pan = rainEvents() * 0.56;
  const gain = 0.008 + (rainEvents() + 1) * 0.0028;
  const l = new Float64Array(Math.round(rate * 0.085)), r = new Float64Array(l.length);
  for (let i = 0; i < l.length; i++) {
    const u = i / rate;
    const s = Math.sin(tau * (hz * u - 1700 * u * u)) * (1 - Math.exp(-u * 1800)) * Math.exp(-u * 116) * gain;
    const env = smooth((rainEnd - at) / 0.6);
    l[i] = s * (1 - pan) * env; r[i] = s * (1 + pan) * env;
  }
  add(effectsL, effectsR, at, l, r);
}

// The 7-second match cut sounds like a thin sheet gently brushing past the lens.
const hush = new Float64Array(Math.round(rate * 0.7));
const hushNoise = random(190701);
let hushLow = 0, hushWarm = 0;
for (let i = 0; i < hush.length; i++) {
  const u = i / rate, noise = hushNoise();
  hushLow = hushLow * 0.76 + noise * 0.24;
  hushWarm = hushWarm * 0.971 + noise * 0.029;
  const env = Math.sin(Math.PI * u / 0.7) ** 2;
  hush[i] = (hushLow - hushWarm) * env * 0.075;
}
add(effectsL, effectsR, paperAt - 0.35, hush);

// Three lightly embossed paper steps echo the SAME ambiguous primary tap.
const stepTimes = voiceTiming.aligned ? cues.stepFrames.map((frame) => frame / cueRate) : [8.3, 9.0, 9.7];
stepTimes.forEach((at, n) => {
  const l = new Float64Array(Math.round(rate * 0.33)), r = new Float64Array(l.length);
  const rustle = random(190800 + n);
  let low = 0, warm = 0;
  for (let i = 0; i < l.length; i++) {
    const u = i / rate, noise = rustle();
    low = low * 0.84 + noise * 0.16; warm = warm * 0.97 + noise * 0.03;
    const paper = (low - warm) * Math.sin(Math.PI * u / 0.33) ** 2 * 0.033;
    const sameTap = i < tick.length ? tick[i] * 0.31 : 0;
    const pan = n % 2 ? 0.1 : -0.1;
    l[i] = (sameTap + paper) * (1 - pan); r[i] = (sameTap + paper) * (1 + pan);
  }
  add(effectsL, effectsR, at, l, r);
  add(effectsL, effectsR, at + 0.135, r, l, 0.15);
});

// A final low paper breath lands in the same silence as the opening.
// No fourth clear tick resolves the question or spoils the three-hit hook.
const loopNoise = random(191801);
let loopLow = 0;
for (let i = Math.round(17.8 * rate); i < count; i++) {
  const t = i / rate;
  loopLow = loopLow * 0.94 + loopNoise() * 0.06;
  effectsL[i] += loopLow * 0.006 * Math.sin(Math.PI * (t - 17.8) / 1.2) ** 2;
  effectsR[i] += loopLow * 0.006 * Math.sin(Math.PI * (t - 17.8) / 1.2) ** 2;
}
for (let i = 0; i < count; i++) {
  const end = smooth((count - 1 - i) / (rate * 0.075));
  musicL[i] *= end; musicR[i] *= end;
  effectsL[i] *= end; effectsR[i] *= end;
}

function stats(left, right) {
  let peak = 0, sum = 0;
  for (let i = 0; i < count; i++) {
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
    sum += left[i] ** 2 + right[i] ** 2;
  }
  return { peakDbfs: Number((20 * Math.log10(peak)).toFixed(3)), rmsDbfs: Number((10 * Math.log10(sum / (count * 2))).toFixed(3)) };
}
const music = wav(musicL, musicR), effects = wav(effectsL, effectsR);
writeFileSync(new URL('music.wav', folder), music);
writeFileSync(new URL('sfx.wav', folder), effects);
const tickHash = createHash('sha256').update(Buffer.from(tick.buffer)).digest('hex');
writeFileSync(new URL('audio-provenance.json', folder), JSON.stringify({
  ...previousProvenance,
  music: 'Original deterministic oscillator composition authored in scripts/create-r19-audio.mjs: suspended warm pad, sparse tender music-box melody and diffuse echoes. No external samples, recordings or third-party music.',
  sfx: 'Original deterministic synthesis authored in scripts/create-r19-audio.mjs: three identical micro-taps, delicate rain, a paper match-cut hush, three light paper steps with quiet echoes and a final paper breath.',
  voice: voiceTiming.aligned ? 'Complete user-supplied ElevenLabs recording at original speed. Untouched voice-source.mp3, normalized mono48k voice.wav, reviewed final-WAV word alignment; no words removed.' : 'Pending complete user-supplied voice and reviewed final-WAV word alignment.',
  ...(voiceTiming.aligned ? { voiceSourceSha256: voiceTiming.sourceSha256, voiceFinalSha256: voiceTiming.finalSha256, voiceDurationMs: voiceTiming.voiceDurationMs, finalWordEndMs: voiceTiming.finalWordEndMs, voiceSpeed: voiceTiming.speed } : {}),
  sampleRate: rate, durationSeconds: seconds, channels: 2, encoding: '16-bit signed PCM WAV',
  sfxCueSeconds: { identicalTicks: tickTimes, rain: [rainStart, rainEnd], paperHush: { start: paperAt - 0.35, peak: paperAt, duration: 0.7 }, paperSteps: stepTimes, paperStepEchoDelay: 0.135, loopBreath: [17.8, 19] },
  identicalTickBufferSha256: tickHash,
  musicalDirection: 'Tender, spacious and curious; sound leads. Music recedes from 15–16s, with a restrained 17–19s tail. Zero-valued endpoints give a clean loop breath.',
  analysis: { music: stats(musicL, musicR), sfx: stats(effectsL, effectsR) },
  sha256: { music: createHash('sha256').update(music).digest('hex'), sfx: createHash('sha256').update(effects).digest('hex') },
}, null, 2) + '\n');
console.log(JSON.stringify({ reel: 'R19', durationSeconds: seconds, sampleRate: rate, channels: 2, music: stats(musicL, musicR), sfx: stats(effectsL, effectsR), identicalTicks: tickTimes }, null, 2));
