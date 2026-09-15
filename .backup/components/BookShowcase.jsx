"use client";

import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { BookCover } from "./BookArt";

/**
 * The cover, presented as a physical book. On pointer devices it gets
 * Aceternity's 3D tilt; on touch — where that interaction does not exist, and
 * where most of our Instagram traffic lives — it still arrives with an
 * entrance and keeps its slow float, so the hero never depends on hover.
 */
export default function BookShowcase({ dict }) {
  const t = dict.sample;

  return (
    <div
      data-enter="scale"
      style={{ "--enter-delay": "0.15s" }}
      className="relative mx-auto w-full max-w-[19rem] sm:max-w-[21rem] lg:max-w-none"
    >
      <CardContainer containerClassName="!py-0" className="w-full">
        <CardBody className="relative h-auto w-full">
          {/* warm light spilling out from behind the cover */}
          <CardItem
            translateZ={-60}
            className="absolute -inset-8 rounded-[50%] bg-gold/20 blur-3xl"
          />
          {/* the shadow it casts */}
          <CardItem
            translateZ={-30}
            className="absolute inset-x-8 bottom-1 h-8 rounded-[50%] bg-black/40 blur-2xl"
          />
          {/* a second copy behind, so it reads as a printed book */}
          <CardItem
            translateZ={10}
            rotateZ={-6}
            className="absolute inset-0 rounded-2xl bg-cream-deep/80 shadow-2xl"
          />

          <CardItem translateZ={60} rotateZ={-1.5} className="w-full">
            <div className="animate-float overflow-hidden rounded-2xl shadow-book ring-1 ring-white/10">
              <BookCover
                priority
                alt={dict.book.coverAlt}
                sizes="(max-width: 640px) 76vw, (max-width: 1024px) 21rem, 30rem"
                className="h-auto w-full"
              />
              {/* the printed title, set in Cairo — the artwork is textless on
                  purpose so Arabic type is never left to the image model */}
              <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/55 via-black/25 to-transparent p-5 pb-10 text-center sm:p-7 sm:pb-14">
                <p className="text-xl font-extrabold leading-tight text-gold drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-2xl">
{t.bookTitleTop}
                </p>
                <p className="mt-1 text-base font-bold text-cream drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-lg">
{t.bookTitleBottom}
                </p>
              </div>
            </div>
          </CardItem>

          {/* proof chip, furthest forward in the 3D stack */}
          <CardItem translateZ={110} className="absolute -bottom-5 start-0 sm:-start-8">
            <div className="flex items-center gap-2.5 rounded-2xl bg-surface/95 px-4 py-3 shadow-lift backdrop-blur">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-berry/10 text-lg">
                👧
              </span>
              <span className="text-sm font-bold leading-tight text-ink">
{dict.book.chipTitle}
                <span className="block text-xs font-medium text-muted">
                  {dict.book.chipSub}
                </span>
              </span>
            </div>
          </CardItem>

          <CardItem translateZ={90} className="absolute -top-4 end-2 sm:end-[-1.25rem]">
            <span className="rounded-full bg-gold px-3.5 py-1.5 text-xs font-extrabold text-ink shadow-soft">
{dict.book.chipBadge}
            </span>
          </CardItem>
        </CardBody>
      </CardContainer>
    </div>
  );
}
