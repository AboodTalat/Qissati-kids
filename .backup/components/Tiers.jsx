import { Check, Sparkles, UserRound } from "lucide-react";
import { Reveal } from "./motion/Reveal";
import { CtaButton, Eyebrow } from "./ui";
import { ORDER_URL } from "@/lib/site";

// Presentation only — the copy for each tier lives in dict.tiers.items.
const TIERS = [
  { id: "avatar", Icon: UserRound, featured: false },
  { id: "custom", Icon: Sparkles, featured: true },
];

export default function Tiers({ dict }) {
  const t = dict.tiers;
  return (
    <section id="tiers" className="relative overflow-hidden py-24 md:py-32">
      {/* a tinted band that stops short of the viewport edges, so this section
          is a panel on the page rather than another full-width stripe */}
      <div
        aria-hidden="true"
        className="absolute inset-x-3 inset-y-0 rounded-[3rem] bg-cream-deep/75 sm:inset-x-6"
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h2 className="mt-5 text-3xl font-extrabold leading-[1.3] text-ink sm:text-4xl md:text-[2.75rem]">
{t.title}
          </h2>
          <p className="mt-4 text-lg leading-loose text-muted">
{t.lead}
          </p>
        </Reveal>

        {/* deliberately unequal columns — the recommended tier is physically
            bigger and sits lower, so the choice reads before the copy does */}
        <div className="mt-14 grid items-start gap-6 md:mt-16 md:grid-cols-[0.85fr_1.15fr] md:gap-8">
          {TIERS.map(({ id, Icon, featured }, i) => {
            const { name, sub, body, points } = t.items[id];
            return (
            <Reveal
              key={id}
              delay={i * 0.12}
              variant="scale"
              className={featured ? "md:-mt-8" : "md:mt-4"}
            >
              <article
                className={`group relative flex h-full flex-col gap-5 rounded-blob p-7 transition-all duration-300 sm:p-9 ${
                  featured
                    ? "bg-brand-deep text-white shadow-lift hover:-translate-y-1"
                    : "border border-ink/8 bg-surface text-ink shadow-soft hover:-translate-y-1 hover:shadow-lift"
                }`}
              >
                {featured ? (
                  <>
                    {/* animated gold rim — the Aceternity background-gradient
                        idea, recoloured and done in CSS instead of JS */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-blob ring-2 ring-gold/60 animate-sheen"
                    />
                    <span className="absolute -top-3.5 end-7 rounded-full bg-gold px-4 py-1 text-sm font-extrabold text-ink shadow-soft">
{t.mostPopular}
                    </span>
                  </>
                ) : null}

                <span
                  className={`grid h-14 w-14 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-105 ${
                    featured
                      ? "bg-white/15 text-gold-soft"
                      : "bg-brand-tint text-brand-deep"
                  }`}
                >
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </span>

                <div>
                  <h3 className={featured ? "text-3xl font-extrabold" : "text-2xl font-extrabold"}>
                    {name}
                  </h3>
                  <p
                    className={`mt-1 text-sm font-bold ${
                      featured ? "text-gold-soft" : "text-berry"
                    }`}
                  >
                    {sub}
                  </p>
                </div>

                <p
                  className={`text-base leading-loose ${
                    featured ? "text-white/85" : "text-muted"
                  }`}
                >
                  {body}
                </p>

                <ul className="flex flex-col gap-3">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                          featured ? "bg-gold text-brand-deep" : "bg-brand-tint text-brand-deep"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={3} />
                      </span>
                      <span
                        className={`text-[0.95rem] leading-relaxed ${
                          featured ? "text-white/90" : "text-ink/80"
                        }`}
                      >
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>

                <CtaButton
                  href={ORDER_URL}
                  variant={featured ? "primary" : "outline"}
                  className="mt-auto w-full"
                >
{t.cta}
                </CtaButton>
              </article>
            </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
