export const palette = {
  cream: '#f9f1e3', paper: '#fffaf0', teal: '#146466', deep: '#163e3b',
  gold: '#b98a37', brass: '#c4a05d', sage: '#a7ba98', muted: '#596f63',
};
export const clamp = (value) => Math.max(0, Math.min(1, value));
export const mix = (a, b, p) => a + (b - a) * p;
export const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
export const enter = (time, at, duration = 0.5) => smooth((time - at) / duration);

// Planned visual cues. No voice recording or measured speech alignment exists.
export const cues = {
  pocket: 0.3, starLift: 0.65, goldenRoute: 2.6, balloonAssembly: 4.2,
  flight: 6.2, bookOpens: 11.4, starLanding: 13.5, closingCopy: 13,
  cta: 16.5, quietHold: 17,
};
