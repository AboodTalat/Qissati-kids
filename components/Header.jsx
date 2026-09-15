"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, createTimeline, stagger, utils } from "animejs";
import { Menu, X } from "lucide-react";
import { LogoMark } from "./Logo";
import LangToggle from "./LangToggle";
import MobileDrawer from "./MobileDrawer";
import { OrderButton } from "./ui";
import { NAV_LINKS, NAV_SECTIONS, orderPath } from "@/lib/site";
import { canAnimate, isLateHydration, prefersReducedMotion } from "@/lib/motion";

const SECTION_IDS = NAV_SECTIONS.map((link) => link.href.slice(1));

// Width of the gold bookmark tab, in px. Kept in JS because the ribbon is
// positioned by transform and has to centre itself over the active link.
const RIBBON_W = 18;

// The intro sets its starting transforms before the browser paints, so the bar
// never flashes in its resting position first. useLayoutEffect is a no-op
// during SSR and warns if called there, hence the environment switch.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * `onLanding` is what tells the bar it has the dark hero behind it. Without
 * it the header would key its transparent state off `window.scrollY > 12` on
 * every route — and on the cream order page that means cream type on cream
 * paper, i.e. an invisible header until you scroll. It also decides whether
 * the nav anchors are in-page (`#how`) or have to travel home first
 * (`/ar#how`), and whether the scrollspy runs at all.
 */
