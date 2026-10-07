import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import captions from './captions.json';
import { palette, reveal } from './art';
import { StorySet } from './Scene';
import '../brand';

const { cream, gold } = palette;
const captionPages = [];
let pageWords = [];
for (const word of captions) {
  pageWords.push(word);
  if (word.pageBreakAfter) {
    captionPages.push({ startMs: pageWords[0].startMs, words: pageWords });
    pageWords = [];
  }
}
if (pageWords.length) captionPages.push({ startMs: pageWords[0].startMs, words: pageWords });
const voicedFrame = (text) => captions.find((word) => word.text === text).startMs * 30 / 1000;
const todayFrame = voicedFrame('اليوم');
const storyFrame = voicedFrame('إشي');
const questionFrame = voicedFrame('شو');

function Words({ text, frame, start, size, beatFrames }) {
  const words = text.split(' ');
  return <div dir="rtl" style={{ textAlign: 'center', fontSize: size, fontWeight: 850, lineHeight: 1.32, color: cream, textShadow: '0 4px 18px rgba(0,17,20,0.65)' }}>
    {words.map((word, i) => {
      const amount = reveal(frame, beatFrames?.[i] ?? start + i * 4, 9);
      return <span key={`${word}-${i}`} style={{ display: 'inline-block', opacity: amount, translate: `0 ${(1 - amount) * 12}px` }}>{word}{i < words.length - 1 ? '\u00a0' : ''}</span>;
    })}
  </div>;
}

function Copy({ frame }) {
  const cue = frame < todayFrame ? { text: 'لو لعبته بتحكي؟', start: -24, end: todayFrame }
    : frame < storyFrame ? { text: 'اليوم دوري!', start: todayFrame, end: storyFrame, beatFrames: [todayFrame, voicedFrame('دوري')] }
      : frame < questionFrame ? { text: 'لعبته بتدخل الحكاية', start: storyFrame, end: questionFrame }
        : { text: 'شو اسم لعبته؟', start: questionFrame, end: 600, beatFrames: [questionFrame, voicedFrame('اسم'), voicedFrame('اللعبة')] };
  const now = frame * 1000 / 30;
  const page = captionPages.find((candidate, i) => now >= candidate.startMs && now < (captionPages[i + 1]?.startMs ?? 18000));
  const line = page?.words ?? [];
  return <>
    <div style={{ position: 'absolute', left: 240, top: 410, width: 600, minHeight: 104, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: cue.end === 600 ? 1 : 1 - reveal(frame, cue.end - 8, 8) }}>
      <Words text={cue.text} frame={frame} start={cue.start} beatFrames={cue.beatFrames} size={frame >= storyFrame && frame < questionFrame ? 54 : 62} />
    </div>
    <div style={{ position: 'absolute', left: 498, top: 520, width: 84, height: 3, borderRadius: 2, background: gold, opacity: frame < questionFrame ? 0.8 : 0.25 }} />
    {frame < 540 && line.length > 0 && <div style={{ position: 'absolute', left: 240, top: 1080, width: 600, height: 86, borderRadius: 14, background: 'rgba(5,36,39,0.94)', border: '1px solid rgba(232,207,147,0.42)', boxShadow: '0 14px 36px rgba(0,14,17,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 1 - reveal(frame, 537, 3) }}>
      <div dir="rtl" style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.3, color: cream, padding: '0 22px' }}>
        {line.map((word, i) => <span key={word.startMs} style={{ display: 'inline-block', color: now >= word.startMs && now < word.endMs ? gold : cream }}>{word.text}{i < line.length - 1 ? '\u00a0' : ''}</span>)}
      </div>
    </div>}
    <div dir="rtl" style={{ position: 'absolute', left: 370, top: 530, width: 340, height: 60, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, color: cream, opacity: reveal(frame, 480, 25), textShadow: '0 3px 16px rgba(0,0,0,0.3)' }}>
      <Img src={staticFile('brand/logo.png')} style={{ width: 58, height: 58, objectFit: 'contain' }} />
      <span style={{ fontSize: 43, fontWeight: 800 }}>قصتي</span>
    </div>
  </>;
}

