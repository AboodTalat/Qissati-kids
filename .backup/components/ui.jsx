import Link from "next/link";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-bold " +
  "transition-all duration-200 active:scale-[0.97] whitespace-nowrap";

const variants = {
  // Berry is the reserved "order now" accent — use sparingly (see brand brief).
  primary:
    "bg-berry text-white shadow-soft hover:bg-berry-deep hover:shadow-lift hover:-translate-y-0.5",
  brand:
    "bg-brand text-white shadow-soft hover:bg-brand-deep hover:shadow-lift hover:-translate-y-0.5",
  outline:
    "border-2 border-brand/25 bg-surface text-brand-deep hover:border-brand/60 hover:bg-brand-tint",
  // for the deep-teal night hero, where the cream outline button would vanish
  onDark:
    "border-2 border-cream/30 bg-white/5 text-cream backdrop-blur-sm hover:border-cream/60 hover:bg-white/10",
  ghost: "text-brand-deep hover:bg-brand-tint",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export function Button({
  as = "a",
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  const Tag = as === "link" ? Link : as;
  return (
    <Tag className={cls} {...props}>
      {children}
    </Tag>
  );
}

/** External CTA — always opens in a new tab with safe rel. */
export function CtaButton({ href, children, ...props }) {
  return (
    <Button
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </Button>
  );
}

export function Eyebrow({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-brand-tint px-4 py-1.5 text-sm font-bold text-brand-deep ${className}`}
    >
      {children}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, align = "center" }) {
  const alignment =
    align === "center"
      ? "items-center text-center"
      : "items-start text-start";
  return (
    <div className={`flex flex-col gap-4 ${alignment}`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="text-3xl font-extrabold leading-[1.35] text-ink sm:text-4xl md:text-[2.75rem]">
        {title}
      </h2>
      {subtitle ? (
        <p className="max-w-2xl text-lg leading-loose text-muted">{subtitle}</p>
      ) : null}
    </div>
  );
}

/** Hand-drawn-feeling underline used to stress a word in a headline. */
export function Squiggle({ className = "" }) {
  return (
    <svg
      viewBox="0 0 200 14"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="none"
      className={className}
    >
      <path
        d="M3 9.5C34 3.5 62 3 97 6.5c33 3.3 62 3.8 100-2"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

/** lucide-react v1 dropped brand glyphs, so the Instagram mark lives here. */
export function InstagramIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
