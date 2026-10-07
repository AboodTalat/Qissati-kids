import { Easing, Interactive, interpolate, useCurrentFrame } from 'remotion';
import { Book, Caption, Masthead, Stage } from '../Elements';
export function Detail() {
  const frame = useCurrentFrame();
  return <Stage paper>
    <Masthead paper />
    <Interactive.Div name="Personalisation promise" data-reel-essential="Personalisation promise" style={{ position: 'absolute', top: 108, insetInline: 0, textAlign: 'center', fontSize: 84, fontWeight: 800, lineHeight: 1.3, opacity: interpolate(frame, [3, 23], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), translate: interpolate(frame, [3, 28], ['0px 12px', '0px 0px'], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>تفصيلة صغيرة…<br />بتبدأ حكاية كبيرة</Interactive.Div>
    <Interactive.Div name="Layan and her colourful socks" data-reel-essential="Layan and her colourful socks" style={{ position: 'absolute', top: 360, insetInlineStart: 130, width: 460, height: 460, scale: interpolate(frame, [0, 131], [0.96, 1], { output: 'perceptual-scale' }) }}><Book cover="page-05.jpg" /></Interactive.Div>
    <Caption paper>ليان بتحب تلبس جرابين بلونين</Caption>
  </Stage>;
}
