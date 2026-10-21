import { AbsoluteFill, interpolateColors } from 'remotion';
import { CREAM, INK } from './Scene';
import { enter, mix } from './timing';

// An original architectural set, rather than a raster background. The light
// drifts by a few pixels with the authored orbit and returns on the last frame.
// Every value is derived from the requested frame, including backwards seeks.
export function MuseumBackdrop({ frame, contentScale = 1 }) {
  const daylight = enter(frame, 0, 30);
  const end = enter(frame, 548, 40);
  const drift = Math.sin(Math.min(frame, 600) / 600 * Math.PI) * 14;
  const wall = interpolateColors(daylight, [0, 1], ['#082e31', '#245b59']);
  const paper = interpolateColors(daylight, [0, 1], ['#103d40', CREAM]);
  const shade = interpolateColors(daylight, [0, 1], ['#0b3033', '#e6d8c1']);
  const overscan = contentScale < 1;
  // The wider floor continues beyond the viewport after the architecture is
  // pulled back. Its curve matches the original horizon inside 0–1080.
  const horizon = overscan ? 'M-360 1608Q540 1352 1440 1608' : 'M0 1526Q540 1434 1080 1526';
  return <AbsoluteFill name="Museum architecture · cream alcove · brass · window light" style={{ pointerEvents: 'none', backgroundColor: wall }}>
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" aria-hidden="true">
      <defs>
        <linearGradient id="r15-wall" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#082e31" /><stop offset="0.45" stopColor={wall} /><stop offset="1" stopColor="#143f40" />
        </linearGradient>
        <linearGradient id="r15-alcove" x1="0" y1="0" x2="0.94" y2="0.7">
          <stop stopColor={shade} /><stop offset="0.3" stopColor={paper} /><stop offset="0.7" stopColor={paper} /><stop offset="1" stopColor={shade} />
        </linearGradient>
        <linearGradient id="r15-floor" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={paper} /><stop offset="1" stopColor={shade} />
        </linearGradient>
        <linearGradient id="r15-brass" x1="0" y1="1" x2="1" y2="0">
          <stop stopColor="#927445" /><stop offset="0.46" stopColor="#d9bc80" /><stop offset="0.7" stopColor="#f0dba8" /><stop offset="1" stopColor="#a7834a" />
        </linearGradient>
        <linearGradient id="r15-daylight" x1="0.9" y1="0" x2="0.3" y2="1">
          <stop stopColor="#fff9e6" stopOpacity="0.48" /><stop offset="0.7" stopColor="#fffdf5" stopOpacity="0.08" /><stop offset="1" stopColor="#fffdf5" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="r15-reading-light" cx="50%" cy="34%" r="65%">
          <stop stopColor={paper} stopOpacity="0.8" /><stop offset="1" stopColor={paper} stopOpacity="0" />
        </radialGradient>
        <filter id="r15-edge-softness" x="-20%" y="-10%" width="140%" height="120%"><feGaussianBlur stdDeviation="14" /></filter>
        <filter id="r15-light-softness" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="24" /></filter>
        <clipPath id="r15-niche"><path d="M130 1634V544C130 317 313 134 540 134S950 317 950 544V1634Z" /></clipPath>
      </defs>
      <rect width="1080" height="1920" fill="url(#r15-wall)" />
      <g transform={`translate(${540 * (1 - contentScale)} ${960 * (1 - contentScale)}) scale(${contentScale})`}>
      {/* Recessed plaster behind a thin, bevelled brass reveal. */}
      <path d="M106 1660V543C106 303 300 109 540 109S974 303 974 543V1660Z" fill="#092f32" opacity={mix(0.52, 0.2, daylight)} filter="url(#r15-edge-softness)" />
      <path d="M116 1646V544C116 310 306 120 540 120S964 310 964 544V1646" fill="none" stroke="url(#r15-brass)" strokeWidth="3" opacity={mix(0.3, 0.66, daylight)} />
      <path d="M130 1634V544C130 317 313 134 540 134S950 317 950 544V1634Z" fill="url(#r15-alcove)" />
      <g clipPath="url(#r15-niche)">
        <path d="M149 1634V544C149 328 324 153 540 153S931 328 931 544V1634" fill="none" stroke={INK} strokeWidth="12" opacity="0.065" filter="url(#r15-edge-softness)" />
        <g style={{ translate: `${drift}px 0` }} opacity={daylight * mix(0.7, 0.36, end)} filter="url(#r15-light-softness)">
          <path d="M756 -80H1065L578 1460H187Z" fill="url(#r15-daylight)" />
          <path d="M887 -80H936L421 1380H371Z" fill="#c4ac83" opacity="0.12" />
          <path d="M653 299L966 344L876 571L571 518Z" fill="#c4ac83" opacity="0.065" />
        </g>
        <rect x="155" y="260" width="770" height="1050" fill="url(#r15-reading-light)" opacity={daylight * end * 0.75} />
      </g>
      {/* Floor stays below the copy/CTA, with restrained perspective seams. */}
      <path d={`${horizon}${overscan ? 'V2400H-360Z' : 'V1920H0Z'}`} fill="url(#r15-floor)" />
      <path d={horizon} fill="none" stroke="#b5a385" strokeWidth="1.5" opacity={daylight * 0.25} />
      <path d={overscan ? 'M392 1484L5 2400M690 1484L1102 2400M-360 1774Q540 1612 1440 1774' : 'M392 1484L208 1920M690 1484L886 1920M0 1722Q540 1664 1080 1722'} fill="none" stroke="#a39175" strokeWidth="1.2" opacity={daylight * mix(0.12, 0.055, end)} />
      {/* Vertical fluting belongs to the outer wall, away from Arabic. */}
      <path d="M28 0V1519M48 0V1517M1032 0V1517M1052 0V1519" stroke="#c2d0b7" strokeWidth="1" opacity="0.1" />
      </g>
    </svg>
  </AbsoluteFill>;
}
