import measured from './captions.json';
import voiceTiming from './voice-timing.json';

export const palette = { teal: '#146466', deep: '#092f32', cream: '#fdf8f0', gold: '#d6b576', wall: '#154d50' };
export const smooth = (value) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
export const mix = (a, b, t) => a + (b - a) * t;
export const enter = (time, start, duration = 0.6) => smooth((time - start) / duration);
export const captions = measured;
export const aligned = voiceTiming.aligned;

// Exact supplied one-second cadence. This is a plan, never measured captions.
export const cadence = [
  'قبل ما', 'تطفّوا الضو،', 'جرّبوا تسألوا', 'طفلكم: لو',
  'في باب', 'سري بغرفتك،', 'وين بودّيك؟', 'اسمعوا الجواب',
  'من غير ما', 'تصحّحوه. يمكن', 'يطلع منه', 'عالم كامل.',
  'احفظوا السؤال', 'لليلة اللي', 'بدكم فيها', 'حكاية جديدة.',
];

export function roomState(time) {
  const approach = enter(time, 3, 5) * (1 - enter(time, 15, 3 - 1 / 30));
  const crack = enter(time, 6, 1) * 0.16 + enter(time, 7, 2) * 0.78;
  const open = crack * (1 - enter(time, 15, 2.6));
  const moon = enter(time, 0.6, 1.5) * (1 - enter(time, 16.8, 18 - 1 / 30 - 16.8));
  const outline = enter(time, 2, 0.9) * (1 - enter(time, 17, 18 - 1 / 30 - 17));
  return { approach, open, moon, outline };
}
