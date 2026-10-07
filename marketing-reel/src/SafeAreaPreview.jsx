import { AbsoluteFill } from 'remotion';
import { REELS_SAFE_AREA as safe } from './reels-safe-area';

// Inspection composition only. Never baked into either delivery composition.
export function SafeAreaPreview() {
  return <AbsoluteFill style={{ pointerEvents: 'none', fontFamily: 'Cairo', direction: 'ltr' }}>
    <svg width="1080" height="1920" style={{ position: 'absolute' }}>
      <defs><pattern id="unsafe-hatch" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="22" height="22" fill="#b84c6e29" /><path d="M0 0V22" stroke="#b84c6e88" strokeWidth="3" /></pattern></defs>
      <path d={`M0 0H1080V1920H0Z M${safe.x} ${safe.y}V${safe.bottom}H${safe.right}V${safe.y}Z`} fill="url(#unsafe-hatch)" fillRule="evenodd" />
      <rect x={safe.x} y={safe.y} width={safe.width} height={safe.height} fill="none" stroke="#f4b740" strokeWidth="3" strokeDasharray="12 8" />
      <path d="M0 285H1080 M0 1635H1080" stroke="#fdf8f0" strokeWidth="2" strokeDasharray="4 12" />
    </svg>
    <div style={{ position: 'absolute', top: 146, left: 90, right: 90, fontSize: 38, color: '#fdf8f0', backgroundColor: '#292522e8', padding: '10px 22px', textAlign: 'center' }}>SAFE-AREA CHECK · PREVIEW ONLY</div>
    <div style={{ position: 'absolute', top: 1330, left: safe.x, right: safe.x, padding: 28, color: '#fdf8f0', backgroundColor: '#292522ed', fontSize: 32, lineHeight: 1.7, textAlign: 'center' }}>
      Reserved for captions, account name and buttons<br />
      Protected content: x {safe.x}–{safe.right} / y {safe.y}–{safe.bottom}<br />
      Dashed white lines: centred 4:5 feed crop
    </div>
  </AbsoluteFill>;
}
