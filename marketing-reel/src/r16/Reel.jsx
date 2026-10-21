import { Fragment } from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { AmmanScene } from './Scene';
import { Backdrop } from './Backdrop';
import { aligned, captions, enter } from './timing';
import { palette } from './art';
import { brand } from '../brand';

function Words({ text, frame, start, size = 88, lineHeight = 1.2, color = palette.teal }) {
  let offset = 0;
  return <div dir="rtl" lang="ar" style={{ textAlign: 'center', fontSize: size, lineHeight, fontWeight: 800, color }}>
    {text.split('\n').map((line, row) => <div key={row}>{line.split(' ').map((word, i, words) => {
      const index = offset++;
      const reveal = enter(frame, start + index * 4, 10);
      return <Fragment key={`${word}-${i}`}><span style={{ display: 'inline-block', opacity: reveal, translate: `0 ${(1 - reveal) * 12}px` }}>{word}</span>{i < words.length - 1 ? ' ' : ''}</Fragment>;
    })}</div>)}
  </div>;
}

function Headline({ frame, cover = false }) {
  const { fps } = useVideoConfig();
  const question = cover ? 'كيف بتبين عمّان\nمن عيون طفل؟' : 'أي مكان\nبقصته؟';
  return <div data-r16-essential="headline" style={{ position: 'absolute', left: 200, top: 410, width: 680, height: 240, boxSizing: 'border-box', padding: '0 5px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    {cover || frame >= 15 * fps ? <Words text={question} frame={frame} start={cover ? -100 : 15 * fps} size={cover ? 65 : 92} lineHeight={cover ? 1.4 : 1.2} />
      : frame < 3 * fps ? <Words text={'عمّان\nمن عيون طفل'} frame={frame} start={-36} />
        : <Words text={'درج ← كنز /\nشجرة ← قلعة'} frame={frame} start={3 * fps} size={72} lineHeight={1.25} />}
    <div style={{ flexShrink: 0, height: 3, width: 100, background: palette.gold, margin: '16px auto 0' }} />
  </div>;
}

function Mark({ frame, cover = false }) {
  const { fps } = useVideoConfig();
  return <div data-r16-essential="logo" dir="rtl" style={{ position: 'absolute', left: 340, top: 310, width: 400, height: 76, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, opacity: cover ? 1 : enter(frame, 18 * fps, 16) }}>
    <Img src={staticFile('brand/logo.png')} style={{ width: 78, height: 74, objectFit: 'contain' }} />
    <span style={{ fontSize: 52, fontWeight: 800, color: palette.teal }}>قصتي</span>
  </div>;
}

function Subtitles() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps * 1000;
  const pages = [];
  let page = [];
  captions.forEach((word) => { page.push(word); if (word.pageBreakAfter) { pages.push(page); page = []; } });
  if (page.length) pages.push(page);
  const current = pages.find((p, i) => time >= p[0].startMs && time < Math.min(p.at(-1).endMs + 120, pages[i + 1]?.[0].startMs ?? 20000));
  if (!current) return null;
  return <div data-r16-essential="subtitles" dir="rtl" lang="ar" style={{ position: 'absolute', left: 200, top: 662, width: 680, textAlign: 'center' }}>
    <div data-r16-caption-plate style={{ display: 'inline-block', maxWidth: '100%', minWidth: 230, boxSizing: 'border-box', padding: '8px 18px', backgroundColor: '#fdf8f0fa', borderRadius: 18, border: '1px solid #c69b5666', boxShadow: '0 5px 20px #4b3e2810', whiteSpace: 'nowrap', fontSize: 54, fontWeight: 700, lineHeight: 1.3, color: palette.ink }}>
      {current.map((word, i) => {
        const active = time >= word.startMs && time <= word.endMs;
        const reveal = enter(frame, word.startMs / 1000 * fps, 2);
        return <Fragment key={word.startMs}><span style={{ display: 'inline-block', padding: '0 4px', borderRadius: 6, opacity: 0.38 + reveal * 0.62, color: active ? palette.teal : palette.ink, backgroundColor: active ? '#c69b5626' : 'transparent' }}>{word.text.trim()}</span>{i < current.length - 1 ? ' ' : ''}</Fragment>;
      })}
    </div>
  </div>;
}

function Cta({ frame, voice }) {
  const { fps } = useVideoConfig();
  return <div data-r16-essential="cta" dir="rtl" lang="ar" style={{ position: 'absolute', left: 210, top: voice ? 1178 : 1110, width: 660, textAlign: 'center', opacity: enter(frame, 18 * fps, 16), color: palette.teal }}>
    <div style={{ fontSize: 42, fontWeight: 750, lineHeight: voice ? 1.22 : 1.35 }}>اكتبوا اسم مكان عام</div>
    {!voice && <div dir="ltr" style={{ fontSize: 27, fontWeight: 600, lineHeight: 1.35, marginTop: 8 }}>{brand.instagram}</div>}
  </div>;
}

export function R16Reel({ voice = false, music = true, sfx = true, safeAreaPreview = false, contentScale = 0.8 }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const scale = Math.max(0.65, Math.min(1, contentScale));
  if (voice && !aligned) throw new Error('R16 narration is pending. Import the final ElevenLabs take and measured alignment with npm run voice:r16 -- /absolute/take.wav /absolute/alignment.json, then enable voice.');
  return <AbsoluteFill data-r16-canvas style={{ overflow: 'hidden', backgroundColor: palette.cream, fontFamily: 'Cairo' }}>
    <Backdrop frame={frame} contentScale={scale} />
    <AmmanScene frame={frame} contentScale={scale} />
    {/* Fixed paper scrim guarantees legibility through the camera descent. */}
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 960 + (790 - 960) * scale, pointerEvents: 'none', background: 'linear-gradient(#fdf8f000 35%, #fdf8f0e8 65%, #fdf8f0e8 86%, #fdf8f000)' }} />
    <AbsoluteFill name="Framing · room for centered Instagram zoom" data-r16-framing style={{ scale, transformOrigin: '540px 960px' }}>
      <Headline frame={frame} />
      <Mark frame={frame} />
      {voice && <Sequence name="Voice and subtitles · final ElevenLabs WAV" layout="none" durationInFrames={20 * fps} premountFor={fps}>
        <Audio src={staticFile('r16/voice.wav')} premountFor={fps} volume={1} />
        <Subtitles />
      </Sequence>}
      <Cta frame={frame} voice={voice} />
    </AbsoluteFill>
    {music && <Sequence name="Music · original hillside score" layout="none" durationInFrames={durationInFrames} premountFor={fps}>
      <Audio src={staticFile('r16/music.wav')} premountFor={fps} volume={(f) => (voice && f < 20 * fps ? 0.24 : 0.53) * (1 - enter(f, durationInFrames - fps, fps - 1))} />
    </Sequence>}
    {sfx && <Sequence name="SFX · steps · clue · leaves · page" layout="none" durationInFrames={durationInFrames} premountFor={fps}>
      <Audio src={staticFile('r16/sfx.wav')} premountFor={fps} volume={voice ? 0.42 : 0.74} />
    </Sequence>}
    {safeAreaPreview && <div style={{ position: 'absolute', left: 180, top: 300, width: 720, height: 930, border: '2px dashed #a64f2d', pointerEvents: 'none' }} />}
  </AbsoluteFill>;
}

export function R16Cover() {
  return <AbsoluteFill style={{ backgroundColor: palette.cream, fontFamily: 'Cairo' }}>
    <Backdrop frame={0} /><AmmanScene frame={0} />
    <Headline frame={0} cover /><Mark frame={0} cover />
  </AbsoluteFill>;
}
