"use client";

import { useEffect, useRef } from "react";
import { createTimeline, onScroll } from "animejs";
import { BookCover, SpreadImage } from "./BookArt";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * The hero's book, opening as you scroll.
 *
 * The logo mark is a child stepping out of an open book; this is that image
 * performing itself. The cover swings on its spine under a scroll-scrubbed
 * timeline and the first spread is revealed underneath it, so the page hands
 * off to the story rather than to another band of marketing copy.
 *
 * Three things make it read as a book rather than a rotating rectangle:
 *
 *  - `sync: 0.45` on the ScrollObserver. A linear scrub (`sync: true`) is
 *    locked 1:1 to the scrollbar and feels like dragging a slider; a catch-up
 *    value gives the cover mass, which is the whole difference.
 *  - The spine is the transform origin, and a book's spine is on the side the
 *    language starts from — right in Arabic, left in English. That flips the
 *    rotation sign too, and it is the one thing here that cannot be derived
 *    from a bounding rect.
 *  - The cover has a real back face. Past 90° you are looking at the inside of
 *    the front cover, and a mirrored front image there gives the trick away.
 *
 * Progress 0 is the closed book with its printed title — the finished, correct
 * state. If the scrub never runs (JS blocked, reduced motion, a background tab
 * where anime's engine is paused) the hero is a closed book on the brand's
 * deep-teal stage, which is exactly what it should look like before you scroll.
 */
export default function HeroBook({ dict, spread }) {
  const rootRef = useRef(null);
  const coverRef = useRef(null);
  const glowRef = useRef(null);
  const spreadRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const cover = coverRef.current;
    const glow = glowRef.current;
    const page = spreadRef.current;
    if (!root || !cover || !glow || !page) return;
    // prefersReducedMotion, NOT canAnimate: the hidden-document half of that
    // guard exists for entrances, which apply a FROM value and freeze there if
    // the engine is paused. A scroll scrub's progress-0 state IS its resting
    // state — a closed book — so there is nothing to be displaced. Bailing on
    // a hidden document would instead disable the scrub permanently for anyone
    // who opened the page in a background tab and only scrolled it later.
    if (prefersReducedMotion()) return;

    // Arabic books are bound on the right and open toward the left-hand page;
    // English books are the mirror. The hinge itself is CSS (origin-left /
    // rtl:origin-right); only the rotation's sign has to be decided here.
    const rtl = getComputedStyle(document.documentElement).direction === "rtl";
    // 118°, not something closer to flat. Two reasons, and they agree: a book
    // opened almost to 180° reads as a flat slab rather than a book, and the
    // cover's horizontal reach past the spine grows with the angle — at 152°
    // it swung clear over the headline and the order button.
    const open = rtl ? 118 : -118;

    const tl = createTimeline({
      defaults: { ease: "linear" },
      autoplay: onScroll({
        target: root,
        // Thresholds read "<target edge> <container edge>". The range runs from
        // the runway's top reaching the viewport top to its bottom reaching the
        // viewport bottom — i.e. exactly the span over which the book is pinned.
        // Its length is `runway height - viewport height`, which is why the
        // runway is taller than the screen; with a runway shorter than the
        // viewport this range inverts and the scrub silently never runs.
        enter: "top top",
        leave: "bottom bottom",
        sync: 0.45,
      }),
    });

    tl.add(cover, { rotateY: open, duration: 100 }, 0)
      // The revealed page pushes forward slightly as the cover clears it.
      .add(page, { scale: [0.94, 1], duration: 100 }, 0)
      // Warm light spills out of the book as it opens — motivated by the
      // opening rather than a decorative blur sitting there from the start.
      .add(glow, { opacity: [0, 1], scale: [0.8, 1.05], duration: 100 }, 0);

    // revert() restores every property this timeline touched to the value it
    // had before, so nothing inline is left behind on unmount.
    return () => tl.revert();
  }, []);

  return (
    // The runway is the scroll trigger and it is deliberately NOT the sticky
    // element: a stuck element's bounding rect stops moving, which would freeze
    // the scrub half-way through. Its height above 100vh IS the scrub length.
    // The book is pinned for all of it, so the extra height is never empty
    // space — and on phones the copy and the CTA sit ABOVE the book, so none of
    // this pushes the order button further down.
    <div ref={rootRef} className="h-[150vh] lg:h-[190vh]">
    <div
      className="sticky top-24 mx-auto w-full max-w-[19rem] sm:max-w-[22rem] lg:top-28 lg:mx-0 lg:max-w-none"
      style={{ perspective: "1800px" }}
    >
      {/* light from inside the book */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute -inset-10 rounded-[50%] bg-gold/25 opacity-0 blur-3xl"
      />

      <div className="relative aspect-square w-full">
        {/* the shadow the book casts on the brand field */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 -bottom-2 h-8 rounded-[50%] bg-black/45 blur-2xl"
        />

        {/* ── revealed interior ─────────────────────────────────── */}
        <div
          ref={spreadRef}
          className="absolute inset-0 overflow-hidden rounded-2xl bg-cream-deep shadow-book ring-1 ring-white/10"
        >
          <SpreadImage
            spread={spread}
            sizes="(max-width: 640px) 76vw, (max-width: 1024px) 22rem, 28rem"
            className="h-full w-full object-cover"
          />
        </div>

        {/* ── the cover, hinged on the spine ────────────────────── */}
        {/* The spine is the hinge. It is set with dir-keyed origin utilities
            rather than in JS, so it is correct in the markup itself and cannot
            be missed by an effect that bailed early. */}
        <div
          ref={coverRef}
          className="absolute inset-0 origin-left rtl:origin-right [transform-style:preserve-3d]"
        >
          {/* front */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl shadow-book ring-1 ring-white/10 [backface-visibility:hidden]">
            <BookCover
              priority
              alt={dict.book.coverAlt}
              sizes="(max-width: 640px) 76vw, (max-width: 1024px) 22rem, 28rem"
              className="h-full w-full object-cover"
            />
            {/* the printed title, set in Cairo — the artwork is textless on
                purpose so Arabic type is never left to the image model */}
            <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/55 via-black/25 to-transparent p-5 pb-10 text-center sm:p-7 sm:pb-14">
              <p className="text-xl font-extrabold leading-tight text-gold drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-2xl">
                {dict.sample.bookTitleTop}
              </p>
              <p className="mt-1 text-base font-bold text-cream drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-lg">
                {dict.sample.bookTitleBottom}
              </p>
            </div>
          </div>

          {/* inside of the front cover — plain board stock, as a real book has.
              Without this you see the cover art mirrored past 90°. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-2xl bg-cream-deep [backface-visibility:hidden] [transform:rotateY(180deg)]"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-bl from-black/10 via-transparent to-black/20" />
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
