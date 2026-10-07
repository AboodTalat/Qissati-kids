import measured from './captions.json';
import planned from './captions-planned.json';
import voiceTiming from './voice-timing.json';

export const FPS = 30;
export const DURATION = 630;
export const aligned = voiceTiming.aligned;
export const captions = aligned ? measured : planned;
export const clamp = (n) => Math.min(1, Math.max(0, n));
export const ease = (n) => { const t = clamp(n); return t * t * (3 - 2 * t); };
export const mix = (a, b, t) => a + (b - a) * t;
export const enter = (frame, start, duration = 24) => ease((frame - start) / duration);
const noun = (text, fallback) => aligned
  ? Math.round(captions.find((word) => word.text.trim().split(/\s+/u).includes(text))?.startMs * FPS / 1000) || fallback
  : fallback;

// The reference cadence stays the fallback. Final-WAV nouns own the three
// camera/reveal cues as soon as measured captions are imported.
export const cues = {
  boot: noun('بجزمة', 120), stone: noun('حجر', 180), key: noun('مفتاح', 240),
  overlap: 270, settle: 300, paper: 360, book: 390,
  orbit: 420, halfClose: 450, brand: 510, cta: 540, tail: 570, reset: 600,
};
