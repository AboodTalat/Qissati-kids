"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { Check, X } from "lucide-react";
import { CtaButton, WhatsAppIcon } from "../ui";
import { canAnimate } from "@/lib/motion";

/**
 * The last screen of the order flow: the order is filed, the parent has been
 * handed off to WhatsApp, and the form behind this dialog has just been wiped.
 *
 * **It exists because of that wipe.** Resetting the form is what lets a parent
 * order a second story for a second child without reloading, but it also takes
 * away every trace of what they just did — including the reference, which the
 * review dialog was the only thing showing. So this dialog carries the
 * reference, and it carries the WhatsApp link a second time: if the new tab
 * was blocked, or WhatsApp is not installed on that device, this is the only
 * remaining way to reach the conversation the whole flow was pointing at.
 *
 * It is the third component using the `"closed" | "open" | "closing"` modal
 * pattern (`MobileDrawer`, `ReviewDialog`, this), and the duplication is
 * deliberate: the two existing copies have a bug history in exactly this
 * wiring — a non-memoised `onDismiss` tearing down the modal effect mid-open —
 * and folding them into a shared shell is a change to make on its own, not on
 * the way past. `onDismiss` and `onExited` must stay memoised here too.
 */
export default function ThankYouDialog({
  state, // "open" | "closing"
  onDismiss,
  onExited,
  dict,
  result, // { reference, waHref } — frozen before the form was reset
  returnFocusRef,
}) {
  const r = dict.order.thanks;
  const panelRef = useRef(null);
  const scrimRef = useRef(null);

  const open = state === "open";

  useEffect(() => {
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    if (!panel || !scrim) return;

    if (!canAnimate()) {
      if (!open) onExited();
      return;
    }

    if (open) {
      animate(scrim, { opacity: [0, 1], duration: 220, ease: "outQuad" });
      animate(panel, {
        opacity: [0, 1],
        translateY: [24, 0],
        scale: [0.97, 1],
        duration: 420,
        ease: "outExpo",
      });
      return;
    }

    animate(scrim, { opacity: 0, duration: 180, ease: "inQuad" });
    const out = animate(panel, {
      opacity: 0,
      translateY: 16,
      duration: 200,
      ease: "inQuad",
      onComplete: onExited,
    });
    return () => out.pause();
  }, [open, onExited]);

  // Modal duties: scroll lock, initial focus, Tab trap.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !open) return;

    const returnTo = returnFocusRef?.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      [...panel.querySelectorAll("a[href], button:not([disabled])")];
    focusables()[0]?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        onDismiss();
        return;
      }
      if (e.key !== "Tab") return;
      const els = focusables();
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener("keydown", onKey);
    return () => {
      panel.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      returnTo?.focus();
    };
  }, [open, onDismiss, returnFocusRef]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <div
        ref={scrimRef}
        onClick={onDismiss}
        aria-hidden="true"
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="thanks-title"
        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] bg-cream shadow-lift sm:max-h-[85dvh] sm:rounded-[1.75rem]"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-8">
          <span
            aria-hidden="true"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-deep text-cream"
          >
            <Check className="h-6 w-6" />
          </span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label={r.closeLabel}
            className="shrink-0 rounded-full border-2 border-brand-deep/70 p-2 text-brand-deep transition-colors hover:bg-brand-tint"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-2 pt-5 sm:px-8">
          <h2 id="thanks-title" className="text-2xl font-extrabold text-ink sm:text-3xl">
            {r.title}
          </h2>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-ink/80">{r.body}</p>

          {/* Their only copy of the reference from here on, so it is set as a
              figure rather than folded into the paragraph above. */}
          {result?.reference ? (
            <div className="mt-6 border-t-2 border-ink/10 pt-5">
              <p className="text-sm text-muted">{r.reference}</p>
              <p className="mt-1 text-xl font-extrabold tracking-wide text-berry-deep">
                {result.reference}
              </p>
            </div>
          ) : null}

          <p className="mt-5 border-t-2 border-gold/60 pt-4 text-sm leading-relaxed text-muted">
            {r.another}
          </p>
        </div>

        <div className="flex flex-col gap-3 px-6 py-5 sm:px-8">
          {/* Second chance at the handoff: a blocked pop-up or a device with no
              WhatsApp installed leaves the first one having done nothing. */}
          {result?.waHref ? (
            <CtaButton href={result.waHref} variant="outline" size="md" className="w-full">
              <WhatsAppIcon className="h-5 w-5" />
              {r.whatsapp}
            </CtaButton>
          ) : null}

          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex w-full items-center justify-center rounded-full bg-berry px-6 py-3.5 text-base font-bold text-white shadow-soft ring-1 ring-cream/70 transition-colors hover:bg-berry-deep"
          >
            {r.close}
          </button>
        </div>
      </div>
    </div>
  );
}
