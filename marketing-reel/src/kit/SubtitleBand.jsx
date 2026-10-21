import { Fragment } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from './tokens';
import { clamp } from './motion';

// Narration subtitles (bible §8) from a captions.json array:
// [{ text, startMs, endMs, pageBreakAfter? }]. Words are grouped into pages at each
// `pageBreakAfter`. One line, cream plate, teal text; words not yet spoken sit at 88% (still ≥ 4.5:1),
// the word being spoken carries a 3 px gold underline. No colour flashing, no pops.
//
// `hidden` lists page indexes to skip (the no-duplicate rule: a page whose words are
// already the on-screen headline). Captions must be measured against the final WAV
// before delivery — planned cadences are for layout previews only.

export function captionPages(captions) {
  const pages = [];
  let current = [];
  captions.forEach((c, i) => {
    current.push(c);
    if (c.pageBreakAfter || i === captions.length - 1) { pages.push(current); current = []; }
  });
  return pages.map((words, i) => ({ index: i, words, start: words[0].startMs, end: words[words.length - 1].endMs }));
}

export function SubtitleBand({ captions, hidden = [], top = 1070, offsetMs = 0, size = 46 }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * 1000 - offsetMs;
  const pages = captionPages(captions);
  const page = pages.find((p, i) => {
    const next = pages[i + 1];
    const until = Math.min(Math.max(p.end + 400, p.start + 800), next ? next.start : Infinity);
    return t >= p.start - 80 && t < until;
  });
  if (!page || hidden.includes(page.index)) return null;
  const fade = clamp((t - (page.start - 80)) / 200);

  return <div data-kit-essential="subtitles" dir="rtl" lang="ar" style={{
    position: 'absolute', left: 180, width: 720, top, display: 'flex', justifyContent: 'center', opacity: fade,
  }}>
    <div style={{
      maxWidth: 720, padding: '10px 26px 14px', borderRadius: 18, background: 'rgba(253, 248, 240, 0.92)',
      boxShadow: '0 6px 18px rgba(15, 79, 81, 0.16)', fontFamily: 'Cairo', fontSize: size, fontWeight: 700,
      lineHeight: 1.5, color: C.teal, whiteSpace: 'nowrap', textAlign: 'center',
    }}>
      {page.words.map((w, i) => {
        const spoken = t >= w.startMs;
        const active = t >= w.startMs && t < w.endMs;
        return <Fragment key={i}>
          <span style={{
            display: 'inline-block', opacity: spoken ? 1 : 0.88,
            boxShadow: active ? `inset 0 -3px 0 ${C.gold}` : 'none',
          }}>{w.text.trim()}</span>
          {i < page.words.length - 1 ? ' ' : ''}
        </Fragment>;
      })}
    </div>
  </div>;
}
