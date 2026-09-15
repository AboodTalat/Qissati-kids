import { Plus } from "lucide-react";
import { Reveal } from "./motion/Reveal";
import { Kicker } from "./ui";

/** Sticky heading beside the list, so this section reads differently again. */
export default function Faq({ dict }) {
  const t = dict.faq;

  return (
    <section
      id="faq"
      className="mx-auto max-w-6xl px-5 py-24 sm:px-8 md:py-32"
    >
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <Kicker>{t.eyebrow}</Kicker>
          <h2 className="mt-5 text-3xl font-extrabold leading-[1.3] text-ink sm:text-4xl">
{t.title}
          </h2>
          <p className="mt-4 max-w-sm text-base leading-loose text-muted">
{t.lead}
          </p>
        </Reveal>

        <div className="flex flex-col gap-3">
          {t.items.map(({ q, a }, i) => (
            <Reveal key={q} delay={i * 0.07} variant="soft">
              <details
                name="qissati-faq"
                className="group rounded-card border border-ink/8 bg-surface px-5 py-1 shadow-soft transition-shadow open:shadow-lift sm:px-6"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-start text-lg font-bold text-ink marker:hidden [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-deep transition-all duration-300 group-open:rotate-45 group-open:bg-brand group-open:text-white">
                    <Plus className="h-5 w-5" aria-hidden="true" />
                  </span>
                </summary>
                <p className="pb-5 text-base leading-loose text-muted">{a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
