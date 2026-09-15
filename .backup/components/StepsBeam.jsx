"use client";

import { MessageCircleHeart, BookHeart, Gift } from "lucide-react";
import { TracingBeam } from "@/components/ui/tracing-beam";

// Icons pair with dict.how.steps by position.
const ICONS = [MessageCircleHeart, BookHeart, Gift];

/**
 * Aceternity's TracingBeam, recoloured teal→gold→berry, drawing itself down
 * the start edge as the steps scroll past — so the three stages read as one
 * continuous journey instead of three parked cards.
 */
export default function StepsBeam({ steps }) {
  return (
    <TracingBeam className="px-4 md:px-0">
      <ol className="flex flex-col gap-12 md:gap-16">
        {steps.map(({ title, body }, i) => {
          const Icon = ICONS[i];
          return (
          <li key={title} className="group relative flex items-start gap-5 sm:gap-7">
            <span className="grid h-[3.25rem] w-[3.25rem] shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-soft transition-all duration-300 group-hover:scale-105 group-hover:bg-brand-deep">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="pt-1">
              <span className="inline-block rounded-full bg-gold px-2.5 py-0.5 text-xs font-extrabold tracking-widest text-ink">
                {`0${i + 1}`}
              </span>
              <h3 className="mt-2 text-xl font-extrabold text-ink sm:text-2xl">
                {title}
              </h3>
              <p className="mt-2 max-w-lg text-base leading-loose text-muted">
                {body}
              </p>
            </div>
          </li>
          );
        })}
      </ol>
    </TracingBeam>
  );
}
