import { Easing } from 'remotion';

// Shared timing helpers for the R25–R36 sprint. Everything is a pure function of
// the frame, so paused and backward Studio seeks always land on the same pixels.
// The rules these encode live in briefs/2026-11-reels-sprint/00-production-bible.md.

export const FPS = 30;

// The bible's default ease for camera and morphs: soft start, softer landing.
export const ease = Easing.bezier(0.33, 0, 0.2, 1);
// Text entrances settle quickly and never overshoot.
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

export const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
export const lerp = (a, b, t) => a + (b - a) * t;

// Eased 0→1 progress of a span that starts at `from` and lasts `duration` frames.
export function progress(frame, from, duration, easing = ease) {
  if (duration <= 0) return frame >= from ? 1 : 0;
  return easing(clamp((frame - from) / duration));
}

// Visible window with eased entry and exit, for copy that comes and goes.
export function windowed(frame, inAt, outAt, fadeIn = 10, fadeOut = 8) {
  const enter = progress(frame, inAt, fadeIn, easeOut);
  const leave = outAt === undefined ? 0 : progress(frame, outAt - fadeOut, fadeOut, ease);
  return clamp(enter - leave);
}

export const sec = (s) => Math.round(s * FPS);

// The bible's reading-time rule: 0.6 s + 0.32 s per word.
export const minReadFrames = (text) => sec(0.6 + 0.32 * text.trim().split(/\s+/).length);
