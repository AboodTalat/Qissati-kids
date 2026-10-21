export const palette = {
  cream: '#fdf8f0', paper: '#fffdf6', teal: '#146466', deep: '#123f3d',
  gold: '#b98a37', paleGold: '#dbc591', muted: '#66736c',
};

export const clamp = (value) => Math.max(0, Math.min(1, value));
export const mix = (from, to, amount) => from + (to - from) * amount;
export const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
export const enter = (time, at, duration = 0.5) => smooth((time - at) / duration);

// The supplied visual schedule. This is planned cadence, not voice alignment.
export const titleSchedule = [
  { from: 0, to: 3, text: '٣ كلمات = بداية حكاية' },
  { from: 3, to: 12, text: 'مكان + غرض + شعور' },
  { from: 12, to: 20, text: 'اكتبوا ٣ كلمات' },
];

export const categories = [
  { kind: 'place', name: 'مكان', example: 'حديقة', at: 5 },
  { kind: 'object', name: 'غرض', example: 'مفتاح', at: 6 },
  { kind: 'feeling', name: 'شعور', example: 'فضول', at: 7 },
];
