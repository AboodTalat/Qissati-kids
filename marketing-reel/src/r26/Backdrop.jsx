import { AbsoluteFill } from 'remotion';
import { C, clamp, progress } from '../kit';

// R26 backdrop: a writing desk in late-afternoon window light, seen from above.
// Every light has a source (bible §2): one warm shaft from a window off-frame top
// right, crossed by the soft shadow of its frame and dappled by a plant on the sill.
// Paper-craft props sit OUTSIDE the safe rectangle (x 180–900, y 300–1230) so they
// add depth without competing with the copy. Three parallax depths follow the
// camera: light (0.4), desk props (1), foreground book (1.5). All motion is slow
// drift or sway — no flicker, no twinkle — and the light warms only slightly when
// the page appears.

const PAPER = '#f3e8d6';
const SHADE = '#13484a';
const LEAF = 'M0 0 C 20 -11 50 -9 78 0 C 50 9 20 11 0 0 Z';

export function Backdrop({ frame, cam = { zoom: 1 } }) {
  const t = frame / 30;
  const z = (k) => 1 + (cam.zoom - 1) * k;
  const warm = progress(frame, 244, 60); // page reveal: the light warms a touch
  const origin = '540px 820px';

  return <AbsoluteFill style={{ background: PAPER, overflow: 'hidden' }}>
    {/* Paper fibre: static, very faint. */}
    <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0, opacity: 0.06 }} aria-hidden="true">
      <filter id="r26-fibre"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.35" numOctaves="2" seed="7" /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="1080" height="1920" filter="url(#r26-fibre)" />
    </svg>

    {/* Window light: a broad diagonal shaft with soft edges, drifting a few px. */}
    <AbsoluteFill style={{ transform: `translateX(${Math.sin(t / 3.2) * 10}px) scale(${z(0.4)})`, transformOrigin: origin }}>
      <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        <defs>
          <linearGradient id="r26-shaft" x1="1" y1="0" x2="0.2" y2="1">
            <stop offset="0" stopColor="#fffaf0" stopOpacity="0.95" />
            <stop offset="0.55" stopColor="#fff6e6" stopOpacity="0.75" />
            <stop offset="1" stopColor="#fff6e6" stopOpacity="0" />
          </linearGradient>
          <filter id="r26-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="46" /></filter>
          <filter id="r26-softer" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="22" /></filter>
        </defs>
        <polygon points="760,-200 1400,-200 640,2100 -60,2100" fill="url(#r26-shaft)" filter="url(#r26-soft)" opacity={0.7 + warm * 0.12} />
        {/* The window frame's cross, as two soft darker bars inside the shaft. */}
        <g filter="url(#r26-softer)" fill="#7a5a2c" opacity="0.06">
          <polygon points="1010,-200 1060,-200 420,2100 370,2100" />
          <polygon points="-100,700 1180,520 1180,560 -100,740" />
        </g>
      </svg>
    </AbsoluteFill>

    {/* Leaf shadows from a plant on the sill: real leaf shapes, blurred, swaying. */}
    <AbsoluteFill style={{ transform: `scale(${z(0.6)})`, transformOrigin: origin, opacity: 0.11 }}>
      <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0, filter: 'blur(9px)' }} aria-hidden="true">
        <LeafSpray x={1010} y={150} angle={150} sway={Math.sin(t / 1.9) * 2.2} scale={2.1} fill={SHADE} />
        <LeafSpray x={1100} y={560} angle={185} sway={Math.sin(t / 2.3 + 1) * 1.8} scale={1.7} fill={SHADE} />
        <LeafSpray x={-30} y={1380} angle={-20} sway={Math.sin(t / 2.1 + 2) * 1.6} scale={1.8} fill={SHADE} />
      </svg>
    </AbsoluteFill>

    {/* Dust motes in the shaft: few, slow, steady (no twinkle). */}
    <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
      {MOTES.map(([x, y, r, s], i) => <circle key={i} cx={x + t * 5 * s} cy={y - t * 9 * s} r={r} fill="#fffdf6"
        opacity={0.5 * clamp(t / 1.5) * clamp((20 - t) / 1.5)} />)}
    </svg>

    {/* Desk props, outside the safe rectangle. */}
    <AbsoluteFill style={{ transform: `translate(${Math.sin(t / 6) * 2}px, 0) scale(${z(1)})`, transformOrigin: origin }}>
      <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        <defs>
          <filter id="r26-prop" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="6" dy="12" stdDeviation="10" floodColor="#3d2b14" floodOpacity="0.22" /></filter>
        </defs>
        <OliveSprig x={10} y={292} filter="url(#r26-prop)" sway={Math.sin(t / 2.6) * 1.2} />
        <Pencil x={1000} y={1330} filter="url(#r26-prop)" />
      </svg>
    </AbsoluteFill>
    <AbsoluteFill style={{ transform: `translate(${Math.sin(t / 5) * 3}px, 0) scale(${z(1.5)})`, transformOrigin: origin }}>
      <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0, filter: 'blur(1.5px)' }} aria-hidden="true">
        <defs>
          <filter id="r26-book" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="10" dy="18" stdDeviation="14" floodColor="#3d2b14" floodOpacity="0.28" /></filter>
        </defs>
        <BookCorner x={-90} y={1440} filter="url(#r26-book)" />
      </svg>
    </AbsoluteFill>

    {/* Gentle vignette, ≤ 12%. */}
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 70% at 55% 42%, transparent 55%, rgba(92, 64, 30, 0.11) 100%)' }} />
  </AbsoluteFill>;
}