export default function Header({ lang, dict, onLanding = false }) {
  // In-page anchors only work on the page that has those sections.
  const navHref = (href) => (onLanding ? href : `/${lang}${href}`);
  // The order entry is a route, not a section. `onLanding` doubles as "are we
  // on the order page", since those are the only two routes.
  const onOrderPage = !onLanding;

  // "closed" | "open" | "closing" — the drawer's exit animation needs the
  // panel mounted after the intent to close, and a boolean would force a
  // setState inside an effect to unmount it.
  const [menu, setMenu] = useState("closed");
  const open = menu === "open";
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState(null);

  const headerRef = useRef(null);
  const navRef = useRef(null);
  const ribbonRef = useRef(null);
  const markRef = useRef(null);
  const burgerRef = useRef(null);
  // First placement of the ribbon jumps rather than slides — otherwise it
  // flies in from the page edge on the first scroll into a section.
  const ribbonPlaced = useRef(false);

  // ── Intro ────────────────────────────────────────────────────────────
  // Transform-only, deliberately: nothing is ever animated to opacity 0. The
  // header is fully readable in the SSR HTML, and if this never runs (JS
  // blocked, reduced motion, slow hydration) the bar is simply already in
  // place. A settle that replays is unobtrusive; a bar that vanishes is not.
  useIsoLayoutEffect(() => {
    const header = headerRef.current;
    if (!header || !canAnimate() || isLateHydration()) return;

    const marks = header.querySelectorAll("[data-intro='mark']");
    const words = header.querySelectorAll("[data-intro='word']");
    const links = header.querySelectorAll("[data-intro='link']");
    const tail = header.querySelectorAll("[data-intro='toggle'], [data-intro='cta'], [data-intro='burger']");
    const all = [...marks, ...words, ...links, ...tail];
    if (!all.length) return;

    utils.set(marks, { translateY: -10, scale: 0.82 });
    utils.set(words, { translateY: -12 });
    utils.set(links, { translateY: -14 });
    utils.set(tail, { translateY: -12 });

    const tl = createTimeline({ defaults: { ease: "outExpo", duration: 700 } });
    tl.add(marks, { translateY: 0, scale: 1, ease: "outElastic(1, .62)", duration: 1100 })
      .add(words, { translateY: 0 }, 90)
      .add(links, { translateY: 0, delay: stagger(70) }, 160)
      .add(tail, { translateY: 0, delay: stagger(70) }, 320);

    return () => {
      tl.pause();
      // Leave no inline transform behind if this unmounts mid-flight.
      utils.set(all, { translateY: 0, scale: 1 });
    };
  }, []);

  // Turn on smooth in-page scrolling only once hydrated — see globals.css.
  // Before this, a fragment landing (a shared /en#pricing link, or the language
  // toggle carrying your place across) is an instant jump rather than a long
  // animated crawl from the top of the document.
  useEffect(() => {
    document.documentElement.dataset.ready = "";
  }, []);

  // ── Scroll state + scrollspy ─────────────────────────────────────────
  // The bar stays transparent with light type for as long as the dark hero is
  // behind it, then becomes the cream chrome the rest of the page expects.
  // Keying off a fixed 12px would drop a cream bar onto the night hero almost
  // immediately. The same pass drives the scrollspy.
  useEffect(() => {
    // No dark hero and no sections on this route — nothing to track. `solid`
    // is derived below rather than set here: writing state from an effect body
    // is what React Compiler rejects, and `active` simply stays null.
    if (!onLanding) return;

    const onScroll = () => {
      const barH = headerRef.current?.offsetHeight ?? 64;
      const hero = document.getElementById("top");
      const handover = hero ? hero.offsetHeight - barH - 24 : 12;
      setScrolled(window.scrollY > handover);

      // Active section = the last one whose top has passed under the bar. The
      // line sits a little below where an anchor click lands a section
      // (scroll-padding-top = bar + 1.5rem), so arriving via a nav link marks
      // that link active instead of leaving the previous one lit.
      const line = window.scrollY + barH + 48;
      let current = null;
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top + window.scrollY <= line) current = id;
      }
      // The final section is short enough that its top may never cross the
      // line on a tall viewport; at the end of the page it is always current.
      const atEnd =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;
      setActive(atEnd ? SECTION_IDS[SECTION_IDS.length - 1] : current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [onLanding]);

  // ── Bookmark ribbon ──────────────────────────────────────────────────
  // Positions are read from getBoundingClientRect deltas — visual coordinates,
  // so this is correct in RTL and LTR alike without a direction sign.
  useEffect(() => {
    const place = (animated) => {
      const header = headerRef.current;
      const nav = navRef.current;
      const ribbon = ribbonRef.current;
      if (!header || !nav || !ribbon) return;

      const target = active
        ? nav.querySelector(`[data-nav="${active}"]`)
        : null;
      if (!target) {
        ribbon.style.opacity = "0";
        ribbonPlaced.current = false;
        return;
      }

      const hr = header.getBoundingClientRect();
      const tr = target.getBoundingClientRect();
      const x = tr.left - hr.left + tr.width / 2 - RIBBON_W / 2;

      const still = !animated || !ribbonPlaced.current || prefersReducedMotion();
      ribbon.style.opacity = "1";
      animate(ribbon, {
        translateX: x,
        // The ribbon stretches and swings as it lands, like a marker dropped
        // into a page.
        scaleY: still ? 1 : [0.62, 1],
        rotate: still ? 0 : [-7, 0],
        duration: still ? 0 : 640,
        ease: "outBack",
      });
      ribbonPlaced.current = true;
    };

    place(true);
    const onResize = () => place(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active]);

  // ── Logo spring on hover ─────────────────────────────────────────────
  useEffect(() => {
    const mark = markRef.current;
    if (!mark || prefersReducedMotion()) return;

    const lift = () =>
      animate(mark, { scale: 1.09, rotate: -4, duration: 520, ease: "outElastic(1, .5)" });
    const drop = () =>
      animate(mark, { scale: 1, rotate: 0, duration: 420, ease: "outQuad" });

    mark.addEventListener("pointerenter", lift);
    mark.addEventListener("pointerleave", drop);
    return () => {
      mark.removeEventListener("pointerenter", lift);
      mark.removeEventListener("pointerleave", drop);
    };
  }, []);

  // Dismissing goes through "closing" so the drawer can animate out — except
  // when there is no motion to play, where it closes outright.
  const dismiss = useCallback(() => {
    setMenu((m) => (m !== "open" ? m : canAnimate() ? "closing" : "closed"));
  }, []);

  // Close on Escape, and when the viewport grows past the breakpoint.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e) => e.matches && setMenu("closed");
    const onKey = (e) => e.key === "Escape" && dismiss();
    mq.addEventListener("change", onChange);
    window.addEventListener("keydown", onKey);
    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("keydown", onKey);
    };
  }, [dismiss]);

  const onExited = useCallback(() => setMenu("closed"), []);

  // The drawer's scrim sits above the header and dims it, so the bar no longer
  // has to change chrome when the menu opens — only on scroll.
  //
  // Off the landing page there is no dark hero to be transparent over, so the
  // bar is cream chrome from the first paint. Without this the order page
  // rendered cream type on cream paper until the reader scrolled.
  const solid = onLanding ? scrolled : true;

  return (
    // Fragment, and the drawer is a SIBLING of <header> — not a child.
    //
    // The bar carries `backdrop-blur-xl` in its solid state, and a
    // `backdrop-filter` makes an element a containing block for `position:
    // fixed` descendants. With the drawer nested inside, `fixed inset-0`
    // resolved against the 64px bar instead of the viewport: the panel and its
    // scrim were 64px tall, clipped into the header. It only appeared to work
    // at the very top of the landing page, where the bar is transparent and
    // has no backdrop-filter at all.
    <>
    <header
      ref={headerRef}
      data-solid={solid ? "" : undefined}
      className={`group/hdr fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? "bg-cream/85 shadow-soft backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      {/* Gilded page edge — the bar reads as the top edge of a sheet of paper
          rather than a floating chrome strip. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-gold/50 to-transparent transition-opacity duration-300 ${
          solid ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* The bookmark that marks where you are in the story. Hangs from the top
          edge of the bar, over the active link. Decorative — the active link
          also carries aria-current and its own colour. */}
      <div
        ref={ribbonRef}
        aria-hidden="true"
        className="bookmark-tab pointer-events-none absolute top-0 hidden h-6 origin-top bg-gold opacity-0 lg:block"
        style={{
          // `left`, not `start` — translateX is driven by a physical-left
          // offset measured off getBoundingClientRect, so the origin has to be
          // the physical left edge in both directions.
          left: 0,
          width: RIBBON_W,
        }}
      />

      <div className="mx-auto flex h-[var(--header-h)] max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
        <a
          href="#top"
          aria-label={dict.header.homeLabel}
          className="inline-flex items-center gap-2.5 rounded-2xl"
        >
          <span ref={markRef} data-intro="mark" className="inline-flex">
            <LogoMark priority className="h-11 lg:h-12" />
          </span>
          <span
            data-intro="word"
            className="inline-block text-2xl font-extrabold leading-none text-cream transition-colors group-data-[solid]/hdr:text-brand-deep lg:text-[1.7rem]"
          >
            {dict.brand.wordmark}
          </span>
        </a>

        <nav ref={navRef} aria-label={dict.header.navLabel} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const id = link.href ? link.href.slice(1) : null;
              const isActive = link.route ? onOrderPage : active === id;
              return (
                <li key={link.key} data-intro="link">
                  <a
                    href={link.route ? orderPath(lang) : navHref(link.href)}
                    // Only sections carry data-nav: it is what the bookmark
                    // ribbon measures against, and the order page is not one.
                    data-nav={id ?? undefined}
                    aria-current={
                      isActive ? (link.route ? "page" : "true") : undefined
                    }
                    className={`block rounded-full px-4 py-2 text-[0.95rem] transition-colors ${
                      isActive
                        ? "font-extrabold text-cream group-data-[solid]/hdr:bg-brand-tint group-data-[solid]/hdr:text-brand-deep"
                        : "font-semibold text-cream/75 hover:bg-white/10 hover:text-cream group-data-[solid]/hdr:text-ink/70 group-data-[solid]/hdr:hover:bg-brand-tint group-data-[solid]/hdr:hover:text-brand-deep"
                    }`}
                  >
                    {dict.nav[link.key]}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <LangToggle lang={lang} dict={dict} section={active} />

          {/* The responsive display class lives on a wrapper: Button's own
              `inline-flex` base would otherwise win over `hidden` on
              stylesheet order, not class order. */}
          <span data-intro="cta" className="hidden sm:block">
            <OrderButton href={orderPath(lang)} size="sm" className="whitespace-nowrap">
              {dict.header.order}
            </OrderButton>
          </span>

          {/* aria-haspopup rather than aria-controls: the drawer is only in
              the DOM while open, and aria-controls pointing at a missing id is
              invalid. aria-expanded carries the state. */}
          <button
            ref={burgerRef}
            type="button"
            data-intro="burger"
            onClick={() => (open ? dismiss() : setMenu("open"))}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label={open ? dict.header.closeMenu : dict.header.openMenu}
            className="rounded-full border border-cream/25 p-2.5 text-cream transition-colors hover:bg-white/10 group-data-[solid]/hdr:border-brand/20 group-data-[solid]/hdr:text-brand-deep group-data-[solid]/hdr:hover:bg-brand-tint lg:hidden"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

    </header>

      {menu !== "closed" ? (
        <MobileDrawer
          state={menu}
          onDismiss={dismiss}
          onExited={onExited}
          dict={dict}
          active={active}
          lang={lang}
          onLanding={onLanding}
          returnFocusRef={burgerRef}
        />
      ) : null}
    </>
  );
}
