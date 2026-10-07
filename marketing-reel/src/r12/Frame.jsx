import { AbsoluteFill, CanvasImage, staticFile } from 'remotion';
import '../brand';

export function Frame({ children, dark = false }) {
  return <AbsoluteFill dir="rtl" style={{ backgroundColor: dark ? '#103f40' : '#fdf8f0', color: dark ? '#fdf8f0' : '#146466', fontFamily: 'Cairo', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 180, right: 100, left: 100, height: 102, display: 'flex', alignItems: 'center', gap: 22, borderBottom: `2px solid ${dark ? '#ffffff30' : '#14646630'}`, paddingBottom: 24 }}>
      <CanvasImage src={staticFile('brand/logo.png')} style={{ width: 70, height: 70, objectFit: 'contain' }} />
      <span style={{ fontSize: 47, fontWeight: 800 }}>قصتي</span>
      <span style={{ marginInlineStart: 'auto', fontSize: 26, color: dark ? '#f4b740' : '#667875' }}>كل تفصيلة… حكاية</span>
    </div>
    {children}
    <div dir="ltr" style={{ position: 'absolute', bottom: 245, left: 100, right: 100, fontSize: 28, textAlign: 'center', color: dark ? '#fdf8f0bb' : '#146466aa' }}>@qissati_kids</div>
  </AbsoluteFill>;
}
