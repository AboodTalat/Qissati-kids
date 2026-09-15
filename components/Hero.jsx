import { ArrowLeft, ArrowRight } from "lucide-react";
import HeroBook from "./HeroBook";
import HeroRoles from "./HeroRoles";
import { getSpreads } from "./BookArt";
import { Enter } from "./motion/Reveal";
import { Kicker, OrderButton } from "./ui";
import { orderPath } from "@/lib/site";

/**
 * Deep-teal brand hero.
 *
 * The brand's own dark end (#0d4143 → #146466), not a new colour. It gives
 * the page a light/dark rhythm: everything below this is cream, which is what
 * the brief asks for and what stops the page reading as one long strip of
 * identical sections. The field stays intentionally quiet so the current
 * sample's bright garden artwork remains the focal point.
 *
 * The composition is deliberately NOT the badge-pill / accent-word headline /
 * twin-CTA / tilted-card-on-the-right arrangement. That shape is the single
 * loudest "generated landing page" signal there is, and no amount of motion
 * layered on top of it reads as anything else. Instead:
 *
 *  - The headline is set as a book's title page — a ruled kicker, then the
 *    title stacked with a real size jump on the middle line. The emphasis is
 *    typographic, not a word painted gold inside a paragraph-shaped heading.
 *  - One CTA, not two. The second button was competing with the first; the
 *    sample is a quiet text link, which is what it actually is.
 *  - The book bleeds past the container on the end edge and outgrows its
 *    column, so the two halves interlock instead of sitting in tidy boxes.
 *  - No blurred glow blobs. The only light in the section now comes out of the
 *    book as it opens, which is motivated rather than decorative.
 */
export default function Hero({ dict, lang }) {
  const t = dict.hero;
  // The book opens onto its own first spread — the same artwork the sample
  // gallery uses further down, so the hero is showing the real product.
  const firstSpread = getSpreads(dict)[0];

  return (
    <section
      id="top"
      // overflow-x-clip, NOT overflow-hidden: `hidden` makes this section a
      // scroll container, which silently kills `position: sticky` on every
      // descendant — the pinned copy column and the pinned book both just
      // scrolled away. `clip` does the same visual job without that.
      className="relative isolate overflow-x-clip bg-[#0d4143] pb-28 md:pb-36"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_25%_35%,#1a6b6d_0%,#0d4143_55%,#082e30_100%)]" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-14 px-5 pt-24 sm:px-8 md:pt-28 lg:grid-cols-[1fr_0.92fr] lg:gap-16 lg:pt-32">
        {/* ── Copy ─────────────────────────────────────────────────
            Sticks while the book opens beside it, so the two halves are one
            movement rather than a column that scrolls away from a fixed card. */}
        <div className="flex flex-col items-start gap-8 text-start lg:sticky lg:top-32 lg:self-start lg:pb-16">
          {/* A ruled kicker instead of a badge pill: same words, none of the
              template's favourite component. */}
          <Enter variant="soft">
            <Kicker as="span" tone="gold">{t.badge}</Kicker>
          </Enter>

          {/* Title-page lockup. The size jump on the middle line is the
              hierarchy; the gold is only reinforcing it. */}
          <Enter delay={0.1}>
            <h1 className="text-cream">
              <span className="block text-2xl font-bold leading-tight tracking-tight text-cream/80 sm:text-3xl">
                {t.titleA}
              </span>
              <span className="mt-1 block text-[3.4rem] font-extrabold leading-[0.95] tracking-tight text-gold sm:text-7xl">
                {t.titleB}
              </span>
              <span className="mt-2 block text-[1.75rem] font-bold leading-tight tracking-tight sm:text-4xl">
                {t.titleC}
              </span>
            </h1>
          </Enter>

          <Enter delay={0.28}>
            <p className="max-w-lg text-lg leading-loose text-cream/75">
              {t.lead}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-1 text-lg font-bold text-cream sm:text-xl">
              <span>{t.rolesPrefix}</span>
              {/* min-width reserves room for the longest role in either
                  language so the line does not reflow on every flip */}
              <span className="relative inline-flex h-8 min-w-[8.5rem] items-center sm:min-w-[11rem]">
                <HeroRoles roles={t.roles} />
              </span>
            </div>
          </Enter>

          {/* One button. The sample is a link, because that is what it is. */}
          <Enter delay={0.4} className="w-full sm:w-auto">
            <div className="flex w-full flex-col items-start gap-5 sm:w-auto sm:flex-row sm:items-center sm:gap-7">
              <OrderButton href={orderPath(lang)} size="lg" className="w-full sm:w-auto">
                {t.ctaOrder}
              </OrderButton>
              <a
                href="#sample"
                className="group inline-flex items-center gap-2 border-b border-cream/25 pb-1 text-base font-bold text-cream/85 transition-colors hover:border-cream/70 hover:text-cream"
              >
                {t.ctaSample}
                {/* "Forward" points toward the end edge — left under rtl,
                    right under ltr — and the hover nudge follows it. Both
                    icons render; the dir-keyed variant hides the wrong one. */}
                <ArrowLeft
                  className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1 ltr:hidden"
                  aria-hidden="true"
                />
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:hidden"
                  aria-hidden="true"
                />
              </a>
            </div>
          </Enter>

          <Enter delay={0.5} variant="soft">
            <p className="text-sm font-medium text-cream/65">{t.reassure}</p>
          </Enter>
        </div>

        {/* ── The book ─────────────────────────────────────────────
            Overgrows its column and bleeds past the container on the end edge,
            so the composition interlocks instead of splitting down the middle. */}
        <div className="lg:-me-16 lg:w-[115%] xl:-me-24">
          <HeroBook dict={dict} spread={firstSpread} />
        </div>
      </div>

      {/* hand-off into the cream page below */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-cream"
      />
    </section>
  );
}
