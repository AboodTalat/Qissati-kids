import { Easing, Img, Interactive, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Caption, Masthead, Stage } from '../Elements';
export function Keepsake() {
  const frame = useCurrentFrame();
  return <Stage paper>
    <Masthead paper />
    <Interactive.Div name="Written from scratch" data-reel-essential="Written from scratch" style={{ position: 'absolute', top: 108, insetInline: 0, textAlign: 'center', fontSize: 84, fontWeight: 800, lineHeight: 1.3, opacity: interpolate(frame, [4, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), translate: interpolate(frame, [4, 28], ['0px 12px', '0px 0px'], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>حكاية من الصفر<br />لطفلك وحده</Interactive.Div>
    <Interactive.Div name="An open Arabic storybook" data-reel-essential="An open Arabic storybook" style={{ position: 'absolute', top: 478, insetInlineStart: 30, width: 660, height: 340, display: 'flex', direction: 'rtl', padding: 10, gap: 2, backgroundColor: '#fdf8f0', borderRadius: 5, boxShadow: '0 6px 0 #dfd0b6, 0 11px 0 #bca888, 0 24px 40px #2e2a2628', scale: interpolate(frame, [0, 32], [0.88, 1], { extrapolateRight: 'clamp', output: 'perceptual-scale', easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>
      {/* Separate image elements keep the two pages distinct in Studio's live preview. */}
      <Img src={staticFile('story-pdf/page-02.jpg')} style={{ width: 319, height: 319, flexShrink: 0, objectFit: 'contain' }} />
      <Img src={staticFile('story-pdf/page-10.jpg')} style={{ width: 319, height: 319, flexShrink: 0, objectFit: 'contain' }} />
      <div style={{ position: 'absolute', top: 10, bottom: 10, insetInlineStart: 308, width: 44, background: 'linear-gradient(90deg, transparent, #2e2a2645 48%, #fff6 52%, transparent)' }} />
    </Interactive.Div>
    <div data-reel-essential="Personal details" style={{ position: 'absolute', top: 353, insetInline: 0, textAlign: 'center', fontSize: 44, fontWeight: 500 }}>باسمه وبكلّ تفاصيله</div>
    <Caption paper>نسخة PDF أو كتاب مطبوع</Caption>
  </Stage>;
}
