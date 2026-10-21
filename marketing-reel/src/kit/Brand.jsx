import { Img, staticFile, useCurrentFrame } from 'remotion';
import { C } from './tokens';
import { windowed } from './motion';

// Brand furniture in the bible's bands. The mark is always the full logo plus the
// wordmark (never a cropped mark), and a sample label or series badge sits beside it.

export function Mark({ dark = false, label, badge, top = 318 }) {
  const ink = dark ? C.cream : C.teal;
  return <div data-kit-essential="mark" dir="rtl" lang="ar" style={{
    position: 'absolute', left: 180, width: 720, top, height: 62, display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: 20, fontFamily: 'Cairo', color: ink,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 62, height: 60, padding: dark ? 5 : 0, borderRadius: 10, background: dark ? C.cream : 'transparent' }}>
        <Img src={staticFile('brand/logo.png')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
      <span style={{ fontSize: 42, fontWeight: 800 }}>قصتي</span>
    </div>
    {label || badge ? <span aria-hidden="true" style={{ width: 1.5, height: 30, background: dark ? `${C.gold}99` : `${C.teal}55` }} /> : null}
    {badge ? <SeriesBadge text={badge} dark={dark} /> : null}
    {label ? <span data-kit-essential="sample-label" style={{ fontSize: 32, fontWeight: 600 }}>{label}</span> : null}
  </div>;
}

// «سؤال الليلة ٢»: the series frame that makes episodes recognisable.
export function SeriesBadge({ text, dark = true }) {
  return <span style={{
    fontSize: 32, fontWeight: 700, color: dark ? C.cream : C.teal, padding: '2px 16px 6px',
    borderRadius: 999, border: `2px solid ${C.gold}`,
  }}>{text}</span>;
}

// Small closing line for reach reels: a bridge to the product, not a pitch.
export function BridgeLine({ text, at, dark = true, top = 1176 }) {
  const frame = useCurrentFrame();
  return <div data-kit-essential="bridge" dir="rtl" lang="ar" style={{
    position: 'absolute', left: 180, width: 720, top, textAlign: 'center', fontFamily: 'Cairo',
    fontSize: 38, fontWeight: 600, color: dark ? C.cream : C.teal, opacity: windowed(frame, at, undefined, 14),
  }}>{text}</div>;
}

// The single call to action, held still until the last frame.
export function CtaLine({ text, at, top = 1172, dark = false }) {
  const frame = useCurrentFrame();
  const p = windowed(frame, at, undefined, 12);
  return <div data-kit-essential="cta" dir="rtl" lang="ar" style={{
    position: 'absolute', left: 180, width: 720, top, display: 'flex', justifyContent: 'center',
    opacity: p, transform: `translateY(${(1 - p) * 10}px)`,
  }}>
    <span style={{
      fontFamily: 'Cairo', fontSize: 40, fontWeight: 800, padding: '4px 30px 10px', borderRadius: 999,
      background: dark ? C.cream : C.teal, color: dark ? C.teal : C.cream,
    }}>{text}</span>
  </div>;
}
