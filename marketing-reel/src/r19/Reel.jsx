import { Fragment } from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ListeningScene } from './Scene';
import { ListeningBackdrop } from './Backdrop';
import { aligned, captions, enter, mix, palette, subtitlePages, tickSeconds, voiceTiming } from './timing';
import { brand } from '../brand';

function Words({ text, time, size = 88, immediate = false, start = 0 }) {
  let wordIndex = 0;
  return <div dir="rtl" lang="ar" style={{ textAlign: 'center', color: palette.cream, fontSize: size, lineHeight: 1.5, fontWeight: 780 }}>
    {text.split('\n').map((line, row) => <div key={row} style={{ whiteSpace: 'nowrap' }}>
      {line.split(' ').map((word, i, words) => {
        const reveal = enter(time, start + wordIndex++ * 0.08, 0.36);
        return <Fragment key={`${row}-${i}`}><span data-r19-word style={{ display: 'inline-block', opacity: immediate ? 1 : reveal, translate: `0 ${immediate ? 0 : (1 - reveal) * 14}px` }}>{word}</span>{i < words.length - 1 ? ' ' : ''}</Fragment>;
      })}
    </div>)}
  </div>;
}

function Mark({ time }) {
  const settle = enter(time, 12, 0.7);
  return <div data-r19-essential="logo" dir="rtl" lang="ar" style={{ position: 'absolute', left: 385, top: 314, width: 310, height: 82, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
    <div style={{ width: mix(64, 70, settle), height: mix(64, 70, settle), padding: 6, background: palette.cream, borderRadius: 10, display: 'grid', placeItems: 'center' }}>
      <Img src={staticFile('brand/logo.png')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
    <span style={{ fontWeight: 850, fontSize: mix(40, 44, settle), color: palette.cream }}>قصتي</span>
  </div>;
}

function TickCopy() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  return <div data-r19-essential="title-A" dir="rtl" lang="ar" style={{ position: 'absolute', left: 202, top: 456, width: 676, textAlign: 'center', opacity: 1 - enter(time, 2.78, 0.22) }}>
    <div style={{ color: palette.cream, fontSize: 106, lineHeight: 1.5, fontWeight: 800, whiteSpace: 'nowrap' }}>
      {['تك...', 'تك...', 'تك'].map((word, i) => {
        const pulse = time < tickSeconds[i] ? 0 : Math.exp(-(time - tickSeconds[i]) * 6);
        return <Fragment key={i}><span data-r19-word style={{ display: 'inline-block', color: time >= tickSeconds[i] ? palette.gold : palette.cream, scale: 1 + pulse * 0.055 }}>{word}</span>{i < 2 ? ' ' : ''}</Fragment>;
      })}
    </div>
    <div style={{ height: 2, width: 94, background: palette.gold, margin: '15px auto 0', opacity: 0.66 }} />
  </div>;
}

function WorldsCopy() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  return <div data-r19-essential="title-B" style={{ position: 'absolute', left: 196, top: 455, width: 688, opacity: 1 - enter(time, 7.75, 0.25) }}>
    <Words text="مطر؟ خطوات؟" time={time} size={91} />
    <div style={{ width: 94, height: 2, background: palette.gold, margin: '16px auto 0', scale: enter(time, 0.22, 0.5) }} />
  </div>;
}

function QuestionCopy() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <div data-r19-essential="title-C" style={{ position: 'absolute', left: 196, top: 455, width: 688 }}>
    <Words text="إنت شو شايف؟" time={frame / fps} size={89} immediate />
    <svg viewBox="0 0 144 16" width="144" height="16" style={{ display: 'block', margin: '12px auto 0' }} aria-hidden="true">
      <path d="M8 12Q72 2 136 12" fill="none" stroke={palette.gold} strokeWidth="2" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - enter(frame / fps, 0.24, 0.6)} />
    </svg>
  </div>;
}

function SoundCue({ time, voice }) {
  const narrativeAt = voice && aligned ? captions[3].startMs / 1000 : 3;
  const opening = 1 - enter(time, narrativeAt - 0.16, 0.16);
  const tick = tickSeconds.reduce((sum, at) => sum + (time < at ? 0 : Math.exp(-(time - at) * 5.5)), 0);
  return <div data-r19-essential="sound-cue" style={{ position: 'absolute', left: 468, top: 1075, width: 144, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, opacity: opening }}>
    {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{ width: 3, height: 9 + (1 - Math.abs(i - 2) / 3) * tick * 36, background: palette.gold, borderRadius: 3 }} />)}
  </div>;
}

function SaveCue({ time }) {
  const reveal = enter(time, 15.7, 0.5);
  return <div data-r19-essential="save-cue" dir="rtl" lang="ar" style={{ position: 'absolute', left: 220, top: 1110, width: 640, opacity: reveal, translate: `0 ${(1 - reveal) * 9}px`, textAlign: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 15 }}>
      <svg width="27" height="37" viewBox="0 0 27 37" aria-hidden="true"><path d="M3 3H24V33L13.5 26L3 33Z" fill="none" stroke={palette.gold} strokeWidth="2.2" strokeLinejoin="round" /></svg>
      <span style={{ color: palette.cream, fontWeight: 650, fontSize: 43, lineHeight: 1.45 }}>احفظوا لعبة الاستماع</span>
    </div>
    <div dir="ltr" style={{ color: palette.gold, fontSize: 25, lineHeight: 1.4, marginTop: 7 }}>{brand.instagram}</div>
  </div>;
}

