import StepsBeam from "./StepsBeam";
import { Reveal } from "./motion/Reveal";
import { Eyebrow } from "./ui";

/**
 * Asymmetric on purpose: a heading column that sticks while the traced
 * timeline scrolls past it, rather than the centred-heading-over-three-cards
 * arrangement every other section would otherwise repeat.
 */
export default function HowItWorks({ dict }) {
  const t = dict.how;

  return (
    <section
      id="how"
      className="mx-auto max-w-6xl px-5 py-24 sm:px-8 md:py-32"
    >
      <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h2 className="mt-5 text-3xl font-extrabold leading-[1.3] text-ink sm:text-4xl md:text-[2.75rem]">
{t.title}
          </h2>
          <p className="mt-4 max-w-md text-lg leading-loose text-muted">
{t.lead}
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gold-soft/45 px-4 py-3 text-sm font-semibold text-ink/80">
            <span aria-hidden="true">💬</span>
{t.note}
          </p>
        </Reveal>

        <StepsBeam steps={t.steps} />
      </div>
    </section>
  );
}
