import { CanvasImage, Interactive, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Frame } from './Frame';

export function Story({ cover = false }) {
  const frame = useCurrentFrame();
  return <Frame dark>
    <div style={{ position: 'absolute', top: 325, right: 100, left: 100, fontSize: 39, color: '#f4b740', textAlign: 'center' }}>نموذج توضيحي</div>
    <Interactive.Div name={cover ? 'غلاف قصة ليان' : 'كف القطة والجوارب الملوّنة'} style={{ position: 'absolute', top: 437, right: 110, width: 860, height: 860, borderRadius: 12, overflow: 'hidden', boxShadow: '0 25px 65px #0005', scale: interpolate(frame, [0, 44], [1, 1.04], { extrapolateRight: 'clamp' }) }}>
      <CanvasImage src={staticFile(cover ? 'r12/cover.png' : 'r12/page-07.jpg')} style={{ width: 860, height: 860, objectFit: 'cover' }} />
    </Interactive.Div>
    <Interactive.Div name="دعوة للتعليق" style={{ position: 'absolute', top: 1370, right: 105, left: 105, textAlign: 'center', fontSize: 69, fontWeight: 800, lineHeight: 1.5 }}>أي سؤال شدّكم أكثر؟</Interactive.Div>
    <div style={{ position: 'absolute', top: 1500, right: 110, left: 110, textAlign: 'center', fontSize: 38, color: '#f4b740' }}>احكولنا بالتعليقات</div>
  </Frame>;
}
