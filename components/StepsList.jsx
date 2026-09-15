import { Reveal } from "./motion/Reveal";

/**
 * The three stages, set as a book's table of contents rather than a stack of
 * cards on a beam.
 *
 * What was here — a rounded-square icon tile, a gold number pill and a title
 * on each of three rows, threaded onto Aceternity's `TracingBeam` — carried
 * three separate template signatures at once (icon tile, badge pill, stock
 * registry effect), and the beam pulled `motion` into the bundle and forced
 * this whole subtree to be a client component.
 *
 * Now: hanging numerals, a rule between entries, and a hairline spine running
 * behind the numbers. Same "one continuous journey" idea the beam was for, in
 * the idiom the product is actually about, in **zero** client JS — this file
 * is a server component again, which is what the section around it wanted.
 *
 * The numerals are `aria-hidden`: the ordinal is already carried by `<ol>`, so
 * to a screen reader they would just be noise read before every heading.
 */
export default function StepsList({ steps }) {
  return (
    <ol className="relative">
      {/* The spine. Runs from the first numeral to the last and draws itself
          downward as the list scrolls in — the beam's job, done as one CSS
          scroll-timeline property on one element. It is inset by half the
          numeral column so it passes through the centre of the numbers. */}
      <span
        aria-hidden="true"
        data-reveal="rule"
        className="absolute inset-y-6 start-[1.4rem] hidden w-px origin-top bg-gradient-to-b from-brand/40 via-gold/60 to-berry/30 sm:block"
      />

      {steps.map(({ title, body }, i) => (
        <Reveal
          as="li"
          key={title}
          delay={i * 0.08}
          variant="soft"
          className="relative grid grid-cols-[2.8rem_1fr] gap-x-4 border-t border-ink/8 py-8 first:border-t-0 first:pt-0 sm:gap-x-7 md:py-10"
        >
          {/* cream ground so the spine reads as passing behind the numeral */}
          <span
            aria-hidden="true"
            // self-start, or the grid stretches this to the full row height and
            // its cream ground masks the spine for the whole entry instead of
            // just behind the digits.
            className="relative -mt-1 self-start bg-cream py-1.5 text-center text-3xl font-extrabold leading-none text-brand tabular-nums md:text-4xl"
          >
            {`0${i + 1}`}
          </span>

          <div>
            <h3 className="text-xl font-extrabold leading-snug text-ink sm:text-2xl">
              {title}
            </h3>
            <p className="mt-2 max-w-lg text-base leading-loose text-muted">
              {body}
            </p>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}
