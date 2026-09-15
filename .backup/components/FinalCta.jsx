import { Aurora, Sparkles } from "./motion/Ambient";
import { Reveal } from "./motion/Reveal";
import { CtaButton, InstagramIcon } from "./ui";
import { INSTAGRAM_HANDLE, ORDER_URL } from "@/lib/site";

export default function FinalCta({ dict }) {
  const t = dict.finalCta;

  return (
    <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8 md:pb-32">
      <Reveal variant="scale">
        <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-brand-deep px-6 py-16 text-center shadow-lift sm:px-12 sm:py-20">
          <Aurora tone="deep" className="opacity-30" />
          <Sparkles className="opacity-80" />

          <div className="relative flex flex-col items-center gap-6">
            <h2 className="max-w-2xl text-3xl font-extrabold leading-[1.4] text-white sm:text-[2.5rem]">
{t.title}
            </h2>
            <p className="max-w-xl text-lg leading-loose text-white/85">
{t.lead}
            </p>
            <CtaButton href={ORDER_URL} size="lg" className="mt-2">
              <InstagramIcon className="h-5 w-5" aria-hidden="true" />
{t.cta}
            </CtaButton>
            <span className="text-sm font-semibold text-white/85" dir="ltr">
              {INSTAGRAM_HANDLE}
            </span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
