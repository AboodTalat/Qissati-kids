import captions from './captions.json';
import voiceTiming from './voice-timing.json';
import audioCues from './audio-cues.json';

export const palette = {
  teal: '#146466', deep: '#0b3b3e', cream: '#fdf8f0', gold: '#d6b576',
};
export const clamp = (value) => Math.max(0, Math.min(1, value));
export const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
export const enter = (time, start, duration = 0.5) => smooth((time - start) / duration);
export const mix = (from, to, amount) => from + (to - from) * amount;
export const smoother = (value) => { const t = clamp(value); return t * t * t * (t * (t * 6 - 15) + 10); };

// Integrate a smooth velocity ramp, rather than jumping the clock across the
// choice pause. The papercraft scenery settles before 12s and resumes after 15s.
export function backdropClock(frame, fps = 30) {
  const seconds = frame / fps;
  const movingTime = (time) => {
    if (time < 11.2) return time;
    if (time < 12) { const u = (time - 11.2) / 0.8; return 11.2 + 0.8 * (u - u ** 3 + 0.5 * u ** 4); }
    if (time <= 15) return 11.6;
    if (time < 15.8) { const u = (time - 15) / 0.8; return 11.6 + 0.8 * (u ** 3 - 0.5 * u ** 4); }
    return time - 3.8;
  };
  if (seconds < 19.6) return movingTime(seconds);
  return movingTime(19.6) * (1 - smoother((frame - 19.6 * fps) / (20 * fps - 1 - 19.6 * fps)));
}
export const aligned = voiceTiming.aligned;
export { captions, voiceTiming, audioCues };

// These A/B/C cuts are the supplied copy schedule, independent of subtitle pages.
export const titleSchedule = [
  { from: 0, to: 3, text: 'النهاية ١ أو ٢؟' },
  { from: 3, to: 12, text: 'جسر للصديق / طريق للمساعدة' },
  { from: 12, to: 20, text: 'اختاروا النهاية' },
];

export const subtitlePages = captions.reduce((pages, word) => {
  if (!pages.length || pages.at(-1).at(-1).pageBreakAfter) pages.push([]);
  pages.at(-1).push(word);
  return pages;
}, []);
