import { Sparkles, UserRound } from "lucide-react";
import { Reveal } from "./motion/Reveal";
import { Kicker, OrderButton } from "./ui";
import { orderPath } from "@/lib/site";

// Presentation only — the copy for each tier lives in dict.tiers.items.
// Order is DOM order: the recommended option comes second, so under `dir`
// it lands on the recto — the page you turn *to*, in either direction.
const TIERS = [
  // Avatar-only is announced but not yet orderable: the ready-made stories it
  // draws on aren't live, and the one order form there is asks the questions
  // that only make sense for the fully personalised flow. So it keeps its page
  // of the spread and states its status instead of offering a CTA that would
  // land the parent on the wrong form.
  { id: "avatar", Icon: UserRound, featured: false, comingSoon: true },
  { id: "custom", Icon: Sparkles, featured: true },
];

/**
 * The two options, set as the facing pages of one open spread rather than two
 * pricing cards.
 *
 * The old shape was the canonical SaaS pricing block: two rounded cards, the
 * recommended one inverted to dark with an animated gold rim and a floating
 * "most popular" badge, each with an icon in a tinted tile above a
 * check-in-circle feature list. Six template signatures in one section.
 *
 * The copy is what suggested the fix. It says both options end in the same
 * place and differ only in *how much* of the story is written around your
 * child — so this is one object with two halves, not two competing products:
 *
 *  - **One spread, one paper, a gutter down the middle.** No card borders, no
 *    shadows on the halves, no inverted colour. The pages are defined by the
 *    fold between them.
 *  - **The recommendation is a bookmark**, the same gold tab the header hangs
 *    over the active nav link (`bookmark-tab` in globals.css). A shared motif,
 *    not another badge pill.
 *  - **The columns stay unequal** — that part of the old layout was right. The
 *    recommended page is wider and its type is larger; it does not also need
 *    to be a different colour to win.
 *  - **The feature lists are hairline-separated rows**, not ticks in circles.
 *    A checklist reads as a pricing table; a ruled list reads as a spec.
 *
 * The spread stays **two-up at every width**, phones included. Stacking the
 * halves turns a comparison into two consecutive pitches — you cannot weigh
 * two options you have to scroll between. Below `sm` the columns go equal
 * (unequal ones leave the narrow half too thin to set Arabic in), the type
 * steps down, and the summary paragraph is dropped: the bulleted points say
 * the same thing in the form you actually compare, and running both summaries
 * as well makes each column a tall thin ribbon of text.
 */
