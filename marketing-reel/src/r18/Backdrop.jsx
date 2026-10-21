import { useCurrentFrame, useVideoConfig } from 'remotion';
import { backdropClock, enter } from './timing';

function Sprig({ x, y, scale = 1, flip = 1, rotation, shade }) {
  return <g transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale * flip} ${scale})`}>
    <path d="M0 75C-5 -70 12 -178 58 -290" fill="none" stroke="#b4c4a0" strokeWidth="2.5" opacity="0.6" />
    {Array.from({ length: 6 }, (_, i) => {
      const side = i % 2 ? -1 : 1;
      const stemY = 10 - i * 46;
      return <g key={i} transform={`translate(${i * 5} ${stemY}) rotate(${side * (48 - i * 2)})`}>
        <path d="M0 0C-36 -33 -42 -80 -5 -115C27 -86 34 -43 0 0Z" fill={i % 2 ? shade : '#79a491'} />
        <path d="M0 -3L-5 -104" fill="none" stroke="#d1d5ae" strokeWidth="1.4" opacity="0.43" />
        <path d="M0 -3L-5 -104C21 -79 27 -45 0 -3Z" fill="#092f32" opacity="0.15" />
      </g>;
    })}
    <path d="M45 -252C27 -285 32 -326 78 -352C93 -305 84 -271 45 -252Z" fill={shade} />
    <path d="M47 -255L74 -339" stroke="#d7d8b6" strokeWidth="1.4" opacity="0.4" />
  </g>;
}

/** A full-bleed paper theatre; all drift is an absolute, seekable frame value. */
export function PaperBackdrop({ stillFrame }) {
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frame = stillFrame ?? currentFrame;
  const clock = backdropClock(frame, stillFrame === undefined ? fps : 30);
  const drift = Math.sin(clock * 0.19) * 24;
  const breathe = Math.sin(clock * 0.27) * 0.5 + 0.5;
  const unfurl = enter(clock, 0, 1.6);
  const lanternLight = enter(clock, 3.6, 1.7);
  const lightX = 460 + Math.sin(clock * 0.2) * 86;
  return <svg data-r18-backdrop width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true">
    <defs>
      <linearGradient id="r18-theatre-ground" x1="0" y1="0" x2="0.8" y2="1"><stop stopColor="#0a343c" /><stop offset="0.5" stopColor="#1b5b5d" /><stop offset="1" stopColor="#0a3339" /></linearGradient>
      <linearGradient id="r18-arch-edge" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#1a5157" /><stop offset="0.4" stopColor="#528a7f" /><stop offset="0.7" stopColor="#316e6b" /><stop offset="1" stopColor="#113f46" /></linearGradient>
      <linearGradient id="r18-arch-core" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#103f48" /><stop offset="0.5" stopColor="#205c5e" /><stop offset="1" stopColor="#124449" /></linearGradient>
      <radialGradient id="r18-stage-light"><stop stopColor="#dbdbb3" stopOpacity={0.18 + breathe * 0.04} /><stop offset="0.57" stopColor="#8ab9a2" stopOpacity="0.05" /><stop offset="1" stopColor="#2c7670" stopOpacity="0" /></radialGradient>
      <linearGradient id="r18-fold-floor" x1="0" y1="0" x2="0.7" y2="1"><stop stopColor="#326f6c" /><stop offset="0.6" stopColor="#225c5d" /><stop offset="1" stopColor="#113d44" /></linearGradient>
      <linearGradient id="r18-window-light" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f0dfaf" stopOpacity="0.14" /><stop offset="0.7" stopColor="#b9c7a2" stopOpacity="0.035" /><stop offset="1" stopColor="#a9c7b5" stopOpacity="0" /></linearGradient>
      <filter id="r18-cut-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="10" floodColor="#06292f" floodOpacity="0.28" /></filter>
    </defs>
    <rect width="1080" height="1920" fill="url(#r18-theatre-ground)" />
    <g transform={`translate(${drift * 0.18} 0)`} filter="url(#r18-cut-shadow)">
      <path d="M40 1670V465C40 196 264 44 540 44C816 44 1040 196 1040 465V1670Z" fill="url(#r18-arch-edge)" />
      <path d="M88 1670V470C88 227 289 98 540 98C791 98 992 227 992 470V1670Z" fill="#235a5d" />
      <path d="M129 1670V474C129 260 313 150 540 150C767 150 951 260 951 474V1670Z" fill="url(#r18-arch-core)" />
      <path d="M112 1670V474C112 246 304 131 540 131C776 131 968 246 968 474V1670" fill="none" stroke="#bdd0af" strokeWidth="2" opacity="0.28" />
      <path d="M135 1655V474C135 271 316 160 540 160C764 160 945 271 945 474V1655" fill="none" stroke="#d6b576" strokeWidth="1.4" opacity="0.47" />
      <path d="M55 1660V465C55 207 268 59 540 59C812 59 1025 207 1025 465V1660" fill="none" stroke="#d1d7b2" strokeWidth="1.2" opacity="0.2" />
    </g>
    <path d={`M${lightX - 150} 179L${lightX + 54} 163L${lightX + 365} 1600L${lightX - 410} 1600Z`} fill="url(#r18-window-light)" opacity={0.65 + breathe * 0.2} />
    <ellipse cx={540 + drift} cy="895" rx="650" ry="720" fill="url(#r18-stage-light)" />
    {/* The lower folds fill the otherwise empty frame without crossing copy. */}
    <g transform={`translate(0 ${Math.sin(clock * 0.17) * 18 + (1 - unfurl) * 38})`}>
      <path d="M-80 1328C129 1167 286 1265 454 1317C668 1384 882 1159 1150 1290L1150 1990H-80Z" fill="#397b74" filter="url(#r18-cut-shadow)" />
      <path d="M-80 1330C129 1169 286 1267 454 1319C668 1386 882 1161 1150 1292" fill="none" stroke="#94b49c" strokeWidth="3" opacity="0.55" />
      <path d="M-80 1440C149 1278 365 1421 551 1440C778 1464 927 1277 1150 1392L1150 1990H-80Z" fill="url(#r18-fold-floor)" filter="url(#r18-cut-shadow)" />
      <path d="M-80 1443C149 1281 365 1424 551 1443C778 1467 927 1280 1150 1395" fill="none" stroke="#d6b576" strokeWidth="1.5" opacity="0.48" />
    </g>
    <g transform={`translate(${drift * -0.9} ${Math.sin(clock * 0.16) * 24 + (1 - unfurl) * 62})`}>
      <path d="M-80 1582C139 1428 337 1579 532 1592C738 1606 956 1410 1150 1514L1150 1990H-80Z" fill="#b7c6a4" opacity="0.65" filter="url(#r18-cut-shadow)" />
      <path d="M-80 1604C139 1450 337 1601 532 1614C738 1628 956 1432 1150 1536L1150 1990H-80Z" fill="#548b78" />
      <path d="M-80 1696C175 1533 357 1709 586 1718C818 1727 952 1538 1150 1674L1150 1990H-80Z" fill="#24575a" filter="url(#r18-cut-shadow)" />
      <path d="M-80 1698C175 1535 357 1711 586 1720C818 1729 952 1540 1150 1676" fill="none" stroke="#93b4a0" strokeWidth="2" opacity="0.62" />
    </g>
    <Sprig x={67 + drift * 0.8} y={1290} scale={1.06} rotation={-10 + Math.sin(clock * 0.35) * 5.8} shade="#a4bea3" />
    <Sprig x={1032 - drift * 0.65} y={1370} scale={1.02} flip={-1} rotation={7 + Math.sin(clock * 0.31 + 0.7) * 6} shade="#96b799" />
    <Sprig x={28 - drift} y={1770} scale={1.35} rotation={13 + Math.sin(clock * 0.23) * 5.2} shade="#7caa91" />
    <Sprig x={1090 + drift * 0.6} y={1870} scale={1.46} flip={-1} rotation={-12 + Math.sin(clock * 0.27 + 1) * 4.8} shade="#abc4a4" />
    {Array.from({ length: 19 }, (_, i) => {
      const side = i % 2;
      const x = i < 10 ? (side ? 975 : 100) + Math.sin(i * 2.4) * 40 : 160 + ((i * 173) % 760);
      const y = i < 10 ? 530 + (i % 5) * 183 : 1355 + ((i * 97) % 350);
      const size = 3 + (i % 4) * 1.3;
      const floatX = Math.sin(clock * 0.28 + i * 2) * (9 + i % 4);
      const floatY = Math.cos(clock * 0.23 + i * 1.7) * 15;
      return <g key={i} transform={`translate(${x + floatX} ${y + floatY}) rotate(${i * 39 + Math.sin(clock * 0.26 + i) * 25})`} opacity={(i % 3 ? 0.27 : 0.45) * (0.68 + lanternLight * 0.32)}>
        <path d={`M0 ${-size}L${size * 0.75} 0L0 ${size}L${-size * 0.75} 0Z`} fill={i % 3 ? '#d8d9b6' : '#d6b576'} />
        <path d={`M0 ${-size}V${size}`} stroke="#f7ead1" strokeWidth="0.5" opacity="0.5" />
      </g>;
    })}
    {/* Fine scored-paper curves tie the foreground to the branching motif. */}
    <g fill="none" stroke="#d6b576" strokeWidth="1" opacity="0.17" transform={`translate(${drift * 0.45} 0)`}>
      <path d="M-40 1850C160 1620 260 1584 467 1615" /><path d="M1120 1800C930 1580 783 1534 650 1565" />
      <path d="M-40 1880C160 1650 260 1614 467 1645" /><path d="M1120 1830C930 1610 783 1564 650 1595" />
    </g>
  </svg>;
}
