import { Fragment } from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { MoonlitRoom } from './Scene';
import { aligned, captions, enter, mix, palette } from './timing';
import { saveClickFrame } from './interaction.json';
import '../brand';

function Phrase({ text, opacity = 1, size = 72, color = palette.cream }) {
  // Whole phrase shares one reveal. Spans contain complete words, never glyphs.
  return <div dir="rtl" lang="ar" style={{ fontSize: size, fontWeight: 750, lineHeight: 1.55, textAlign: 'center', color, opacity }}>
    {text.split('\n').map((line, row) => <div key={row} style={{ whiteSpace: 'nowrap' }}>{line.split(' ').map((word, i, words) => <Fragment key={`${word}-${i}`}><span style={{ display: 'inline-block' }}>{word}</span>{i < words.length - 1 ? ' ' : ''}</Fragment>)}</div>)}
  </div>;
}

function Mark({ time, cover = false }) {
  const end = cover ? 0 : enter(time, 14, 1);
  return <div data-r17-essential="logo" dir="rtl" style={{ position: 'absolute', left: 360, top: 320, width: 360, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: mix(10, 14, end) }}>
    <div style={{ width: mix(54, 76, end), height: mix(54, 76, end), background: palette.cream, borderRadius: 8, padding: 5, boxSizing: 'border-box', display: 'grid', placeItems: 'center' }}><Img src={staticFile('brand/logo.png')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
    <span lang="ar" style={{ fontSize: mix(28, 46, end), fontWeight: 800, color: palette.cream }}>قصتي</span>
  </div>;
}

function Titles({ time }) {
  return <>
    {time < 3 && <div data-r17-essential="hook" style={{ position: 'absolute', left: 200, top: 453, width: 680 }}><Phrase text="سؤال الليلة" size={88} /></div>}
    {time >= 3 && time < 12 && <div data-r17-essential="question" style={{ position: 'absolute', left: 195, top: 444, width: 690 }}>
      <Phrase text={'لو في باب سري\nبغرفتك... وين بودّيك؟'} opacity={enter(time, 3, 0.35) * (1 - enter(time, 11.7, 0.3))} size={68} />
      <div style={{ height: 2, width: 76, background: palette.gold, margin: '18px auto 0', opacity: enter(time, 3, 0.35) }} />
    </div>}
  </>;
}

function SaveCue({ time, fps }) {
  const reveal = enter(time, 11, 0.45);
  const bookmark = enter(time, 13, 0.6);
  const clickAt = saveClickFrame / fps;
  const approach = enter(time, clickAt - 0.5, 0.4);
  const pointer = enter(time, clickAt - 0.5, 0.22) * (1 - enter(time, clickAt + 0.22, 0.25));
  const press = enter(time, clickAt - 0.12, 0.12) * (1 - enter(time, clickAt, 0.16));
  const rebound = enter(time, clickAt, 0.18) * (1 - enter(time, clickAt + 0.18, 0.3));
  const saved = enter(time, clickAt, 0.14);
  const ripple = enter(time, clickAt, 0.6);
  const rippleOpacity = time >= clickAt ? (1 - ripple) * 0.65 : 0;
  return <div data-r17-essential="save-cue" dir="rtl" lang="ar" style={{ position: 'absolute', left: 200, top: 1133, width: 680, height: 76, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, opacity: reveal, color: palette.cream }}>
    <div data-r17-bookmark style={{ position: 'relative', width: 60, height: 76, flexShrink: 0, opacity: bookmark, translate: `0 ${(1 - bookmark) * 7}px` }}>
      <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true" style={{ position: 'absolute', left: -14, top: -6, overflow: 'visible' }}>
        <circle data-r17-click-ripple cx="44" cy="44" r={mix(12, 39, ripple)} fill="none" stroke={palette.gold} strokeWidth="2" opacity={rippleOpacity} />
        <g transform={`translate(44 44) scale(${1 - press * 0.12 + rebound * 0.08}) translate(-44 -44)`}>
          <path d="M29 20h30v46L44 55 29 66Z" fill={palette.gold} fillOpacity={mix(0.12, 0.95, saved)} stroke={palette.gold} strokeWidth="2.6" strokeLinejoin="round" />
          <path d="M36 29h16" stroke={saved > 0.5 ? palette.deep : palette.gold} strokeWidth="1.8" />
        </g>
        <g data-r17-click-pointer opacity={pointer} transform={`translate(${53 + (1 - approach) * 12} ${47 + (1 - approach) * 12}) scale(0.75)`}>
          <path d="M0 0v24l6-6 7 12 6-3-7-11h9Z" fill={palette.cream} stroke={palette.deep} strokeWidth="2" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
    <span style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.4 }}>احفظوا السؤال</span>
  </div>;
}

