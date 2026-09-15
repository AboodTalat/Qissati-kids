import { PenLine, Package, Zap } from "lucide-react";
import { Enter } from "./motion/Reveal";

// Icons pair with dict.trust.items by position.
const ICONS = [PenLine, Package, Zap];

/**
 * Straddles the hero and the section below it rather than sitting in its own
 * band — the overlap is what stops the page reading as a stack of equal
 * full-width strips.
 */
export default function TrustBar({ dict }) {
  const { label, items } = dict.trust;

  return (
    <section
      aria-label={label}
      className="relative z-10 mx-auto -mt-6 max-w-6xl px-5 sm:px-8 md:-mt-12"
    >
      <ul className="grid gap-px overflow-hidden rounded-blob border border-ink/5 bg-ink/5 shadow-lift md:grid-cols-3">
        {items.map(({ title, body }, i) => {
          const Icon = ICONS[i];
          return (
          <Enter
            as="li"
            key={title}
            delay={i * 0.1}
            variant="soft"
            className="group flex items-start gap-4 bg-surface p-6 transition-colors duration-300 hover:bg-brand-tint/40 sm:p-7"
          >
            <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-tint text-brand-deep transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:bg-brand group-hover:text-white">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-ink">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          </Enter>
          );
        })}
      </ul>
    </section>
  );
}
