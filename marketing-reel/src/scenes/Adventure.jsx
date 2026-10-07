import { CanvasImage, Easing, Interactive, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Caption, Masthead, Stage, Star } from '../Elements';
export function Adventure() {
  const frame = useCurrentFrame();
  return <Stage>
    <Masthead />
    <Interactive.Div name="The detail becomes the story" data-reel-essential="The detail becomes the story" style={{ position: 'absolute', top: 108, insetInline: 0, textAlign: 'center', fontSize: 84, fontWeight: 800, lineHeight: 1.3, opacity: interpolate(frame, [4, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), translate: interpolate(frame, [4, 30], ['0px 12px', '0px 0px'], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>جرابها الأصفر…<br /><span style={{ color: '#f4b740' }}>صار جزء من القصة</span></Interactive.Div>
    <Interactive.Div name="The kitten reaches for Shams" data-reel-essential="The kitten reaches for Shams" style={{ position: 'absolute', top: 360, insetInlineStart: 130, width: 460, height: 460, scale: interpolate(frame, [0, 131], [0.96, 1], { output: 'perceptual-scale' }), borderRadius: 8, overflow: 'hidden', boxShadow: '0px 30px 65px #062f3155' }}><CanvasImage src={staticFile('story-pdf/page-07.jpg')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></Interactive.Div>
    <Star x={629} y={415} size={32} delay={16} />
    <Caption>تفصيلة منها… صارت بقصتها</Caption>
  </Stage>;
}
