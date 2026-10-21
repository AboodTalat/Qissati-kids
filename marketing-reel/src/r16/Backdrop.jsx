import { AbsoluteFill } from 'remotion';
import { enter, mix } from './timing';
import { palette } from './art';

export function Backdrop({ frame, contentScale = 1 }) {
  const magic = enter(frame, 150, 120);
  const end = enter(frame, 420, 60);
  return <AbsoluteFill style={{ backgroundColor: palette.cream }}>
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="r16-ground" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#eee2cd" /><stop offset=".55" stopColor="#fdf8f0" /><stop offset="1" stopColor="#d8e4d9" /></linearGradient>
        <radialGradient id="r16-light"><stop stopColor="#fff5d4" stopOpacity=".75" /><stop offset="1" stopColor="#fff5d4" stopOpacity="0" /></radialGradient>
        <filter id="r16-paper"><feTurbulence type="fractalNoise" baseFrequency=".63" numOctaves="3" seed="16" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      </defs>
      <rect width="1080" height="1920" fill="url(#r16-ground)" />
      <ellipse cx={mix(250, 660, magic)} cy="850" rx="590" ry="740" fill="url(#r16-light)" opacity={0.45 + magic * 0.3} />
      {/* Full-bleed paper contours evoke a hillside without mapping a place. */}
      <g opacity={0.24 * (1 - end * 0.6)}>
        <path d="M-180 1420Q170 1060 500 1240T1230 1170L1230 1920H-180Z" fill="#9cb7a8" />
        <path d="M-120 1500Q130 1290 520 1420T1200 1330L1200 1920H-120Z" fill="#6d9b8e" />
        <path d="M-90 1660Q380 1450 770 1570T1210 1490L1210 1920H-90Z" fill="#146466" />
      </g>
      <g transform={`translate(540 960) scale(${contentScale}) translate(-540 -960)`}>
        <path d="M88 253H992M88 1280H992" stroke="#c69b56" strokeWidth="2" opacity=".24" />
        <path d="M89 255V279M991 255V279M89 1254V1278M991 1254V1278" stroke="#c69b56" strokeWidth="2" opacity=".3" />
      </g>
      <rect width="1080" height="1920" filter="url(#r16-paper)" opacity=".047" style={{ mixBlendMode: 'multiply' }} />
    </svg>
  </AbsoluteFill>;
}
