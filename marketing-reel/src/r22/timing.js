export const palette = {
  night: '#082f32', teal: '#12585a', deep: '#062528', cream: '#fff4da',
  paper: '#f6ead0', sage: '#9fb999', gold: '#d7b566', bronze: '#95713c',
};
export const clamp = (n) => Math.max(0, Math.min(1, n));
export const mix = (a, b, p) => a + (b - a) * p;
export const smooth = (n) => { const p = clamp(n); return p * p * (3 - 2 * p); };
export const enter = (t, at, duration = 0.6) => smooth((t - at) / duration);
// Planned visual/audio cues only. No recorded narration has been supplied.
export const r22Cues = {
  latch: 2.25, shutters: 3, garden: 4.1, stars: [5.1, 5.5, 5.9],
  boat: 7.4, sail: 8.2, fold: 12, book: 13.3, save: 15.2,
};