function Subtitles() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps * 1000;
  const pages = []; let page = [];
  captions.forEach((word) => { page.push(word); if (word.pageBreakAfter) { pages.push(page); page = []; } });
  if (page.length) pages.push(page);
  const current = pages.find((p, i) => time >= p[0].startMs && time < Math.min(p.at(-1).endMs + 120, pages[i + 1]?.[0].startMs ?? 16000));
  if (!current) return null;
  return <div data-r17-essential="subtitles" dir="rtl" lang="ar" style={{ position: 'absolute', left: 210, top: 1040, width: 660, textAlign: 'center' }}>
    <div style={{ display: 'inline-block', maxWidth: '100%', boxSizing: 'border-box', padding: '5px 18px', background: '#092f32e8', border: '1px solid #d6b57655', borderRadius: 10, fontSize: 43, lineHeight: 1.5, fontWeight: 650, color: palette.cream }}>
      {current.map((word, i) => <Fragment key={word.startMs}><span style={{ display: 'inline-block', opacity: time < word.startMs ? 0.4 : 1, color: time >= word.startMs && time <= word.endMs ? palette.gold : palette.cream }}>{word.text.trim()}</span>{i < current.length - 1 ? ' ' : ''}</Fragment>)}
    </div>
  </div>;
}

export function R17Reel({ voice = true, music = true, sfx = true, roomTone = true, safeAreaPreview = false }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const time = frame / fps;
  if (voice && !aligned) throw new Error('R17 voice needs final-WAV alignment. Prepare the complete ElevenLabs take with voice:r17, then transcribe and review the final WAV and import its measured timings with align:r17 before enabling voice.');
  return <AbsoluteFill data-r17-canvas style={{ background: palette.deep, fontFamily: 'Cairo', overflow: 'hidden' }}>
    <MoonlitRoom />
    {/* Fixed scrims preserve text contrast while the 3D lighting changes. */}
    <AbsoluteFill style={{ pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 47%, transparent 20%, #031c2060 85%), linear-gradient(#082e3260 12%, #092f32bb 24%, #092f32bb 34%, transparent 44%, transparent 54%, #092f32a0 64%, #082b3090 100%)' }} />
    <Mark time={time} />
    <Titles time={time} />
    <SaveCue time={time} fps={fps} />
    {voice && <Sequence name="Voice and subtitles · final ElevenLabs WAV" layout="none" durationInFrames={16 * fps} premountFor={fps}>
      <Audio src={staticFile('r17/voice.wav')} premountFor={fps} volume={1} />
      <Subtitles />
    </Sequence>}
    {music && <Audio name="Music · original nocturne" src={staticFile('r17/music.wav')} premountFor={fps} volume={voice ? 0.28 : 0.46} durationInFrames={durationInFrames} />}
    {roomTone && <Audio name="Room tone · original quiet air" src={staticFile('r17/room-tone.wav')} premountFor={fps} volume={voice ? 0.4 : 0.62} durationInFrames={durationInFrames} />}
    {sfx && <>
      <Audio name="SFX · latch · paper star chime" src={staticFile('r17/sfx.wav')} premountFor={fps} volume={voice ? 0.45 : 0.7} durationInFrames={durationInFrames} />
      <Audio name="SFX · bookmark click" from={saveClickFrame} src={staticFile('r17/bookmark-click.wav')} premountFor={fps} volume={0.75} durationInFrames={8} />
    </>}
    {safeAreaPreview && <div style={{ position: 'absolute', left: 180, top: 300, width: 720, height: 930, boxSizing: 'border-box', border: '2px dashed #f4b740', pointerEvents: 'none' }} />}
  </AbsoluteFill>;
}

export function R17Cover() {
  return <AbsoluteFill style={{ background: palette.deep, fontFamily: 'Cairo' }}>
    <MoonlitRoom stillFrame={165} />
    <AbsoluteFill style={{ background: 'linear-gradient(#092f3260, #092f32bb 34%, transparent 52%, #092f3280)' }} />
    <Mark time={0} cover />
    <div style={{ position: 'absolute', left: 200, top: 453, width: 680 }}><Phrase text={'جرّبوا هالسؤال\nالليلة قبل النوم'} size={70} /></div>
  </AbsoluteFill>;
}
