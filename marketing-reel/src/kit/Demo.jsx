import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, CtaLine, KineticHeadline, Mark, MorphPath, SubtitleBand, checkRig, progress, roundRectD, sampleRig } from '.';

// Exercises every kit component in six seconds, for checking the kit on its own.
const rig = [
  { frame: 0, zoom: 1, x: 0, y: 0 },
  { frame: 60, zoom: 1.04, x: -10, y: 6 },
  { frame: 150, zoom: 1.06, x: 0, y: 0, stop: true },
];
checkRig('Kit-Demo', rig, { zoom: 0.06 });

const card = roundRectD(240, 700, 600, 360, 28);
const page = roundRectD(290, 640, 500, 500, 6);
const captions = [
  { text: 'كل', startMs: 3300, endMs: 3600 },
  { text: ' جواب', startMs: 3600, endMs: 4000 },
  { text: ' بيصير', startMs: 4000, endMs: 4400 },
  { text: ' صفحة.', startMs: 4400, endMs: 5000, pageBreakAfter: true },
];

export function KitDemo() {
  const frame = useCurrentFrame();
  const cam = sampleRig(rig, frame);
  const morph = progress(frame, 60, 26);
  return <AbsoluteFill style={{ background: C.cream, fontFamily: 'Cairo' }}>
    <AbsoluteFill style={{ transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.zoom})` }}>
      <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0 }}>
        <MorphPath from={card} to={page} t={morph} fill={C.paper} stroke={C.teal} strokeWidth={3} />
      </svg>
    </AbsoluteFill>
    <Mark label="نموذج توضيحي" />
    <KineticHeadline text={'جواب واحد\nبيصير صفحة'} at={8} top={420} emphasis={[{ word: 3, at: 70, mode: 'gold' }]} underline={{ from: 0, to: 1, at: 50 }} />
    <SubtitleBand captions={captions} />
    <CtaLine text="الرابط بالبايو" at={150} />
  </AbsoluteFill>;
}
