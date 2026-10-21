import { Fragment, useMemo } from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  C, CtaLine, KineticHeadline, Mark, SubtitleBand, checkRig, clamp, ease, easeOut, morphD,
  prepareMorph, progress, roundRectD, sampleRig, windowed,
} from '../kit';
import plannedCaptions from './captions-planned.json';
import measuredCaptions from './captions.json';
import { Backdrop } from './Backdrop';

// R26 · جواب واحد… صار صفحة. Brief: briefs/2026-11-reels-sprint/R26.md
// One continuous move: a real answer on the order form becomes an illustrated page.
// Source material is the fictional marketing order Q-000002, so «نموذج توضيحي»
// stays on screen for every frame. The form label is `quirk.label` and the story
// line is page 7's text, both copied verbatim from lib/dictionaries/ar.js.
//
// Built as a 2.5D scene (CSS perspective + SVG) rather than WebGL: the card's
// Arabic stays native DOM text, sharp and correctly shaped at every zoom.

const QUIRK_LABEL = 'شو عادة أو حركة مميزة بيعملها طفلكم؟';
const ANSWER = [['بتلبس', 'جرابين', 'بلونين', 'مختلفين،'], ['وبتعطي', 'كل', 'لون', 'اسم']];
const TYPE_AT = [90, 102, 120, 132, 150, 158, 166, 174];
const STORY_LINES = ['مَدَّت إِيدْهَا الصَّغِيرَة…', 'وَصَارَت تِحَاوِل تِمْسِكِ الْجِرْبَانِ الْأَصْفَر «شَمْس»'];

// Layout, in composition pixels. The page square is where the card lands.
const CARD = { x: 230, y: 650, w: 620, h: 380, r: 30 };
const PAGE = { x: 240, y: 520, w: 600, h: 600, r: 8 };
// Sock and kitten paw in page-07, as fractions of the artwork (measured on the file).
const PUSH_ORIGIN = { x: 0.4, y: 0.62 };
const SOCK = { x: 0.41, y: 0.68 };

// Beat frames (30 fps), matching the brief's second-by-second table.
const T = {
  tilt: [196, 216], contentOut: [204, 214], morph: [216, 26], reveal: [244, 24],
  artPush: [270, 66], story: [300, 420], chip: 360, line: [390, 24],
  attachOut: 468, turn: [480, 26], price: 545, cta: 565, loop: 585,
};

// Camera: push toward the card, ease back while it squares up, pull out for the
// price. Hermite keys from the kit; `stop` keys come fully to rest.
const RIG = [
  { frame: 0, zoom: 1, x: 0, y: 0 },
  { frame: 90, zoom: 1.05, x: 0, y: -8, stop: true },
  { frame: 170, zoom: 1.05, x: 0, y: -8, stop: true },
  { frame: 216, zoom: 1, x: 0, y: 0, stop: true },
  { frame: 412, zoom: 1, x: 0, y: 0, stop: true },
  { frame: 495, zoom: 0.9, x: 0, y: 10, stop: true },
];
checkRig('R26', RIG, { zoom: 0.06 });
const WORLD_ORIGIN = '540px 820px';

// Music sits at 0.85 alone and ducks to 0.3 under the voice, easing over 0.6 s
// either side of the first and last measured word.
function musicVolume(f, fps, voiceOn) {
  if (!voiceOn || measuredCaptions.length === 0) return 0.85;
  const t = f / fps;
  const first = measuredCaptions[0].startMs / 1000, last = measuredCaptions[measuredCaptions.length - 1].endMs / 1000;
  const duck = clamp((t - (first - 0.6)) / 0.6) * (1 - clamp((t - last) / 0.6));
  return 0.85 - 0.55 * duck;
}

