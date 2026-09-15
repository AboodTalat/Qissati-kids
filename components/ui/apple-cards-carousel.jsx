"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpreadImage } from "@/components/BookArt";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";

/**
 * Adapted from Aceternity's Apple Cards Carousel.
 *
 * Changes from the shipped version:
 *  - RTL-correct scrolling. The original assumes `scrollLeft` grows from 0;
 *    under dir="rtl" Chrome reports it as 0 → negative, so the arrows and
 *    their disabled states were inverted and the end arrow was dead on load.
 *    Everything now works off `Math.abs(scrollLeft)` and a direction sign.
 *  - lucide icons instead of @tabler/icons-react, which was a second icon
 *    dependency for three glyphs.
 *  - Landscape cards holding rendered artwork, rather than portrait cards
 *    with a background photo and an overlaid title.
 *  - Cream/teal chrome instead of the gray-100 / neutral-900 dark styling.
 */

export const CarouselContext = createContext({
  onCardClose: () => {},
  currentIndex: 0,
});

export const Carousel = ({ items, labels, initialScroll = 0 }) => {
  const carouselRef = useRef(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // `scrollLeft` is negative in RTL, so compare on its magnitude.
  const checkScrollability = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const pos = Math.abs(el.scrollLeft);
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollStart(pos > 2);
    setCanScrollEnd(pos < max - 2);
  }, []);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
      checkScrollability();
    }
  }, [initialScroll, checkScrollability]);

  const step = (towardEnd) => {
    const el = carouselRef.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    const sign = rtl ? -1 : 1;
    el.scrollBy({ left: 320 * sign * (towardEnd ? 1 : -1), behavior: "smooth" });
  };

  const handleCardClose = (index) => {
    const el = carouselRef.current;
    if (!el) return;
    const cardWidth = window.innerWidth < 768 ? 240 : 384;
    const gap = window.innerWidth < 768 ? 16 : 24;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollTo({
      left: (rtl ? -1 : 1) * (cardWidth + gap) * (index + 1),
      behavior: "smooth",
    });
    setCurrentIndex(index);
  };

  return (
    <CarouselContext.Provider value={{ onCardClose: handleCardClose, currentIndex }}>
      <div className="relative w-full">
        <div
          className="flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          ref={carouselRef}
          onScroll={checkScrollability}
        >
          <div className="flex w-max flex-row justify-start gap-4 ps-5 pe-16 sm:ps-8 md:gap-6 md:pe-32">
            {items.map((item, index) => (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{
                  duration: 0.5,
                  delay: 0.1 * index,
                  ease: [0.22, 1, 0.36, 1],
                }}
                key={`card-${index}`}
                className="rounded-card"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="me-5 flex justify-end gap-2 sm:me-8">
          <button
            type="button"
            aria-label={labels.previous}
            className="relative z-40 flex h-11 w-11 items-center justify-center rounded-full bg-brand-tint text-brand-deep transition-colors hover:bg-brand hover:text-white disabled:opacity-40 disabled:hover:bg-brand-tint disabled:hover:text-brand-deep"
            onClick={() => step(false)}
            disabled={!canScrollStart}
          >
            {/* "Previous" points toward the start edge: right under rtl,
                left under ltr. Both are rendered and one is hidden by the
                dir-keyed variant, so no direction prop has to be threaded. */}
            <ArrowRight className="h-5 w-5 ltr:hidden" aria-hidden="true" />
            <ArrowLeft className="h-5 w-5 rtl:hidden" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={labels.next}
            className="relative z-40 flex h-11 w-11 items-center justify-center rounded-full bg-brand-tint text-brand-deep transition-colors hover:bg-brand hover:text-white disabled:opacity-40 disabled:hover:bg-brand-tint disabled:hover:text-brand-deep"
            onClick={() => step(true)}
            disabled={!canScrollEnd}
          >
            <ArrowLeft className="h-5 w-5 ltr:hidden" aria-hidden="true" />
            <ArrowRight className="h-5 w-5 rtl:hidden" aria-hidden="true" />
          </button>
        </div>
      </div>
    </CarouselContext.Provider>
  );
};

export const Card = ({ card, index, labels, layout = false }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const { onCardClose } = useContext(CarouselContext);

  const handleClose = useCallback(() => {
    setOpen(false);
    onCardClose(index);
  }, [onCardClose, index]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") handleClose();
    };
    document.body.style.overflow = open ? "hidden" : "auto";
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  useOutsideClick(containerRef, handleClose);

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 h-screen overflow-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 h-full w-full bg-ink/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              ref={containerRef}
              layoutId={layout ? `card-${card.id}` : undefined}
              role="dialog"
              aria-modal="true"
              aria-label={card.title}
              className="relative z-[60] mx-auto my-10 h-fit max-w-3xl rounded-blob bg-surface p-5 shadow-lift md:p-8"
            >
              <button
                type="button"
                aria-label={labels.close}
                className="sticky top-2 ms-auto flex h-9 w-9 items-center justify-center rounded-full bg-ink text-cream"
                onClick={handleClose}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
              <motion.p
                layoutId={layout ? `category-${card.id}` : undefined}
                className="text-sm font-bold text-brand-deep"
              >
                {card.category}
              </motion.p>
              <motion.p
                layoutId={layout ? `title-${card.id}` : undefined}
                className="mt-2 text-2xl font-extrabold text-ink md:text-3xl"
              >
                {card.title}
              </motion.p>
              <div className="mt-6 overflow-hidden rounded-card">
                <SpreadImage
                  spread={card}
                  sizes="(max-width: 768px) 92vw, 48rem"
                  className="h-auto w-full"
                />
              </div>
              {card.body ? (
                <p className="mt-6 text-base leading-loose text-muted">{card.body}</p>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        layoutId={layout ? `card-${card.id}` : undefined}
        onClick={() => setOpen(true)}
        aria-label={`${labels.open} — ${card.title}`}
        className="group relative z-10 flex w-[15rem] shrink-0 flex-col overflow-hidden rounded-card bg-surface p-3 text-start shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:w-96 md:p-4"
      >
        <div className="overflow-hidden rounded-xl">
          <SpreadImage
            spread={card}
            sizes="(max-width: 768px) 15rem, 24rem"
            className="h-auto w-full"
          />
        </div>
        <div className="flex items-center justify-between gap-3 px-1 pt-3 pb-1">
          <motion.span
            layoutId={layout ? `title-${card.id}` : undefined}
            className="text-sm font-bold text-ink md:text-base"
          >
            {card.title}
          </motion.span>
          <span className="shrink-0 rounded-full bg-brand-tint px-2.5 py-1 text-xs font-bold text-brand-deep transition-colors group-hover:bg-brand group-hover:text-white">
{labels.zoom}
          </span>
        </div>
      </motion.button>
    </>
  );
};
