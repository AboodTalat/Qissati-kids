import { FileText, BookOpen, Check } from "lucide-react";
import { Reveal } from "./motion/Reveal";
import { CtaButton, Kicker } from "./ui";
import { ORDER_URL } from "@/lib/site";

// Presentation only — copy (and the [X] price placeholders) live in
// dict.pricing.plans, in both languages.
const PLANS = [
  { id: "pdf", Icon: FileText, highlight: false },
  { id: "print", Icon: BookOpen, highlight: true },
];

export default function Pricing({ dict }) {
  const t = dict.pricing;
  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* heading on the start edge, note on the end edge — a two-part header
            instead of another centred block */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <Reveal>
            <Kicker>{t.eyebrow}</Kicker>
            <h2 className="mt-5 text-3xl font-extrabold leading-[1.3] text-ink sm:text-4xl md:text-[2.75rem]">
{t.title}
            </h2>
          </Reveal>
          <Reveal delay={0.1} variant="soft">
            <p className="max-w-sm text-base leading-loose text-muted sm:text-end">
{t.note}
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {PLANS.map(({ id, Icon, highlight }, i) => {
            const { name, price, note, points } = t.plans[id];
            return (
            <Reveal key={id} delay={i * 0.1} variant="scale">
              <article
                className={`group relative flex h-full flex-col gap-5 overflow-hidden rounded-blob bg-surface p-7 transition-all duration-300 hover:-translate-y-1 sm:p-8 ${
                  highlight
                    ? "border-2 border-gold shadow-lift"
                    : "border border-ink/8 shadow-soft hover:shadow-lift"
                }`}
              >
                {highlight ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -end-16 -top-16 h-40 w-40 rounded-full bg-gold-soft/40 blur-2xl"
                  />
                ) : null}

                <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-brand-tint text-brand-deep transition-transform duration-300 group-hover:scale-105">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>

                <h3 className="relative text-xl font-extrabold text-ink">{name}</h3>

                <p className="relative flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-muted">{t.startsFrom}</span>
                  <span className="text-4xl font-extrabold text-berry">{price}</span>
                  <span className="text-lg font-bold text-ink/70">{t.currency}</span>
                </p>
                <p className="relative -mt-3 text-sm text-muted">{note}</p>

                <ul className="relative flex flex-col gap-2.5">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-[0.95rem] text-ink/80">
                      <Check
                        className="mt-1 h-4 w-4 shrink-0 text-brand"
                        strokeWidth={3}
                        aria-hidden="true"
                      />
                      {point}
                    </li>
                  ))}
                </ul>

                <CtaButton
                  href={ORDER_URL}
                  variant={highlight ? "primary" : "outline"}
                  className="relative mt-auto w-full"
                >
{t.cta}
                </CtaButton>
              </article>
            </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.15} variant="soft">
          <p className="mt-8 text-center text-sm text-muted">
{t.footnote}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
