import { Fragment } from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { brand } from '../brand';
import { R22Scene } from './Scene';
import { R22Backdrop } from './Backdrop';
import { enter, palette as C, r22Cues } from './timing';

function Words({ text, t = 1, size = 82, immediate = false }) {
  let n = 0;
  return <div dir="rtl" lang="ar" style={{ color: C.cream, fontSize: size, fontWeight: 800, lineHeight: 1.5, textAlign: 'center' }}>
    {text.split('\n').map((line, row) => <div key={row} style={{ whiteSpace: 'nowrap' }}>{line.split(' ').map((word, i, all) => {
      const q = immediate ? 1 : enter(t, n++ * .075, .36);
      return <Fragment key={i}><span data-r22-word style={{ display: 'inline-block', opacity: q, translate: `0 ${(1 - q) * 18}px` }}>{word}</span>{i < all.length - 1 ? ' ' : ''}</Fragment>;
    })}</div>)}
  </div>;
}

function Mark() {
  return <div data-r22-essential="logo" dir="rtl" lang="ar" style={{ position: 'absolute', left: 370, top: 313, width: 340, height: 78, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 17 }}>
    <Img src={staticFile('brand/logo.png')} style={{ width: 77, height: 74, objectFit: 'contain' }} />
    <span style={{ fontSize: 46, fontWeight: 850, color: C.cream }}>قصتي</span>
  </div>;
}

function Title({ text, size = 81, hold = 3, immediate = false, top = 450 }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return <div data-r22-essential="title" style={{ position: 'absolute', left: 192, top, width: 696, opacity: 1 - enter(t, hold - .22, .22) }}>
    <Words text={text} size={size} t={t} immediate={immediate} />
    <svg width="160" height="17" viewBox="0 0 160 17" style={{ display: 'block', margin: '12px auto' }}><path d="M7 11Q80 1 153 11" fill="none" stroke={C.gold} strokeWidth="2" /><circle cx="80" cy="6" r="3" fill={C.gold} /></svg>
  </div>;
}

function SaveCue() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const saved = enter(t, r22Cues.save - 14, .22);
  return <div data-r22-essential="save-cue" dir="rtl" lang="ar" style={{ position: 'absolute', left: 230, top: 1096, width: 620, textAlign: 'center', opacity: enter(t, .05, .4) }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 17, fontSize: 44, lineHeight: 1.4, color: C.cream, fontWeight: 700 }}>
      <svg width="35" height="44" viewBox="0 0 35 44" style={{ scale: 1 + Math.sin(saved * Math.PI) * .13 }}><path d="M5 3H30V40L17.5 31L5 40Z" fill={saved > .5 ? C.gold : 'none'} stroke={C.gold} strokeWidth="2.5" strokeLinejoin="round" /></svg>
      <span>احفظوه لوقت الحكاية</span>
    </div>
    <div dir="ltr" style={{ fontSize: 26, lineHeight: 1.4, fontWeight: 600, color: '#d3d4b7', marginTop: 14 }}>{brand.instagram}</div>
  </div>;
}

export function R22Reel({ music = true, sfx = true, safeAreaPreview = false }) {
  const { fps, durationInFrames } = useVideoConfig();
  return <AbsoluteFill data-r22-canvas style={{ background: C.night, fontFamily: 'Cairo', overflow: 'hidden' }}>
    <R22Backdrop />
    <Sequence name="3D · observatory · moon garden · paper boat · book" durationInFrames={durationInFrames} premountFor={fps}><R22Scene /></Sequence>
    <Mark />
    <Sequence name="Hook · لو القمر عنده باب…" durationInFrames={3 * fps} premountFor={fps} layout="none"><Title text="لو القمر عنده باب…" size={69} hold={3} immediate /></Sequence>
    <Sequence name="Question · وين بتحبّوا يودّيكم؟" from={3 * fps} durationInFrames={7 * fps} premountFor={fps} layout="none"><Title text="وين بتحبّوا يودّيكم؟" size={66} hold={7} /></Sequence>
    <Sequence name="Bridge · سؤال صغير، خيال كبير" from={10 * fps} durationInFrames={4 * fps} premountFor={fps} layout="none"><Title text={'سؤال صغير،\nخيال كبير'} size={67} top={418} hold={4} /></Sequence>
    <Sequence name="CTA · جرّبوا السؤال الليلة · final four-second hold" from={14 * fps} durationInFrames={4 * fps} premountFor={fps} layout="none"><Title text={'جرّبوا السؤال\nالليلة'} size={79} top={435} hold={5} immediate /><SaveCue /></Sequence>
    {music && <Audio name="Music · original moon-garden lullaby" src={staticFile('r22/music.wav')} durationInFrames={durationInFrames} premountFor={fps} volume={.85} />}
    {sfx && <Audio name="SFX · latch · moon chimes · paper starboat" src={staticFile('r22/sfx.wav')} durationInFrames={durationInFrames} premountFor={fps} volume={.92} />}
    {safeAreaPreview && <div style={{ position: 'absolute', left: 180, top: 300, width: 720, height: 930, border: '2px dashed #d7b566', pointerEvents: 'none' }} />}
  </AbsoluteFill>;
}

export function R22Cover() {
  return <AbsoluteFill style={{ background: C.night, fontFamily: 'Cairo', overflow: 'hidden' }}>
    <R22Backdrop stillFrame={180} /><R22Scene stillFrame={180} /><Mark />
    <div data-r22-essential="cover-hook" style={{ position: 'absolute', left: 195, top: 449, width: 690 }}><Words text="لو القمر عنده باب…" size={69} immediate /></div>
    <div data-r22-essential="cover-question" dir="rtl" lang="ar" style={{ position: 'absolute', left: 220, top: 580, width: 640, color: C.cream, fontSize: 33, fontWeight: 700, textAlign: 'center' }}>وين بتحبّوا يودّيكم؟</div>
  </AbsoluteFill>;
}
