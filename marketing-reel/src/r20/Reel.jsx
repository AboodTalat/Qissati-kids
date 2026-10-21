import { Fragment } from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { R20Scene, projectTileLabels } from './Scene';
import { categories, enter, palette } from './timing';
import { brand } from '../brand';

// Whole words preserve Arabic shaping. Spaces stay outside the inline boxes.
function Words({ text, time, start = 0, size = 84, color = palette.deep, immediate = false }) {
  let wordIndex = 0;
  return <div dir="rtl" lang="ar" style={{ color, fontSize: size, fontWeight: 800, lineHeight: 1.48, textAlign: 'center' }}>
    {text.split('\n').map((line, row) => <div key={row} style={{ whiteSpace: 'nowrap' }}>
      {line.split(' ').map((word, index, words) => {
        const reveal = immediate ? 1 : enter(time, start + wordIndex++ * 0.075, 0.34);
        return <Fragment key={index}><span data-r20-word style={{ display: 'inline-block', opacity: reveal, translate: `0 ${(1 - reveal) * 18}px` }}>{word}</span>{index < words.length - 1 ? ' ' : ''}</Fragment>;
      })}
    </div>)}
  </div>;
}

function Mark() {
  return <div data-r20-essential="logo" dir="rtl" lang="ar" style={{ position: 'absolute', left: 370, top: 316, width: 340, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
    <Img src={staticFile('brand/logo.png')} style={{ width: 77, height: 74, objectFit: 'contain' }} />
    <span style={{ fontSize: 46, color: palette.teal, fontWeight: 850 }}>قصتي</span>
  </div>;
}

function GoldRule({ time, at = 0 }) {
  return <svg viewBox="0 0 156 18" width="156" height="18" aria-hidden="true" style={{ display: 'block', margin: '12px auto 0', opacity: enter(time, at, 0.4) }}>
    <path d="M8 12Q78 0 148 12" pathLength="1" fill="none" stroke={palette.gold} strokeWidth="2.6" strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1 - enter(time, at, 0.6)} />
    <circle cx="78" cy="7" r="3" fill={palette.gold} />
  </svg>;
}

function HookCopy() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  return <div data-r20-essential="title-A" style={{ position: 'absolute', left: 200, top: 436, width: 680, opacity: 1 - enter(time, 2.78, 0.22) }}>
    <Words text="٣ كلمات =" size={102} time={time} immediate />
    <Words text="بداية حكاية" size={87} time={time} immediate />
    <GoldRule time={time} />
  </div>;
}

function FormulaCopy() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  return <div data-r20-essential="title-B" style={{ position: 'absolute', left: 194, top: 470, width: 692, opacity: 1 - enter(time, 8.75, 0.25) }}>
    <Words text="مكان + غرض + شعور" size={61} time={time} />
    <GoldRule time={time} at={0.25} />
  </div>;
}

function CommentCopy() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  return <div data-r20-essential="title-C" style={{ position: 'absolute', left: 196, top: 450, width: 688 }}>
    <Words text="اكتبوا ٣ كلمات" size={84} time={time + 0.36} />
    <GoldRule time={time} />
  </div>;
}

function TileLabels({ time, cover = false }) {
  const anchors = projectTileLabels(time);
  return <>{categories.map((category, index) => {
    const anchor = anchors.find((item) => item.kind === category.kind);
    if (!anchor) return null;
    const visible = cover ? 1 : enter(time, 3.1 + index * 0.12, 0.35) * (1 - enter(time, 9, 0.3));
    const example = cover ? 0 : enter(time, category.at, 0.34);
    return <div key={category.kind} data-r20-essential={`tile-${category.kind}`} dir="rtl" lang="ar" style={{ position: 'absolute', left: anchor.x - 95, top: anchor.y + 8, width: 190, textAlign: 'center', opacity: visible * (anchor.opacity ?? 1), translate: `0 ${(1 - visible) * 9}px` }}>
      <div style={{ color: palette.teal, fontSize: 35, fontWeight: 600, lineHeight: 1.5 }}>{category.name}</div>
      {cover ? <div style={{ width: 110, borderBottom: `2px solid ${palette.gold}`, margin: '14px auto 0' }} /> : <div style={{ color: palette.deep, fontSize: 49, fontWeight: 800, lineHeight: 1.5, opacity: example, scale: 0.92 + example * 0.08 }}>{category.example}</div>}
    </div>;
  })}</>;
}

