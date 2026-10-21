import { useCurrentFrame, useVideoConfig } from 'remotion';
import { enter, palette as C } from './timing';

export function R22Backdrop({ stillFrame }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (stillFrame ?? frame) / (stillFrame === undefined ? fps : 30);
  const sweep = t * 1.4;
  return <svg width="1080" height="1920" viewBox="0 0 1080 1920" aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
    <defs>
      <radialGradient id="r22-night" cx="48%" cy="43%" r="66%"><stop stopColor="#1d6866" /><stop offset=".52" stopColor={C.night} /><stop offset="1" stopColor="#031b20" /></radialGradient>
      <linearGradient id="r22-fold" x1="0" x2="1"><stop stopColor="#092f33" /><stop offset=".48" stopColor="#174b4b" /><stop offset=".51" stopColor="#0a3034" /><stop offset="1" stopColor="#061f26" /></linearGradient>
      <radialGradient id="r22-spot"><stop stopColor="#e9d08a" stopOpacity=".15" /><stop offset="1" stopColor="#e9d08a" stopOpacity="0" /></radialGradient>
      <filter id="r22-grain"><feTurbulence type="fractalNoise" baseFrequency=".77" numOctaves="3" seed="22" /><feColorMatrix type="saturate" values="0" /><feComponentTransfer><feFuncA type="linear" slope=".055" /></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light" /></filter>
    </defs>
    <rect width="1080" height="1920" fill="url(#r22-night)" />
    <path d="M-130 -40L117 0L201 1920L-30 1990Z" fill="url(#r22-fold)" opacity=".86" />
    <path d="M1200 -60L960 0L882 1920L1140 1990Z" fill="url(#r22-fold)" opacity=".85" />
    <path d="M-50 0L192 0L218 1920L133 1920Z" fill="#d2b66e" opacity=".025" />
    <path d="M1120 0L965 0L868 1920L987 1920Z" fill="#c4d2b0" opacity=".025" />
    <ellipse cx="535" cy="960" rx="540" ry="670" fill="url(#r22-spot)" />
    <g fill="none" stroke={C.gold} strokeWidth="1" opacity=".22" transform={`rotate(${sweep} 540 890)`}>
      <ellipse cx="540" cy="890" rx="635" ry="720" transform="rotate(-24 540 890)" />
      <ellipse cx="540" cy="890" rx="665" ry="745" transform="rotate(-24 540 890)" />
      <ellipse cx="540" cy="890" rx="585" ry="795" transform="rotate(39 540 890)" />
      <path d="M-130 1350Q520 1650 1230 970M-120 315Q550 48 1180 490" />
    </g>
    {Array.from({ length: 36 }, (_, i) => {
      const x = ((i * 247 + 43) % 1040) + 20;
      const y = ((i * 389 + 31) % 1870) + 20;
      const alpha = .13 + (Math.sin(t * .52 + i * 1.7) + 1) * .105;
      return <g key={i} transform={`translate(${x + Math.sin(t * .16 + i) * 4} ${y + Math.cos(t * .2 + i) * 5})`} opacity={alpha}>
        <path d="M-3 0H3M0 -3V3" stroke={i % 3 ? C.cream : C.gold} strokeWidth="1" />
      </g>;
    })}
    <path d="M-100 1425Q540 1190 1180 1445V1960H-100Z" fill="#0c3739" opacity=".8" />
    <path d="M-80 1540Q560 1250 1160 1535" fill="none" stroke="#325e55" strokeWidth="1.5" opacity=".5" />
    <g opacity={.15 + enter(t, 4.1, 2) * .1} transform={`translate(${Math.sin(t * .15) * 12} 0)`}><path d="M-50 1400L200 1720L510 1430L780 1830L1160 1370" fill="none" stroke="#65816b" strokeWidth=".8" /></g>
    <rect width="1080" height="1920" fill="transparent" filter="url(#r22-grain)" opacity=".7" />
  </svg>;
}
