import { Fragment } from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { PaperForkScene } from './Scene';
import { PaperBackdrop } from './Backdrop';
import { aligned, audioCues, enter, mix, palette, subtitlePages, voiceTiming } from './timing';
import '../brand';

function Words({ text, start = -1, time, size = 80, immediate = false }) {
  let index = 0;
  return <div dir="rtl" lang="ar" style={{ color: palette.cream, textAlign: 'center', fontSize: size, lineHeight: 1.5, fontWeight: 780 }}>
    {text.split('\n').map((line, row) => <div key={row} style={{ whiteSpace: 'nowrap' }}>
      {line.split(' ').map((word, i, words) => {
        const wordIndex = index++;
        const reveal = enter(time, start + wordIndex * 0.055, 0.3);
        return <Fragment key={`${row}-${i}`}>
          <span data-r18-word style={{ display: 'inline-block', opacity: immediate ? 0.78 + reveal * 0.22 : reveal, translate: `0 ${(1 - reveal) * 12}px`, color: /[١٢/]/u.test(word) ? palette.gold : palette.cream }}>{word}</span>{i < words.length - 1 ? ' ' : ''}
        </Fragment>;
      })}
    </div>)}
  </div>;
}

function Mark({ time }) {
  const settle = enter(time, 12, 0.75);
  return <div data-r18-essential="logo" dir="rtl" lang="ar" style={{ position: 'absolute', left: 370, top: 314, width: 340, height: 86, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 17 }}>
    <div style={{ width: mix(62, 70, settle), height: mix(62, 70, settle), padding: 6, background: palette.cream, borderRadius: 10, display: 'grid', placeItems: 'center' }}>
      <Img src={staticFile('brand/logo.png')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
    <span style={{ fontWeight: 850, fontSize: mix(38, 43, settle), color: palette.cream }}>قصتي</span>
  </div>;
}

function OpeningCopy() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = enter(frame / fps, 2.66, 0.34);
  return <div data-r18-essential="title-A" style={{ position: 'absolute', left: 198, top: 440, width: 684, height: 166, opacity: 1 - exit, translate: `0 ${-exit * 7}px` }}>
    <Words text="النهاية ١ أو ٢؟" time={frame / fps} start={-0.22} size={83} immediate />
    <div style={{ width: 78, height: 2, background: palette.gold, margin: '16px auto 0' }} />
  </div>;
}

function RoutesCopy() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = enter(frame / fps, 8.66, 0.34);
  return <div data-r18-essential="title-B" style={{ position: 'absolute', left: 208, top: 431, width: 664, height: 191, opacity: 1 - exit, translate: `0 ${-exit * 7}px` }}>
    <Words text={'جسر للصديق /\nطريق للمساعدة'} time={frame / fps} start={0} size={62} />
  </div>;
}

function ChoiceCopy() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <div data-r18-essential="title-C" style={{ position: 'absolute', left: 198, top: 440, width: 684, height: 164 }}>
    <Words text="اختاروا النهاية" time={frame / fps} start={0} size={81} />
    <svg width="120" height="12" viewBox="0 0 120 12" style={{ display: 'block', margin: '10px auto 0' }} aria-hidden="true">
      <path d="M10 8Q60 1 110 8" fill="none" stroke={palette.gold} strokeWidth="2" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - enter(frame / fps, 0.2, 0.45)} />
    </svg>
  </div>;
}

function RouteNumbers({ time }) {
  const { fps } = useVideoConfig();
  const questionAt = (audioCues.voiceWordFrames?.question ?? 7 * fps) / fps;
  const reveal = enter(time, questionAt, 0.5);
  const leftAt = (audioCues.voiceWordFrames?.firstChoice ?? audioCues.leftSelectionFrame) / fps;
  const rightAt = (audioCues.voiceWordFrames?.secondChoice ?? audioCues.rightSelectionFrame) / fps;
  const leftLight = enter(time, leftAt, 0.2) * (1 - enter(time, rightAt, 0.25));
  const rightLight = enter(time, rightAt, 0.2) * (1 - enter(time, 11, 0.5));
  return <div data-r18-essential="route-numbers" style={{ position: 'absolute', left: 248, top: 1015, width: 584, display: 'flex', justifyContent: 'space-between', opacity: reveal }}>
    {[[1, leftLight], [2, rightLight]].map(([number, light]) => <div key={number} dir="rtl" lang="ar" style={{ width: 64, height: 64, display: 'grid', placeItems: 'center', fontSize: 40, lineHeight: 1, fontWeight: 750, color: palette.cream, border: `1.5px solid ${palette.gold}`, borderRadius: '50%', background: `rgba(214,181,118,${mix(0.06, 0.3, light)})`, boxShadow: `0 0 ${light * 22}px rgba(214,181,118,0.23)` }}>{number === 1 ? '١' : '٢'}</div>)}
  </div>;
}

