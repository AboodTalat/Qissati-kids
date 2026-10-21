import measured from './captions.json';
import voiceTiming from './voice-timing.json';

export const smooth = (value) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
export const mix = (a, b, t) => a + (b - a) * t;
export const enter = (frame, start, duration = 24) => smooth((frame - start) / duration);
export const aligned = voiceTiming.aligned;
export const captions = measured;
// The supplied second-by-second schedule remains the visual plan. Captions
// above use measured final-WAV intervals, not this planned cadence.
export const schedule = [
  'من فوق،', 'عمّان شوارع', 'وبيوت.', 'بس من', 'عيون طفل؟',
  'درج طويل', 'بصير طريق', 'كنز،', 'وشجرة الحارة', 'بتصير قلعة،',
  'وضوّ الشباك', 'بصير إشارة', 'لبداية', 'المغامرة. تخيّلوا',
  'مدينتكم مرسومة', 'على مقاس', 'خياله. أي', 'مكان',
  'فيها بتحبّوا', 'يدخل قصته؟',
];
