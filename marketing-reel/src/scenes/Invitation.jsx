import { CanvasImage, Easing, Interactive, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Stage, Star } from '../Elements';
import { brand } from '../brand';
export function Invitation() {
  const frame = useCurrentFrame();
  return <Stage>
    <Interactive.Div name="Qissati brand mark" data-reel-essential="Qissati brand mark" style={{ position: 'absolute', top: 52, insetInlineStart: 236, width: 248, height: 236, scale: interpolate(frame, [0, 35], [0.84, 1], { extrapolateRight: 'clamp', output: 'perceptual-scale', easing: Easing.bezier(0.16, 1, 0.3, 1) }), opacity: interpolate(frame, [0, 16], [0, 1], { extrapolateRight: 'clamp' }) }}><CanvasImage src={staticFile('brand/logo.png')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></Interactive.Div>
    <Interactive.Div name="Qissati wordmark" data-reel-essential="Qissati wordmark" style={{ position: 'absolute', top: 306, insetInline: 0, textAlign: 'center', fontSize: 112, fontWeight: 800, lineHeight: 1.3 }}>قصتي</Interactive.Div>
    <div style={{ position: 'absolute', top: 482, insetInlineStart: 287, width: 146, height: 3, backgroundColor: '#f4b740' }} />
    <Interactive.Div name="Order invitation" data-reel-essential="Order invitation" style={{ position: 'absolute', top: 529, insetInline: 0, textAlign: 'center', fontSize: 84, fontWeight: 800, lineHeight: 1.4, opacity: interpolate(frame, [14, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), translate: interpolate(frame, [14, 35], ['0px 24px', '0px 0px'], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>اطلبوا حكاية<br />طفلكم الخاصة</Interactive.Div>
    <Interactive.Div name="Bio link call to action" data-reel-essential="Bio link call to action" style={{ position: 'absolute', top: 783, insetInline: 0, fontSize: 44, lineHeight: 1.4, fontWeight: 700, color: '#f4b740', textAlign: 'center', opacity: interpolate(frame, [25, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>من الرابط في البايو</Interactive.Div>
    <div data-reel-essential="Instagram handle" dir="ltr" style={{ position: 'absolute', top: 864, insetInline: 0, fontSize: 44, lineHeight: 1.4, fontWeight: 600, textAlign: 'center' }}>{brand.instagram}</div>
    <Star x={104} y={145} size={40} delay={10} /><Star x={579} y={245} size={28} delay={20} />
  </Stage>;
}
