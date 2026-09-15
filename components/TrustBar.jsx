import { PenLine, Package, Zap } from "lucide-react";
import { Reveal } from "./motion/Reveal";
import { Kicker } from "./ui";

// Icons pair with dict.trust.items by position.
const ICONS = [PenLine, Package, Zap];

/**
 * The three promises, set as columns of a printed page rather than a row of
 * cards.
 *
 * What was here before — three equal thirds, each an icon in a rounded tile
 * above a bold title and a muted line, inside one bordered, shadowed, rounded
 * container — is the same generated-template signature the hero had. The fix
 * is the same one: change the composition, not the decoration.
 *
 *  - **The columns are deliberately unequal, and the content decides it.** The
 *    first promise (the story is written around your child, not a template
 *    with the name swapped) is the entire product thesis; the other two are
 *    logistics. So it gets more width and larger type. Three identical thirds
 *    imply three equally important claims, which is not true.
 *  - **No card.** No container, no shadow, no rounded tiles — hairline rules
 *    between the columns, which is what separates columns on a printed page.
 *  - **Icons are drawn inline in brand teal**, not parked in tinted squares.
 *    The tile is the card pattern in miniature.
 *
 * It still tucks up under the hero, which is what stops the page reading as a
 * stack of equal full-width bands — but it no longer needs to be a floating
 * slab to do it.
 */
export default function TrustBar({ dict }) {
  const { label, items } = dict.trust;

  return (
    <section
      aria-labelledby="trust-label"
      className="relative z-10 mx-auto -mt-8 max-w-6xl px-5 pb-4 pt-12 sm:px-8 md:-mt-12 md:pt-16"
    >
      {/* the same ruled kicker as the hero, so the sections rhyme */}
      <Reveal variant="soft">
        <Kicker id="trust-label">{label}</Kicker>
      </Reveal>

      <ul className="mt-8 grid gap-x-10 gap-y-10 md:mt-10 md:grid-cols-[1.35fr_1fr_1fr]">
        {items.map(({ title, body }, i) => {
          const Icon = ICONS[i];
          const lead = i === 0;
          return (
            <Reveal
              as="li"
              key={title}
              delay={i * 0.1}
              variant="soft"
              className="relative md:ps-10"
            >
              {/* The rule between columns. It draws itself down as the band
                  scrolls in — a CSS scroll timeline, not JS: this is one
                  property on one element, which is exactly what
                  `animation-timeline: view()` is for, and it keeps the section
                  a server component with no client bundle at all. */}
              {i > 0 ? (
                <span
                  aria-hidden="true"
                  data-reveal="rule"
                  className="absolute inset-y-0 start-0 hidden w-px origin-top bg-ink/12 md:block"
                />
              ) : null}

              <Icon
                className={`text-brand ${lead ? "h-7 w-7" : "h-6 w-6"}`}
                aria-hidden="true"
                strokeWidth={1.75}
              />
              <h3
                className={`mt-4 font-extrabold leading-snug text-ink ${
                  lead ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
                }`}
              >
                {title}
              </h3>
              <p
                className={`mt-2 leading-loose text-muted ${
                  lead ? "text-base" : "text-sm"
                }`}
              >
                {body}
              </p>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}
