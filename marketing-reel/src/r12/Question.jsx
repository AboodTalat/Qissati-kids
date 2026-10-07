import { CanvasImage, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Frame } from './Frame';

export function Question({ number, title, asset }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const highlight = asset === 'fear' ? { top: 9, height: 54 } : { top: 58, height: 63 };
  return <Frame>
    <div style={{ position: 'absolute', top: 340, right: 110, left: 110, display: 'flex', alignItems: 'center', gap: 25 }}>
      <span style={{ fontSize: 40, fontWeight: 800, color: '#9c731e' }}>السؤال {number.toLocaleString('ar-JO')}</span>
      <div style={{ flex: 1, height: 2, backgroundColor: '#14646630' }} />
      <span dir="ltr" style={{ fontSize: 28, color: '#667875' }}>{number} / 7</span>
    </div>
    <Interactive.Div name={title} style={{ position: 'absolute', top: 448, right: 110, left: 110, height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 85, fontWeight: 800, lineHeight: 1.5, textAlign: 'center', whiteSpace: 'pre-line' }}>{title}</Interactive.Div>
    <Interactive.Div name="لقطة الاستمارة الفارغة" style={{ position: 'absolute', top: 828, right: 130, width: 820, height: 574, borderRadius: 20, overflow: 'hidden', border: '2px solid #14646630', boxShadow: '0 20px 42px #103f4010', scale: interpolate(frame, [0, durationInFrames - 1], [1, 1.08], { extrapolateRight: 'clamp' }) }}>
      <CanvasImage src={staticFile(`r12/${asset}.png`)} style={{ width: 820, height: 572 }} />
      <div style={{ position: 'absolute', top: highlight.top, right: 27, left: 27, height: highlight.height, border: '4px solid #f4b740', borderRadius: 9, backgroundColor: '#f4b74016' }} />
    </Interactive.Div>
    <div style={{ position: 'absolute', top: 1495, right: 110, left: 110, display: 'flex', gap: 12 }}>{Array.from({ length: 7 }, (_, i) => <div key={i} style={{ height: 7, flex: 1, borderRadius: 4, backgroundColor: i < number ? '#c79228' : '#14646625' }} />)}</div>
  </Frame>;
}
