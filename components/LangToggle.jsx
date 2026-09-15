"use client";

import { useEffect, useRef } from "react";
import { animate, utils } from "animejs";
import { otherLocale } from "@/lib/i18n";
import { canAnimate } from "@/lib/motion";

/**
 * Two-segment language switch.
 *
 * Deliberately a plain <a>, i.e. a full document navigation, not next/link.
 * Both locales share the `[lang]` layout, so a client-side transition between
 * them is a param change inside one layout: the router keeps the scroll
 * offset, and because the new locale's document is briefly shorter while it
 * renders, that offset gets clamped to the bottom — the page appeared to jump
 * to the footer on every switch. A document navigation also lets `<html dir>`
 * and everything that measures direction on mount (this knob, the header
 * ribbon, the carousel) initialise cleanly instead of re-measuring a tree that
 * flipped direction underneath them.
 *
 * `section` carries the reader's place across: both locales use the same
 * section ids, so switching language keeps you where you were rather than
 * dropping you at the top.
 *
 * The knob is positioned from getBoundingClientRect deltas rather than a
 * left/right class, so it lands correctly under both `dir=rtl` and `dir=ltr`
 * without a direction prop. On arrival it slides in from the *other* segment,
 * which makes the switch legible: you see the toggle move to where you just
 * put it. Hovering nudges it toward the other side as a preview.
 */
export default function LangToggle({ lang, dict, section, className = "" }) {
  const other = otherLocale(lang);
  const href = section ? `/${other}#${section}` : `/${other}`;
  const rootRef = useRef(null);
  const knobRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const knob = knobRef.current;
    if (!root || !knob) return;

    // Measure against the knob's own untransformed position rather than the
    // container's box: that sidesteps border/padding coordinate mismatches and
    // is direction-agnostic, since these are visual pixels either way.
    utils.set(knob, { translateX: 0 });
    const zero = knob.getBoundingClientRect().left;
    const xOf = (which) => {
      const el = root.querySelector(`[data-seg="${which}"]`);
      return el ? el.getBoundingClientRect().left - zero : 0;
    };

    const here = xOf("current");
    const there = xOf("other");

    // No motion available (reduced-motion, or a background tab where anime
    // would only ever apply the FROM value): park it and stop.
    if (!canAnimate()) {
      utils.set(knob, { translateX: here });
      return;
    }

    // Arrival: slide from where the knob sat in the previous locale.
    animate(knob, { translateX: [there, here], duration: 620, ease: "outBack" });

    const nudge = () =>
      animate(knob, { translateX: here + (there - here) * 0.3, duration: 280, ease: "outQuad" });
    const settle = () =>
      animate(knob, { translateX: here, duration: 420, ease: "outElastic(1, .7)" });

    root.addEventListener("pointerenter", nudge);
    root.addEventListener("pointerleave", settle);
    root.addEventListener("focus", nudge);
    root.addEventListener("blur", settle);
    return () => {
      root.removeEventListener("pointerenter", nudge);
      root.removeEventListener("pointerleave", settle);
      root.removeEventListener("focus", nudge);
      root.removeEventListener("blur", settle);
    };
  }, [lang]);

  return (
    <a
      ref={rootRef}
      href={href}
      hrefLang={other}
      lang={other}
      aria-label={dict.header.langSwitchTo}
      title={dict.header.langSwitchTo}
      data-intro="toggle"
      className={`relative inline-flex items-center rounded-full border border-cream/25 p-0.5 text-xs font-extrabold group-data-[solid]/hdr:border-brand/20 ${className}`}
    >
      {/* the knob, under the segment for the language you are reading now */}
      {/* Positioned with `top`/`left`, never a translate utility: anime writes
          the whole `transform` string, so a Tailwind -translate-y-1/2 here
          would be wiped the moment the knob first moves. */}
      <span
        ref={knobRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0.5 h-6 w-7 rounded-full bg-gold"
      />
      <span
        data-seg="current"
        className="relative z-10 grid h-6 w-7 place-items-center text-ink"
      >
        {dict.header.langShortCurrent}
      </span>
      {/* ink/70, not lighter: this label names the language you would switch
          to, so it is real text and has to clear AA at 12px. ink/55 on cream
          measures 3.38:1; ink/70 measures 5.23:1. */}
      <span
        data-seg="other"
        className="relative z-10 grid h-6 w-7 place-items-center text-cream/70 transition-colors group-data-[solid]/hdr:text-ink/70"
      >
        {dict.header.langShortOther}
      </span>
    </a>
  );
}
