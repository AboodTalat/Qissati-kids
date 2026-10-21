export const palette = {
  deep: '#062d30', teal: '#146466', cream: '#fdf8f0', gold: '#d6b576',
};
export const clamp = (value) => Math.max(0, Math.min(1, value));
export const mix = (from, to, amount) => from + (to - from) * amount;
export const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
export const enter = (time, start, duration = 0.5) => smooth((time - start) / duration);
export const aligned = voiceTiming.aligned;
export { captions, voiceTiming, audioCues };
export const tickSeconds = aligned ? audioCues.voiceWordFrames.ticks.map((frame) => frame / 30) : [0.32, 1.18, 2.14];
export const rainAt = aligned ? audioCues.voiceWordFrames.rain / 30 : 2.68;
export const stepSeconds = (audioCues.stepFrames ?? [249, 270, 291]).map((frame) => frame / 30);
export const subtitlePages = captions.reduce((pages, word) => {
  if (!pages.length || pages.at(-1).at(-1).pageBreakAfter) pages.push([]);
  pages.at(-1).push(word);
  return pages;
}, []);

// The paper unfolds on “بممر”; preserve the designed final hold and reset.
export function paperSceneTime(time) {
  const shift = aligned ? audioCues.voiceWordFrames.corridor / 30 - 6.05 : 0;
  return time - shift * (1 - enter(time, 10.6, 0.6));
}

// This is the supplied visual-copy schedule, not measured speech alignment.
export const titleSchedule = [
  { from: 0, to: 3, text: 'تك... تك... تك' },
  { from: 3, to: 11, text: 'مطر؟ خطوات؟' },
  { from: 11, to: 19, text: 'إنت شو شايف؟' },
];

import captions from './captions.json';
import voiceTiming from './voice-timing.json';
import audioCues from './audio-cues.json';

