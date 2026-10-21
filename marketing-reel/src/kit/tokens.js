// Sprint-wide design tokens. Colours are the site's @theme values (app/globals.css);
// the darkest and lightest values are the eye-comfort extremes from the bible —
// no pure black or white anywhere in a frame.
export const C = {
  cream: '#fdf8f0',
  paper: '#f7eee0',
  paperShade: '#e9dcc5',
  teal: '#146466',
  tealDeep: '#0f4f51',
  night: '#0b3c3e',
  gold: '#f4b740',
  goldDeep: '#9e6a0c', // gold for TEXT: ≥ 3:1 on cream at headline sizes
  berry: '#b84c6e',
  ink: '#2e2a26',
};

// Vertical bands inside the Instagram-safe rectangle (x 180–900, y 300–1230).
export const BANDS = {
  mark: { top: 318, height: 62 },
  headline: { top: 404, height: 236 },
  stage: { top: 640, height: 420 },
  subtitles: { top: 1070, height: 100 },
  cta: { top: 1170, height: 58 },
};

export const SAFE = { left: 180, top: 300, width: 720, height: 930, right: 900, bottom: 1230 };
