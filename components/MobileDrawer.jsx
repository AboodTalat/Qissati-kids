"use client";

import { useEffect, useRef } from "react";
import { animate, stagger, utils } from "animejs";
import { X } from "lucide-react";
import { LogoMark } from "./Logo";
import { InstagramIcon, OrderButton } from "./ui";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, NAV_LINKS, orderPath } from "@/lib/site";
import { canAnimate } from "@/lib/motion";

/**
 * The phone navigation, as a drawer off the end edge rather than a panel that
 * pushes down from the bar. It slides in over a scrim that dims the whole page
 * — the bar included — so the menu is unambiguously modal.
 *
 * The parent owns a three-way state (closed / open / closing) rather than a
 * boolean: the exit animation needs the panel to stay mounted after the intent
 * to close, and driving that from a boolean means calling setState inside an
 * effect, which React Compiler rightly rejects. `onExited` is fired from
 * anime's completion callback. When motion is unavailable the parent skips
 * "closing" entirely, so this component never has to unmount itself.
 */
export default function MobileDrawer({
  state, // "open" | "closing"
  onDismiss,
  onExited,
  dict,
  active,
  returnFocusRef,
  lang,
  onLanding = false,
}) {
  // Same rule as the header bar: off the landing page the anchors have to
  // travel home before they can find their section.
  const navHref = (href) => (onLanding ? href : `/${lang}${href}`);
  const onOrderPage = !onLanding;
  const panelRef = useRef(null);
  const scrimRef = useRef(null);

  const open = state === "open";

  // ── Enter / exit ─────────────────────────────────────────────────────
  useEffect(() => {
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    if (!panel || !scrim) return;

    // The drawer leaves toward the edge it is docked on. `end` is right in LTR
    // and left in RTL, so this off-screen offset needs a direction sign — the
    // one place here a physical transform can't be derived from a rect.
    const rtl = getComputedStyle(document.documentElement).direction === "rtl";
    const away = (rtl ? -1 : 1) * panel.offsetWidth;
    const rows = panel.querySelectorAll("[data-row]");

    // Without this the drawer can open *off-screen*. `animate` writes its FROM
    // value immediately — translateX(away), opacity 0 — and if anime's engine
    // is paused (a backgrounded tab) it never advances, so the panel sits one
    // full width outside the viewport with the scrim over the page: from the
    // reader's side, the menu button simply does nothing. Every other anime
    // call in this project checks this; this one was missed.
    //
    // The parent only enters "closing" when canAnimate() is true, so the exit
    // path below never has to cope with this.
    if (!canAnimate()) {
      utils.set([panel, scrim, ...rows], { translateX: 0, opacity: 1 });
      return;
    }

    if (open) {
      animate(scrim, { opacity: [0, 1], duration: 260, ease: "outQuad" });
      animate(panel, { translateX: [away, 0], duration: 460, ease: "outExpo" });
      animate(rows, {
        opacity: [0, 1],
        translateX: [rtl ? -18 : 18, 0],
        duration: 420,
        delay: stagger(45, { start: 140 }),
        ease: "outQuad",
      });
      return;
    }

    animate(scrim, { opacity: 0, duration: 220, ease: "inQuad" });
    const out = animate(panel, {
      translateX: away,
      duration: 300,
      ease: "inQuad",
      onComplete: onExited,
    });
    return () => out.pause();
  }, [open, onExited]);

  // ── Modal behaviour: scroll lock, initial focus, Tab trap ────────────
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !open) return;

    // Copy the node now: by cleanup time the ref may point elsewhere.
    const returnTo = returnFocusRef?.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      [...panel.querySelectorAll("a[href], button:not([disabled])")];
    focusables()[0]?.focus();

    const onKey = (e) => {
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
  }, [open, returnFocusRef]);

  return (
    <div className="lg:hidden">
      {/* Above the header, so the bar dims with everything else — a drawer
          that leaves the top bar bright reads as a dropdown, not a modal. */}
      <div
        ref={scrimRef}
        onClick={onDismiss}
        aria-hidden="true"
        className="fixed inset-0 z-[60] bg-ink/55 backdrop-blur-sm"
      />

      <aside
        ref={panelRef}
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label={dict.header.navLabel}
        className="fixed inset-y-0 end-0 z-[70] flex w-[min(20rem,86vw)] flex-col overflow-y-auto bg-cream shadow-lift"
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink/5 px-5 py-4">
          <span data-row className="inline-flex items-center gap-2.5">
            <LogoMark className="h-10" />
            <span className="text-xl font-extrabold leading-none text-brand-deep">
              {dict.brand.wordmark}
            </span>
          </span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label={dict.header.closeMenu}
            className="rounded-full border border-brand/20 p-2 text-brand-deep transition-colors hover:bg-brand-tint"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label={dict.header.navLabel} className="px-3 py-3">
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => {
              const id = link.href ? link.href.slice(1) : null;
              const isActive = link.route ? onOrderPage : active === id;
              return (
                <li key={link.key} data-row>
                  <a
                    href={link.route ? orderPath(lang) : navHref(link.href)}
                    onClick={onDismiss}
                    aria-current={
                      isActive ? (link.route ? "page" : "true") : undefined
                    }
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3.5 text-lg transition-colors hover:bg-brand-tint hover:text-brand-deep ${
                      isActive
                        ? "font-extrabold text-brand-deep"
                        : "font-semibold text-ink/80"
                    }`}
                  >
                    {/* the bookmark motif again, lying flat beside the row */}
                    <span
                      aria-hidden="true"
                      className={`h-5 w-1.5 rounded-full transition-colors ${
                        isActive ? "bg-gold" : "bg-transparent"
                      }`}
                    />
                    {dict.nav[link.key]}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-ink/5 px-5 py-5">
          <span data-row>
            <OrderButton
              href={orderPath(lang)}
              size="md"
              className="w-full"
              onClick={onDismiss}
            >
              {dict.header.order}
            </OrderButton>
          </span>
          <span data-row className="text-center">
            {/* dir="ltr": the leading "@" is a bidi-neutral character, so in an
                RTL paragraph it would render as "qissati_kids@". */}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              dir="ltr"
              className="inline-block text-sm font-semibold text-muted transition-colors hover:text-brand-deep"
            >
              {INSTAGRAM_HANDLE}
            </a>
          </span>
        </div>
      </aside>
    </div>
  );
}
