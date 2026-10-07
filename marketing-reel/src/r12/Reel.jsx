import { Audio } from '@remotion/media';
import { TransitionSeries } from '@remotion/transitions';
import { staticFile } from 'remotion';
import { Opening } from './Opening';
import { Question } from './Question';
import { Story } from './Story';

export function QuestionsReel() {
  return <>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={45} name="سبع أسئلة بتصير قصة"><Opening /></TransitionSeries.Sequence>
      <TransitionSeries.Sequence durationInFrames={32} name="شو بحب أكثر شي؟"><Question number={1} title={'شو بحب\nأكثر شي؟'} asset="favourite" /></TransitionSeries.Sequence>
      <TransitionSeries.Sequence durationInFrames={32} name="مين بيلعب معه؟"><Question number={2} title={'مين بيلعب معه\nدايمًا؟'} asset="sidekick" /></TransitionSeries.Sequence>
      <TransitionSeries.Sequence durationInFrames={32} name="شو بيخوفه؟"><Question number={3} title="شو بيخوفه؟" asset="fear" /></TransitionSeries.Sequence>
      <TransitionSeries.Sequence durationInFrames={32} name="صفتين من شخصيته"><Question number={4} title={'صفتين\nمن شخصيته'} asset="traits" /></TransitionSeries.Sequence>
      <TransitionSeries.Sequence durationInFrames={32} name="أغرب عادة عنده"><Question number={5} title={'أغرب عادة\nعنده'} asset="quirk" /></TransitionSeries.Sequence>
      <TransitionSeries.Sequence durationInFrames={32} name="شو ما بدكم نذكره؟"><Question number={6} title={'شو ما بدكم\nنذكره أبدًا؟'} asset="avoid" /></TransitionSeries.Sequence>
      <TransitionSeries.Sequence durationInFrames={33} name="مين بطل القصة معه؟"><Question number={7} title={'مين بدكم يكون\nبطل معه؟'} asset="hero" /></TransitionSeries.Sequence>
      <TransitionSeries.Sequence durationInFrames={45} name="صفحة ٧: القطة والجوارب"><Story /></TransitionSeries.Sequence>
      <TransitionSeries.Sequence durationInFrames={45} name="الغلاف وسؤال التعليقات"><Story cover /></TransitionSeries.Sequence>
    </TransitionSeries>
    <Audio src={staticFile('r12/music.wav')} volume={0.72} />
  </>;
}