const MOTES = [[820, 420, 2.5, 1], [700, 760, 2, 0.8], [930, 980, 3, 1.2], [600, 1180, 2, 0.9], [880, 640, 1.8, 1.1],
  [520, 1420, 2.6, 0.7], [760, 1300, 2, 1], [990, 820, 1.6, 0.9], [440, 1620, 2.2, 1.1]];

function LeafSpray({ x, y, angle, sway, scale, fill }) {
  const leaves = [[0, -30], [60, 25], [120, -35], [180, 20], [240, -25], [300, 30], [350, -10]];
  return <g transform={`translate(${x} ${y}) rotate(${angle + sway}) scale(${scale})`}>
    <path d="M0 0 C 120 -10 260 10 380 0" stroke={fill} strokeWidth="5" fill="none" />
    {leaves.map(([d, a], i) => <path key={i} d={LEAF} fill={fill} transform={`translate(${d} 0) rotate(${a}) scale(${1 - i * 0.05})`} />)}
  </g>;
}

function OliveSprig({ x, y, filter, sway }) {
  const leaves = [[20, -38, '#5d7b58'], [55, 34, '#4c6b51'], [95, -32, '#678563'], [135, 30, '#557452'], [175, -28, '#5d7b58'], [210, 24, '#4c6b51']];
  return <g transform={`translate(${x} ${y}) rotate(${-30 + sway}) scale(1.55)`} filter={filter}>
    <path d="M-60 0 C 40 -6 140 4 250 -2" stroke="#6b5a3a" strokeWidth="4" fill="none" strokeLinecap="round" />
    {leaves.map(([d, a, c], i) => <g key={i} transform={`translate(${d} 0) rotate(${a})`}>
      <path d={LEAF} fill={c} transform="scale(1.05 0.9)" />
      <path d="M4 0 L 70 0" stroke="#e9e2c8" strokeOpacity="0.35" strokeWidth="1.4" />
    </g>)}
    <circle cx="232" cy="-14" r="11" fill="#3f5a48" />
    <circle cx="228" cy="-18" r="3" fill="#fdf8f0" opacity="0.35" />
  </g>;
}

function Pencil({ x, y, filter }) {
  return <g transform={`translate(${x} ${y}) rotate(152)`} filter={filter}>
    <rect x="0" y="-11" width="300" height="22" rx="3" fill={C.gold} />
    <rect x="0" y="-11" width="300" height="7" fill="#f9cc6a" />
    <rect x="0" y="4" width="300" height="7" fill="#d99a26" />
    <rect x="-22" y="-11" width="24" height="22" fill="#b9c2b4" />
    <rect x="-34" y="-11" width="14" height="22" rx="4" fill={C.berry} />
    <polygon points="300,-11 352,0 300,11" fill="#f1dcb8" />
    <polygon points="338,-3 352,0 338,3" fill={C.ink} />
  </g>;
}

function BookCorner({ x, y, filter }) {
  return <g transform={`translate(${x} ${y}) rotate(-14)`} filter={filter}>
    <rect x="0" y="0" width="420" height="330" rx="10" fill="#0f4f51" />
    <rect x="16" y="12" width="400" height="306" rx="6" fill="#fbf3e4" />
    {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1="20" x2="412" y1={318 - i * 4} y2={318 - i * 4} stroke="#e6d8bf" strokeWidth="1" />)}
    <rect x="0" y="0" width="406" height="304" rx="10" fill={C.teal} />
    <rect x="22" y="22" width="362" height="260" rx="6" fill="none" stroke={C.gold} strokeOpacity="0.55" strokeWidth="2" />
    <path d="M300 300 L300 420 L316 404 L332 420 L332 300 Z" fill={C.gold} />
  </g>;
}
