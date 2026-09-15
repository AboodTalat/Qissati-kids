import StepsList from "./StepsList";
import { Reveal } from "./motion/Reveal";
import { Kicker } from "./ui";

/**
 * Asymmetric on purpose: a heading column that sticks while the contents list
 * scrolls past it, rather than the centred-heading-over-three-cards
 * arrangement every other section would otherwise repeat. That part was
 * already right and is kept.
 *
 * What changed is the chrome inside it — the badge pill is now the shared
 * ruled `Kicker`, and the reassurance note has lost its emoji and its tinted
 * rounded box for a gold rule and a line of text. An emoji standing in for an
 * icon, inside a soft-tinted pill, is about as template as a detail gets.
 */
export default function HowItWorks({ dict }) {
  const t = dict.how;

  return (
    <section id="how" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 md:py-32">
      <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Reveal className="lg:sticky lg:top-32 lg:self-start">
          <Kicker>{t.eyebrow}</Kicker>
          <h2 className="mt-5 text-3xl font-extrabold leading-[1.3] text-ink sm:text-4xl md:text-[2.75rem]">
            {t.title}
          </h2>
          <p className="mt-4 max-w-md text-lg leading-loose text-muted">
            {t.lead}
          </p>

          {/* The reassurance, set as a footnote under a gold rule rather than
              parked in a tinted pill with an emoji in it. */}
          <p className="mt-8 max-w-sm border-t-2 border-gold/60 pt-4 text-sm font-semibold leading-relaxed text-ink/75">
            {t.note}
          </p>
        </Reveal>

        <StepsList steps={t.steps} />
      </div>
    </section>
  );
}
