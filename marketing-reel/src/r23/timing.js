export const palette = { cream: '#f6eee0', paper: '#fff9ef', teal: '#23665d', deep: '#153e36', gold: '#bd985a', sage: '#a6b59a', edge: '#daceb4' };
export const clamp = (v) => Math.max(0, Math.min(1, v));
export const mix = (a, b, p) => a + (b - a) * p;
export const ease = (v) => { const p = clamp(v); return p * p * (3 - 2 * p); };
export const enter = (t, at, duration = .6) => ease((t - at) / duration);
export const cues = { ribbon: 1, lid: 4, book: 6, cover: 9, garden: 12, settle: 15, finalHold: 16, cta: 17 };
