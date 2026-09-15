"use client";

import { ArrowDown } from "lucide-react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { BookCover } from "./BookArt";
import { Kicker } from "./ui";

/**
 * Aceternity's ContainerScroll: the cover starts tilted back and rights itself
 * as the section scrolls through, so the book reads as being lifted toward the
 * reader rather than pasted onto the page.
 *
 * It lives here rather than in the hero on purpose — the component reserves a
 * lot of scroll height, which above the fold would push the order CTA out of
 * view on a phone.
 */
export default function BookReveal({ dict }) {
  const t = dict.sample;

  return (
    <ContainerScroll
      titleComponent={
        <div className="flex flex-col items-center gap-5 px-5">
          <Kicker>{t.eyebrow}</Kicker>
          <h2 className="text-3xl font-extrabold leading-[1.3] text-ink sm:text-4xl md:text-[2.75rem]">
{t.title}
          </h2>
          <p className="max-w-xl text-lg leading-loose text-muted">
{t.lead}
          </p>
        </div>
      }
    >
      <div className="flex h-full items-center justify-center gap-8 p-4 sm:p-8">
        <div className="relative w-full max-w-[13rem] shrink-0 sm:max-w-[15rem]">
          <div className="relative overflow-hidden rounded-xl shadow-book">
            <BookCover
              alt={dict.book.coverAlt}
              sizes="(max-width: 640px) 50vw, 15rem"
              className="h-auto w-full"
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/55 via-black/25 to-transparent p-4 pb-8 text-center">
              <p className="text-base font-extrabold leading-tight text-gold drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
{t.bookTitleTop}
              </p>
              <p className="text-sm font-bold text-cream drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
{t.bookTitleBottom}
              </p>
            </div>
          </div>
        </div>
        <div className="hidden flex-col gap-3 text-start sm:flex">
          <p className="text-xl font-extrabold text-ink md:text-2xl">
{t.bookFullTitle}
          </p>
          <p className="max-w-xs text-base leading-loose text-muted">
{t.bookNote}
          </p>
          {/* the gallery is directly below, so the cue points down — a
              horizontal arrow would have to mirror per direction */}
          <p className="flex items-center gap-1.5 text-sm font-bold text-brand-deep">
            {t.galleryHint}
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </p>
        </div>
      </div>
    </ContainerScroll>
  );
}
