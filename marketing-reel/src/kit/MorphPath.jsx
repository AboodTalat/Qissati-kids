import { useMemo } from 'react';
import { getLength, getPointAtLength } from '@remotion/paths';

// Shape morphs (bible §4, M1–M5). Both outlines are resampled to the same number
// of evenly spaced points, and the target's starting point is rotated to the one
// nearest the source's, so a morph slides rather than twisting through itself.
// Author closed paths in the same winding direction.

export function resample(d, points = 160) {
  const length = getLength(d);
  return Array.from({ length: points }, (_, i) => {
    const p = getPointAtLength(d, (i / points) * length);
    return [p.x, p.y];
  });
}

function align(from, to) {
  let best = 0, bestDist = Infinity;
  for (let shift = 0; shift < to.length; shift++) {
    let dist = 0;
    for (let i = 0; i < from.length; i += 8) {
      const a = from[i], b = to[(i + shift) % to.length];
      dist += (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
    }
    if (dist < bestDist) { bestDist = dist; best = shift; }
  }
  return to.map((_, i) => to[(i + best) % to.length]);
}

export function prepareMorph(fromD, toD, points = 160) {
  const from = resample(fromD, points);
  return { from, to: align(from, resample(toD, points)) };
}

export function morphD({ from, to }, t, closed = true) {
  const pts = from.map((a, i) => [a[0] + (to[i][0] - a[0]) * t, a[1] + (to[i][1] - a[1]) * t]);
  return `M${pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('L')}${closed ? 'Z' : ''}`;
}

// Rounded-rectangle outline as a path, starting at the top-right corner and running
// anticlockwise in screen space, so card → page morphs share a start point.
export function roundRectD(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  return `M${x + w - rr} ${y}H${x + rr}Q${x} ${y} ${x} ${y + rr}V${y + h - rr}Q${x} ${y + h} ${x + rr} ${y + h}`
    + `H${x + w - rr}Q${x + w} ${y + h} ${x + w} ${y + h - rr}V${y + rr}Q${x + w} ${y} ${x + w - rr} ${y}Z`;
}

// `t` is the eased morph progress (0 = from, 1 = to). Renders fill/stroke paths,
// or exposes the interpolated outline to a mask via `id`.
export function MorphPath({ from, to, t, points = 160, fill = 'none', stroke, strokeWidth = 0, id, style }) {
  const prepared = useMemo(() => prepareMorph(from, to, points), [from, to, points]);
  const d = morphD(prepared, t);
  return <path id={id} d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" style={style} />;
}
