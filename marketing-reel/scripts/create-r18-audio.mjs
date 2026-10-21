import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

// Original score and tactile accents: no samples, recordings or external music.
const rate = 48000, seconds = 20, count = rate * seconds;
const folder = new URL('../public/r18/', import.meta.url);
const cues = JSON.parse(readFileSync(new URL('../src/r18/audio-cues.json', import.meta.url), 'utf8'));
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
const musicLeft = new Float32Array(count), musicRight = new Float32Array(count);
const effectsLeft = new Float32Array(count), effectsRight = new Float32Array(count);
// A tender D-major paper-box phrase. The second route echoes the first.
const notes = [[0.22, 293.665], [2.05, 369.994], [4.03, 440], [5.62, 493.883],
  [7.65, 369.994], [9.15, 440], [11.1, 293.665], [13.5, 369.994],
  [15.4, 440], [17.65, 293.665], [18.75, 220]];
let seed = 181820, low = 0, warm = 0;
const creakAt = (cues.voiceWordFrames?.bridge ?? cues.bridgeFrame) / cues.fps;
const beaconAt = (cues.voiceWordFrames?.beacon ?? cues.beaconFrame) / cues.fps;
const taps = cues.voiceWordFrames ? [cues.voiceWordFrames.firstChoice, cues.voiceWordFrames.secondChoice].map((frame) => frame / cues.fps) : cues.choiceTapFrames.map((frame) => frame / cues.fps);
const rewindAt = cues.rewindFrame / cues.fps;
for (let i = 0; i < count; i++) {
  const t = i / rate;
  const fade = Math.max(0, Math.min(1, t / 0.8, (seconds - t) / 0.65));
  const pad = [146.832, 220, 293.665, 369.994].reduce((sum, hz, n) => sum + Math.sin(2 * Math.PI * hz * t + Math.sin(t * 0.17 + n) * 0.045) * 0.012 / (n + 1), 0);
  let l = pad, r = pad;
  for (let n = 0; n < notes.length; n++) {
    const [at, hz] = notes[n], u = t - at;
    if (u < 0 || u > 4) continue;
    const envelope = (1 - Math.exp(-u * 13)) * Math.exp(-u * 1.75);
    const note = (Math.sin(2 * Math.PI * hz * u) + 0.1 * Math.sin(2 * Math.PI * hz * 2.001 * u) + 0.025 * Math.sin(2 * Math.PI * hz * 3 * u)) * envelope * 0.065;
    const pan = n % 2 ? 0.18 : -0.18;
    l += note * (1 - pan); r += note * (1 + pan);
  }
  musicLeft[i] = l * fade; musicRight[i] = r * fade;
  seed = (1664525 * seed + 1013904223) >>> 0;
  const noise = seed / 4294967296 * 2 - 1;
  low = low * 0.86 + noise * 0.14;
  warm = warm * 0.98 + noise * 0.02;
  let fxL = 0, fxR = 0;
  const creak = t - creakAt;
  if (creak >= 0 && creak < 0.65) {
    const env = Math.sin(Math.PI * creak / 0.65) ** 2;
    // Rounded wooden/paper creak: soft low pitch, no alarm or distress cue.
    const sound = (Math.sin(2 * Math.PI * (160 * creak + 14 * Math.sin(creak * 5))) * 0.025 + warm * 0.12) * env;
    fxL += sound * 1.15; fxR += sound * 0.75;
  }
  const beacon = t - beaconAt;
  if (beacon >= 0 && beacon < 1.25) {
    const env = (1 - Math.exp(-beacon * 45)) * Math.exp(-beacon * 4.1);
    const sound = (Math.sin(2 * Math.PI * 880 * beacon) + Math.sin(2 * Math.PI * 1320 * beacon) * 0.12) * env * 0.032;
    fxL += sound * 0.75; fxR += sound * 1.15;
  }
  for (let n = 0; n < taps.length; n++) {
    const u = t - taps[n];
    if (u < 0 || u >= 0.16) continue;
    const sound = (Math.sin(2 * Math.PI * (n ? 740 : 620) * u) * 0.043 + low * 0.04) * (1 - Math.exp(-u * 1600)) * Math.exp(-u * 60);
    fxL += sound * (n ? 0.75 : 1.15); fxR += sound * (n ? 1.15 : 0.75);
  }
  const rewind = t - rewindAt;
  if (rewind >= 0 && rewind < 0.4) {
    const progress = rewind / 0.4, env = Math.sin(Math.PI * progress) ** 2;
    const paper = (low - warm) * 0.11 + Math.sin(2 * Math.PI * (530 * rewind - 290 * rewind * rewind)) * 0.012;
    fxL += paper * env * (1.1 - 0.3 * progress); fxR += paper * env * (0.8 + 0.3 * progress);
  }
  effectsLeft[i] = fxL; effectsRight[i] = fxR;
}
writeFileSync(new URL('music.wav', folder), wav(musicLeft, musicRight));
writeFileSync(new URL('sfx.wav', folder), wav(effectsLeft, effectsRight));
const prior = (() => { try { return JSON.parse(readFileSync(new URL('audio-provenance.json', folder), 'utf8')); } catch { return {}; } })();
writeFileSync(new URL('audio-provenance.json', folder), JSON.stringify({
  ...prior,
  music: 'Original deterministic oscillator composition by scripts/create-r18-audio.mjs; no samples, filmed audio or third-party music.',
  sfx: 'Original deterministic synthesis: gentle bridge creak, welcoming helper beacon, two soft choice taps and a 0.4-second paper rewind flourish.',
  voice: prior.voice ?? 'Pending complete ElevenLabs recording and final-WAV measured alignment. No placeholder speech or assumed subtitle timings are presented as final.',
  sampleRate: rate, durationSeconds: seconds, channels: 2,
  sfxCueSeconds: { bridge: creakAt, beacon: beaconAt, choiceTaps: taps, rewind: rewindAt, rewindDuration: 0.4 },
}, null, 2) + '\n');
console.log('R18: original separate 20-second 48kHz stereo music and SFX generated. Voice remains independent.');
