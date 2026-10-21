import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { enter, palette, tickSeconds } from './timing';

export function ListeningBackdrop({ stillFrame }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clockFps = stillFrame === undefined ? fps : 30;
  const time = (stillFrame ?? frame) / clockFps;
  const reset = enter(time, 18, 1 - 1 / clockFps);
  const windowLight = enter(time, 2.7, 1.5) * (1 - enter(time, 16, 2));
  const corridor = enter(time, 6, 2) * (1 - reset);
  const beamShift = Math.sin(time * 0.19) * 10 * (1 - reset);
  const soundLight = tickSeconds.reduce((sum, at) => sum + (time < at ? 0 : Math.exp(-(time - at) * 3.6)), 0);
  const veil = Math.sin(time * 0.15) * 5 * (1 - reset);
  return <AbsoluteFill style={{ background: palette.deep, pointerEvents: 'none' }}>
    <svg viewBox="0 0 1080 1920" width="1080" height="1920" aria-hidden="true">
      <defs>
        <linearGradient id="r19-night" x1="0" y1="0" x2="0.5" y2="1">
          <stop stopColor="#031b1e" /><stop offset="0.44" stopColor="#133f40" /><stop offset="0.72" stopColor="#092e31" /><stop offset="1" stopColor="#031c20" />
        </linearGradient>
        <linearGradient id="r19-beam" x1="0" y1="0" x2="0.6" y2="1">
          <stop stopColor={palette.cream} stopOpacity="0.22" /><stop offset="0.46" stopColor="#e7d6af" stopOpacity="0.075" /><stop offset="1" stopColor={palette.gold} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="r19-stage-light">
          <stop stopColor="#458781" stopOpacity="0.22" /><stop offset="0.6" stopColor="#2c6764" stopOpacity="0.08" /><stop offset="1" stopColor="#146466" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="r19-edge-shade"><stop offset="0.32" stopColor="#03191c" stopOpacity="0" /><stop offset="1" stopColor="#03191c" stopOpacity="0.76" /></radialGradient>
        <linearGradient id="r19-left-fold"><stop stopColor="#03181b" /><stop offset="0.72" stopColor="#0e3b3d" /><stop offset="1" stopColor="#164749" /></linearGradient>
        <linearGradient id="r19-right-fold"><stop stopColor="#1c4c4c" /><stop offset="0.18" stopColor="#10383b" /><stop offset="1" stopColor="#03191c" /></linearGradient>
        <radialGradient id="r19-wave-light"><stop stopColor="#d6b576" stopOpacity="0.07" /><stop offset="1" stopColor="#d6b576" stopOpacity="0" /></radialGradient>
        <filter id="r19-grain"><feTurbulence type="fractalNoise" baseFrequency="0.56" numOctaves="3" seed="19" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      </defs>
      <rect width="1080" height="1920" fill="url(#r19-night)" />
      <ellipse cx="540" cy="852" rx="600" ry="570" fill="url(#r19-stage-light)" />
      <ellipse cx="540" cy="920" rx="390" ry="230" fill="url(#r19-wave-light)" opacity={soundLight} />
      <g opacity={windowLight * 0.4} style={{ translate: `${beamShift}px 0` }}>
        <path d="M148 600L502 600L879 1500L519 1500Z" fill="url(#r19-beam)" />
        <path d="M322 600L334 600L705 1500L693 1500Z" fill="#061f22" opacity="0.42" />
      </g>
      {/* Broad, quiet folded scenery replaces the enclosing rectangle. It
          leaves the small sculpted story-world as the only outlined subject. */}
      <g opacity="0.58" style={{ translate: `${veil}px 0` }}>
        <path d="M0 0H111Q174 467 109 866Q51 1258 136 1920H0Z" fill="url(#r19-left-fold)" />
        <path d="M1080 0H995Q899 482 971 904Q1033 1370 946 1920H1080Z" fill="url(#r19-right-fold)" />
      </g>
      <g opacity={0.055 + corridor * 0.025} stroke={palette.gold} fill="none" strokeWidth="0.8">
        <path d="M-88 1387Q477 1250 1176 1548" />
        <path d="M-106 1680Q407 1482 1180 1756" />
      </g>
      <rect width="1080" height="1920" fill="url(#r19-edge-shade)" />
      <rect width="1080" height="1920" filter="url(#r19-grain)" opacity="0.024" />
    </svg>
  </AbsoluteFill>;
}