function CommentTemplate() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  return <>
    <div data-r20-essential="question" dir="rtl" lang="ar" style={{ position: 'absolute', left: 200, top: 647, width: 680, textAlign: 'center', fontSize: 43, color: palette.deep, fontWeight: 650, opacity: enter(time, 2, 0.5), translate: `0 ${(1 - enter(time, 2, 0.5)) * 10}px` }}>إنتو أي ٣ كلمات بتختاروا؟</div>
    <div data-r20-essential="comment-slots" dir="rtl" lang="ar" style={{ position: 'absolute', left: 204, top: 770, width: 672, height: 200, display: 'flex', gap: 18 }}>
      {categories.map((category, index) => {
        const reveal = enter(time, 1 + index * 0.24, 0.5);
        return <div key={category.kind} style={{ position: 'relative', flex: 1, padding: '23px 15px', borderRadius: 16, background: palette.paper, border: '1px solid #d8caa9', boxShadow: '0 8px 0 #e2d7bc, 0 17px 28px #645d4214', opacity: reveal, translate: `0 ${(1 - reveal) * 42}px`, rotate: `${(1 - reveal) * (index === 1 ? -7 : 5)}deg` }}>
          <div style={{ color: palette.teal, fontSize: 39, fontWeight: 700, textAlign: 'center', lineHeight: 1.5 }}>{category.name}</div>
          <div style={{ position: 'absolute', left: 25, right: 25, bottom: 35, borderBottom: `2px dashed ${palette.gold}` }} />
        </div>;
      })}
    </div>
    <div data-r20-essential="comment-cta" dir="rtl" lang="ar" style={{ position: 'absolute', left: 200, top: 1045, width: 680, textAlign: 'center', opacity: enter(time, 2.1, 0.5), translate: `0 ${(1 - enter(time, 2.1, 0.5)) * 10}px` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 17, color: palette.teal, fontWeight: 750, fontSize: 48, lineHeight: 1.45 }}>
        <svg width="39" height="38" viewBox="0 0 39 38" aria-hidden="true"><path d="M5 4H34V27H19L9 34V27H5Z" fill="none" stroke={palette.gold} strokeWidth="2.5" strokeLinejoin="round" /><path d="M12 13H27M12 19H22" stroke={palette.gold} strokeWidth="2" strokeLinecap="round" /></svg>
        <span>بالتعليقات</span>
      </div>
      <div style={{ color: palette.muted, fontSize: 31, lineHeight: 1.5, fontWeight: 600, marginTop: 14 }}>كلمات عامة، بلا تفاصيل شخصية</div>
      <div dir="ltr" style={{ color: palette.teal, fontSize: 26, lineHeight: 1.4, fontWeight: 550, marginTop: 10 }}>{brand.instagram}</div>
    </div>
  </>;
}

export function R20Reel({ music = true, sfx = true, safeAreaPreview = false }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  return <AbsoluteFill data-r20-canvas style={{ background: palette.cream, fontFamily: 'Cairo', overflow: 'hidden' }}>
    <Sequence name="3D · paper tiles → three ideas → story doorway" durationInFrames={durationInFrames} premountFor={fps}><R20Scene /></Sequence>
    <Mark />
    <Sequence name="A · ٣ كلمات = بداية حكاية" durationInFrames={3 * fps} premountFor={fps} layout="none"><HookCopy /></Sequence>
    <Sequence name="B · مكان + غرض + شعور" from={3 * fps} durationInFrames={9 * fps} premountFor={fps} layout="none"><FormulaCopy /></Sequence>
    <Sequence name="C · اكتبوا ٣ كلمات" from={12 * fps} durationInFrames={8 * fps} premountFor={fps} layout="none"><CommentCopy /></Sequence>
    <Sequence name="Template · three blank slots · hold 16–20s" from={13 * fps} durationInFrames={7 * fps} premountFor={fps} layout="none"><CommentTemplate /></Sequence>
    <TileLabels time={frame / fps} />
    {music && <Audio name="Music · original paper-world score" src={staticFile('r20/music.wav')} durationInFrames={durationInFrames} premountFor={fps} volume={0.85} />}
    {sfx && <Audio name="SFX · tile taps · paper folds · brass key" src={staticFile('r20/sfx.wav')} durationInFrames={durationInFrames} premountFor={fps} volume={0.92} />}
    {safeAreaPreview && <div style={{ position: 'absolute', left: 180, top: 300, width: 720, height: 930, border: '2px dashed #b98a37', pointerEvents: 'none' }} />}
  </AbsoluteFill>;
}

export function R20Cover() {
  return <AbsoluteFill style={{ background: palette.cream, fontFamily: 'Cairo', overflow: 'hidden' }}>
    <R20Scene stillFrame={135} />
    <Mark />
    <div data-r20-essential="cover-hook" style={{ position: 'absolute', left: 200, top: 449, width: 680 }}>
      <Words text="عطونا ٣ كلمات،" time={1} size={69} immediate />
      <Words text="نفتح فيهم حكاية" time={1} size={69} immediate />
      <GoldRule time={1} />
    </div>
    <TileLabels time={4.5} cover />
  </AbsoluteFill>;
}
