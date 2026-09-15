/**
 * Ambient background layers. These are the Aceternity "aurora" and "sparkles"
 * ideas rebuilt in the Qissati palette — the shipped versions hardcode neon
 * blue/violet (#7b61ff, #1ca0fb) which the brand brief rules out, and the
 * sparkles component pulls in tsparticles, far too heavy for a page whose
 * traffic is mostly mobile.
 *
 * Pure CSS animation: no JS on the main thread, and the reduced-motion block
 * in globals.css already switches it off.
 */

export function Aurora({ className = "", tone = "warm" }) {
  const palettes = {
    warm: [
      "bg-[radial-gradient(closest-side,var(--color-gold-soft),transparent)]",
      "bg-[radial-gradient(closest-side,var(--color-brand-tint),transparent)]",
      "bg-[radial-gradient(closest-side,#f6dcc6,transparent)]",
    ],
    deep: [
      "bg-[radial-gradient(closest-side,#2fa6a8,transparent)]",
      "bg-[radial-gradient(closest-side,var(--color-gold),transparent)]",
      "bg-[radial-gradient(closest-side,#3fb0b2,transparent)]",
    ],
  };
  const [a, b, c] = palettes[tone] ?? palettes.warm;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div
        className={`absolute -top-1/3 start-[-15%] h-[42rem] w-[42rem] rounded-full opacity-70 blur-3xl animate-aurora ${a}`}
      />
      <div
        className={`absolute top-[10%] end-[-20%] h-[38rem] w-[38rem] rounded-full opacity-60 blur-3xl animate-drift ${b}`}
      />
      <div
        className={`absolute bottom-[-25%] start-[25%] h-[32rem] w-[32rem] rounded-full opacity-45 blur-3xl animate-aurora ${c}`}
        style={{ animationDelay: "-8s" }}
      />
    </div>
  );
}

// Fixed coordinates rather than Math.random(), so server and client markup
// match and nothing flashes on hydration.
const SPARKS = [
  [6, 18, 3, 0], [15, 62, 2, 1.2], [23, 34, 4, 2.4], [31, 78, 2, 0.6],
  [39, 12, 3, 3], [47, 55, 2, 1.8], [55, 26, 4, 0.3], [63, 70, 2, 2.1],
  [71, 40, 3, 1.5], [79, 15, 2, 2.7], [86, 60, 4, 0.9], [93, 33, 2, 3.3],
  [11, 88, 2, 1.1], [44, 92, 3, 2.9], [68, 86, 2, 0.4], [88, 80, 3, 1.7],
];

export function Sparkles({ className = "", color = "var(--color-gold)" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {SPARKS.map(([x, y, size, delay], i) => (
        <span
          key={i}
          className="absolute rounded-full animate-twinkle"
          style={{
            insetInlineStart: `${x}%`,
            top: `${y}%`,
            width: `${size}px`,
            height: `${size}px`,
            background: color,
            animationDelay: `${delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Fine paper grain — keeps big cream areas from reading as flat digital fill. */
export function Grain({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-multiply ${className}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}
