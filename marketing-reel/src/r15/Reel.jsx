import { Fragment } from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, interpolateColors } from 'remotion';
import { Museum, INK, CREAM, GOLD, TEAL } from './Scene';
import { aligned, captions, cues, enter, ease } from './timing';
import { brand } from '../brand';

function Words({ text, frame, start, size = 66, color = INK }) {
  let offset = 0;
  return <div dir="rtl" lang="ar" style={{ textAlign: 'center', fontSize: size, fontWeight: 800, lineHeight: 1.44, color }}>
    {text.split('\n').map((line, l) => <div key={l}>{line.split(' ').map((word, i, words) => {
      const index = offset++;
      const reveal = enter(frame, start + index * 3, 9);
      return <Fragment key={`${word}-${i}`}><span style={{ display: 'inline-block', opacity: reveal, translate: `0 ${(1 - reveal) * 12}px` }}>{word}</span>{i < words.length - 1 ? ' ' : ''}</Fragment>;
    })}</div>)}
  </div>;
}

function Headline({ frame }) {
  const line = frame < 90 ? { text: 'مش كل مغامرة\nبتبدأ بتنين', start: -30, size: 68 }
    : frame < 300 ? { text: 'جزمة / حجر / مفتاح', start: 90, size: 57 }
      : frame < 510 ? { text: 'التفصيلة\nبتصير مشهد', start: 300, size: 73 }
        : { text: 'شو غرضه\nالمفضل؟', start: 510, size: 74 };
  return <div data-r15-essential="headline" style={{ position: 'absolute', left: 200, top: frame < 510 ? 351 : 445, width: 680 }}>
    <Words {...line} frame={frame} color={frame < 14 ? CREAM : INK} />
    {frame >= 90 && frame < 300 && <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, gap: 10 }}>
      {[cues.boot, cues.stone, cues.key].map((cue, i) => <div key={cue} style={{ width: 31, height: 2, background: frame >= cue ? GOLD : '#cabfac', opacity: frame >= cue && frame < [cues.stone, cues.key, 300][i] ? 1 : 0.45 }} />)}
    </div>}
  </div>;
}

function Subtitles({ frame }) {
  const time = frame / 30 * 1000;
  const pages = [];
  let page = [];
  captions.forEach((word) => { page.push(word); if (word.pageBreakAfter) { pages.push(page); page = []; } });
  if (page.length) pages.push(page);
  const current = pages.find((p) => time >= p[0].startMs && time < p.at(-1).endMs + 100);
  if (!current) return null;
  return <div data-r15-essential="subtitles" dir="rtl" lang="ar" style={{ position: 'absolute', left: 200, top: 1032, width: 680, minHeight: 76, textAlign: 'center', fontSize: 42, fontWeight: 650, lineHeight: 1.55, color: INK }}>
    {current.map((word, i) => <Fragment key={word.startMs}><span style={{ display: 'inline-block', opacity: enter(frame, word.startMs / 1000 * 30, 3), color: time >= word.startMs && time <= word.endMs ? TEAL : INK }}>{word.text.trim()}</span>{i < current.length - 1 ? ' ' : ''}</Fragment>)}
  </div>;
}

function EndCard({ frame }) {
  return <>
    <div data-r15-essential="logo" dir="rtl" style={{ position: 'absolute', left: 340, top: 313, width: 400, height: 104, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, opacity: enter(frame, cues.brand, 20) }}>
      <Img src={staticFile('brand/logo.png')} style={{ width: 105, height: 100, objectFit: 'contain' }} />
      <span style={{ fontSize: 58, fontWeight: 800, color: TEAL }}>قصتي</span>
    </div>
    <div data-r15-essential="cta" dir="rtl" style={{ position: 'absolute', left: 210, top: 1115, width: 660, textAlign: 'center', opacity: enter(frame, cues.cta, 18), color: INK }}>
      <div style={{ width: 64, height: 2, background: GOLD, margin: '0 auto 12px' }} />
      <div style={{ fontSize: 38, lineHeight: 1.5, fontWeight: 700 }}>رابط الطلب في البايو</div>
      <div dir="ltr" style={{ fontSize: 24, lineHeight: 1.6, color: TEAL }}>{brand.instagram}</div>
    </div>
  </>;
}

function Grain() {
  return <AbsoluteFill style={{ pointerEvents: 'none', opacity: 0.032, mixBlendMode: 'multiply', backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 180 180\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.72\' numOctaves=\'3\' seed=\'15\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />;
}

export function R15Reel({ voice = false, safeAreaPreview = false }) {
  const frame = useCurrentFrame();
  if (voice && !aligned) throw new Error('R15 needs its final ElevenLabs recording and measured captions. Run npm run voice:r15 -- /absolute/final.wav /absolute/alignment.json.');
  const bg = interpolateColors(frame, [0, 30, 570, 600], ['#0b3033', CREAM, CREAM, '#fffdf8']);
  return <AbsoluteFill style={{ backgroundColor: bg, fontFamily: 'Cairo', overflow: 'hidden' }}>
    <Museum frame={frame} />
    <Grain />
    <Headline frame={frame} />
    {voice && <Subtitles frame={frame} />}
    <EndCard frame={frame} />
    <Sequence name="Music · original museum score" layout="none" durationInFrames={630}>
      <Audio src={staticFile('r15/music.wav')} volume={(f) => (voice && f < 570 ? 0.2 : 0.43) * (1 - ease((f - 607) / 22))} />
    </Sequence>
    <Sequence name="SFX · water · stone · brass · paper" layout="none" durationInFrames={630}>
      <Audio src={staticFile('r15/sfx.wav')} volume={0.67} />
    </Sequence>
    {voice && <Sequence name="Voice · final ElevenLabs WAV" layout="none" durationInFrames={570}><Audio src={staticFile('r15/voice.wav')} volume={1} /></Sequence>}
    {safeAreaPreview && <div style={{ position: 'absolute', left: 180, top: 300, width: 720, height: 930, border: '2px dashed #ae683c', pointerEvents: 'none' }} />}
  </AbsoluteFill>;
}
