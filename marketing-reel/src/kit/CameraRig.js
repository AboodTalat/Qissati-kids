import { FPS } from './motion';

// Keyframed camera for 3D (Three.js position/target/fov) and 2.5D (CSS x/y/zoom/
// rotation) scenes alike. A key is `{ frame, ...fields }`, where every field is a
// number or an array of numbers. Keys may set `stop: true` to come to rest there.
//
// Interpolation is a cubic Hermite with time-aware Catmull-Rom tangents: the camera
// flows through intermediate keys without a velocity jump, and eases in and out of
// the first key, the last key and every `stop` key (zero tangent = smoothstep).
// Sampling is a pure function of the frame, so Studio seeks are exact.

const isArr = Array.isArray;
const map2 = (a, b, f) => (isArr(a) ? a.map((v, i) => f(v, b[i])) : f(a, b));

function hermite(p0, p1, m0, m1, t) {
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * m0
    + (-2 * t3 + 3 * t2) * p1 + (t3 - t2) * m1;
}

function tangent(keys, i, field) {
  const k = keys[i];
  if (k.stop || i === 0 || i === keys.length - 1) return map2(k[field], k[field], () => 0);
  const prev = keys[i - 1], next = keys[i + 1];
  const span = next.frame - prev.frame;
  return map2(prev[field], next[field], (a, b) => (b - a) / span);
}

export function sampleRig(keys, frame) {
  const sorted = keys;
  const fields = Object.keys(sorted[0]).filter((f) => f !== 'frame' && f !== 'stop');
  if (frame <= sorted[0].frame) return pick(sorted[0], fields);
  const last = sorted[sorted.length - 1];
  if (frame >= last.frame) return pick(last, fields);
  let i = 0;
  while (sorted[i + 1].frame < frame) i++;
  const a = sorted[i], b = sorted[i + 1];
  const dur = b.frame - a.frame;
  const t = (frame - a.frame) / dur;
  const out = {};
  for (const f of fields) {
    const ma = tangent(sorted, i, f), mb = tangent(sorted, i + 1, f);
    out[f] = isArr(a[f])
      ? a[f].map((v, j) => hermite(v, b[f][j], ma[j] * dur, mb[j] * dur, t))
      : hermite(a[f], b[f], ma * dur, mb * dur, t);
  }
  return out;
}

function pick(k, fields) {
  const out = {};
  for (const f of fields) out[f] = isArr(k[f]) ? [...k[f]] : k[f];
  return out;
}

// Peak speed per field, in units per second, measured across the whole rig.
export function rigPeakSpeeds(keys) {
  const first = keys[0].frame, last = keys[keys.length - 1].frame;
  const peaks = {};
  let prev = sampleRig(keys, first);
  for (let f = first + 1; f <= last; f++) {
    const cur = sampleRig(keys, f);
    for (const k of Object.keys(cur)) {
      const d = isArr(cur[k])
        ? Math.hypot(...cur[k].map((v, j) => v - prev[k][j]))
        : Math.abs(cur[k] - prev[k]);
      peaks[k] = Math.max(peaks[k] ?? 0, d * FPS);
    }
    prev = cur;
  }
  return peaks;
}

const warned = new Set();
// Dev guard for the bible's camera speed caps, e.g. `{ rotY: 25, zoom: 0.06 }`.
// Warns once per rig/field in the Studio console; never throws during a render.
export function checkRig(name, keys, caps) {
  const peaks = rigPeakSpeeds(keys);
  for (const [field, cap] of Object.entries(caps)) {
    const id = `${name}:${field}`;
    if (peaks[field] > cap && !warned.has(id)) {
      warned.add(id);
      globalThis.console.warn(`[kit] ${name}: ${field} peaks at ${peaks[field].toFixed(3)}/s, above the ${cap}/s comfort cap.`);
    }
  }
  return peaks;
}
