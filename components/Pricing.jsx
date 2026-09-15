import { FileText, BookOpen } from "lucide-react";
import { Reveal } from "./motion/Reveal";
import { Kicker, OrderButton } from "./ui";
import { orderPath } from "@/lib/site";

// Presentation only — copy lives in dict.pricing.plans, in both languages.
const PLANS = [
  { id: "pdf", Icon: FileText, highlight: false },
  { id: "print", Icon: BookOpen, highlight: true },
];

/**
 * What each format starts at, from the live price table.
 *
 * "Starts from" is literal: the cheapest way to buy that format is the base
 * story at 8 pages, so the PDF is the base price and the printed copy is the
 * base plus the print add-on. Every longer or gifted variant costs more, which
 * is what "from" means.
 *
 * Returns `null` — which renders as the dictionary's `[X]` — unless every
 * component is a real number. A partial sum here would put a price on the
 * landing page that the order page then contradicts.
 */
function startsFrom(id, pricing) {
  const base = pricing?.base;
  if (typeof base !== "number") return null;
  if (id === "pdf") return base;
  const print = pricing?.format?.print;
  return typeof print === "number" ? base + print : null;
}

/**
 * A price list, not a pricing table.
 *
 * The old version was the stock SaaS pricing block almost line for line: two
 * bordered white cards side by side, the recommended one ringed in gold with a
 * blurred glow blob behind its corner, an icon in a tinted rounded tile, a
 * huge number, and a checklist of ticks.
 *
 *  - **Rows, not cards.** Two formats is a list of two things. Each is one
 *    ruled row — description on the start edge, price and CTA on the end —
 *    which is what a price list actually looks like in print.
 *  - **The price is not a hero number.** It is `[X]` until launch (see
 *    "Deliberate placeholders"), and a 4xl bracket looks like a bug. It is
 *    sized to sit level with the format name instead of dominating it.
 *  - **The recommendation is the bookmark again**, the same gold tab the header
 *    hangs over the active link and Tiers hangs on the recto. Third use, same
 *    meaning — that is a system rather than decoration.
 *  - **Points are an inline spec line**, middot-separated. Ticks in a column
 *    read as a pricing table, and a ruled stack would just repeat Tiers.
 *
 * No glow blob, no tinted tiles, no card shadows, and the closing footnote is
 * start-aligned like everything else on the page.
 */
export default function Pricing({ dict, lang, pricing }) {
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

        <ul className="mt-12 md:mt-14">
          {PLANS.map(({ id, Icon, highlight }, i) => {
            const { name, price: placeholder, note, points } = t.plans[id];
            // The owner's number when they have set one, the dictionary's
            // `[X]` when they have not.
            const amount = startsFrom(id, pricing);
            const price = amount === null ? placeholder : String(amount);
            return (
              <Reveal
                as="li"
                key={id}
                delay={i * 0.1}
                variant="soft"
                className="relative grid gap-x-10 gap-y-6 border-t border-ink/12 py-8 last:border-b md:grid-cols-[1fr_auto] md:items-center md:py-10"
              >
                {highlight ? (
                  <span
                    aria-hidden="true"
                    className="bookmark-tab absolute start-0 top-0 h-7 w-4 bg-gold"
                  />
                ) : null}

                <div className="md:ps-8">
                  <div className="flex items-center gap-3">
                    <Icon
                      className="h-5 w-5 shrink-0 text-brand"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <h3 className="text-xl font-extrabold leading-tight text-ink sm:text-2xl">
                      {name}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-muted">{note}</p>

                  {/* The spec line — one wrapped row with middots between.
                      Still a real <ul>: it reads as a line, but these are a
                      list of three things and flattening them into a <p> would
                      hand a screen reader one run-on sentence. The separator
                      lives inside each item, since a bare <span> is not valid
                      as a child of <ul>. */}
                  <ul className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.95rem] leading-relaxed text-ink/80">
                    {points.map((point, j) => (
                      <li key={point} className="flex items-center gap-2.5">
                        {j > 0 ? (
                          <span aria-hidden="true" className="text-brand/50">
                            ·
                          </span>
                        ) : null}
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-4 md:flex-col md:items-end md:gap-4">
                  <p className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-muted">
                      {t.startsFrom}
                    </span>
                    <span className="text-3xl font-extrabold text-berry-deep">
                      {price}
                    </span>
                    <span className="text-base font-bold text-ink/70">
                      {t.currency}
                    </span>
                  </p>
                  <OrderButton
                    href={`${orderPath(lang)}?format=${id}`}
                    variant={highlight ? "primary" : "outline"}
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    {t.cta}
                  </OrderButton>
                </div>
              </Reveal>
            );
          })}
        </ul>

        <Reveal delay={0.15} variant="soft">
          <p className="mt-8 max-w-xl text-sm leading-relaxed text-muted">
            {t.footnote}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
