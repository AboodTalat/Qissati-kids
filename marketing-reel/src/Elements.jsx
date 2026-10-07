import { AbsoluteFill, CanvasImage, Easing, Interactive, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { brand } from './brand';
import { REELS_SAFE_AREA } from './reels-safe-area';

export function Stage({ children, paper = false }) {
  return <AbsoluteFill dir="rtl" lang="ar" style={{ backgroundColor: paper ? brand.cream : brand.teal, color: paper ? brand.teal : brand.cream, fontFamily: 'Cairo', overflow: 'hidden' }}>
    <AbsoluteFill style={{ backgroundImage: paper ? 'radial-gradient(ellipse at 50% 65%, #f7eee0 0%, transparent 65%)' : 'linear-gradient(165deg, #146466 0%, #105658 65%, #093e41 100%)' }} />
    <svg width="1080" height="1920" style={{ position: 'absolute', opacity: paper ? 0.09 : 0.13 }} aria-hidden="true">
      <defs><filter id="paper-grain"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter></defs>
      <rect width="100%" height="100%" filter="url(#paper-grain)" opacity="0.28" />
      <path d="M-160 1690 Q540 1270 1240 1690 M-160 1720 Q540 1300 1240 1720" stroke={paper ? brand.teal : brand.gold} strokeWidth="2" fill="none" />
    </svg>
    <div data-reel-safe-area style={{ position: 'absolute', insetInlineEnd: REELS_SAFE_AREA.x, top: REELS_SAFE_AREA.y, width: REELS_SAFE_AREA.width, height: REELS_SAFE_AREA.height }}>
      {children}
    </div>
  </AbsoluteFill>;
}

export function Masthead({ paper = false }) {
  return <div data-reel-essential="Brand and sample label" style={{ position: 'absolute', insetInline: 0, top: 8, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, color: paper ? brand.teal : brand.cream }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><CanvasImage src={staticFile('brand/logo.png')} style={{ width: 63, height: 60, objectFit: 'contain' }} /><span style={{ fontSize: 44, fontWeight: 800 }}>قصتي</span></div>
    <span aria-hidden="true" style={{ width: 1, height: 30, backgroundColor: paper ? '#14646655' : '#f4b74088' }} />
    <span style={{ fontSize: 32, fontWeight: 500 }}>نموذج توضيحي</span>
  </div>;
}

export function Book({ cover = 'cover.jpg', title = false }) {
  return <div style={{ width: '100%', height: '100%', position: 'relative', borderRadius: 6, boxShadow: '0 6px 0 #e6dac4, 0 11px 0 #cbbd9f, 0 24px 40px #062f3138', overflow: 'hidden', backgroundColor: brand.teal }}>
    <CanvasImage src={staticFile(`story-pdf/${cover}`)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    {title ? <div style={{ position: 'absolute', insetInline: 0, top: 0, padding: '14px 16px 58px', background: 'linear-gradient(#063e41ef, #063e41cf 60%, transparent)', textAlign: 'center', color: brand.cream, fontSize: 34, lineHeight: 1.65, fontWeight: 800 }}>طَبِيبَةُ الْحَيَوَانَاتِ لَيَان<br />وَجَرَابِينُهَا الْمُلَوَّنَةُ</div> : null}
    <div style={{ position: 'absolute', insetInlineEnd: 0, top: 0, bottom: 0, width: 24, background: 'linear-gradient(90deg, transparent, #fdf8f035, #062f3155)' }} />
  </div>;
}

export function Star({ x, y, size = 40, delay = 0 }) {
  const frame = useCurrentFrame();
  return <svg width={size} height={size} viewBox="0 0 40 40" style={{ position: 'absolute', insetInlineStart: x, top: y, opacity: interpolate(frame, [delay, delay + 22], [0, 0.75], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), rotate: interpolate(frame, [0, 132], ['-12deg', '12deg']) }} aria-hidden="true"><path d="M20 0 Q23 17 40 20 Q23 23 20 40 Q17 23 0 20 Q17 17 20 0" fill={brand.gold} /></svg>;
}

export function Caption({ children, paper = false }) {
  const frame = useCurrentFrame();
  return <Interactive.Div name="Supporting copy" data-reel-essential="Supporting copy" style={{ position: 'absolute', insetInline: 0, top: 858, lineHeight: 1.4, textAlign: 'center', fontSize: 44, fontWeight: 500, color: paper ? '#146466' : '#fdf8f0', opacity: interpolate(frame, [20, 38], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), translate: interpolate(frame, [20, 42], ['0px 8px', '0px 0px'], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>{children}</Interactive.Div>;
}