function Subtitles() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps * 1000;
  // Title A represents the three opening tick words. Narrative pages share
  // the voice track's source clock and begin after that opening caption page.
  const pages = subtitlePages.slice(1);
  const page = pages.find((words, i) => time >= words[0].startMs && time < Math.min(words.at(-1).endMs + 120, pages[i + 1]?.[0].startMs ?? 17000));
  if (!page) return null;
  return <div data-r19-essential="subtitles" dir="rtl" lang="ar" style={{ position: 'absolute', left: 220, top: 1078, width: 640, textAlign: 'center' }}>
    <div style={{ display: 'inline-block', boxSizing: 'border-box', maxWidth: '100%', padding: '4px 16px', borderRadius: 8, border: '1px solid #d6b57660', background: '#062d30f2', fontSize: 46, lineHeight: 1.35, fontWeight: 650, color: palette.cream, whiteSpace: 'nowrap' }}>
      {page.map((word, i) => <Fragment key={`${word.startMs}-${i}`}><span data-r19-caption-word style={{ display: 'inline-block', opacity: time < word.startMs ? 0.35 : 1, color: time >= word.startMs && time <= word.endMs ? palette.gold : palette.cream }}>{word.text.trim()}</span>{i < page.length - 1 ? ' ' : ''}</Fragment>)}
    </div>
  </div>;
}

export function R19Reel({ voice = true, music = true, sfx = true, safeAreaPreview = false }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const time = frame / fps;
  if (voice && !aligned) throw new Error('R19 needs the complete prepared voice WAV and reviewed final-WAV alignment. Run voice:r19, transcribe:r19 and align:r19 before enabling voice.');
  return <AbsoluteFill data-r19-canvas style={{ background: palette.deep, fontFamily: 'Cairo', overflow: 'hidden' }}>
    <Sequence name="3D · sound ripples → rain window → paper corridor" durationInFrames={durationInFrames} premountFor={fps}>
      <ListeningBackdrop />
      <ListeningScene />
    </Sequence>
    <Mark time={time} />
    <Sequence name="B · مطر؟ خطوات؟" from={3 * fps} durationInFrames={8 * fps} premountFor={fps} layout="none"><WorldsCopy /></Sequence>
    <Sequence name="C · إنت شو شايف؟" from={11 * fps} durationInFrames={8 * fps} premountFor={fps} layout="none"><QuestionCopy /></Sequence>
    <Sequence name="Voice + Arabic captions · complete Mona take" durationInFrames={durationInFrames} premountFor={fps} layout="none">
      <Sequence name="A · تك... تك... تك" durationInFrames={3 * fps} premountFor={fps} layout="none"><TickCopy /></Sequence>
      {voice && <Audio name="Voice · normalized complete ElevenLabs recording" src={staticFile('r19/voice.wav')} durationInFrames={Math.ceil(voiceTiming.voiceDurationMs / 1000 * fps)} premountFor={fps} volume={1} />}
      {voice && <Subtitles />}
    </Sequence>
    <SoundCue time={time} voice={voice} />
    <SaveCue time={time} />
    {music && <Audio name="Music · original listening-game score" src={staticFile('r19/music.wav')} durationInFrames={durationInFrames} premountFor={fps} volume={(audioFrame) => voice ? mix(0.35, 0.72, enter(audioFrame / fps, voiceTiming.finalWordEndMs / 1000 + 0.1, 0.6)) : 0.72} />}
    {sfx && <Audio name="Sound · three ticks · rain · paper steps · return" src={staticFile('r19/sfx.wav')} durationInFrames={durationInFrames} premountFor={fps} volume={(audioFrame) => voice ? mix(0.38, 0.95, enter(audioFrame / fps, voiceTiming.finalWordEndMs / 1000 + 0.1, 0.6)) : 0.95} />}
    {safeAreaPreview && <div style={{ position: 'absolute', left: 180, top: 300, width: 720, height: 930, border: '2px dashed #f4b740', pointerEvents: 'none' }} />}
  </AbsoluteFill>;
}

export function R19Cover() {
  return <AbsoluteFill style={{ background: palette.deep, fontFamily: 'Cairo', overflow: 'hidden' }}>
    <ListeningBackdrop stillFrame={57} />
    <ListeningScene stillFrame={57} />
    <Mark time={0} />
    <div data-r19-essential="cover-hook" style={{ position: 'absolute', left: 200, top: 446, width: 680 }}>
      <Words text="اسمعوا هالصوت..." size={64} time={1} immediate />
      <Words text="وين بودّيكم؟" size={89} time={1} immediate />
    </div>
  </AbsoluteFill>;
}