export default function Tiers({ dict, lang }) {
  const t = dict.tiers;

  return (
    <section id="tiers" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 md:py-32">
      <Reveal className="max-w-2xl">
        <Kicker>{t.eyebrow}</Kicker>
        <h2 className="mt-5 text-3xl font-extrabold leading-[1.3] text-ink sm:text-4xl md:text-[2.75rem]">
          {t.title}
        </h2>
        <p className="mt-4 text-lg leading-loose text-muted">{t.lead}</p>
      </Reveal>

      {/* The spread. `shadow-book` and the gutter gradient are what make it
          read as a physical open book rather than a bordered panel. */}
      <Reveal variant="scale" delay={0.1}>
        <div className="relative mt-14 overflow-hidden rounded-2xl bg-cream-deep/60 shadow-book md:mt-16">
          {/* the fold: a dark hairline with light falling away from it on both
              sides, which is what a gutter actually looks like */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 start-[calc(50%-1.25rem)] w-10 bg-[linear-gradient(to_right,transparent,rgb(46_42_38/0.07)_45%,rgb(46_42_38/0.16)_50%,rgb(46_42_38/0.07)_55%,transparent)] md:start-[calc(42%-2rem)] md:w-16"
          />

          <div className="grid grid-cols-2 md:grid-cols-[0.84fr_1.16fr]">
            {TIERS.map(({ id, Icon, featured, comingSoon }) => {
              const { name, sub, body, points } = t.items[id];
              return (
                <article
                  key={id}
                  className={`relative flex min-w-0 flex-col p-4 sm:p-7 md:p-10 ${
                    featured
                      ? "bg-cream-deep/50 pt-8 sm:pt-9 md:pb-12 md:pt-14"
                      : "border-e border-ink/8"
                  }`}
                >
                  {featured ? (
                    <span
                      aria-hidden="true"
                      className="bookmark-tab absolute end-4 top-0 h-7 w-4 bg-gold sm:end-7 sm:h-9 sm:w-5 md:end-10"
                    />
                  ) : null}

                  <Icon
                    className={`text-brand ${featured ? "h-5 w-5 sm:h-7 sm:w-7" : "h-5 w-5 sm:h-6 sm:w-6"}`}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />

                  <h3
                    className={`mt-3 font-extrabold leading-tight text-ink text-balance sm:mt-5 ${
                      featured
                        ? "text-base sm:text-2xl md:text-3xl"
                        : "text-base sm:text-xl md:text-2xl"
                    }`}
                  >
                    {name}
                  </h3>
                  {/* The recommended label is announced here rather than only
                      by the decorative bookmark.

                      berry-deep, not berry: the tinted paper costs contrast
                      that plain white did not. `berry` measures 4.39:1 on this
                      background — just under AA — while `berry-deep` is
                      5.84:1. The old design got away with `berry` because the
                      card was pure white. */}
                  <p className="mt-1.5 text-[0.7rem] font-bold leading-snug text-berry-deep sm:text-sm">
                    {sub}
                    {featured ? (
                      <span className="text-brand-deep">
                        <span aria-hidden="true"> · </span>
                        <span className="whitespace-nowrap">{t.mostPopular}</span>
                      </span>
                    ) : null}
                  </p>

                  {/* The status is a stamp under the name, not a middot
                      annotation on the sub-line: it is the first thing you
                      need to know about this half, so it gets its own line,
                      full-weight ink and a gold underline. Underline rather
                      than a tinted pill — the pill is the badge shape this
                      whole section exists to avoid, and gold-rule-plus-text is
                      already the house idiom (see HowItWorks' footnote). */}
                  {comingSoon ? (
                    <p className="mt-3 w-fit border-b-2 border-gold pb-1 text-sm font-extrabold text-ink sm:mt-4 sm:text-lg">
                      {t.comingSoon}
                    </p>
                  ) : null}

                  {/* hidden below sm — see the note at the top of the file */}
                  <p
                    className={`mt-4 hidden leading-loose text-muted sm:block ${
                      featured ? "text-base md:text-lg" : "text-base"
                    }`}
                  >
                    {body}
                  </p>

                  <ul className="mt-4 flex flex-col sm:mt-7">
                    {points.map((point) => (
                      <li
                        key={point}
                        className="border-t border-ink/10 py-2.5 text-[0.8rem] leading-relaxed text-ink/80 first:border-t-0 first:pt-0 sm:py-3 sm:text-[0.95rem]"
                      >
                        {point}
                      </li>
                    ))}
                  </ul>

                  {/* mt-auto on the wrapper, not the button: padding classes
                      on CtaButton would fight its own size variant. */}
                  <div className="mt-auto pt-6 sm:pt-9">
                    {comingSoon ? (
                      // A ruled line of text, not a greyed-out button: a
                      // button-shaped element invites a tap that does nothing,
                      // and the hairline continues the rhythm of the spec rows
                      // above it. Nothing here looks pressable, so there is no
                      // dead control and no boundary to measure.
                      <p className="border-t-2 border-gold/60 pt-3 text-[0.8rem] font-bold text-ink/80 sm:pt-4 sm:text-base">
                        {t.comingSoon}
                      </p>
                    ) : (
                      <OrderButton
                        href={orderPath(lang)}
                        variant={featured ? "primary" : "outline"}
                        size="sm"
                        className="w-full text-[0.8rem] sm:px-6 sm:py-3 sm:text-base"
                      >
                        {t.cta}
                      </OrderButton>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
