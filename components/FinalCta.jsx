import { Reveal } from "./motion/Reveal";
import { CtaButton, InstagramIcon } from "./ui";
import { CONTACT_URL, INSTAGRAM_HANDLE } from "@/lib/site";

/**
 * The closing ask.
 *
 * It used to be a centred `rounded-[2.5rem]` dark slab floating on the cream
 * page, with an aurora blob layer and a sparkle field on top of it — the
 * "gradient CTA card" that ends most generated pages, and the last centred
 * block left here.
 *
 * Two problems, one fix:
 *
 *  - The slab was dark teal **immediately above a dark teal footer**, so the
 *    page ended on two stacked dark blocks with a cream gutter between them.
 *  - Being a floating rounded card, it read as chrome rather than as the end
 *    of the page.
 *
 * So it is now full-bleed and butts directly onto the footer with no cream
 * gutter between them: the closing ask and the footer read as one dark region
 * that bookends the dark hero, and the page returns to the night it opened in.
 * The two are not the same tone — the gradient bottoms out darker than the
 * footer's `brand-deep` — so there is a deliberate step at the seam, and the
 * gilded hairline (the same one under the header bar) sits exactly on it and
 * reads as the divider.
 *
 * Removing the ambient layer left `components/motion/Ambient.jsx` with no
 * consumers at all; see "Dead exports".
 */
export default function FinalCta({ dict }) {
  const t = dict.finalCta;

  return (
    <section className="relative isolate mt-24 overflow-hidden bg-brand-deep md:mt-32">
      {/* one pool of warm light, the same idea as the hero's night sky —
          motivated by the story rather than decorating the panel */}
      {/* The light end is #166668, not something brighter: the copy sits on
          this gradient, and `text-cream/80` needs 4.5:1 against the LIGHTEST
          point of it, not the average. At #1d7a7c that measured 3.69:1; here
          it is 4.70:1. Re-measure against the light end if this is retuned. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_120%_at_20%_0%,#166668_0%,#125a5c_45%,#0d4a4c_100%)]"
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 md:grid-cols-[1.15fr_0.85fr] md:items-end md:gap-16 md:py-28">
        <Reveal>
          <h2 className="max-w-xl text-3xl font-extrabold leading-[1.3] text-cream sm:text-4xl md:text-[2.75rem]">
            {t.title}
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-loose text-cream/80">
            {t.lead}
          </p>
        </Reveal>

        <Reveal
          delay={0.1}
          variant="soft"
          className="flex flex-col items-start gap-4 md:items-end"
        >
          <CtaButton href={CONTACT_URL} size="lg" className="w-full sm:w-auto">
            <InstagramIcon className="h-5 w-5" aria-hidden="true" />
            {t.cta}
          </CtaButton>
          {/* dir="ltr": the leading "@" is bidi-neutral and would otherwise be
              pushed to the visual end of an RTL line. */}
          <span dir="ltr" className="text-sm font-semibold text-cream/80">
            {INSTAGRAM_HANDLE}
          </span>
        </Reveal>
      </div>

      {/* the gilded page edge again — this is what divides the closing ask
          from the footer, since they share a background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-gold/50 to-transparent"
      />
    </section>
  );
}
