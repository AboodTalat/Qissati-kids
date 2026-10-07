import { Easing, Interactive, interpolate, useCurrentFrame } from 'remotion';
import { Book, Caption, Masthead, Stage, Star } from '../Elements';
export function Hook() {
  const frame = useCurrentFrame();
  return <Stage>
    <Masthead />
    <Interactive.Div name="Opening hook" data-reel-essential="Opening hook" style={{ position: 'absolute', top: 100, insetInline: 0, textAlign: 'center', fontSize: 84, fontWeight: 800, lineHeight: 1.3, translate: interpolate(frame, [0, 27], ['0px 12px', '0px 0px'], { extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>تخيّل طفلك<br /><span style={{ color: '#f4b740', fontSize: 94 }}>بطل الحكاية</span></Interactive.Div>
    <Interactive.Div name="Storybook cover" data-reel-essential="Storybook cover" style={{ position: 'absolute', top: 360, insetInlineStart: 130, width: 460, height: 460, scale: interpolate(frame, [0, 30, 119], [0.9, 0.98, 1], { extrapolateRight: 'clamp', output: 'perceptual-scale', easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}><Book title /></Interactive.Div>
    <Star x={55} y={420} size={44} delay={5} /><Star x={630} y={724} size={32} delay={15} />
    <Caption>قصص مصوّرة مخصّصة بالكامل</Caption>
  </Stage>;
}
