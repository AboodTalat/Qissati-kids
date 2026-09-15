import { Plus } from "lucide-react";
import { Reveal } from "./motion/Reveal";
import { Kicker } from "./ui";
import { fillPlaceholders } from "@/lib/pricing";

/**
 * Sticky heading beside the questions — the same asymmetric arrangement as
 * HowItWorks, which is the part of this section that was already right.
 *
 * What changed is the list. Each question used to be its own rounded, bordered,
 * shadowed card that lifted when opened, with a plus in a tinted circle that
 * rotated 45°. That is the stack-of-cards accordion every generated page
 * ships. Now:
 *
 *  - **Ruled rows, no boxes and no gaps.** A run of questions separated by
 *    hairlines is what a printed Q&A looks like, and it lets the eye run down
 *    the column instead of stopping at each card edge.
 *  - **The plus loses its circle.** The rotating plus is a real affordance, not
 *    decoration, so it stays — but the tinted disc around it was the template
 *    tell, and without it the marker reads as type rather than chrome.
 *  - **The open question turns its own rule gold.** Marking it with a bar on
 *    the start edge was the first idea, but that needs an indent to clear the
 *    bar, and on phones — where the heading and the list stack — the indent
 *    knocked the questions out of alignment with the heading above them.
 *    Recolouring the rule that is already there costs no layout at all.
 *
 * `<details name>` keeps this a native exclusive accordion: opening one closes
 * the rest, with no client JS and no `"use client"` boundary.
 *
 * The turnaround and the age range are still written as `[X]` / `[X-Y]` in
 * both dictionaries. `fillPlaceholders` substitutes whichever of them the
 * owner has actually set in the dashboard, and leaves the rest as brackets —
 * so an undecided value stays visibly undecided rather than becoming a
 * plausible invention, which is the one failure mode that rule exists for.
 */
export default function Faq({ dict, pricing }) {
  const t = dict.faq;

  return (
    <section id="faq" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 md:py-32">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Reveal className="lg:sticky lg:top-32 lg:self-start">
          <Kicker>{t.eyebrow}</Kicker>
          <h2 className="mt-5 text-3xl font-extrabold leading-[1.3] text-ink sm:text-4xl">
            {t.title}
          </h2>
          <p className="mt-4 max-w-sm text-base leading-loose text-muted">
            {t.lead}
          </p>
        </Reveal>

        {/* The closing rule lives on the container: every <details> is the
            only one inside its own Reveal wrapper, so a `last:` variant would
            match all of them and draw a border under every row. */}
        <div className="border-b-2 border-ink/10">
          {t.items.map(({ q, a: rawAnswer }, i) => {
            const a = fillPlaceholders(rawAnswer, pricing, dict);
            return (
              <Reveal key={q} delay={i * 0.07} variant="soft">
                <details
                  name="qissati-faq"
                  className="group border-t-2 border-ink/10 transition-colors duration-300 open:border-gold"
                >
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-5 py-5 text-start text-lg font-bold text-ink transition-colors marker:hidden hover:text-brand-deep group-open:text-brand-deep [&::-webkit-details-marker]:hidden">
                    {q}
                    <Plus
                      className="mt-1 h-5 w-5 shrink-0 text-brand transition-transform duration-300 group-open:rotate-45"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </summary>

                  <p className="max-w-2xl pb-6 pe-10 text-base leading-loose text-muted">
                    {a}
                  </p>
                </details>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
