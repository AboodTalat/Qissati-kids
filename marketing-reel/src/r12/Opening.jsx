import { CanvasImage, Easing, Interactive, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Frame } from './Frame';

export function Opening() {
  const frame = useCurrentFrame();
  return <Frame>
    <Interactive.Div name="سبع أسئلة بتصير قصة" style={{ position: 'absolute', top: 320, right: 110, left: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, fontSize: 92, fontWeight: 800, lineHeight: 1.35, textAlign: 'center' }}>
      <div>سبع أسئلة</div>
      <div style={{ backgroundColor: '#f4b740', paddingInline: 26 }}>بتصير قصة</div>
    </Interactive.Div>
    <div style={{ position: 'absolute', top: 672, right: 120, width: 840, height: 810, overflow: 'hidden', border: '2px solid #14646635', borderRadius: 22, boxShadow: '0 22px 50px #103f4012', backgroundColor: '#fdf8f0' }}>
      <CanvasImage src={staticFile('r12/form-scroll.png')} style={{ width: 840, position: 'absolute', top: 0, translate: interpolate(frame, [0, 44], ['0px 0px', '0px -2100px'], { easing: Easing.bezier(0.32, 0, 0.4, 1), extrapolateRight: 'clamp' }) }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(#fdf8f0 0%, transparent 10%, transparent 86%, #fdf8f0 100%)' }} />
    </div>
    <div style={{ position: 'absolute', top: 1530, right: 110, left: 110, textAlign: 'center', fontSize: 38, fontWeight: 600 }}>شو منسألكم عنه؟</div>
  </Frame>;
}
