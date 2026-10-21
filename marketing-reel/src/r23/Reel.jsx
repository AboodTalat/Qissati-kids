import { Fragment } from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { R23Scene } from './Scene';
import { enter, palette } from './timing';
import { brand } from '../brand';

function Words({ text, time, immediate = false, size = 77, color = palette.deep }) {
  let index = 0;
  return <div dir="rtl" lang="ar" style={{ fontSize: size, lineHeight: 1.46, fontWeight: 800, color, textAlign: 'center' }}>
    {text.split('\n').map((line, row) => <div key={row} style={{ whiteSpace: 'nowrap' }}>{line.split(' ').map((word, i, words) => {
      const reveal = immediate ? 1 : enter(time, index++ * .085, .42);
      return <Fragment key={i}><span data-r23-word style={{ display: 'inline-block', opacity: reveal, translate: `0 ${(1 - reveal) * 22}px` }}>{word}</span>{i < words.length - 1 ? ' ' : ''}</Fragment>;
    })}</div>)}
  </div>;
}

function Mark() {
  return <div data-r23-essential="logo" dir="rtl" lang="ar" style={{ position: 'absolute', left: 370, top: 316, width: 340, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
    <Img src={staticFile('brand/logo.png')} style={{ width: 77, height: 74, objectFit: 'contain' }} /><span style={{ fontSize: 46, color: palette.teal, fontWeight: 850 }}>قصتي</span>
  </div>;
}

function Rule() {
  return <svg width="160" height="20" viewBox="0 0 160 20" style={{ display: 'block', margin: '17px auto 0' }} aria-hidden="true"><path d="M9 10H65M95 10H151" stroke={palette.gold} strokeWidth="2" /><path d="M80 3L86 10L80 17L74 10Z" fill="none" stroke={palette.gold} strokeWidth="2" /></svg>;
}

function Title({ text, duration = 4, immediate = false, size = 77, final = false }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  return <div data-r23-essential="title" style={{ position: 'absolute', left: 200, top: final ? 453 : 438, width: 680, opacity: final ? 1 : 1 - enter(time, duration - .24, .24) }}>
    <Words text={text} time={time} immediate={immediate} size={size} /><Rule />
  </div>;
}

function Closing() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  return <div data-r23-essential="cta" dir="rtl" lang="ar" style={{ position: 'absolute', left: 200, top: 1080, width: 680, textAlign: 'center', opacity: enter(time, 0, .45), translate: `0 ${(1 - enter(time, 0, .45)) * 14}px` }}>
    <div style={{ color: palette.teal, fontSize: 45, lineHeight: 1.5, fontWeight: 750 }}>شوفوا نموذج القصة</div>
    <div dir="ltr" style={{ fontSize: 29, fontWeight: 600, lineHeight: 1.5, marginTop: 10, color: palette.teal }}>{brand.instagram}</div>
  </div>;
}

export function R23Reel({ music = true, sfx = true, safeAreaPreview = false }) {
  const { fps, durationInFrames } = useVideoConfig();
  return <AbsoluteFill data-r23-canvas style={{ background: palette.cream, fontFamily: 'Cairo', overflow: 'hidden' }}>
    <Sequence name="3D · silk ribbon → gift box → pop-up storybook" durationInFrames={durationInFrames} premountFor={fps}><R23Scene /></Sequence>
    <Mark />
    <Sequence name="Hook · في هدايا… بتفتح حكاية" durationInFrames={4 * fps} premountFor={fps} layout="none"><Title text={'في هدايا…\nبتفتح حكاية'} immediate /></Sequence>
    <Sequence name="Personal gift · كتاب مخصّص للطفل اللي بتحبّوه" from={4 * fps} durationInFrames={9 * fps} premountFor={fps} layout="none"><Title text={'كتاب مخصّص\nللطفل اللي بتحبّوه'} duration={9} size={68} /></Sequence>
    <Sequence name="Gift with a story · hold" from={13 * fps} durationInFrames={7 * fps} premountFor={fps} layout="none"><Title text="هدية إلها حكاية" duration={7} size={76} final /></Sequence>
    <Sequence name="CTA · sample story · calm closing" from={17 * fps} durationInFrames={3 * fps} premountFor={fps} layout="none"><Closing /></Sequence>
    {music && <Audio name="Music · original harp and piano gift score" src={staticFile('r23/music.wav')} durationInFrames={durationInFrames} premountFor={fps} volume={.85} />}
    {sfx && <Audio name="SFX · cloth ribbon · lid · book folds" src={staticFile('r23/sfx.wav')} durationInFrames={durationInFrames} premountFor={fps} volume={.92} />}
    {safeAreaPreview && <div style={{ position: 'absolute', left: 180, top: 300, width: 720, height: 930, border: '2px dashed #b98a37', pointerEvents: 'none' }} />}
  </AbsoluteFill>;
}

export function R23Cover() {
  return <AbsoluteFill style={{ background: palette.cream, fontFamily: 'Cairo', overflow: 'hidden' }}>
    <R23Scene stillFrame={60} /><Mark />
    <div data-r23-essential="cover-hook" style={{ position: 'absolute', left: 200, top: 438, width: 680 }}><Words text={'في هدايا…\nبتفتح حكاية'} time={1} immediate size={77} /><Rule /></div>
  </AbsoluteFill>;
}
