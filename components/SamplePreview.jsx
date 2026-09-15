import { ArrowDown } from "lucide-react";
import { BookCover } from "./BookArt";
import SampleGallery from "./SampleGallery";
import { Reveal } from "./motion/Reveal";
import { Kicker } from "./ui";

/**
 * The sample story, built the way the sections above it are: a start-aligned
 * ruled kicker, an asymmetric composition, and no cards.
 *
 * Three things went, all for the same reason the other sections lost theirs:
 *
 *  - **The centred heading block.** Every other section opens start-aligned;
 *    a centred column in the middle of them reads as a different page. Nothing
 *    here is centred any more, in either direction — the copy hangs off the
 *    start edge and the composition is what carries the eye.
 *  - **Aceternity's `ContainerScroll`.** It tilted the cover up on scroll on a
 *    big rounded stage. The hero already opens a book on scroll; doing it
 *    twice reads as one trick repeated, and the stage was another card. Losing
 *    it also drops a second `motion` consumer and makes this whole section a
 *    **server** component again — `SampleGallery` is the only client part now.
 *  - **The tinted rounded quote card**, with its centred quote-mark icon. It
 *    is a pull quote, so it is now set as one.
 *
 * What replaced the stage is a catalogue entry: the cover at listing size
 * beside the book's own title and note. The hero already showed this cover
 * full size, so showing it big again was a repeat; at this size it reads as
 * the book being introduced before you leaf through its pages.
 */
export default function SamplePreview({ dict }) {
  const t = dict.sample;

  return (
    <section id="sample" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <Kicker>{t.eyebrow}</Kicker>
          <h2 className="mt-5 text-3xl font-extrabold leading-[1.3] text-ink sm:text-4xl md:text-[2.75rem]">
            {t.title}
          </h2>
          <p className="mt-4 text-lg leading-loose text-muted">{t.lead}</p>
        </Reveal>

        {/* Catalogue entry: the book, at listing size, beside its own title. */}
        <Reveal
          delay={0.1}
          variant="soft"
          className="mt-14 grid items-center gap-7 sm:grid-cols-[auto_1fr] sm:gap-10 md:mt-16"
        >
          <div className="w-40 shrink-0 sm:w-44 md:w-52">
            <div className="relative overflow-hidden rounded-xl shadow-book">
              <BookCover
                alt={dict.book.coverAlt}
                sizes="(max-width: 640px) 10rem, 13rem"
                className="h-auto w-full"
              />
              {/* The artwork is textless on purpose, so the printed title is
                  set here in Cairo. Image pixels cannot be contrast-audited —
                  the scrim is what carries it. */}
              <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 via-black/25 to-transparent p-3 pb-7 text-center">
                <p className="text-sm font-extrabold leading-tight text-gold drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
                  {t.bookTitleTop}
                </p>
                <p className="text-xs font-bold text-cream drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
                  {t.bookTitleBottom}
                </p>
              </div>
            </div>
          </div>

          <div className="text-start">
            <p className="text-xl font-extrabold leading-snug text-ink sm:text-2xl">
              {t.bookFullTitle}
            </p>
            <p className="mt-3 max-w-md text-base leading-loose text-muted">
              {t.bookNote}
            </p>
            {/* The gallery is directly below, so the cue points down — a
                horizontal arrow would have to mirror per direction. */}
            <p className="mt-5 flex items-center gap-1.5 border-t border-ink/10 pt-4 text-sm font-bold text-brand-deep">
              {t.galleryHint}
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </p>
          </div>
        </Reveal>
      </div>

      {/* full-bleed: the spreads run past the container on both sides, and
          each one opens full size */}
      <div className="mt-12 md:mt-16">
        <SampleGallery dict={dict} />
      </div>

      {/* A pull quote from the sample brief, not a customer testimonial: a gold
          rule on the start edge and the words set large. */}
      <Reveal
        variant="soft"
        className="mx-auto mt-14 max-w-6xl px-5 sm:px-8 md:mt-16"
      >
        <blockquote className="max-w-2xl border-s-[3px] border-gold ps-6 text-start sm:ps-8">
          <p className="text-xl font-bold leading-loose text-brand-deep sm:text-2xl">
            {t.quote}
          </p>
          {t.quoteAttribution ? (
            <footer className="mt-3 text-sm font-semibold text-muted">
              {t.quoteAttribution}
            </footer>
          ) : null}
        </blockquote>
      </Reveal>
    </section>
  );
}