function Atmosphere({ frame }) {
  const drift = Math.sin(frame / 599 * Math.PI * 2) * 12;
  return <>
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: 'absolute' }}>
      <defs>
        <radialGradient id="r13-aura"><stop stopColor="#c8d2b0" stopOpacity=".24" /><stop offset=".55" stopColor="#87b2a0" stopOpacity=".12" /><stop offset="1" stopColor="#87b2a0" stopOpacity="0" /></radialGradient>
        <radialGradient id="r13-warm"><stop stopColor="#f0d795" stopOpacity=".14" /><stop offset="1" stopColor="#f0d795" stopOpacity="0" /></radialGradient>
        <linearGradient id="r13-paper" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8ab4a1" stopOpacity=".15" /><stop offset="1" stopColor="#092d31" stopOpacity=".08" /></linearGradient>
        <linearGradient id="r13-ray" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e4d4a5" stopOpacity=".06" /><stop offset="1" stopColor="#e4d4a5" stopOpacity="0" /></linearGradient>
        <filter id="r13-soft-light" x="-30%" y="-20%" width="160%" height="140%"><feGaussianBlur stdDeviation="30" /></filter>
      </defs>
      <path d="M80 140 L260 140 L880 1330 L590 1330 Z" fill="url(#r13-ray)" filter="url(#r13-soft-light)" />
      <ellipse cx={540 + drift} cy="825" rx="535" ry="665" fill="url(#r13-aura)" />
      <ellipse cx={620 - drift} cy="660" rx="370" ry="420" fill="url(#r13-warm)" />
      <path d="M140 1335 V735 A400 400 0 0 1 940 735 V1335 Q540 1470 140 1335 Z" fill="url(#r13-paper)" stroke="#d1d8bb" strokeWidth="1.4" strokeOpacity=".15" />
      <path d="M172 1298 V755 A368 368 0 0 1 908 755 V1298" fill="none" stroke="#edce8c" strokeWidth="1" opacity=".21" />
      <ellipse cx="540" cy="1035" rx="310" ry="68" fill="#042a2c" opacity=".12" />
      <path d={`M0 1470 C195 ${1320 + drift} 320 1385 535 1480 C735 1568 900 1430 1080 1395 L1080 1920 L0 1920 Z`} fill="#6e9b87" opacity=".13" />
      <path d={`M0 1470 C195 ${1320 + drift} 320 1385 535 1480 C735 1568 900 1430 1080 1395`} fill="none" stroke="#d4d5b2" strokeWidth="1.5" opacity=".17" />
      <path d="M0 1620 C310 1450 460 1650 690 1620 C845 1600 970 1510 1080 1550 L1080 1920 L0 1920 Z" fill="#a6b799" opacity=".055" />
      <path d="M0 1650 C280 1480 475 1700 710 1660 C900 1625 940 1585 1080 1590" fill="none" stroke="#e9cf94" strokeWidth="1" opacity=".12" />
      <g fill="#edce8c" opacity=".36">
        <path d="M230 594 L233 601 L240 604 L233 607 L230 614 L227 607 L220 604 L227 601 Z" />
        <path d="M860 730 L862 735 L867 737 L862 739 L860 744 L858 739 L853 737 L858 735 Z" />
        <circle cx="213" cy="991" r="2.5" /><circle cx="845" cy="1025" r="2" />
      </g>
    </svg>
    <AbsoluteFill style={{ opacity: 0.075, pointerEvents: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 180 180\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.7\' numOctaves=\'3\' seed=\'13\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'.5\'/%3E%3C/svg%3E")', mixBlendMode: 'soft-light' }} />
  </>;
}

export function R13Reel({ voice = true }) {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ fontFamily: 'Cairo', background: 'radial-gradient(ellipse at 50% 42%, #2b7970 0%, #185d5c 34%, #0c383c 72%, #092b30 100%)', overflow: 'hidden' }}>
    <Atmosphere frame={frame} />
    <StorySet frame={frame} />
    <Copy frame={frame} />
    <Audio src={staticFile('r13/music.wav')} volume={voice ? 0.28 + reveal(frame, 534, 15) * 0.14 : 0.42} />
    <Audio src={staticFile('r13/sfx.wav')} volume={voice ? 0.5 : 0.62} />
    {voice && <Audio src={staticFile('r13/voice.wav')} volume={1} />}
  </AbsoluteFill>;
}
