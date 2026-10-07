import { Audio } from '@remotion/media';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { wipe } from '@remotion/transitions/wipe';
import { fade } from '@remotion/transitions/fade';
import { staticFile } from 'remotion';
import { Hook } from './scenes/Hook';
import { Detail } from './scenes/Detail';
import { Adventure } from './scenes/Adventure';
import { Keepsake } from './scenes/Keepsake';
import { Invitation } from './scenes/Invitation';
import { SafeAreaPreview } from './SafeAreaPreview';
export function Reel({ music = true, safeAreaPreview = false }) {
  return <>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={120} name="تخيّل طفلك بطل الحكاية"><Hook /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={wipe({ direction: 'from-left' })} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence durationInFrames={132} name="التفصيلة الصغيرة"><Detail /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence durationInFrames={132} name="التفصيلة تصير مغامرة"><Adventure /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={wipe({ direction: 'from-left' })} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence durationInFrames={132} name="قصة مخصصة بالكامل"><Keepsake /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
      <TransitionSeries.Sequence durationInFrames={132} name="اطلبوا قصة طفلكم"><Invitation /></TransitionSeries.Sequence>
    </TransitionSeries>
    {music ? <Audio src={staticFile('audio/qissati-original.wav')} volume={0.72} /> : null}
    {safeAreaPreview ? <SafeAreaPreview /> : null}
  </>;
}