// subtitles: 'measured' (captions.json, from the aligned ElevenLabs take),
// 'planned' (layout preview only, never for delivery) or 'off'.
export function R26Reel({ music = true, sfx = true, voice = false, subtitles = 'planned', safeAreaPreview = false }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const cam = sampleRig(RIG, frame);
  const captions = subtitles === 'measured' ? measuredCaptions : subtitles === 'planned' ? plannedCaptions : [];

  return <AbsoluteFill style={{ background: '#f3e8d6', fontFamily: 'Cairo', overflow: 'hidden' }}>
    <Backdrop frame={frame} cam={cam} />
    <AbsoluteFill style={{ transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.zoom})`, transformOrigin: WORLD_ORIGIN }}>
      <World frame={frame} />
    </AbsoluteFill>

    <Mark label="نموذج توضيحي" />
    <KineticHeadline text={'جواب واحد\nبالاستمارة…'} at={-30} out={214} top={404} size={78} name="hook" />
    <KineticHeadline text="…صار صفحة" at={220} out={420} top={404} size={74} emphasis={[{ word: 1, at: 250, mode: 'gold' }]} name="became-a-page" />
    <KineticHeadline text={'مش اسم منبدّله…\nتفصيلة منكتب حولها'} at={424} top={400} size={54} lineHeight={1.35}
      emphasis={[{ word: 3, at: 470, mode: 'scale' }]} name="not-a-name-swap" />

    <Sequence name="Subtitles" durationInFrames={540} layout="none">
      {captions.length ? <SubtitleBand captions={captions} hidden={[1, 5]} top={1135} size={44} /> : null}
    </Sequence>
    <KineticHeadline text="PDF يبدأ من ١٥ دينار · مطبوعة من ٣٢ دينار" at={T.price} top={1104} size={36} weight={700} stagger={2} name="price" />
    <CtaLine text="الرابط بالبايو" at={T.cta} top={1156} />

    {music && <Audio name="Music · original curious theme" src={staticFile('r26/music.wav')} durationInFrames={durationInFrames} premountFor={fps} volume={(f) => musicVolume(f, fps, voice)} />}
    {sfx && <Audio name="SFX · ticks · whoosh · page" src={staticFile('r26/sfx.wav')} durationInFrames={durationInFrames} premountFor={fps} volume={0.9} />}
    {voice && <Audio name="Voice · ElevenLabs (aligned)" src={staticFile('r26/voice.wav')} durationInFrames={durationInFrames} premountFor={fps} />}
    {safeAreaPreview && <div style={{ position: 'absolute', left: 180, top: 300, width: 720, height: 930, border: '2px dashed #c98f1c', pointerEvents: 'none' }} />}
  </AbsoluteFill>;
}

function World({ frame }) {
  const morph = useMemo(() => prepareMorph(
    roundRectD(CARD.x, CARD.y, CARD.w, CARD.h, CARD.r),
    roundRectD(PAGE.x, PAGE.y, PAGE.w, PAGE.h, PAGE.r), 200), []);
  const m = progress(frame, T.morph[0], T.morph[1]);
  const showCard = frame < T.morph[0];
  const turn = progress(frame, T.turn[0], T.turn[1], ease);

  return <>
    {/* The cover waits under the page; the page turns away to reveal it. */}
    {frame >= T.turn[0] - 2 && <Cover frame={frame} />}
    {frame >= T.morph[0] && frame < T.turn[0] + T.turn[1] &&
      <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        <defs><filter id="r26-shadow"><feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#0f4f51" floodOpacity="0.22" /></filter></defs>
        <path d={morphD(morph, m)} fill={C.cream} stroke={C.teal} strokeWidth={3 * (1 - progress(frame, T.reveal[0], T.reveal[1]))}
          filter="url(#r26-shadow)" opacity={1 - turn} />
      </svg>}
    {frame >= T.reveal[0] && <Page frame={frame} turn={turn} />}
    {showCard && <Card frame={frame} />}
    {frame >= T.chip && frame < T.attachOut + 10 && <Attach frame={frame} />}
  </>;
}

function Card({ frame }) {
  const enter = progress(frame, -20, 20, easeOut);
  const tilt = 1 - progress(frame, T.tilt[0], T.tilt[1] - T.tilt[0]);
  const content = 1 - progress(frame, T.contentOut[0], T.contentOut[1] - T.contentOut[0]);
  const typed = TYPE_AT.filter((at) => frame >= at).length;
  const caretOn = typed === 0 ? Math.floor((frame - 20) / 15) % 2 === 0 && frame >= 20 : frame < 186;
  const underline = progress(frame, 180, 14);
  let i = 0;

  return <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, perspective: 1600, perspectiveOrigin: '540px 840px' }}>
    <div dir="rtl" lang="ar" style={{
      position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, boxSizing: 'border-box',
      borderRadius: CARD.r, background: C.cream, border: `3px solid ${C.teal}`,
      boxShadow: '0 14px 32px rgba(15, 79, 81, 0.22)', padding: '34px 40px',
      opacity: enter, transform: `translateY(${(1 - enter) * 24}px) rotateY(${-8 * tilt}deg) rotateX(${6 * tilt}deg)`,
    }}>
      <div style={{ opacity: content }}>
        <div data-kit-essential="form-label" style={{ fontSize: 34, fontWeight: 800, color: C.teal, lineHeight: 1.5 }}>{QUIRK_LABEL}</div>
        <div style={{
          marginTop: 22, minHeight: 168, borderRadius: 16, background: C.paper, border: `2px solid ${C.paperShade}`,
          padding: '14px 22px', fontSize: 37, fontWeight: 700, color: C.ink, lineHeight: 1.65,
        }}>
          {ANSWER.map((line, row) => <div key={row} style={{ whiteSpace: 'nowrap', minHeight: 61 }}>
            {line.map((word, w) => {
              const idx = i++;
              const shown = idx < typed;
              const isUnderlined = idx === 1 || idx === 2;
              const isLastShown = idx === typed - 1;
              return <Fragment key={w}>
                <span style={{ display: shown ? 'inline-block' : 'none', position: 'relative' }}>
                  {word}
                  {isUnderlined && <span aria-hidden="true" style={{
                    position: 'absolute', right: idx === 2 ? -14 : 0, left: 0, bottom: 4, height: 4, borderRadius: 2,
                    background: C.gold, transformOrigin: 'right center', transform: `scaleX(${idx === 1 ? clamp(underline * 2) : clamp(underline * 2 - 1)})`,
                  }} />}
                </span>
                {shown && w < line.length - 1 ? ' ' : ''}
                {isLastShown && caretOn && <Caret />}
              </Fragment>;
            })}
            {row === 0 && typed === 0 && caretOn && <Caret />}
          </div>)}
        </div>
      </div>
    </div>
  </div>;
}

const Caret = () => <span aria-hidden="true" style={{ display: 'inline-block', width: 3, height: 44, marginInlineStart: 6, background: C.teal, verticalAlign: 'middle' }} />;

function Page({ frame, turn }) {
  const reveal = progress(frame, T.reveal[0], T.reveal[1]);
  const push = progress(frame, T.artPush[0], T.artPush[1]);
  const story = windowed(frame, T.story[0], T.story[1], 14, 12);
  const mask = reveal < 1 ? `linear-gradient(to left, #000 ${reveal * 115 - 15}%, transparent ${reveal * 115}%)` : undefined;
  return <div style={{ position: 'absolute', inset: 0, perspective: 2200, perspectiveOrigin: '840px 820px' }}>
    <div style={{
      position: 'absolute', left: PAGE.x, top: PAGE.y, width: PAGE.w, height: PAGE.h, borderRadius: PAGE.r, overflow: 'hidden',
      boxShadow: '0 14px 32px rgba(15, 79, 81, 0.22)', WebkitMaskImage: mask, maskImage: mask,
      transformOrigin: 'right center', transform: `rotateY(${-turn * 100}deg)`, backfaceVisibility: 'hidden', opacity: turn > 0.92 ? 0 : 1,
    }}>
      <Img src={staticFile('r26/page-07.jpg')} style={{
        width: '100%', height: '100%', objectFit: 'cover',
        transform: `scale(${1 + 0.1 * push})`, transformOrigin: `${PUSH_ORIGIN.x * 100}% ${PUSH_ORIGIN.y * 100}%`,
      }} />
      <div dir="rtl" lang="ar" data-kit-essential="story-line" style={{
        position: 'absolute', insetInline: 0, bottom: 0, height: 172, padding: '44px 22px 0', boxSizing: 'border-box',
        background: 'linear-gradient(to bottom, rgba(11, 60, 62, 0) 0%, rgba(11, 60, 62, 0.82) 38%, rgba(11, 60, 62, 0.9) 100%)',
        color: C.cream, textAlign: 'center', fontSize: 26, fontWeight: 700, lineHeight: 1.8, opacity: story,
      }}>
        {STORY_LINES.map((l) => <div key={l} style={{ whiteSpace: 'nowrap' }}>{l}</div>)}
      </div>
      {turn > 0 && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to left, rgba(15,79,81,${0.35 * turn}), transparent 60%)` }} />}
    </div>
  </div>;
}

// The answer, shrunk to a chip, and a gold line drawn from it to the sock it became.
function Attach({ frame }) {
  const chip = windowed(frame, T.chip, T.attachOut, 12, 10);
  const draw = progress(frame, T.line[0], T.line[1]);
  const fadeOut = 1 - progress(frame, T.attachOut, 10);
  const sx = PAGE.x + (PUSH_ORIGIN.x + (SOCK.x - PUSH_ORIGIN.x) * 1.1) * PAGE.w;
  const sy = PAGE.y + (PUSH_ORIGIN.y + (SOCK.y - PUSH_ORIGIN.y) * 1.1) * PAGE.h;
  const start = { x: 410, y: 600 };
  const d = `M${start.x} ${start.y} Q ${330} ${(start.y + sy) / 2} ${sx - 6} ${sy - 18}`;
  const len = 420;
  return <>
    <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0, opacity: fadeOut }} aria-hidden="true">
      <path d={d} fill="none" stroke="rgba(11, 60, 62, 0.45)" strokeWidth="9" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
      <path d={d} fill="none" stroke={C.gold} strokeWidth="5" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
      <circle cx={sx - 6} cy={sy - 18} r={12 * progress(frame, T.line[0] + T.line[1] - 4, 10, easeOut)} fill="none" stroke={C.gold} strokeWidth="4" />
    </svg>
    <div dir="rtl" lang="ar" data-kit-essential="answer-chip" style={{
      position: 'absolute', left: 256, top: 540, padding: '6px 20px 10px', borderRadius: 999,
      background: C.cream, border: `2px solid ${C.gold}`, color: C.teal, fontSize: 28, fontWeight: 700,
      opacity: chip * fadeOut, transform: `scale(${0.9 + 0.1 * chip})`, transformOrigin: 'left top',
      boxShadow: '0 6px 16px rgba(15, 79, 81, 0.2)', whiteSpace: 'nowrap',
    }}>«بتلبس جرابين بلونين…»</div>
  </>;
}

function Cover({ frame }) {
  const loop = progress(frame, T.loop, 15);
  return <>
    <div style={{
      position: 'absolute', left: PAGE.x, top: PAGE.y, width: PAGE.w, height: PAGE.h, borderRadius: PAGE.r,
      background: C.teal, boxShadow: '0 14px 32px rgba(15, 79, 81, 0.25)', overflow: 'hidden', opacity: 1 - loop * 0.06,
    }}>
      <Img src={staticFile('r26/cover.jpg')} style={{ position: 'absolute', inset: 22, width: PAGE.w - 44, height: PAGE.h - 44, objectFit: 'contain' }} />
      <div dir="rtl" lang="ar" data-kit-essential="cover-title" style={{
        position: 'absolute', left: 22, right: 22, top: 22, padding: '14px 16px 58px', textAlign: 'center',
        background: 'linear-gradient(rgba(11,60,62,0.92), rgba(11,60,62,0.78) 60%, rgba(11,60,62,0))',
        color: C.cream, fontFamily: 'Cairo', fontSize: 34, fontWeight: 800, lineHeight: 1.6,
      }}>طَبِيبَةُ الْحَيَوَانَاتِ لَيَان<br />وَجَرَابِينُهَا الْمُلَوَّنَةُ</div>
    </div>
    {loop > 0 && <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
      <path d={roundRectD(CARD.x, CARD.y, CARD.w, CARD.h, CARD.r)} fill="none" stroke={C.teal} strokeWidth="3" opacity={loop * 0.35} />
    </svg>}
  </>;
}

export function R26Cover() {
  return <AbsoluteFill style={{ background: '#f3e8d6', fontFamily: 'Cairo', overflow: 'hidden' }}>
    <Backdrop frame={300} />
    <div style={{ position: 'absolute', left: 520, top: 610, width: 360, height: 360, borderRadius: 8, overflow: 'hidden', boxShadow: '0 14px 32px rgba(15,79,81,0.25)', transform: 'rotate(2deg)' }}>
      <Img src={staticFile('r26/page-07.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
    <div dir="rtl" lang="ar" style={{
      position: 'absolute', left: 200, top: 700, width: 380, padding: '22px 26px', borderRadius: 24, background: C.cream,
      border: `3px solid ${C.teal}`, boxShadow: '0 14px 32px rgba(15,79,81,0.22)', transform: 'rotate(-2deg)',
      fontFamily: 'Cairo', color: C.ink, fontSize: 34, fontWeight: 700, lineHeight: 1.55,
    }}>
      <div style={{ fontSize: 24, color: C.teal, fontWeight: 800 }}>{QUIRK_LABEL}</div>
      <div style={{ marginTop: 8 }}>بتلبس جرابين بلونين مختلفين، وبتعطي كل لون اسم</div>
    </div>
    <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
      <path d="M560 860 Q 640 960 690 1000" fill="none" stroke={C.gold} strokeWidth="6" strokeLinecap="round" />
      <circle cx="694" cy="1003" r="11" fill="none" stroke={C.gold} strokeWidth="4" />
    </svg>
    <Mark label="نموذج توضيحي" />
    <div dir="rtl" lang="ar" style={{ position: 'absolute', left: 180, width: 720, top: 420, textAlign: 'center', fontFamily: 'Cairo', fontSize: 80, fontWeight: 800, lineHeight: 1.4, color: C.teal }}>
      جواب واحد…<br /><span style={{ color: C.goldDeep }}>صار صفحة</span>
    </div>
  </AbsoluteFill>;
}
