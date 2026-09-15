import { ArrowLeft, ArrowRight, Sparkles as SparkleIcon } from "lucide-react";
import BookShowcase from "./BookShowcase";
import HeroRoles from "./HeroRoles";
import { Enter, WordReveal } from "./motion/Reveal";
import { Button, CtaButton, InstagramIcon } from "./ui";
import { ORDER_URL } from "@/lib/site";

/**
 * Deep-teal night hero.
 *
 * The brand's own dark end (#0d4143 → #146466), not a new colour — and the
 * sample story is literally about the night, so the page opens inside the
 * book's own world. It also gives the page a light/dark rhythm: everything
 * below this is cream, which is what the brief asks for and what stops the
 * page reading as one long strip of identical sections.
 *
 * No aurora blobs, no grain, no overlay effects: the artwork is the hero, and
 * decoration layered on top of it only competes with it.
 */
export default function Hero({ dict }) {
  const t = dict.hero;

  return (
    <section
      id="top"
      className="relative isolate overflow-hidden bg-[#0d4143] pb-28 md:pb-36"
    >
      {/* the night sky the cover sits in — one soft pool of warm light behind
          the book, matching the glow inside the illustration itself */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_25%_35%,#1a6b6d_0%,#0d4143_55%,#082e30_100%)]" />
        <div className="absolute start-[8%] top-[28%] hidden h-[26rem] w-[26rem] rounded-full bg-gold/15 blur-[90px] lg:block" />
        <StarField />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pt-28 sm:px-8 md:pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        {/* ── Copy ─────────────────────────────────────────────── */}
        <div className="flex flex-col items-start gap-7 text-start">
          <Enter variant="soft">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/5 px-4 py-1.5 text-sm font-bold text-gold-soft backdrop-blur-sm">
              <SparkleIcon className="h-4 w-4" aria-hidden="true" />
{t.badge}
            </span>
          </Enter>

          <h1 className="text-[2.7rem] font-extrabold leading-[1.22] tracking-tight text-cream sm:text-6xl sm:leading-[1.16]">
            <WordReveal text={t.titleA} />{" "}
            <WordReveal text={t.titleB} delay={0.08} className="text-gold" />{" "}
            <WordReveal text={t.titleC} delay={0.16} />
          </h1>

          <Enter delay={0.35}>
            <p className="max-w-xl text-lg leading-loose text-cream/75 sm:text-xl">
{t.lead}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-1 text-lg font-bold text-cream sm:text-xl">
              <span>{t.rolesPrefix}</span>
              {/* min-width reserves room for the longest role in either
                  language so the line does not reflow on every flip */}
              <span className="relative inline-flex h-8 min-w-[8.5rem] items-center sm:min-w-[11rem]">
                <HeroRoles roles={t.roles} />
              </span>
            </div>
          </Enter>

          <Enter delay={0.45} className="w-full sm:w-auto">
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <CtaButton href={ORDER_URL} size="lg" className="group w-full sm:w-auto">
                <InstagramIcon className="h-5 w-5" aria-hidden="true" />
{t.ctaOrder}
              </CtaButton>
              <Button
                href="#sample"
                variant="onDark"
                size="lg"
                className="group w-full sm:w-auto"
              >
                {t.ctaSample}
                {/* "Forward" points toward the end edge — left under rtl,
                    right under ltr — and the hover nudge follows it. Both
                    icons render; the dir-keyed variant hides the wrong one. */}
                <ArrowLeft
                  className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1 ltr:hidden"
                  aria-hidden="true"
                />
                <ArrowRight
                  className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 rtl:hidden"
                  aria-hidden="true"
                />
              </Button>
            </div>
          </Enter>

          <Enter delay={0.55} variant="soft">
            <p className="text-sm font-medium text-cream/65">
{t.reassure}
            </p>
          </Enter>
        </div>

        {/* ── The book ─────────────────────────────────────────── */}
        <BookShowcase dict={dict} />
      </div>

      {/* hand-off into the cream page below */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-cream"
      />
    </section>
  );
}

// Fixed coordinates rather than Math.random(), so server and client markup
// match and nothing shifts on hydration.
const STARS = [
  [4, 14, 2], [11, 47, 1.5], [17, 22, 2.5], [24, 66, 1.5], [31, 9, 2],
  [38, 38, 1.5], [44, 72, 2], [52, 17, 2.5], [59, 52, 1.5], [66, 28, 2],
  [72, 63, 1.5], [79, 12, 2.5], [85, 44, 2], [91, 71, 1.5], [96, 26, 2],
  [8, 82, 1.5], [28, 88, 2], [48, 92, 1.5], [69, 86, 2], [88, 90, 1.5],
];

function StarField() {
  return (
    <div className="absolute inset-0">
      {STARS.map(([x, y, r], i) => (
        <span
          key={i}
          className="absolute rounded-full bg-gold-soft animate-twinkle"
          style={{
            insetInlineStart: `${x}%`,
            top: `${y}%`,
            width: `${r}px`,
            height: `${r}px`,
            animationDelay: `${(i % 6) * 0.7}s`,
          }}
        />
      ))}
    </div>
  );
}
