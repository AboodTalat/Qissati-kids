import { Fragment } from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { brand } from '../brand';
import { R21Scene } from './Scene';
import { enter, palette } from './timing';

function Words({ text, time, start = 0, size = 84, color = palette.deep, immediate = false }) {
  let count = 0;
  return <div dir="rtl" lang="ar" style={{ color, fontSize: size, fontWeight: 800, lineHeight: 1.48, textAlign: 'center' }}>
    {text.split('\n').map((line, row) => <div key={row} style={{ whiteSpace: 'nowrap' }}>
      {line.split(' ').map((word, index, words) => {
        const reveal = immediate ? 1 : enter(time, start + count++ * 0.07, 0.4);
        return <Fragment key={index}><span data-r21-word style={{ display: 'inline-block', opacity: reveal, translate: `0 ${(1 - reveal) * 19}px` }}>{word}</span>{index < words.length - 1 ? ' ' : ''}</Fragment>;
      })}
    </div>)}
  </div>;
}

function Mark() {
  return <div data-r21-essential="logo" dir="rtl" lang="ar" style={{ position: 'absolute', zIndex: 2, left: 365, top: 316, width: 350, height: 78, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
    <Img src={staticFile('brand/logo.png')} style={{ width: 78, height: 74, objectFit: 'contain' }} />
    <span style={{ color: palette.teal, fontWeight: 850, fontSize: 46 }}>قصتي</span>
  </div>;
}

function Rule({ time = 2 }) {
  const reveal = enter(time, .12, .75);
  return <svg width="180" height="24" viewBox="0 0 180 24" style={{ display: 'block', margin: '10px auto 0', opacity: reveal }} aria-hidden="true">
    <path d="M8 15C45 3 135 3 172 15" fill="none" stroke={palette.gold} strokeWidth="2.5" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - reveal} />
    <path d="M90 5L93 11L100 12L95 17L96 24L90 20L84 24L85 17L80 12L87 11Z" fill={palette.gold} transform="translate(0 -4) scale(1 .85)" />
  </svg>;
}

function Hook() {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const time = frame / fps;
  return <div data-r21-essential="hook" style={{ position: 'absolute', left: 200, top: 429, width: 680, opacity: 1 - enter(time, 3.72, .28) }}>
    <Words text="تفصيلة صغيرة…" time={time} size={78} immediate />
    <Words text="مغامرة كبيرة" time={time + .1} size={91} color={palette.teal} immediate />
    <Rule time={time} />
  </div>;
}

function Middle() {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const time = frame / fps;
  return <div data-r21-essential="middle" style={{ position: 'absolute', left: 200, top: 447, width: 680, opacity: 1 - enter(time, 8.72, .28) }}>
    <Words text="من الأشياء اللي بحبّها" time={time + .15} size={60} />
    <Words text="بتبلّش حكايته" time={time + .15} size={84} color={palette.teal} start={.22} />
    <Rule time={time} />
  </div>;
}

function Closing() {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const time = frame / fps;
  return <div data-r21-essential="closing" style={{ position: 'absolute', left: 200, top: 454, width: 680 }}>
    <Words text="كل تفصيلة…" time={time + .1} size={83} />
    <Words text="حكاية" time={time + .1} start={.2} size={107} color={palette.teal} />
    <Rule time={time} />
  </div>;
}

function Cta() {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const time = frame / fps;
  const reveal = enter(time, 0, .5);
  return <div data-r21-essential="cta" dir="rtl" lang="ar" style={{ position: 'absolute', left: 202, top: 1100, width: 676, textAlign: 'center', opacity: reveal, translate: `0 ${(1 - reveal) * 18}px` }}>
    <div style={{ fontSize: 48, lineHeight: 1.4, color: palette.teal, fontWeight: 800 }}>اكتشفوا قصتي</div>
    <div dir="ltr" style={{ fontSize: 30, lineHeight: 1.6, color: palette.muted, marginTop: 8, fontWeight: 600 }}>qissatikids.com</div>
  </div>;
}

export function R21Reel({ music = true, sfx = true, safeAreaPreview = false }) {
  const { fps, durationInFrames } = useVideoConfig();
  return <AbsoluteFill data-r21-canvas style={{ background: palette.cream, fontFamily: 'Cairo', overflow: 'hidden' }}>
    <Sequence name="3D · brass star → assembled balloon → illustrated storybook" durationInFrames={durationInFrames} premountFor={fps}><R21Scene /></Sequence>
    <Mark />
    <Sequence name="Hook · تفصيلة صغيرة… مغامرة كبيرة" durationInFrames={4 * fps} premountFor={fps} layout="none"><Hook /></Sequence>
    <Sequence name="Wonder · من الأشياء اللي بحبّها بتبلّش حكايته" from={4 * fps} durationInFrames={9 * fps} premountFor={fps} layout="none"><Middle /></Sequence>
    <Sequence name="Payoff · كل تفصيلة… حكاية" from={13 * fps} durationInFrames={7 * fps} premountFor={fps} layout="none"><Closing /></Sequence>
    <Sequence name="CTA · discover Qissati · quiet hold" from={16.5 * fps} durationInFrames={3.5 * fps} premountFor={fps} layout="none"><Cta /></Sequence>
    {music && <Audio name="Music · original D-major star voyage" src={staticFile('r21/music.wav')} durationInFrames={durationInFrames} premountFor={fps} volume={.85} />}
    {sfx && <Audio name="SFX · paper folds · star chimes · miniature landing" src={staticFile('r21/sfx.wav')} durationInFrames={durationInFrames} premountFor={fps} volume={.92} />}
    {safeAreaPreview && <div style={{ position: 'absolute', left: 180, top: 300, width: 720, height: 930, border: '2px dashed #b98a37', pointerEvents: 'none' }} />}
  </AbsoluteFill>;
}

export function R21Cover() {
  return <AbsoluteFill style={{ background: palette.cream, fontFamily: 'Cairo', overflow: 'hidden' }}>
    <R21Scene stillFrame={192} />
    <Mark />
    <div data-r21-essential="cover" style={{ position: 'absolute', left: 200, top: 431, width: 680 }}>
      <Words text="تفصيلة صغيرة…" time={2} size={78} immediate />
      <Words text="مغامرة كبيرة" time={2} size={91} color={palette.teal} immediate />
      <Rule />
    </div>
    <div dir="ltr" style={{ position: 'absolute', left: 200, top: 1134, width: 680, textAlign: 'center', fontSize: 30, color: palette.teal }}>{brand.instagram}</div>
  </AbsoluteFill>;
}