function CommentCue({ time }) {
  const { fps } = useVideoConfig();
  const commentAt = (audioCues.voiceWordFrames?.comment ?? 14 * fps) / fps;
  const reveal = enter(time, commentAt, 0.4);
  return <div data-r18-essential="comment-cue" style={{ position: 'absolute', left: 498, top: 1167, width: 84, height: 54, opacity: reveal, translate: `0 ${(1 - reveal) * 8}px` }}>
    <svg width="84" height="54" viewBox="0 0 84 54" aria-hidden="true">
      <path d="M13 5H71Q79 5 79 13V32Q79 40 71 40H36L23 49V40H13Q5 40 5 32V13Q5 5 13 5Z" fill="#0b3b3ed9" stroke={palette.gold} strokeWidth="1.7" strokeLinejoin="round" />
      {[0, 1, 2].map((i) => <circle key={i} cx={31 + i * 11} cy={23} r={2.5} fill={palette.cream} opacity={enter(time, commentAt + 0.18 + i * 0.08, 0.18)} />)}
    </svg>
  </div>;
}

function Subtitles() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps * 1000;
  const page = subtitlePages.find((words, i) => time >= words[0].startMs && time < Math.min(words.at(-1).endMs + 120, subtitlePages[i + 1]?.[0].startMs ?? 18000));
  if (!page) return null;
  return <div data-r18-essential="subtitles" dir="rtl" lang="ar" style={{ position: 'absolute', left: 204, top: 1090, width: 672, textAlign: 'center' }}>
    <div style={{ display: 'inline-block', maxWidth: '100%', padding: '4px 16px', borderRadius: 8, border: '1px solid #d6b57660', background: '#0b3b3eef', fontSize: 42, lineHeight: 1.45, fontWeight: 650, color: palette.cream }}>
      {page.map((word, i) => <Fragment key={`${word.startMs}-${i}`}><span style={{ display: 'inline-block', opacity: time < word.startMs ? 0.32 : 1, color: time >= word.startMs && time <= word.endMs ? palette.gold : palette.cream }}>{word.text.trim()}</span>{i < page.length - 1 ? ' ' : ''}</Fragment>)}
    </div>
  </div>;
}

function PaperFinish() {
  return <>
    <AbsoluteFill style={{ pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 43%, transparent 32%, #052d3038 100%)' }} />
    <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.048 }} aria-hidden="true">
      <filter id="r18-paper-grain"><feTurbulence type="fractalNoise" baseFrequency="0.54" numOctaves="3" seed="18" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="1080" height="1920" filter="url(#r18-paper-grain)" opacity="0.75" />
    </svg>
  </>;
}

export function R18Reel({ voice = true, music = true, sfx = true, safeAreaPreview = false }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const time = frame / fps;
  if (voice && !aligned) throw new Error('R18 needs the final ElevenLabs WAV and reviewed measured word alignment. Run voice:r18, transcribe:r18 and align:r18 before enabling voice.');
  return <AbsoluteFill data-r18-canvas style={{ background: palette.deep, fontFamily: 'Cairo', overflow: 'hidden' }}>
    <PaperBackdrop />
    <PaperForkScene />
    <PaperFinish />
    <Mark time={time} />
    <Sequence name="A · النهاية ١ أو ٢؟" durationInFrames={3 * fps} premountFor={fps} layout="none"><OpeningCopy /></Sequence>
    <Sequence name="B · جسر للصديق / طريق للمساعدة" from={3 * fps} durationInFrames={9 * fps} premountFor={fps} layout="none"><RoutesCopy /></Sequence>
    <Sequence name="C · اختاروا النهاية" from={12 * fps} durationInFrames={8 * fps} premountFor={fps} layout="none"><ChoiceCopy /></Sequence>
    <RouteNumbers time={time} />
    <CommentCue time={time} />
    {voice && <Sequence name="Voice + Arabic subtitles · final ElevenLabs WAV" durationInFrames={18 * fps} premountFor={fps} layout="none">
      <Audio src={staticFile('r18/voice.wav')} volume={1} premountFor={fps} />
      <Subtitles />
    </Sequence>}
    {music && <Audio name="Music · original paper garden score" src={staticFile('r18/music.wav')} durationInFrames={durationInFrames} premountFor={fps} volume={(audioFrame) => voice ? mix(0.23, 0.46, enter(audioFrame / fps, (voiceTiming.finalWordEndMs ?? 17800) / 1000, 0.6)) : 0.46} />}
    {sfx && <Audio name="SFX · bridge · beacon · choice taps · rewind" src={staticFile('r18/sfx.wav')} durationInFrames={durationInFrames} premountFor={fps} volume={() => voice ? 0.48 : 0.72} />}
    {safeAreaPreview && <div style={{ position: 'absolute', left: 180, top: 300, width: 720, height: 930, border: '2px dashed #f4b740', pointerEvents: 'none' }} />}
  </AbsoluteFill>;
}

export function R18Cover() {
  return <AbsoluteFill style={{ background: palette.deep, fontFamily: 'Cairo', overflow: 'hidden' }}>
    <PaperBackdrop stillFrame={420} />
    <PaperForkScene stillFrame={420} />
    <PaperFinish />
    <Mark time={14} />
    <div data-r18-essential="cover-hook" style={{ position: 'absolute', left: 200, top: 432, width: 680 }}><Words text={'النهاية الأولى\nولا الثانية؟'} time={1} immediate size={73} /></div>
    <RouteNumbers time={14} />
  </AbsoluteFill>;
}
