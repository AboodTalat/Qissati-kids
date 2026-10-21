import { Fragment } from 'react';
import { interpolateColors, useCurrentFrame } from 'remotion';
import { C } from './tokens';
import { clamp, ease, easeOut, minReadFrames, progress } from './motion';

// Arabic kinetic headline (bible §5). Split by WORD only — per-letter spans break
// the joins between Arabic letters. Word separators sit outside each word's
// inline-block (a trailing space inside one is stripped and glues words together).
// No letter-spacing, no uppercase. Text is screen-space: it never rides the camera.
//
// effect: 'rise' (K1, staggered words) or 'wipe' (K2, mask moving right→left).
// emphasis (K3): [{ word, at, mode: 'scale' | 'gold' }] — `word` is a global index.
// underline (K5): { from, to, at } — a gold stroke drawn right→left under words from..to.
// `out` blurs the whole headline away (K4 swap = one headline's out + the next one's at).

const warned = new Set();

export function KineticHeadline({
  text, at = 0, out, size = 76, weight = 800, color = C.teal, lineHeight = 1.45,
  effect = 'rise', stagger = 4, emphasis = [], underline, top, style, name = 'headline',
}) {
  const frame = useCurrentFrame();
  const lines = text.split('\n').map((l) => l.split(' ').filter(Boolean));
  const total = lines.flat().length;

  if (out !== undefined) {
    const settled = at + (effect === 'rise' ? (total - 1) * stagger + 11 : 16);
    const id = `${name}:${text}`;
    if (out - settled < minReadFrames(text) && !warned.has(id)) {
      warned.add(id);
      globalThis.console.warn(`[kit] "${text}" is fully visible for ${out - settled} frames; the reading rule asks for ${minReadFrames(text)}.`);
    }
  }

  const exit = out === undefined ? 0 : progress(frame, out - 8, 8, ease);
  if (exit >= 1 || frame < at - 1) return null;

  let index = 0;
  return <div data-kit-essential={name} dir="rtl" lang="ar" style={{
    position: 'absolute', left: 180, width: 720, top, textAlign: 'center',
    fontFamily: 'Cairo', fontSize: size, fontWeight: weight, lineHeight, color,
    opacity: 1 - exit, filter: exit > 0 ? `blur(${exit * 6}px)` : undefined, ...style,
  }}>
    {lines.map((words, row) => {
      const lineStart = index;
      const wipe = effect === 'wipe' ? progress(frame, at + row * 6, 16, ease) : 1;
      const mask = effect === 'wipe' && wipe < 1
        ? `linear-gradient(to left, #000 ${wipe * 112 - 12}%, transparent ${wipe * 112}%)` : undefined;
      return <div key={row} style={{ whiteSpace: 'nowrap', WebkitMaskImage: mask, maskImage: mask }}>
        {groupUnderline(words, lineStart, underline).map((group, g, groups) => {
          const rendered = group.words.map((word, i) => {
            const idx = group.start + i;
            index = Math.max(index, idx + 1);
            return <Fragment key={idx}>
              <Word word={word} idx={idx} frame={frame} at={at} stagger={stagger} effect={effect} emphasis={emphasis} baseColor={color} />
              {i < group.words.length - 1 ? ' ' : ''}
            </Fragment>;
          });
          const sep = g < groups.length - 1 ? ' ' : '';
          if (!group.underlined) return <Fragment key={g}>{rendered}{sep}</Fragment>;
          const draw = progress(frame, underline.at, 14, ease);
          return <Fragment key={g}>
            <span style={{ display: 'inline-block', position: 'relative' }}>
              {rendered}
              <span aria-hidden="true" style={{
                position: 'absolute', right: 0, left: 0, bottom: size * 0.04, height: 4, borderRadius: 2,
                background: C.gold, transformOrigin: 'right center', transform: `scaleX(${draw})`,
              }} />
            </span>{sep}
          </Fragment>;
        })}
      </div>;
    })}
  </div>;
}

function groupUnderline(words, start, underline) {
  if (!underline) return [{ words, start, underlined: false }];
  const groups = [];
  let current = null;
  words.forEach((w, i) => {
    const idx = start + i;
    const inside = idx >= underline.from && idx <= underline.to;
    if (!current || current.underlined !== inside) {
      current = { words: [], start: idx, underlined: inside };
      groups.push(current);
    }
    current.words.push(w);
  });
  return groups;
}

function Word({ word, idx, frame, at, stagger, effect, emphasis, baseColor }) {
  const p = effect === 'rise' ? progress(frame, at + idx * stagger, 11, easeOut) : 1;
  let scale = 1, color = baseColor;
  for (const e of emphasis) {
    if (e.word !== idx) continue;
    if (e.mode === 'gold') {
      color = interpolateColors(progress(frame, e.at, 10, ease), [0, 1], [baseColor, C.goldDeep]);
    } else {
      const s = clamp((frame - e.at) / 14);
      scale = 1 + 0.06 * Math.sin(Math.PI * s);
    }
  }
  return <span data-kit-word style={{
    display: 'inline-block', opacity: p, color,
    transform: `translateY(${(1 - p) * 14}px) scale(${scale})`,
    filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined,
  }}>{word}</span>;
}
