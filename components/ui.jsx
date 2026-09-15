import Link from "next/link";

// No `whitespace-nowrap` here on purpose: in a narrow column (the two-up tier
// spread on a 320px phone) a one-line label overflows its own button, and a
// nowrap baked into the base cannot be overridden from a className without an
// important modifier. Buttons that must never wrap ask for it explicitly.
const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-bold " +
  "text-center transition-all duration-200 active:scale-[0.97]";

const variants = {
  // Berry is the reserved "order now" accent — use sparingly (see brand brief).
  //
  // The ring is an accessibility fix, not decoration. Berry and the brand teals
  // are close in *luminance* however different they look in hue, so a berry
  // button on a teal ground measures 1.28–2.32:1 against it — under WCAG
  // 1.4.11's 3:1 for the boundary of a non-text UI component. The button is
  // used on both teal (hero, closing band) and cream (drawer, tiers, pricing),
  // and cream/70 is the value that resolves both: it clears 3:1 on the worst
  // teal ground (3.78:1 on the hero's lightest #1a6b6d) and is invisible on
  // cream, where the berry fill already passes at 4.62:1 on its own.
  primary:
    "bg-berry text-white shadow-soft ring-1 ring-cream/70 hover:bg-berry-deep hover:shadow-lift hover:-translate-y-0.5",
  brand:
    "bg-brand text-white shadow-soft hover:bg-brand-deep hover:shadow-lift hover:-translate-y-0.5",
  // Same 1.4.11 problem as `primary`, from the opposite direction: this button
  // is a white fill on cream (≈1.05:1), so its border is the ONLY thing
  // defining it — and `brand/25` measured 1.36:1 against cream, i.e. the
  // control had no perceivable boundary at all. `brand-deep/80` is 4.18:1 on
  // cream and 4.01:1 on the tinted tier spread. This is a visible change: the
  // outline buttons now read as outlined rather than as floating white pills.
  outline:
    "border-2 border-brand-deep/80 bg-surface text-brand-deep hover:border-brand-deep hover:bg-brand-tint",
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

/**
 * Internal "order" CTA. Same button, but a same-site `next/link`: no
 * `target="_blank"`, no external `rel`, and prefetched like any other route.
 * Use this for anything pointing at `orderPath(lang)`; `CtaButton` is for
 * links that genuinely leave the site.
 */
export function OrderButton({ href, children, ...props }) {
  return (
    <Button as="link" href={href} {...props}>
      {children}
    </Button>
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

/**
 * Ruled kicker — the small label that opens a section.
 *
 * This replaced `Eyebrow`, a tinted rounded pill, which is now gone. The pill
 * is one of the loudest generated-template components there is; a rule and a
 * line of small caps says the same thing and reads as typography rather than
 * chrome.
 *
 * `ltr:` on the tracking and the caps is not cosmetic: letter-spacing Arabic
 * pushes joined letterforms apart along a stretched connector and reads as
 * broken type, and Arabic has no case for `uppercase` to act on. Both belong
 * to the Latin locale only.
 */
export function Kicker({ children, tone = "brand", as: Tag = "p", ...props }) {
  const text = tone === "gold" ? "text-gold-soft" : "text-brand-deep";
  const rule = tone === "gold" ? "bg-gold/50" : "bg-brand/40";
  const { className = "", ...rest } = props;
  return (
    <Tag
      className={`flex items-center gap-3 text-[0.8rem] font-bold text-balance ltr:uppercase ltr:tracking-[0.2em] ${text} ${className}`}
      {...rest}
    >
      <span aria-hidden="true" className={`h-px w-10 shrink-0 ${rule}`} />
      {children}
    </Tag>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, align = "center" }) {
  const alignment =
    align === "center"
      ? "items-center text-center"
      : "items-start text-start";
  return (
    <div className={`flex flex-col gap-4 ${alignment}`}>
      {eyebrow ? <Kicker>{eyebrow}</Kicker> : null}
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

/**
 * lucide-react v1 dropped brand glyphs, so the WhatsApp mark lives here too.
 * Filled rather than stroked, unlike `InstagramIcon`: the handset-in-a-bubble
 * only reads at small sizes as a solid shape.
 */
export function WhatsAppIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
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
