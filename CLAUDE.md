# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server (Turbopack)
npm run build    # production build — also the only type/parse gate
npm run lint     # eslint; must exit clean
```

The dev server needs `NEXT_PUBLIC_QISSATI_API` in `.env.local` to reach the backend (`servers/qissati` on the Hafith Server, `npm run dev` there). Without it the site still runs — every price is `[X]`, orders fall back to the WhatsApp path, and `/admin` says the API is not configured.

**The dev server's CSS and server modules go stale.** More than once this project's `next dev` has kept serving a stylesheet that predates a change — new Tailwind classes simply absent from it — and has replayed compile errors for code that no longer exists. Symptoms: a utility that has no effect in the browser while `document.styleSheets` contains no rule for it, or a console error citing a line you already rewrote. **Check the production CSS before concluding the code is wrong**: `npm run build`, then grep the emitted chunk under `.next/static` for the class. Restarting `next dev` is the actual fix; touching files is not reliable.

There is **no test framework** in this project — no jest/vitest/playwright, no test script. `npm run build` plus `npm run lint` are the full automated gate. Verify behaviour by driving the running app in a browser, not by writing tests against a runner that doesn't exist.

`.claude/launch.json` defines a `qissati-dev` preview config with `autoPort: true`, so the dev server takes a free port when 3000 is busy — read the assigned port from the launch output rather than assuming 3000.

React Compiler is enabled (`next.config.mjs`), so its ESLint rules are enforced. In particular, a function referenced by a `useEffect` must be **declared above** that effect and listed in its deps; the vendored Aceternity components originally violated this and were fixed.

## What this is

A bilingual (Arabic + English) site for **Qissati (قصتي)**, a Jordan-based brand selling personalised illustrated Arabic children's storybooks. Two routes: the marketing landing page and an order form.

**There is a backend now.** `servers/qissati/` on the Hafith Server (mounted at `/qissati`) receives orders, stores the reference photos in its own UploadThing app, and serves the price table; `/admin` in this app is the dashboard. The order form POSTs the answers, uploads the photos, and *then* offers WhatsApp — which is now only about arranging payment. See "The order API" below. `NEXT_PUBLIC_QISSATI_API` is the base URL, including the `/qissati` mount; **leave it empty and the whole site falls back to the phase-1 behaviour** — every price renders `[X]` and the order form keeps the copy-the-details-and-WhatsApp path.

Stack: Next.js 16 App Router, React 19, **JavaScript (not TypeScript)**, Tailwind CSS v4.

## Architecture

`app/(site)/[lang]/page.js` is a flat composition of section components in `components/` — `Hero`, `TrustBar`, `HowItWorks`, `Tiers`, `SamplePreview`, `Pricing`, `Faq`, `FinalCta`, plus `Header`/`Footer`. `app/(site)/[lang]/order/page.js` is the other public route.

**Two route groups, two root layouts.** `app/(site)/[lang]/layout.js` is the site's root layout and depends on the `[lang]` segment, so the dashboard — which has no locale segment — cannot live under it. `(site)` serves `/ar` and `/en`; `(admin)` serves `/admin`. Group names never appear in a URL, and the icon files stay at `app/` root where Next looks for them.

**Sections are server components, and the client boundary is deliberately small.** Every `"use client"` **on the site side** and why — the dashboard is a different argument and has its own section, and `components/ui/*` are vendored and carry their own:

| Client component | Needs the client for |
|---|---|
| `Header`, `MobileDrawer`, `LangToggle` | scroll state, the anime.js chrome, the drawer |
| `HeroBook` | the scroll-scrubbed cover |
| `HeroRoles`, `SampleGallery` | the vendored `flip-words` / carousel |
| `order/OrderForm`, `Fields`, `PhotoPicker`, `ReviewDialog`, `ThankYouDialog` | form state, and the three-way modal pattern |
| `BookShowcase` | dead — see "Dead exports" |

**`/admin` is client-side by design and inverts this.** Everything under
`components/admin/` is a client component, because the dashboard is an
authenticated single-page app whose every figure arrives over a bearer-token
fetch — there is nothing for the server to render but an empty shell, which is
also why both admin pages are `force-dynamic` and `no-store`.

Keep it that way: a client wrapper exists so the section *around* it stays server-rendered.

Everything else is a server component, including some that look like they should not be. `Faq` is a native `<details name>` accordion, `StepsList` and `TrustBar` animate through CSS scroll timelines, and `SamplePreview` became one again when `ContainerScroll` was dropped. Before adding `"use client"` to a section, check whether CSS or a native element already does the job.

**`lib/site.js` is the single source for every link off a component.** Its exports and their intents:

- `orderPath(lang)` → the order page. Every "order" CTA.
- `CONTACT_URL` → the Instagram DM. Every "talk to us" CTA.
- `whatsappHref(text)` → a `wa.me` link carrying a prefilled message. The order flow only.
- `NAV_LINKS` / `NAV_SECTIONS` → navigation, see "Linking".

Never hardcode a URL in a component.

### Direction is structural, not cosmetic

`<html lang>` and `<html dir>` are both set from the `[lang]` segment: `ar` renders RTL, `en` LTR. Use logical properties everywhere (`ms-`/`me-`, `ps-`/`pe-`, `start-`/`end-`, `text-start`) — physical `left`/`right` will mirror wrong. Specific traps already hit here:

- **Directional icons don't auto-mirror**, and the fix is CSS rather than a `lang` prop: render *both* glyphs and hide the wrong one with `ltr:hidden` / `rtl:hidden`. "Forward" points left under RTL and right under LTR; "previous" is the reverse. See the hero's sample link and the carousel's arrows.
- **`scrollLeft` runs 0 → negative in RTL.** Any horizontal-scroll logic must compare on `Math.abs(scrollLeft)` and flip its scroll delta by a direction sign.
- **A `w-max` row inside a horizontal scroller must not be `mx-auto`** — centring a row wider than its container splits the overflow across both sides and makes most of it unreachable.
- **Never letter-space or uppercase Arabic.** `tracking-*` pushes joined letterforms apart along a stretched connector and reads as broken type; Arabic has no case for `uppercase` to act on. Both belong to the Latin locale only — gate them with `ltr:` (see the ruled kickers in `Hero.jsx` and `TrustBar.jsx`).
- **Never split Arabic text per character** for animation. Per-letter `<span>`s shape every letter in isolation, so `شرطي` renders as four disconnected glyphs. Word-level splitting only (`WordReveal` in `components/motion/Reveal.jsx` does this correctly).
- **Never concatenate a numeral to a fixed noun.** Arabic needs four forms where English needs two — 1 takes the singular, 2 takes the dual and *absorbs* the numeral ("صفحتين", not "2 صفحتين"), 3–10 take the plural, 11 and up return to the singular. `${n} صفحة` produces "10 صفحة", which is simply ungrammatical. This is now a family of four, and any new counted noun joins it: `pagesLabel()` and `daysLabel()` in `lib/order.js`, the photo count in `PhotoPicker.jsx`, and `pages()` in `lib/admin.js` (the dashboard's own copy of the rule). Each reads its forms from a `unit` table in the dictionary rather than building the string in code, so English can supply one plural where Arabic supplies four. **The dual is easy to miss because it is often unreachable** — the photo picker only needed `selectedTwo` once the ceiling dropped from 7 to 3 and made a count of 2 ordinary.

### Styling: `app/globals.css` is the design system

Tailwind v4 is CSS-first — **there is no `tailwind.config`**. Brand colours, shadows, radii and animations are `@theme` tokens in `globals.css`; add new design values there, not as arbitrary values in class strings.

Palette rule from the brand brief: teal + gold, deliberately **never blue+orange or blue+pink** (those read as gendered). Vendored components ship neon blue/violet gradients and must be recoloured on the way in.

`--color-muted` is intentionally darker than the brief's Warm Gray `#8a8580`, which is only 3.46:1 on cream and fails WCAG AA for text. The brief's value is preserved as `--color-muted-soft` for non-text decoration. The page currently has **zero AA contrast failures**; keep it that way when adding colours.

**`control-text` is the type size for anything a finger can focus and type into**, and it exists for a bug rather than a look: **iOS Safari zooms the whole page in when a control smaller than 16px takes focus**, and does not zoom back out — so on an iPhone, tapping a field knocked the layout sideways and left the reader pinching to recover. The controls were `text-[0.95rem]`, which is 15.2px. The utility is exactly 16px on phones and the design's 0.95rem from `sm` up, where no browser does this. **The fix has to be the font size**: `maximum-scale=1` in the viewport also stops the zoom, and does it by taking pinch-zoom away from everyone who needs it — a WCAG failure traded for a layout bug. Every admin input, select and textarea uses it; buttons and labels do not need it, since only focusable text entry triggers the zoom.

**A focused field that is also invalid must wear one colour, not two.** The global `:focus-visible` ring is brand teal and `CONTROL`'s error border is berry, so an invalid *focused* control came out double-bordered in two different colours — which reads as a rendering fault, not as "fix this field". That is not an edge case: `handleSubmit` focuses the first missing field, so it is what every parent sees the instant they submit an incomplete form. `[aria-invalid="true"]:focus-visible` in `globals.css` recolours the ring to `berry-deep` (6.16:1 on cream, so the boundary still clears 1.4.11). The border and the word "مطلوب" both stay, so the state is never signalled by colour alone.

**`:focus-visible` must not set `border-radius`.** It used to also apply `border-radius: 0.35rem`, which silently overrode the *element's own* radius while focused — every `rounded-xl` input squared off from 12px to 5.6px on focus, and every `rounded-full` button lost its pill. An outline already follows the element's own radius; there is nothing to restate.

**Two traps when reading these styles in `next dev`.** The `aria-[invalid=true]:border-berry-deep` utility is **not emitted by the dev build at all** — it appears only after `npm run build`, so in dev an invalid field keeps its teal border and the error looks broken when it is not. And the dev CSS chunk has a stable filename (`[root-of-the-server]__…css`), so a browser that has cached it keeps serving the old bytes across restarts. Verify styling against the built chunk under `.next/static`, as this file says elsewhere — and remember these rules are **equal specificity** (`[aria-invalid=true]` vs `.border-brand-deep/70`), so what decides the winner is source order, which differs between dev and production.

### The reveal system is CSS-only, and visible by default

`components/motion/Reveal.jsx` exports `Enter` (above-the-fold, plays on load), `Reveal` (below-the-fold, driven by a CSS `animation-timeline: view()` scroll timeline) and `WordReveal`. These are **server** components that only emit `data-enter` / `data-reveal` attributes; the animation lives in `globals.css`.

This is deliberate and worth preserving: a Framer-style `initial={{opacity: 0}}` serialises the hidden state into the SSR HTML, so slow, blocked or throttled JS leaves the page invisible. Here the finished state is the default — browsers without scroll timelines (Firefox today) render a complete, static page. **Do not reintroduce JS-gated hiding for content reveals.** `prefers-reduced-motion` resolves everything to its finished state.

`WordReveal` emits its word separator *outside* the per-word `inline-block`. A trailing space inside one is stripped by whitespace processing, which glued multi-word phrases together ("حكايتهالخاصة", "theirownstory") — invisible in Arabic until a heading happened to hold two words, obvious in English immediately.

### Bilingual routing

`app/(site)/[lang]/layout.js` **is** the site's root layout — there is no `app/layout.js`, because `<html lang>`/`<html dir>` depend on the segment and only a layout inside it can read the param. `/` has no page of its own; `next.config.mjs` redirects it to `/ar` (temporary, so Accept-Language detection can be added later without a cached 308). `generateStaticParams` emits `ar` and `en`, and `dynamicParams = false` makes `/fr` a 404 rather than Arabic under `lang="fr"`.

Copy lives in `lib/dictionaries/{ar,en}.js`, resolved through `lib/i18n.js`. `app/(site)/[lang]/page.js` resolves the dictionary once and passes a `dict` prop down; **no component reaches for a global locale**. Each dictionary does carry a `lang` field naming itself (`ar.lang === "ar"`), which is not a hole in that rule: it lets a pure helper handed only a `dict` resolve language-keyed *data* — `buildOrderSummary` uses it to turn a stored `city` slug into "عمّان" via `lib/jordan.js` — without the caller threading a locale through, and without anything reading a module-level current locale. Server sections take `dict` directly; the client components (`Header`, `MobileDrawer`, `LangToggle`, `HeroBook`, `HeroRoles`, `SampleGallery`) receive already-resolved strings as props, so the server/client boundary is unchanged.

Two rules for the dictionaries:

- **English is a rewrite, not a translation.** The Arabic body copy is colloquial Jordanian; rendering it literally reads stilted. Match the claim and the reading level, not the sentence.
- **Placeholders stay placeholders in both files.** `[X]` prices, `[X]` turnaround days, `[X-Y]` age range and the unfinalised refund policy are TODO in `ar.js` *and* `en.js`. Translating a bracket into a plausible number is the one failure mode to avoid.

`lib/site.js` keeps only the locale-independent parts of navigation: `NAV_LINKS` is `{ key, href }`, where `href` is an in-page anchor (identical in both locales) and `key` indexes `dict.nav`.

**The language toggle is a plain `<a>`, not `next/link`, and that is deliberate.** Both locales share the `[lang]` layout, so a client-side transition between them is a param change inside one layout: the router keeps the scroll offset, and because the incoming locale's document is briefly shorter while it renders, that offset gets clamped — the page jumped to the footer on every switch. A document navigation also lets `<html dir>` and everything that measures direction on mount (the toggle knob, the header ribbon, the carousel's scroll logic) initialise cleanly rather than re-measuring a tree that flipped direction underneath them. The toggle carries the reader's current section as a hash (`/en#pricing`) so switching language keeps your place; the section ids are identical in both locales.

**Direction-conditional UI belongs in CSS, not JS.** Tailwind v4's `rtl:`/`ltr:` variants read the `dir` attribute, so a directional icon renders both glyphs and hides the wrong one (`ltr:hidden` / `rtl:hidden`) — see the Hero's forward arrow and the carousel's prev/next. That needs no `lang` prop and leaves the carousel's runtime `getComputedStyle(el).direction` scroll logic untouched.

### Animation: CSS for reveals, anime.js for interaction

`animejs` v4 is the animation library for anything **interaction-driven** — the header's intro timeline, bookmark indicator, language-toggle knob, logo hover and mobile-sheet stagger. v4 has no default export: `import { animate, createTimeline, stagger, utils } from "animejs"`, not `anime({targets})`. `motion` (Framer) stays installed only because the vendored Aceternity components need it; don't add new `motion` usage.

Three hard rules, all enforced through `lib/motion.js`:

- **Load-in reveals for page content stay on the CSS `data-enter` / `data-reveal` system.** anime writes an inline hidden state, which is exactly the SSR failure mode the reveal system exists to avoid. The header's intro is the one exception, and it is transform-only — nothing is ever animated to `opacity: 0`, so a replay is a settle rather than a vanish.
- **`canAnimate()` before writing any starting value.** anime is invisible to the global reduced-motion kill-switch (that CSS rule only collapses `animation-duration`; anime drives inline styles through rAF), *and* its engine pauses while `document.hidden` — a page opened in a background tab would otherwise apply every FROM value and freeze there, leaving the bar visibly displaced until the tab is focused. `canAnimate()` covers both. Use it for anything that runs at mount or that animates from a hidden state; plain `prefersReducedMotion()` is enough for handlers that can only fire when the user is already looking (hover).
- **`isLateHydration()` for intro timelines.** If hydration lands after ~1.5s the visitor has been reading the header already; replaying its entrance reads as a glitch.

Positioning traps this bit already: anime writes the whole `transform` string, so an element it animates must not also carry a Tailwind transform utility (`-translate-y-1/2` on the toggle knob was silently wiped). Position those with `top`/`left` instead. And measure sliding indicators from `getBoundingClientRect()` deltas — visual coordinates are correct in both directions without a direction sign.

### The hero, and scroll scrubbing

`components/Hero.jsx` + `components/HeroBook.jsx`. The section is deliberately **not** the badge-pill / accent-word-headline / twin-CTA / tilted-card-on-the-right arrangement — that shape is the loudest "generated landing page" signal there is, and motion layered on top of it only reads as a template that also moves. What replaced it, and why each part is load-bearing:

- The headline is a **book's title page**: a ruled kicker, then the title stacked with a real size jump on the middle line. The hierarchy is typographic; the gold only reinforces it. Do not collapse it back into one heading with a coloured word.
- **One CTA.** The sample is a text link, because that is what it is.
- **No blurred glow blobs.** The only light in the section comes out of the book as it opens, so it is motivated rather than decorative.

`HeroBook` scrubs the cover open on its spine with `onScroll()`. Five things about it will bite anyone who changes it:

- **`overflow-x-clip` on the section, never `overflow-hidden`.** `hidden` makes the section a scroll container, which silently kills `position: sticky` on every descendant — both the pinned copy column and the pinned book just scrolled away, with no error anywhere.
- **The observer target is the runway, not the sticky element.** A stuck element's bounding rect stops moving, so keying the scrub on it freezes the animation half-way.
- **The scrub's length is `runway height − viewport height`.** Thresholds read `"<target edge> <container edge>"`, and the range is `enter: "top top"` → `leave: "bottom bottom"`. With a runway shorter than the viewport that range inverts and the scrub silently never runs — no warning, the cover just sits closed.
- **The hinge lives in CSS** (`origin-left rtl:origin-right`), so it is right in the markup even if the effect bails. Only the rotation's *sign* is decided in JS: Arabic books are bound on the right and open leftward, English books mirror it.
- **The open angle is a layout constraint, not just taste.** The cover's horizontal reach past the spine grows with the angle; at 152° it swung clear over the headline and the order button. 118° also simply looks more like a book than a flat slab does.

**Scroll-driven animations guard on `prefersReducedMotion()`, not `canAnimate()`.** The hidden-document half of `canAnimate()` exists for *entrances*, which apply a FROM value and freeze there if anime's engine is paused. A scrub's progress-0 state IS its resting state — here, a closed book — so nothing can be left displaced, and bailing on a hidden document would instead disable the scrub permanently for anyone who opened the page in a background tab and scrolled it later.

The runway costs the hero roughly 1.4 extra viewports of height. On phones that is deliberately harmless: the copy column and the order CTA stack **above** the book, so the CTA stays above the fold and the extra height is all pinned, animating book rather than empty space.

### TrustBar: unequal on purpose

Same treatment as the hero, same reason. What was there — three equal thirds, each an icon in a rounded tile above a bold title and a muted line, inside one bordered, shadowed, rounded container — is the generated-template signature in miniature.

- **The columns are unequal and the content decides it** (`md:grid-cols-[1.35fr_1fr_1fr]`). The first promise is the product thesis; the other two are logistics. Three identical thirds claim three equally important things, which is not true. Don't "tidy" it back to `grid-cols-3`.
- **No card, no icon tiles.** Hairline rules between columns, icons drawn inline in brand teal. The tinted rounded tile is the card pattern in miniature.
- It still tucks under the hero with a negative top margin — that overlap is what stops the page reading as a stack of equal full-width bands — but it no longer needs to be a floating slab to do it.

**The dividing rules use CSS, not anime.js, and that is the right call.** They are one property on one element animated against scroll position, which is exactly what `animation-timeline: view()` is for — it keeps the whole section a server component with no client bundle. Reach for anime only when CSS scroll timelines genuinely cannot express the move: the hero qualifies (a damped multi-property timeline driving a direction-dependent 3D transform), a hairline does not.

`data-reveal="rule"` / `data-enter="rule"` is the reveal variant for this: a `scaleY` draw that needs `origin-top` on the element, since the keyframe only supplies the scale. It runs over a longer scroll range than the block reveals so the line is still growing while you read the column beside it.

### HowItWorks: a contents page

The sticky-heading-beside-a-scrolling-list arrangement was already right and is kept. What changed is everything inside it, because the steps carried **three** template signatures at once: a rounded-square icon tile, a gold number pill, and Aceternity's `TracingBeam` threading them together.

`components/StepsList.jsx` replaces `StepsBeam.jsx`: hanging numerals, a rule between entries, and a hairline spine running *behind* the numbers — the beam's "one continuous journey" idea in the idiom the product is actually about. It is a **server** component; dropping the beam removed the only reason this subtree needed `"use client"`, and took a `motion` consumer out of the bundle with it.

Two things to know if you touch it:

- **The numeral needs `self-start`.** Grid items stretch by default, so without it the numeral's cream ground grows to the full row height and masks the spine for the whole entry rather than just behind the digits.
- **The numerals are `aria-hidden`.** The ordinal is already carried by `<ol>`; announcing "01" before every heading is noise. They are also large-bold text at 3.92:1 on cream, which clears AA's 3:1 for large text but would fail as body copy — don't shrink them.

The reassurance note lost its emoji and its tinted rounded pill for a gold rule and a line of text. An emoji standing in for an icon inside a soft-tinted pill is about as template as a detail gets.

### Tiers: one spread, two facing pages

The old shape was the canonical SaaS pricing block — two rounded cards, the recommended one inverted to dark with an animated gold rim and a floating "most popular" badge, each with an icon in a tinted tile above a check-in-circle feature list. Six template signatures in one section.

**The copy is what dictated the fix.** `dict.tiers.lead` says both options end in the same place and differ only in *how much* of the story is written around the child — so this is one object with two halves, not two competing products. It is now a single open spread:

- **One paper, one shadow, a gutter down the middle.** No card borders, no per-half shadow, and crucially **no inverted colour on the recommended half.** It is distinguished by width, type size and the bookmark; making it dark as well is the pricing-table reflex.
- **The recommendation is a bookmark** — the same gold tab the header hangs over the active nav link. The shape lives in `globals.css` as the `bookmark-tab` utility (a Tailwind v4 `@utility`), used by both, so they read as one motif rather than two coincidental gold shapes.
- **Feature lists are hairline-separated rows.** Ticks in circles read as a pricing table; a ruled list reads as a spec.
- **The avatar-only half is announced, not orderable.** `comingSoon: true` on its entry in the `TIERS` array (the same flag shape as `featured`) swaps its CTA for a status, and `dict.tiers.comingSoon` carries the word in both locales. It says so twice: a **stamp under the tier name** — `text-sm sm:text-lg`, full-weight `text-ink`, under a solid `border-b-2 border-gold` — and a **gold-ruled line of text standing where the button would be** (`border-t-2 border-gold/60`, `text-ink/80`). Both are typography rather than a greyed-out button or a tinted badge: a button-shaped element invites a tap that does nothing, and the pill is the badge shape this whole section exists to avoid. Gold rule plus a line of text is the house idiom for a note like this — see HowItWorks' footnote. **Why it has no CTA at all** rather than a disabled-looking one is an order-form argument, not a design one; see "The order page".

**It stays two-up at every width, phones included.** Stacking the halves turns a comparison into two consecutive pitches — you cannot weigh two options you have to scroll between. Below `sm` the columns go equal (unequal ones leave the narrow half too thin to set Arabic in), the type steps down, and the summary paragraph is dropped via `hidden sm:block`: the bulleted points say the same thing in the form you actually compare, and running both summaries as well makes each column a tall thin ribbon. Verified down to 320px in both locales — 138px columns, no overflow, no horizontal scroll. That verification predates the coming-soon stamp, which was measured rather than seen (~88px for "Coming soon" at `text-sm` extrabold, in a 106px content box); it wants a real look at 320px next time the section is open in a browser.

`Button` in `components/ui.jsx` therefore has **no `whitespace-nowrap` in its base**. In a 138px column a one-line label overflows its own button, and a nowrap baked into the base cannot be overridden from a `className` without an important modifier. Buttons that must never wrap ask for it explicitly — currently only the header's CTA, where a wrap would break the fixed bar.

Two more things that will bite:

- **The gutter is positioned `start-[calc(42%-2rem)]`, not `start-[42%]` with `-translate-x-1/2`.** `start` is logical and `translate-x` is physical, so mixing them puts the fold on the wrong side of the boundary under RTL. 42% is the first column's share of `[0.84fr_1.16fr]`.
- **The recommended tier is second in DOM order on purpose.** Under `dir` that lands it on the recto — the page you turn *to* — which is the right-hand page in LTR and the left-hand page in RTL. Reordering the array breaks that in one direction.

**Contrast:** the tinted paper costs about half a point versus the old white card, which pushed `text-berry` to 4.39:1 — under AA. The tier sub-label uses `berry-deep` (5.84:1) for that reason. Any accent moved onto this section's paper needs re-measuring; don't assume a value that passed on `bg-surface` still passes here.

### SamplePreview: nothing is centred

Every reworked section opens start-aligned, so a centred column in the middle of them read as a different page. This section now hangs off the start edge in both directions — verified: kicker, heading, lead and pull quote all land on the container's start edge at 1184 under RTL and 96 under LTR.

Three things went, each for the same reason its equivalent went elsewhere:

- **Aceternity's `ContainerScroll`**, which tilted the cover up on scroll on a big rounded stage. The hero already opens a book on scroll; doing it twice reads as one trick repeated, and the stage was another card. Dropping it made this a **server** component again (`SampleGallery` is the only client part) and removed the third `motion` consumer.
- **The centred heading block**, now the shared start-aligned `Kicker` + h2 + lead.
- **The tinted rounded quote card** with its centred quote-mark icon. It is a pull quote, so it is set as one: `border-s-[3px] border-gold`, words large, attribution under. `border-s`, not `border-l` — it has to sit on the reading edge in both directions.

The stage was replaced by a **catalogue entry**: the cover at listing size (`w-40` → `md:w-52`) beside the book's own title, note and gallery cue. The hero already shows this cover full size, so repeating it big was a repeat; at listing size it reads as the book being introduced before you leaf through its pages.

The carousel below is deliberately untouched — it is full-bleed and its row is `w-max justify-start` with **no** `mx-auto`, which is what keeps all of it reachable under RTL.

### Pricing: a price list, not a pricing table

The old version was the stock SaaS pricing block almost line for line: two bordered white cards, the recommended one ringed in gold with a blurred glow blob behind its corner, an icon in a tinted rounded tile, a huge number, and a column of ticks.

- **Rows, not cards.** Two formats is a list of two things. Each is one ruled row — description on the start edge, price and CTA on the end — which is what a price list looks like in print.
- **The price is not a hero number.** It is `[X]` until launch, and a 4xl bracket looks like a bug. `text-3xl`, level with the format name rather than dominating it. If real prices land, resist growing it back into a pricing-card centrepiece.
- **The bookmark marks the recommended row** — third use of `bookmark-tab`, same meaning as in the header and Tiers.
- **Points are an inline middot-separated spec line**, but still a real `<ul>`. Ticks in a column read as a pricing table, and a ruled stack would just repeat Tiers. The middot separator lives *inside* each `<li>` — a bare `<span>` is not valid as a child of `<ul>`, and flattening the three points into a `<p>` would hand a screen reader one run-on sentence.

`whitespace-nowrap` is set explicitly on this section's CTA (the base `Button` no longer carries it — see Tiers), because the row layout always gives it full width.

### Faq: ruled rows, native accordion

The sticky heading beside the questions was already right. The list was not: each question was its own rounded, bordered, shadowed card that lifted on open, with a plus in a tinted circle rotating 45°.

- **Ruled rows, no boxes and no gaps.** A run of questions separated by hairlines is what a printed Q&A looks like, and the eye runs down the column instead of stopping at every card edge.
- **The plus keeps its rotation, loses its circle.** The rotating plus is a real affordance; the tinted disc around it was the template tell.
- **The open question recolours its own rule gold** rather than growing a bar on its start edge. A start-edge bar needs an indent to clear it, and on phones — where the heading and the list stack — that indent knocked the questions out of alignment with the heading above them. Verified: heading and rows both land at x=20 at 360px.
- The closing rule lives on the **container**, not a `last:` variant: every `<details>` sits alone inside its own `Reveal` wrapper, so `:last-of-type` would match all five and draw a border under every row.

`<details name="qissati-faq">` keeps this a native exclusive accordion — opening one closes the rest, with no client JS.

### FinalCta: the page ends in the dark it opened in

It was a centred `rounded-[2.5rem]` dark slab floating on cream, with an aurora blob layer and a sparkle field on top — the gradient CTA card that ends most generated pages, and the last centred block left here. It was also dark teal sitting **immediately above the dark teal footer**, so the page finished on two stacked dark blocks separated by a cream gutter.

Now it is full-bleed and butts straight onto the footer: the closing ask and the footer read as one dark region bookending the dark hero. They are not the same tone — the gradient bottoms out darker than the footer's `brand-deep` — so there is a deliberate step at the seam, and the gilded hairline (the same one under the header bar) sits exactly on it as the divider.

**The gradient's light end is a contrast constraint, not a colour choice.** The copy sits on the gradient, so `text-cream/80` has to clear 4.5:1 against its **lightest** point, not its average. The first value (`#1d7a7c`) measured 3.69:1 and failed; `#166668` measures 4.70:1. Re-measure against the light end if this is ever retuned.

Removing the ambient layer left `components/motion/Ambient.jsx` with no consumers at all.

### Buttons carry their own boundary

Both button variants failed WCAG 1.4.11 (3:1 for the boundary of a non-text UI component), from opposite directions, and both are fixed in the `variants` map in `components/ui.jsx`. Don't undo either as "decoration".

- **`primary`** is berry on teal in the hero and the closing band. Berry and the brand teals look nothing alike but sit close in *luminance*, so the fill measured **1.28–2.32:1** against those grounds. It now carries `ring-1 ring-cream/70`: 3.78:1 on the worst ground (the hero's lightest `#1a6b6d`), and invisible on cream, where the berry fill already passes on its own at 4.62:1. cream/55 was not enough (2.95:1) — 0.70 is the floor, not a preference.
- **`outline`** is a white fill on cream (≈1.05:1), so its border is the *only* thing defining it — and `brand/25` measured **1.36:1**. It is now `border-brand-deep/80` (4.18:1 on cream, 4.01:1 on the tinted tier spread), hovering to full `brand-deep`. This is a visible change: those buttons now read as outlined rather than as floating white pills.

The general rule this came from: **a fill that passes for text contrast tells you nothing about whether the control has a perceivable edge.** Any accent placed on a teal ground needs its boundary measured separately, against the *lightest* point of whatever gradient it sits on.

`brand`, `onDark` and `ghost` in that map now have no consumers — `onDark` lost its last one when the hero's second CTA became a text link.

### `Kicker`, not a badge pill

`Eyebrow` (`components/ui.jsx`) is the tinted rounded pill that opened every section. It is one of the loudest generated-template components there is, so reworked sections use `Kicker` instead — a hairline rule and a line of small caps, same words.

`Kicker` takes `tone="gold"` for the dark hero and defaults to brand teal on cream. Its `ltr:` gating on `uppercase`/`tracking` is load-bearing, not cosmetic — see the direction rules above.

`Eyebrow` is **gone** — every section now opens with `Kicker`. Don't reintroduce a tinted pill for a section label.

### The mobile drawer

Below `lg`, navigation is a drawer off the **end** edge (`components/MobileDrawer.jsx`), not a panel dropping out of the bar. Its scrim sits at `z-[60]` — *above* the `z-50` header — so the bar dims with everything else; a drawer that leaves the top bar bright reads as a dropdown rather than a modal. It carries the usual modal duties: `role="dialog"`, `aria-modal`, body scroll lock, initial focus, a Tab trap, Escape to close, and focus returned to the hamburger on close.

`Header` owns a three-way `menu` state — `"closed" | "open" | "closing"` — rather than a boolean. The exit animation needs the panel mounted *after* the intent to close, and driving that from a boolean means calling `setState` inside an effect, which React Compiler rejects. `"closing"` is entered from the click handler and left from anime's `onComplete`. When `canAnimate()` is false the dismiss handler skips `"closing"` entirely, so the drawer never has to unmount itself.

This is the one place a physical transform can't be derived from a rect: the panel slides toward the edge it is docked on, so its off-screen offset needs `direction === "rtl" ? -1 : 1`.

**The drawer is a SIBLING of `<header>`, not a child, and it must stay that way.** `Header` returns a fragment for exactly this reason. The bar carries `backdrop-blur-xl` in its solid state, and **a `backdrop-filter` makes an element a containing block for `position: fixed` descendants** — so with the drawer nested inside, `fixed inset-0` resolved against the 64px bar instead of the viewport. The panel and its scrim were 64px tall, clipped into the header: on every device, on the order page always (the bar is solid from the first paint there) and on the landing page from the moment you scrolled past the hero. It only ever appeared to work at the very top of the landing page, where the bar is `bg-transparent` and has no backdrop-filter at all — which is precisely where it had been tested.

The same trap applies to anything else `fixed`: `transform`, `filter`, `backdrop-filter`, `perspective` and `will-change` on an ancestor all create a containing block. `ReviewDialog` is safe because it sits under `OrderForm`'s plain wrapper, but check before nesting a new overlay anywhere.

**Its `canAnimate()` guard is load-bearing and was missing once.** `animate` writes its FROM value immediately — `translateX(away)`, `opacity: 0` — so with anime's engine paused (a backgrounded tab) the panel opens one full width *outside* the viewport with the scrim over the page: from the reader's side, the menu button does nothing at all. That is the single worst failure this rule prevents, and it is invisible to any test that reads the drawer's DOM instead of its geometry — which is exactly how it was missed. **Assert on `getBoundingClientRect()`, not on `querySelectorAll` finding the rows** — and assert on *both* axes. The containing-block bug above survived a geometry check that only measured `left`/`width`; the panel was the right width and in the right horizontal place, and 64px tall.

### Header height and anchor offsets

`--header-h` (`:root` in `globals.css`, 4rem → 5rem at `lg`) is the single source for the fixed bar's height. `Header.jsx` consumes it as `h-[var(--header-h)]`, and `html { scroll-padding-top: calc(var(--header-h) + 1.5rem) }` offsets every in-page anchor from it. Sections deliberately carry **no** `scroll-mt-*`: scroll-padding on the scrollport and scroll-margin on the target *add together*, which is what previously pushed anchor landings ~180px past the bar.

**`Header` takes an `onLanding` prop, and it is not optional in practice.** The transparent bar exists only because the dark hero is behind it; on any other route that state means cream type on cream paper — an invisible header until the reader scrolls, which is exactly what the order page shipped with before this was added. `onLanding` also decides whether the nav anchors are in-page (`#how`) or have to travel home first (`/ar#how`, otherwise they are dead links off the landing page), and whether the scrollspy runs at all. It is derived from a prop rather than sniffed from the DOM (`document.getElementById("top")`) so the anchors render identically on server and client. `solid` is *derived* as `onLanding ? scrolled : true` — setting it from the effect body is a React Compiler violation.

The header's scrollspy also measures the live bar height rather than a constant, so changing `--header-h` alone keeps the bar, the anchor offset, the transparent→cream handover and the active-link line in sync.

`scroll-behavior: smooth` is gated behind `html[data-ready]`, which `Header` sets on mount. On bare `html` it also applies to the browser's initial scroll-to-fragment, so arriving at `/en#pricing` animated all the way down from the top — which reads as the page running away with itself. A deep link should arrive instantly; only in-page clicks should glide. The reduced-motion override has to match `html[data-ready]` too, or it loses on specificity.

### The logo

`components/Logo.jsx` renders the delivered brand mark through `next/image`. `public/brand/logo-source.png` is the untouched master as delivered; `public/brand/logo.png` is that file trimmed to its alpha bounds and downscaled, which is what the app loads. `public/brand/logo-512.png` is a transparent padded square, currently unreferenced.

**The icons are the full mark at every size**, on a `brand-deep` rounded square. They live in `app/` and Next wires them by filename — `favicon.ico` (16/32/48/64), `icon.png` (256), `apple-icon.png` (180) — so no `<link>` tags are declared anywhere.

This is a deliberate brand decision, made against the legibility argument: a simplified icon (the open book alone, cropped from the mark) reads noticeably better at 16px, and was tried and rejected. **Use the whole logo.** If the 16px frame is ever revisited, that is the alternative — not a new mark.

- **Padding shrinks with the frame** (3% at 16px up to 8% at 64px). A 16px icon cannot afford the margin a 64px one can before the mark stops reading at all.
- **`apple-icon.png` is square-bled** (no corner radius) because Apple applies its own mask.
- The badge has its own teal ground on purpose: the mark is transparent with cream pages, which disappear against a light tab bar.

Regenerating them is a Pillow script, not a design tool — centre the mark on the rounded square, render each ICO frame natively rather than downscaling one bitmap, then quantise to a 256-colour palette (`FASTOCTREE`, the only palette method Pillow allows on RGBA), which cuts the PNGs by roughly 6× with no visible change.

The mark is **illustrative, and 1.051 wide** — below ~44px the book and the figure collapse into one teal smudge, and its cream pages lose their silhouette against the cream page background. Give it height, never a square (`h-11`, not `h-10 w-10`), and don't shrink it to fit a tighter bar. It is also **teal-only**: the gold in the brief now has to come from elsewhere in the chrome (in the header, the bookmark indicator and the gilded bottom hairline). The mark is language-neutral; only the wordmark beside it changes (`dict.brand.wordmark`).

### Vendored Aceternity components

`components/ui/*.jsx` came from the Aceternity shadcn registry (`npx shadcn@latest add @aceternity/<name>`) and were then **modified** — RTL fixes, brand recolouring, Arabic-safe text splitting, icon-dependency removal, React Compiler lint fixes. Each file records what changed from upstream, either as a header comment or as a note at the modification point. Re-running `shadcn add --overwrite` on these will silently undo all of it.

`motion` (Framer) is a dependency only because these components need it. Prefer CSS for anything new; before pulling another registry component, check what it drags in (`card-spotlight` pulls `three` + react-three-fiber, `sparkles` pulls tsparticles — both far too heavy for a page whose traffic is mostly mobile).

### Artwork pipeline

`components/BookArt.jsx` owns the *files* — `COVER`, the spread paths and their intrinsic dimensions, and the `BookCover`/`SpreadImage` wrappers around `next/image`. Every **string** (title, category, note, alt) is per-locale and lives in `dict.book`; `getSpreads(dict)` merges the two. Swapping in real photography of the printed book means changing only this file and `public/samples/`.

**The live landing-page sample is the fictional marketing order Q-000002.** Its
1024px square artwork lives under `public/samples/q-000002/`: `cover.jpg`, then
`page-01.jpg` through `page-10.jpg` in story order. The Arabic dictionary carries
the approved fully vocalised Jordanian story text; English is a reader-facing
rewrite of the same beats. The order chose a general character rather than the
child's likeness, so the sample must never claim that these pictures reproduce a
real child's face. It is labelled "نموذج توضيحي" / "Illustrative sample" everywhere.
The pull quote beneath the gallery is the story dedication from the approved JSON,
not a customer testimonial, and its attribution must keep saying so.

The illustrations are AI-generated and **deliberately textless**. Generated Arabic comes out mangled, which is the loudest possible "AI-made" signal on an Arabic page, so the book's title is set in Cairo as an HTML overlay instead. Any text placed over artwork needs a gradient scrim behind it — image pixels can't be contrast-audited, so the scrim is what has to carry the contrast.

## The order page

`/[lang]/order` (`app/(site)/[lang]/order/page.js` → `components/order/OrderForm.jsx`). It is the only route besides the landing page, and the only form in the project.

**Its fields are not a design decision — they are the inputs to the AI pipeline.** `docs/ai-prompts.md` holds the three prompt templates the business runs in order (story text → character reference sheet → per-page illustration), and every field on this page fills a placeholder in Template 1 or 2:

| Form field | Fills |
|---|---|
| `childName` `childAge` `gender` | Template 1 name / age / gender |
| `trait1` `trait2` | Template 1 personality traits |
| `favourite` | Template 1 favorite_thing |
| `sidekick` | Template 1 supporting character |
| `sidekickRelation` | Template 1 supporting character's **relationship** — see below |
| `sidekickAge` | Template 1 supporting character's age — see below |
| `petDescription` | Template 1 pet species/type, colour and distinctive markings — see below |
| `quirk` | Template 1 `quirky_detail` — **the load-bearing one** |
| `storyType` + `storyChoice` | Template 1 story type + specific choice |
| `setting` | Template 1 setting — optional, omit the line when blank |
| `avoid` | Template 1 **hard exclusion** — see below |
| `tone` `language` `pages` | Template 1 tone / language / length |
| photos (picker) | Template 2 reference images |
| `wantsAvatar` | whether Template 2 runs at all — see below |

**The form no longer asks for a dedication.** It was optional, and its own hint already said we would write one if it was left blank — which is what Template 1 does anyway: `dedication` is a field of that prompt's JSON *output*, never one of its inputs. So the question offered to override something the model was going to write regardless, and most parents left it blank. The story's dedication is now always ours; `giftMessage` is the one place the buyer's own words go, and that is a distinct, paid, printed page.

**The `dedication` field is still in the API and the dashboard on purpose.** Orders placed while the question existed carry a real one, so the model field, the validation entry and both shapers stay, and `OrderPanel` still renders the row — but only when it is non-empty, so new orders don't show a permanent "—". Removing any of that would hide real customer data. New orders simply store `''`.

**`avoid` is the only field that constrains the story instead of describing the child, and it is the one with real stakes.** A personalised gift that lands on a bereavement, an absent parent or a fear the child has not been told they have is the worst thing this product can do, and nothing else on the form asks about it. It is optional and free text; in Template 1 it becomes a hard exclusion covering both the page text and the `illustration_description`, worked around silently rather than mentioned. In the dashboard it is deliberately **not** a table row — it is set apart in berry above the book panel, the way `quirk` is set apart in gold, because a prohibition lost in a list of rows is exactly the failure it exists to prevent. `setting` beside it is ordinary and optional: give the writer a real place or let them choose one.

**`city` and `area` are a dependent pair backed by `lib/jordan.js`, not free text.** The old single "المدينة أو المنطقة" box produced answers nobody could dispatch a courier from — every parent spells the same place differently. The top level is the **12 governorates**, which is the only complete, stable partition of the country, so Russeifa is an *area* under Zarqa and Ramtha one under Irbid rather than cities of their own. The second level is **towns and neighbourhoods, deliberately not the ألوية hierarchy** — 244 of them, compiled from the Arabic Wikipedia governorate articles and cross-checked against the English "Districts of Jordan" list rather than recited from memory. Two reasons for towns over districts: sources disagree on the district structure of the smaller governorates (Ajloun is 2 ألوية in one source and 5 in another) while the town names are consistent everywhere, and — decisive — nobody arranging a delivery says "لواء وادي السير", they say "مرج الحمام". Each governorate's ألوية centres are in the list alongside its towns, and Amman additionally carries the neighbourhoods people actually name. Every list ends in "أخرى", because this is a delivery *zone* — the exact address is arranged in the WhatsApp conversation that follows, and no list of a country's towns is ever finished.

Three things about it: **area slugs are globally unique** (`karak-city`, not `city` twice) so `areaLabel()` is a flat lookup — `briefText` iterates flat field keys and has no city in scope. **Slugs are stored, labels displayed**, the same rule as `tone: sweet` → "حنونة", and both lookups fall back to the raw value so orders placed before the dropdown still show the Arabic a parent typed. And the server keeps them as **capped strings, not enums**, unlike every other closed set here: they feed no prompt and no price, and duplicating a 150-entry gazetteer across two repos would give two lists that drift.

Two fields need their own note:

- **`sidekickRelation`, `sidekickAge` and `petDescription`** are prompt inputs. The relationship exists because Arabic changes pronoun, verb form and adjective ending depending on whether the named sidekick is a brother, a sister, a friend (m/f) or a pet; the age keeps that character's dialogue, behaviour and illustrated appearance accurate instead of leaving the writer to guess whether they are a toddler, peer or older sibling. Relation and age are **required once `sidekick` is filled, and hidden entirely when it is not**. If the relationship is `pet`, one more required textarea asks for the animal's species/type, colour or breed and distinctive markings; that answer is stored with the brief and used directly by the story prompt, so fulfilment does not have to ask the parent again or let the model infer a pet from its name. Clearing the name clears all three dependent values, and changing the relationship away from `pet` clears `petDescription`, so hidden data cannot leak into another companion. The relationship is a five-option native `<select>` (`SelectField`), not the usual `ChoiceField` — five radio cards would outweigh the optional question they hang off.
- **`wantsAvatar`** (`yes` / `no`, default `yes`) decides whether the child's likeness is drawn. `no` means **Template 2 is skipped entirely** and Template 3 draws a general character from a fixed description instead. It is asked directly above the photo picker because it decides whether that picker is rendered at all, and answering `no` **clears any photos already chosen** — a parent who says they do not want their child drawn must not have that child's photographs uploaded anyway. It is also why zero photos is no longer unambiguous: on a `wantsAvatar: no` order an empty photo list is the correct outcome, so the send dialog and the dashboard both say that instead of "send them in the chat". The `?? 'yes'` defaults in the API shapers exist because every order predating the field was an avatar order.
- **`occasion`** (`birthday` / `eid` / `newSibling` / `justBecause`) fills **no** placeholder in any template, and should not be wired into one. It records what the book is *for*, which is what the gift page should sound like — so it is **asked only when `isGift === "yes"`**, directly under that question and above the message it informs. Asking every parent, including the ones keeping the book for themselves, was a question most of them had no reason to answer. Turning the gift back off **clears it**, the same rule `sidekick` → its dependent details and `wantsAvatar` → photos follow: the control is hidden in that state, so a leftover value would be submitted, and be uneditable, for an order with no gift page to shape. It stays optional even for a gift, and `justBecause` is the honest "none" — a radio set cannot be unpicked, so the neutral answer has to be one of the options rather than an absent one. **The cost of the condition is worth knowing:** a non-gift order now carries no occasion, so a future birthday / yearly-reorder reminder can only key on orders that were gifts. The dashboard still renders the row for any older order that recorded one.

There is deliberately **no tier question** here. Choosing between an avatar-only and a fully personalised story belongs to the **ready-stories order page, which does not exist yet** — everything this form asks for (the quirk, the real habit, the traits) only makes sense for the fully personalised flow, so asking again would be a question with one honest answer. The Tiers section reflects that: the avatar-only half is marked **coming soon** and has no CTA at all, because the only order path there is would land that parent on a form asking questions their story does not have — which is worse than no button. Only the fully personalised half links here. Give the avatar half its CTA back when the ready-stories page lands, and point it there rather than here. How the coming-soon state is rendered is in "Tiers".

Renaming a key in `lib/order.js` without updating the prompt that consumes it breaks the pipeline silently — nothing will error, the stories will just get blander.

`quirk` gets the largest control and the longest hint on purpose. The prompt weaves it through the story at two or more points, and it is the single thing that separates a personalised story from a template with the name swapped. A vague answer here produces exactly the product the landing page promises this is not.

### `contactHandle` is a phone number, and `lib/phone.js` is what makes that true

The field used to ask for "a WhatsApp number **or** an Instagram handle", which meant the single field we use to reach a parent could hold `079…`, `@sara`, `sara.q` or a bare `7 9139 0118` — none of them dialable without a human first deciding what they are. It is now a phone number, validated, and `lib/phone.js` owns every read and write of one.

**The key stays `contactHandle`.** Orders placed while the field accepted a handle hold a real one, so renaming it would need a migration and would hide customer data for nothing — the same reasoning that keeps `dedication` in the model. The label, the input type and the validation are what changed.

Three rules decided the module:

- **Arabic-Indic digits are ordinary input, not an edge case.** A parent on an Arabic keyboard types `٠٧٩…`, and every naive `/^\d/` test rejects it. Both Arabic digit blocks (U+0660–0669, U+06F0–06F9) are folded to ASCII first, along with spaces, dashes, parens and the bidi marks that travel with anything pasted out of an RTL chat.
- **A Jordanian number is stored the way Jordanians write it — `07XXXXXXXX`, not E.164.** The dashboard's order search (`orders.routes.ts`) is an *unanchored regex over the stored string*, so an operator typing `079` has to find the order; storing `+962…` would silently return nothing. `wa.me` wants `9627…` and gets it from `toWhatsAppDigits()` at the point of use — that conversion is centralised because getting it wrong does not error, it opens a chat with nobody.
- **A foreign number keeps its `+`, and must have one.** Print delivery is Jordan-only but a PDF is not, so a parent abroad is a real customer; what is refused is a foreign number with no country code, which is a number nobody can ring. Jordanian landlines (`06…`) are refused too — this field exists to reach someone on WhatsApp.

`normalizePhone()` returns `""` for anything it cannot make sense of and `isPhone()` is defined as "normalises to something", so "cannot be normalised" and "invalid" are the same answer by construction — there is no second rule set to drift out of step.

**Validation is two lists, not one.** `missingFields` (blank) and `invalidFields` (answered wrongly) are kept apart because they need different words on screen — "required" is not an answer to "that age is text" or "that number is nine digits long". `orderProblems` merges both in `FORM_FIELD_ORDER`, and that merged list is what `isComplete`, `errorOn` and the submit-focus all read. `validationIssue` distinguishes an invalid age, phone, closed choice and overlong text so `errorTextFor` can say what is actually wrong. **Every error message used in a two-up row has to stay one short line** — it lands in the `min-h-[1.25rem]` slot `reserveError` holds open, and a second line brings back the neighbour shift that slot exists to prevent (measured: error height 20px, neighbour divergence 0).

**Submit focus must understand both single controls and choice groups.** Text inputs, selects and the photo picker are addressed by `id`, while `ChoiceField` renders a set of radios addressed by their shared `name`; there is intentionally no focusable element with the group's field id. `focusOrderField` handles both shapes, focuses the first radio for a choice group, scrolls its containing fieldset into view, and waits one animation frame so React can render every error before the target is centred. Reusing it for review-section edits also means an Edit action can land on a section whose first field is a choice group (notably `format`).

**Normalisation happens on the way into the review, not on every keystroke.** Rewriting a field while someone is typing in it is hostile; the review dialog is exactly the screen where a parent should see the canonical form of what they are about to send, before anything leaves the page. `normalizeOrderValues` trims outer whitespace, turns Arabic-Indic ages into canonical ASCII integer strings, normalises the phone, and clears values hidden by a controlling choice (sidekick details, print delivery fields, occasion and gift message).

**Age controls stay `type="text"` with `inputMode="numeric"`, deliberately.** Browser support for Arabic-Indic digits in `type="number"` is inconsistent, while Arabic keyboards produce those digits routinely. `lib/numbers.js` folds both Arabic digit blocks and validates whole years; the main child is constrained to 0–18 and a supporting character to 0–120 (the latter may be an older sibling or a pet). The API repeats the same rules and canonicalises the stored value, so bypassing the browser cannot put prose or a decimal into an age field.

**Frontend text limits mirror the API caps.** `FIELD_LIMITS` in `lib/order.js` is passed into every free-text input/textarea as `maxLength`; Zod remains the authority and carries the same limits. Closed radio/select values are also checked in both places. Names are deliberately not restricted to an alphabet — Arabic, English, spaces, hyphens and family spellings are all legitimate text.

**A phone number is LTR text however the page reads.** Without an isolate, a leading `+` resolves against the surrounding paragraph and renders on the *wrong end* — `+962…` shows as `962…+`. So the input carries `dir="ltr"` (`TextField` passes `dir` and `autoComplete` through), and every place the value is displayed on an RTL page wraps it in `<bdi dir="ltr">`: the review dialog's row (via `ltr: true` on that row) and the dashboard's contact row. This is invisible in `/en`; check it in `/ar`.

**The same trap exists in plain text, where there is no markup to fix it with.** The WhatsApp message and the copyable summary are strings rendered by someone else's text engine — measured in an RTL paragraph, `رقمي: +14155552671` puts the `+` to the *right* of the last digit, so the parent sends `14155552671+`. `phoneForText()` wraps the value in the Unicode isolate `<bdi>` compiles down to (LRI…PDI, U+2066/U+2069), and **only when there is a `+` to protect** — a local `0791234567` is all digits and needs nothing, and invisible formatting characters are not worth sending to every parent for a case that cannot arise. The reference (`Q-000001`) opens with a Latin letter and was measured as safe unaided.

**The dashboard's contact row is a `wa.me` link when the value is a phone**, plain text when it is not — one tap instead of copying digits out of a row, guarded on `isPhone` so a legacy Instagram handle does not become a link to nobody.

**The server still takes `contactHandle` as a plain capped string, deliberately.** Duplicating the phone rules in `validation.ts` would let a number this repo considers messy 400 an order that has already been filled in — and losing an order is the thing this codebase treats as worse than anything. The browser is where the number is checked and where it is fixed.

### Review before send, and what actually happens on send

Submitting does not send anything — it opens `components/order/ReviewDialog.jsx`, where the parent reads their own answers back grouped the way the form is, with a per-section **Edit** button that closes the dialog and puts the cursor in that section's first field. A review you cannot act on is a speed bump, not a check.

It is a real modal (`role="dialog"`, `aria-modal`, scroll lock, initial focus, Tab trap, Escape, focus returned to the submit button) and uses the same three-way `"closed" | "open" | "closing"` state as `MobileDrawer`, for the same React Compiler reason.

**`onDismiss`, `onExited` and `onEdit` must stay memoised.** The dialog's modal effect lists `onDismiss` in its deps, so an inline arrow makes that effect tear down and re-run on every parent render — unlocking body scroll and yanking focus back to the trigger while the dialog is still open. That bug was live for one commit; it is not theoretical. This is also why `dismissReview` reads a **ref** (`sendingRef`, written from an effect, never during render) to know whether a send is in flight: depending on `send.state` directly would give `onDismiss` a new identity on every progress tick, which is the same bug with extra steps.

**Placing the order and opening WhatsApp are two separate presses, and that is load-bearing.** The dialog's footer runs `POST /public/orders` → upload the photos against the ticket that response carries → *then* show a WhatsApp link. Two reasons it is not one button:

- The order has to be filed before the parent leaves the page. WhatsApp is a navigation away.
- **A `window.open` after an `await` is a popup**, and browsers block it. A link the parent taps once the order is in is both honest and reliable.

**The failure path is a first-class path, not an error toast.** If the POST fails the parent is not stranded: the dialog says so, offers a retry, keeps the WhatsApp link, and brings back the phase-1 escape hatch — the full details, copyable, to paste into the chat. That copy button appears **only** in the failure branch; once the order is filed it would just invite pasting a wall of text we already have. Losing an order to a bad minute of Wi-Fi is worse than any amount of interface. A failed photo upload does **not** fail the order — the team has the whole brief and can ask for photos in the chat, and telling a parent whose order we already have that nothing worked would be a lie.

**A filed order stays filed.** The done state hides the send button, but the parent can still close the dialog and press submit again — which, before this, reset `send` to idle and filed the same answers a second time. `handleSubmit` now only resets `send` when it is not already `"done"`, so reopening the review after a successful send shows that done state again — reference, WhatsApp link, no send button. **Editing a field afterwards does not unlock a re-send either**, and that is the counter-intuitive half: an edit changes nothing about the order already sitting in the dashboard, so re-filing would produce two orders and one payment. The way to place a second order is to finish the first one.

**Tapping WhatsApp on a filed order is what ends the flow.** It resets the form to blank and hands over to `ThankYouDialog`, which is how a parent orders a second story for a second child without reloading — the requirement that "they cannot send this order twice, but they can place another one" is one rule with two halves, and this is the other half. Four things about it:

- **The reset happens on the dialog's way out, not in the click handler.** Resetting in the handler unmounts the very anchor the browser is about to follow, and whether the navigation survives that is a guess about scheduling. `finishOrder` writes an intent to `finishRef` (a ref, for the same reason as `sendingRef` — it must not change `reviewExited`'s identity, which the dialog's effect depends on) and sets the review to `"closing"`; `reviewExited` performs the reset ~200ms later, after the new tab is long gone. It routes through `"closing"` **even when `canAnimate()` is false**, where `dismissReview` would go straight to `"closed"` — that would unmount the anchor during the click that is following it.
- **The reference and the WhatsApp link are captured before the wipe.** After the reset the parent has no other copy of either: the answers are gone, so the link cannot be rebuilt, and the review dialog that was showing the reference is gone too. `finished` holds both, and the thank-you renders the reference as a figure rather than folding it into a sentence. The WhatsApp link appears there a second time on purpose — a blocked pop-up or a device without WhatsApp leaves the first one having done nothing at all.
- **`format` survives the reset**, because the URL still says `?format=print`; wiping it would leave the page contradicting its own address. Everything else goes back to `EMPTY_ORDER`, and `photos` is cleared. **The picker stays mounted through that**, since `wantsAvatar` resets to `"yes"` — so its unmount cleanup never runs, and the previous child's photographs would have stayed alive in the page while the next order was filled in. `PhotoPicker` therefore revokes an object URL when its photo **leaves the array**, in an effect on `photos`, rather than only where it was removed: `photos` is a controlled prop and the parent clears the whole array in two places (`wantsAvatar: "no"`, and this reset), neither of which goes through `remove()`.
- **The failure branch resets nothing.** No order was filed, so the answers on screen are the only copy of the brief and the "copy the full details" button beside them exists precisely so they can be pasted into that chat. `onFinish` is wired to the `sent` branch only.

**The thank-you returns focus to the page's `<h1>`, not to the button that opened it.** That button is at the foot of a form that has just been emptied, so the usual return-to-trigger rule would leave a parent who might want a second story at the bottom of a blank page — and its focus scroll beats any `scrollTo` the close handler makes. The heading takes `tabIndex={-1}`, a screen reader announces it, and the page is at the top: the same "you are back at the start" the dialog just said in words.

**`ThankYouDialog` is the third copy of the `"closed" | "open" | "closing"` modal pattern** (`MobileDrawer`, `ReviewDialog`, this), and the duplication is deliberate rather than pending. Both existing copies have a bug history in exactly this wiring — a non-memoised `onDismiss` tearing the modal effect down mid-open — so folding them into a shared shell is a change to make on its own, with its own verification, not on the way past. `onDismiss` and `onExited` must stay memoised in all three.

**The WhatsApp message is deliberately not the brief.** `buildWhatsAppMessage` in `lib/order.js` writes a greeting, a short labelled block and a closing line — because **WhatsApp is where payment gets arranged, not where the order is filed**. The full answers are in the dashboard, which is easier to act on than a message thread.

What is in that block is chosen so the same message works for both readers. It is **first person throughout**, since the parent is the one pressing send, and every line has to be something they would actually say *and* the line the team needs:

- **the reference** (`Q-000001`) is what turns "someone messaged about a story" into a row in the dashboard, and is why the function takes a `reference` argument at all. `ReviewDialog` passes `send.result?.reference`, so the message is built **after** the POST rather than at render time;
- **the parent's name** sits in the greeting rather than in a labelled row, because that is where a person puts their own name;
- **the phone number** is repeated even though WhatsApp already shows who is writing. Parents message from a shared family phone, or fill in a spouse's number; when the two differ, that difference is the thing to notice, and it is invisible unless the form's answer is in the message.

**The failure path gets a different message, not the same one with a line missing.** `reference` is empty when the POST failed, and sending the confident version silently short a line would leave the team looking for an order nobody filed and the parent waiting on it. That branch says so instead (`whatsapp.notFiled` / `whatsapp.closingNotFiled`) and invites the details into the chat — which is exactly what the "copy the full details" button beside it is for.

**The number is live:** `WHATSAPP_NUMBER = "962777390118"` in `lib/site.js`. It is dialled as 00962 777 390 118, but **wa.me wants digits only, country code first, with no `+` and no `00`** — get that wrong and wa.me does not error, it opens an empty chat with nobody. The `whatsappHref()` fallback to the Instagram DM is kept for the case where the number is ever removed; `ig.me` cannot carry prefilled text at all, which is what that branch exists to handle.

**Conversation CTAs are still Instagram, on purpose.** `CONTACT_URL` is pinned to `INSTAGRAM_DM_URL` rather than preferring WhatsApp, because every line of copy on the page says Instagram — the hero's "we reply on Instagram within hours", the FAQ lead, the closing section, the footer. Pointing those at WhatsApp without rewriting that copy would send people somewhere the page did not promise. Orders are the exception: they go to WhatsApp, because that is where payment happens. To move conversations across too, set `CONTACT_URL = WHATSAPP_URL` and update those four mentions in both dictionaries.

### The order API

`lib/api.js` is the whole client. `NEXT_PUBLIC_QISSATI_API` is the base URL **including the `/qissati` mount** (`http://localhost:5000/qissati` locally). It is public because the parent's browser posts the order and pushes the photos directly, and the dashboard runs client-side — nothing secret passes through it.

**Every call returns `{ok, status, data, error}` rather than throwing.** At every call site the question is "did it work, and what do I tell the parent", and a try/catch around each call answers that worse. Requests carry a timeout, because a hanging request is worse than a failed one when someone is staring at a spinner between filling the form and paying — **except** a cached server-side read, where an `AbortSignal` would opt the fetch out of Next's data cache and turn the landing page's price lookup into a per-request round trip.

**`lib/pricing.js` fails soft, and that is the point.** `getPricing()` (landing) and `getOrderPricing()` (order page) fall back to the bundled all-`null` table when the API is unreachable — so every figure renders `[X]` and the page looks exactly as it did before there was a backend. A pricing fetch must never be able to take the landing page down.

**The two readers cache in opposite directions, and the order page's `no-store` is not an oversight.** The landing page keeps a 5-minute `revalidate`: it is otherwise static, a price changes a few times a year, and trading a prerender for per-request freshness buys nothing. The order page is `cache: "no-store"`.

It used to be a 30-second `revalidate`, and that was wrong for a reason worth recording, because the symptom is so misleading. An owner who changed a price at `/admin` and reloaded the order page kept seeing the old one — **measured at up to 27 seconds across nine ordinary reloads.** Reloading cannot help, because the staleness is in Next's server-side data cache, not the browser's; but the natural next move is a hard refresh, and by the time you have done one the window has lapsed. So the interface teaches you that this page "needs Cmd+Shift+R", which is a conclusion that cannot be true — a hard reload has no reach into a server cache. The order page is also the one place a stale price actually costs something, because that is where the number becomes a quote. `no-store` makes the next ordinary reload correct.

**A `no-store` read must carry a timeout, and `request()` now gives it one.** The AbortSignal is skipped for `next`-cached reads because a signal opts a fetch out of Next's data cache — but there is no data cache to protect here, and this fetch runs on *every* render of the order page rather than once per window. It is therefore the read that most needs a bound: an API that accepts the connection and never answers would otherwise hang the order page itself. Verified — with a hanging API the page renders `[X]` after 6.05s instead of never; with the API refused outright it renders in 0.03s.

`fillPlaceholders()` substitutes the turnaround days and the age range into the FAQ copy — and **only what the owner has actually set**, leaving the rest as brackets. Both dictionaries keep `[X]` / `[X-Y]` precisely so an undecided value stays visibly undecided.

**The price box says when, not just how much — and there are two answers, not one.** The PDF and the printed copy are different jobs: the digital file is finished when the book is, the printed one adds printing and a courier. So the settings carry **`turnaroundDaysPdf` and `turnaroundDaysPrint`**, and `turnaroundLabel(dict, pricing, format)` quotes the one for the format actually chosen.

They are **deliberately independent** — no `print >= pdf` validation anywhere. The owner may decide one before the other, and the site's standing rule is that undecided stays undecided; the two are not even on the same clock, since a print turnaround is quoted from the order and a PDF one from the details landing.

`turnaroundLabel` returns `null` when no format is picked, and the line is then **not rendered at all** — a conditional row like `showPages`/`showFormat`/`showGift` beside it. Until a format is chosen there is no single promise to make, which is the same reason the total reads `[X]`. Once chosen it still renders "[X] أيام" while that format's number is unset. The day count goes through `daysLabel()` for the number-agreement reason `pagesLabel()` exists — verified: a 3-day PDF renders "3 أيام" and a 2-day print renders "يومين", the dual absorbing the numeral.

The FAQ answer carries **both**, as `[X]` (digital) and `[Y]` (printed). Neither token can match inside the age range's `[X-Y]`, and `fillPlaceholders` now takes the `dict` so it can substitute through `daysLabel` rather than pasting a bare numeral — which is why that answer must **not** write "أيام" after the token, or the unit doubles. `turnaroundDays` (singular) survives in the settings model and is still emitted by `shapePricing` as the PDF value, purely so a frontend deployed before this change keeps filling its one placeholder; nothing writes it any more.

**The 8-page chip says "مشمول ضمن السعر الأساسي", not a price.** Eight pages *is* the base story, so it adds nothing; showing the base figure there — beside "10 صفحات +٣ دينار" — read as a second charge for the thing you were already paying for, rather than as the default. `addon.includedInBase` in both dictionaries.

**`priceBreakdown`, `buildOrderSummary` and `buildWhatsAppMessage` all take the live table as an argument**, defaulting to the bundled `PRICING`. The order page threads it down as a `pricing` prop. Nothing reaches for a module-level price table any more, so a backend outage degrades a price to "not decided" instead of quoting last week's.

### Photo uploads

**The photo range is 1–3 when `wantsAvatar === "yes"`.** `OrderForm` refuses to open the review until at least one image is selected and focuses `PhotoPicker` with a specific error; `wantsAvatar: "no"` still requires none and clears any selected files. The minimum is necessarily a browser gate: the order is created first so its response can mint the secure, order-scoped upload ticket. A later network failure during the upload still keeps the already-filed brief and sends the family to the established photos-by-chat recovery path. The ceiling is enforced in two places: `MAX_PHOTOS` in `components/order/PhotoPicker.jsx` keeps the browser polite; `MAX_PHOTOS` in the API's `services/uploads.ts` is what actually decides, via the upload route's `maxFileCount` *and* the atomic `photos.2` `$exists` predicate that stops parallel uploads racing past the cap. Change one without the other and they disagree.

`components/order/PhotoPicker.jsx` is now **controlled** — `photos` and `onChange` come from `OrderForm`, because the upload happens at submit, after the order exists and the server has minted a ticket for it, so the picker cannot be the only thing that knows about the files.

`lib/upload.js` does two things before anything leaves the browser:

- **Downscales to 1600px long-edge, JPEG q0.85.** A modern phone photo is 3–5MB of 12-megapixel JPEG; the character-reference prompt needs a clear face, not a print master. Three photos go from ~12MB to ~1MB — on Jordanian mobile data that is the difference between an upload that finishes and one the parent gives up on, and it leaves that much less of a child's likeness in storage. `createImageBitmap(file, {imageOrientation: "from-image"})` is not optional: without it a portrait iPhone photo lands sideways, because the rotation is in EXIF rather than in the pixels. Any failure returns the original file — a failed resize must not become a failed order.
- **Sends the upload ticket as a bearer header.** The endpoint is not open: the server authorises the upload against a 30-minute JWT scoped to the one order it just created.

**What happens to the photos is stated on the screen where they are handed over** (`dict.order.photos.privacy`), not in a policy page nobody opens. It is a promise the code has to keep, and the API now checks it before letting the dashboard make it: `DELETE /orders/:id/photos` deletes from the store **first** and only clears the row once the store confirms, answering 502 if it does not. `OrderPanel` tells those apart — a 502 says the photos are still there and a retry is safe, rather than the generic failure — and its success notice is only reachable when the deletion actually happened. Before this the row cleared regardless, so a failed deletion looked exactly like a successful one. Note UploadThing URLs are unguessable but publicly fetchable — there is no per-viewer ACL — so deletion is the only real revocation, and both the dashboard and this file say so.

### The admin dashboard

`/admin` (`app/(admin)/admin/page.js` → `components/admin/`). **Arabic, RTL, single locale** — its only readers are the Qissati team, and wiring it into the site's `[lang]` system would buy an English translation nobody asked for at the cost of putting the dashboard behind a locale segment and doubling every string. `noindex, nofollow`.

It follows the site's visual rules rather than inventing dashboard ones — ruled rows over cards, hairlines over shadows, the gold bookmark marking the active tab exactly as the header marks the active nav link. A dashboard bolted onto a brand in a different visual language reads as a different product.

**`AdminUi.jsx` holds every shared part** — `AdminButton`, `Panel`, `Row`,
`Notice`, `StatusPill`, `AdminField`, `PriceField`, `Empty`. They exist so the
dashboard's look is decided once: ruled rows rather than cards, hairlines rather
than shadows, one accent doing one job. Build a new panel out of these rather
than styling a `div`, or the dashboard starts drifting into a second visual
language one screen at a time. Two of them carry rules of their own: `Notice` is
a live region because every mutating action reports through it rather than a
toast that vanishes before it is read, and `PriceField` turns an empty box into
`null` rather than `0` — see "Prices are admin-managed now".

**The tabs are `OrdersView` (+ `OrderPanel`), `SettingsView`, `UsersView` and
`AccountView`.** `UsersView` is الحسابات: admin-only, creates and deactivates
accounts and resets passwords. It is the one place a password is set for someone
else, which is why the API stamps `passwordChangedAt` on that path too — an
admin resetting a compromised account must not leave the old tokens alive.

**Correcting a submitted brief is fulfilment work, not an admin privilege.**
Both `staff` and `admin` see `OrderEditForm` from an order and may replace the
customer-authored answers after confirming a correction with the parent. The
API revalidates the complete brief and strictly allowlists those fields; the
reference, photos, status, internal notes, timestamps and frozen price cannot
be changed through the answers object. Product choices are editable because
they were submitted answers, but the panel says explicitly that the original
quote does not recalculate — any price difference is handled with the parent.

`lib/utils.js` is the shadcn `cn()` helper (clsx + tailwind-merge) that the
vendored components expect. Nothing else uses it; the house style is plain
template strings.

**Views are state, not routes.** One operator working a queue moves between the list and an order constantly; routing would make each of those a route change that re-checks the session and repaints from empty. It buys deep links to an order, which is worth less here than a list that keeps its filter and scroll position when you come back from an order you just marked delivered.

**The session is a bearer token in `localStorage`**, checked against `GET /auth/me` on mount — a stored token is not a session (it may be expired, or belong to an account since deactivated), so it is only trusted after the server has answered for it. `localStorage` is readable by any script on this origin, which is the accepted trade for a cross-site API (Safari blocks the third-party cookie that would be the alternative); what keeps it honest is that this page renders no user-supplied HTML and loads no third-party script.

**A 401 on any authenticated request ends the session**, through a single hook rather than four copies of the same rule. `lib/api.js` holds a module-level `setUnauthorizedHandler`; `request()` calls it when a response is 401 **and the request carried a token**, and `AdminApp` registers `expireSession` on mount. The token check is the load-bearing half: a 401 from `/auth/login` means "wrong password", and signing an operator out of a session they have not started would clear the form under them. Before this, an expired token left every panel saying "we couldn't fetch that" — which reads as the API being down and gives the operator nothing to act on.

**`AccountView` is the one tab every role sees.** `adminApi.changePassword` sat in the client from the start with nothing calling it, which meant an operator who thought their password had leaked had no move at all — the best available was asking an admin to delete and re-create the account. Changing *your own* password is not an administrative act, so it is not in الحسابات, which is admin-only and would have left staff exactly as stuck.

### The dashboard is an installable PWA, without an offline copy of the dashboard

`app/manifest.js` makes `/admin` the installed app's start URL and uses the delivered full Qissati mark at 192px and 512px. `AdminApp` registers `public/qissati-sw.js` from every dashboard view, so the browser can offer installation before the operator visits `حسابي`. The worker has **no fetch handler and no cache at all**. Installability and background push are useful; a durable offline copy of orders, child details or photos would contradict the dashboard's `no-store` boundary.

`DeviceNotifications` under `حسابي` owns the explicit, per-device opt-in. It never asks permission on mount — `Notification.requestPermission()` runs only inside the enable-button click, which is both the honest UX and required by mobile browsers. An already-permitted browser subscription is re-sent to the API when this panel opens; that repairs a subscription row deliberately cleared by a password change without asking permission again. Turning notifications off unsubscribes the browser first, so even a failed API cleanup leaves an invalid endpoint; the server removes it on the next 404/410.

The API routes are `/notifications/config` (configured flag + VAPID **public** key only) and authenticated `PUT`/`DELETE /notifications/subscription`. Any active admin or staff user may register a device because both roles work the order queue. A new order triggers push after the successful response, beside the existing notification email, and neither delivery can make the parent's already-saved order fail. The lock screen gets only `وصل الطلب Q-…`; names, contact information, the brief and photos stay behind the dashboard login.

Password changes, admin password resets, account deactivation and deletion clear that account's saved endpoints on the server. This is separate from JWT invalidation: a push endpoint can receive without presenting a token, so ending sessions alone would not revoke it.

Real VAPID keys are deployment configuration, never frontend env: the dashboard fetches the public half after authentication and the private half remains on the Server. The qissati-specific `QISSATI_VAPID_*` trio is preferred; the Server-wide `VAPID_*` trio is the fallback. Keep one generated pair stable — rotating it invalidates every existing subscription. Missing or placeholder keys make the Account panel say push is not configured; the dashboard and email flow keep working.

**Local and Apple testing are not the same path.** On the Mac that is running Next, `http://localhost:<port>` is a potentially trustworthy origin, so service workers and Web Push can be tested without HTTPS. An iPhone opening `http://<Mac-LAN-IP>:<port>` is *not* on localhost; it needs a real/trusted HTTPS URL for the frontend (and an HTTPS API URL as well, or the browser blocks the mixed-content request). On iOS/iPadOS 16.4+, add the HTTPS site to the Home Screen, launch that installed app, then press the enable button under `حسابي`; WebKit exposes Web Push to Home Screen web apps and requires the permission request to come from that direct tap. Safari 16 on macOS Ventura 13+ supports standards-based Web Push without the iPhone Home Screen restriction.

**Provider acceptance is not proof that the OS displayed the notification.** A successful `webpush.sendNotification` means FCM/APNs accepted it; macOS can still suppress it when System Settings → Notifications has Google Chrome/Safari/the installed web app set to Off, and Focus can suppress it too. A browser subscription can therefore exist and the Account panel can correctly say “مفعّلة” while the OS displays nothing. Check both the site/app permission and the OS notification permission before debugging the service worker. Restart the backend after changing SMTP or VAPID env values because the running Node process does not reread `.env`.

**It is also the one authenticated call exempt from the 401 rule above** (`skipSessionEnd` in `lib/api.js`). `/auth/password` answers 401 when the *current* password is wrong, and ending the session over a typo would throw the operator out of the form they are standing in. Every other authenticated 401 still ends the session.

**Changing a password really does sign the other devices out** — the API stamps `passwordChangedAt` and `requireAuth` refuses any token issued before it. Because that invalidates *this* request's token too, `POST /auth/password` returns a replacement, and `AdminApp.refreshToken` swaps it into `localStorage` and state. Drop that and the operator is signed out by their own password change, one request later. The paragraph in `AccountView` states this promise out loud, so if the server stops keeping it, that copy is wrong — it was wrong twice before the server could keep it.

**A 401 from `changePassword` now means two things**, which is why the handler asks a second question instead of guessing. Normally it is "that is not your current password" (the reason for `skipSessionEnd`); but it can also mean this tab's token was rotated away by a change made elsewhere. `AccountView` follows a 401 with `adminApi.me(token)` — that call carries the token and does *not* opt out, so a genuinely dead session signs itself out through the global hook, and only a live one shows "wrong password".

`LoginView` therefore takes an `expired` prop, and `AdminApp` keeps `signOut` (the button, which `onClick` would otherwise hand a click event as its first argument) separate from `expireSession`. Both route through one `endSession(wasExpired)`.

**`res.data` can be `null` on an ok response.** `request()` returns a null body when the response will not parse as JSON — a gateway answering an HTML error page — so `res.ok` alone is not a user, a token or a stats object. Reading `res.data.token` off that threw inside the submit handler and left the form looking untouched: no error, no spinner, nothing to retry. Every read of `res.data.*` is now guarded.

**Security headers are split across two files, on purpose.** `next.config.mjs` carries what is static: `nosniff` and a referrer policy site-wide, and on `/admin/:path*` a stricter `no-referrer`, the legacy `X-Frame-Options`, and `Cache-Control: no-store` — the dashboard HTML is an empty shell whose every figure arrives later over an authenticated fetch, so caching it gains nothing and risks a shared cache serving the shell to someone the PIN gate turned away, or the back button redrawing it after sign-out. (`/admin/:path*` matches `/admin` itself; verified against a production server.)

**The Content-Security-Policy is built in `proxy.js`, because it needs a per-request nonce.** The session is a bearer token in `localStorage`, so the honest threat is a script that should not be running, and `script-src 'self' 'nonce-…'` is the directive that earns its keep. Next reads the nonce back out of the `content-security-policy` **request** header the proxy sets and stamps it onto every script tag it emits — verified: 14/14 in production, 22/22 in dev, and the value changes on every request.

**This is why the two admin pages are `force-dynamic`.** A nonce prerendered at build time would be the same one for every visitor, which is the same as having none. Nothing was lost — both pages are empty shells and already carried `no-store`. Do not "restore" `force-static` here; it would silently reduce the CSP to decoration.

Three entries in that policy are looser than they look, each deliberately:

- **`style-src` allows `'unsafe-inline'`.** React writes real `style` attributes — `next/image` alone emits `style="color:transparent"` — and CSP governs those through `style-src`. A stylesheet cannot execute; breaking every image buys nothing.
- **`img-src` allows any `https:`.** The reference photographs come from UploadThing, whose host arrives inside an API response and is written down nowhere in this repo. Pinning a guess would silently blank the photographs the team draws the book from — a visible, load-bearing failure — to constrain the one thing that cannot execute.
- **`'unsafe-eval'` and `ws:`/`wss:` are added only when `NODE_ENV === "development"`**, for React Refresh and the HMR socket.

`connect-src` is the strict one, and it is derived from the same `NEXT_PUBLIC_QISSATI_API` the client fetches with, so the policy and the fetch cannot drift apart. Both are inlined at build time, so **changing the API URL needs a redeploy** — which was already true of the client.

### What the dashboard was measured at, and what it costs

Audited against a production server (2026-09-05), not asserted. The numbers are
here so a regression is visible rather than argued about.

**Weight.** `/admin` downloads **211.9 KB gzip** across 11 assets. Roughly
180 KB of that is the React/Next floor; the dashboard's own code is ~32 KB, and
`lib/jordan.js` is 13.5 KB of it — the gazetteer comes along because
`lib/admin.js` needs `cityLabel`/`areaLabel` for two rows.

**`OrderPanel` is `lazy()`, and that is the only code-splitting here that pays.**
It pulls the prompt builder, the book editor, the canvas renderer, the OOXML
writer and the ZIP writer — none of which mean anything until an order is open,
and all of which an operator sitting at the *sign-in screen* was downloading.
Deferring it took `/admin` from 240.1 KB to 211.9 KB. Nothing else in the
dashboard is heavy enough to be worth a Suspense boundary; don't split for the
sake of it.

**Responsive: zero horizontal overflow at 318, 358, 388, 412, 500, 638, 766,
1024 and 1440 px** — measured as `scrollWidth − clientWidth` on the real
components, with every element whose box escaped the viewport listed. The book
editor's 208px page previews are the widest fixed thing in it and they clear
318px with room.

Two things that probe kept honest and that are easy to break:

- **Every visible control is ≥16px below `sm`.** That is `control-text` doing
  its job (see "Styling"), and the probe checks it rather than trusting it. The
  only sub-16px controls it finds are the fifteen `sr-only` file inputs, which
  are 1×1 and can never take a keystroke.
- **Tap targets are ≥24px** (WCAG 2.2 SC 2.5.8). The image-picker labels and
  the disclosure summaries were 20px tall — text links standing alone in a row,
  not inline in a sentence, so the inline exception does not cover them. They
  carry `min-h-[24px]` and `py-1` for that reason, not for looks.

**Security, re-verified end to end:** the PIN is in no client chunk and neither
is its name; a locked visitor gets no login form, no dashboard markup, no API
URL and **not even the dashboard's JS chunk**; the CSP nonce is fresh per
request and lands on 15/15 script tags; the gate cookie is `Secure`, `HttpOnly`,
`SameSite=lax`, scoped to `/admin`; five wrong PINs earn a 429; and there is no
`dangerouslySetInnerHTML`, `eval` or `innerHTML` anywhere in the app.

Two things that audit changed:

- **`poweredByHeader: false`.** `X-Powered-By: Next.js` named the stack to look
  up advisories for and bought nothing.
- **The gate page has its own `<title>`.** It is served *at* `/admin`, so its
  title is what a stranger who guesses the URL reads — and "لوحة تحكم قصتي"
  confirmed for them that they had found a real dashboard. It says "قصتي" now.
  Same argument as the rewrite, one line smaller.

**One thing the audit did not change, deliberately.** The book editor keeps its
edits in `localStorage`, so the child's name and the story text now sit on the
operator's machine alongside the token. That is the same trade the token
already makes and it holds for the same reason: this page renders no
user-supplied HTML and loads no third-party script. It is worth knowing that
the contents of that key are no longer just a session.

### The PIN gate in front of `/admin`

`ADMIN_GATE_PIN` puts a shared-secret prompt in front of the dashboard's sign-in form. **Be clear about what it is:** the real credential check is still the API's — email, password, a JWT it mints, roles it enforces, accounts it can deactivate — and that API is a different machine, reachable directly, so the PIN protects none of it. What it buys is that `/admin` stops being a door a stranger who guesses the URL can rattle: no login form to fingerprint, no password field for a bot to spray, no dashboard bundle served to anyone but the team. It is **not** a second factor and must never be described as one.

The pieces:

- **`lib/admin-gate.js`** — Web Crypto, not `node:crypto`, because `proxy.js` runs on the Edge runtime and this module has to work in both.
- **`proxy.js`** — the guard, matching `/admin` and `/admin/:path*`.
- **`app/api/admin-gate/route.js`** — verifies the PIN, sets the cookie. It sits *outside* the `/admin` matcher so the gate never has to carve an exception out of its own guard.
- **`app/(admin)/admin/gate/page.js` + `components/admin/GateView.jsx`** — the prompt, inside `(admin)` so it inherits the Arabic/RTL root layout and its `noindex`.

Six things that are load-bearing:

- **The file is `proxy.js`, not `middleware.js`.** Next 16 renamed the convention. Both names still resolve in 16.3, but having both is a hard build error telling you to keep the proxy — so don't "restore" the old name.
- **`ADMIN_GATE_PIN` has no `NEXT_PUBLIC_` prefix, and adding one would defeat the entire feature.** A `NEXT_PUBLIC_` value is inlined into the client bundle in cleartext; a PIN checked in the browser is a PIN published to everyone it was meant to exclude. Every check is server-side and the browser only ever holds an httpOnly cookie it cannot read.
- **A locked request is rewritten, not redirected.** A redirect would publish `/admin/gate` as a URL of its own and leave `/admin` visibly guarded. The rewrite means the dashboard's own URL answers with the prompt, and answers with the dashboard the moment the cookie is good — and the dashboard's HTML never reaches a locked visitor. An *unlocked* visitor who types `/admin/gate` is redirected to `/admin`, so it is never a second door.
- **The cookie is HMAC-signed with the PIN as the key**, value `<expiry>.<signature>`, and the expiry is inside the signature so it cannot be extended. Keying on the PIN means **rotation is revocation** — change the value and every device re-locks, with no session store to keep. The cost: anyone who ever sees a cookie value can brute-force a *short* PIN offline against that signature, which is why `.env.example` asks for a passphrase and not four digits.
- **Unset means the gate is off, on purpose.** Failing open is right here precisely because the password login behind it is the real security: a missing PIN leaves the dashboard exactly as safe as it was before this existed, while failing closed would lock the team out of their own orders over a forgotten environment variable. Set it in production.
- **The rate limit is an in-memory `Map` and is per instance.** Five wrong guesses buys that address a fifteen-minute pause; a serverless cold start begins with an empty map. Treat it as a speed bump — the *length* of the PIN is what actually decides this. Its key falls back through `x-forwarded-for` → `x-real-ip` → one shared bucket, and in that last case a stranger guessing wrong can make the team wait. That is the accepted trade against leaving an unlimited guessing endpoint open.

PIN comparison goes through HMAC digests rather than `===`: a string compare returns as soon as a character differs, which times how much of the secret a guess got right. Same for the cookie signature.


**React Compiler trap, hit for real here.** `SettingsView` fetched into state, early-returned while it was `null`, then rendered JSX reading `form.ageMax` directly — and crashed on first render with "Cannot read properties of null", because the compiler hoisted the memoised JSX block above the early return. It is now split into a fetching outer component and a `SettingsForm` that takes the loaded object as a prop, so there is no render in which it can be absent.

The trigger is narrower than "early return plus fetched data": `OrderPanel` has the same guard and renders fine, because it **destructures into locals** (`const { child, story } = order`) immediately after the guard rather than reaching through the object inside the JSX. Both shapes are safe; reading `data.field` inside hoisted JSX is not. When in doubt, prefer the split — it cannot go wrong either way.

**The other rule the compiler enforces here**: no synchronous `setState` in an effect body. Where an effect has a "nothing to fetch" branch, it resolves through `Promise.resolve(null)` so both branches settle asynchronously (`AdminApp`), and loading spinners are raised in the event handler that caused the refetch rather than at the top of the effect (`OrdersView`). Every list effect also carries a `cancelled` flag — type into the search box and three requests are in flight; without it the slowest wins.

`lib/admin.js` holds the Arabic vocabulary. Two things in it are load-bearing: the option labels **must agree with the order form's dictionary** (a `tone` of `sweet` is "حنونة" in both, or the team reads back a different answer than the parent gave), and `pages()` reimplements Arabic number agreement — `${n} صفحة` produces "10 صفحة", which is ungrammatical. `STATUS_TONE` writes out complete class strings rather than composing them, because Tailwind scans source text and an interpolated class name is simply absent from the stylesheet with no error anywhere.

### The prompt panel: one order → a finished book

`components/admin/PromptStudio.jsx` sits on every order and hands over six
gated steps: story prompt, paste/validation, human review, parent text approval,
reference sheets and page art. The prompts are built by `lib/prompts.js`,
filled from the stored order; `docs/ai-prompts.md` describes the pipeline and
says out loud that the code, not the doc, is the source of the wording.

**It exists because the drudgery is real.** A ten-page book is twelve image
prompts differing in one paragraph each, and an operator assembling those by
hand will eventually paste page 6's scene under page 7's number — a mistake
nobody catches until the printed book is wrong.

**Step 2 is why this is a component and not six buttons.** Gemini's JSON is
the hub: the character sheets need the appearance briefs and every page prompt
needs that page's scene. So the operator pastes the answer back and everything
below it is derived **during render** — no effect, no fetch, no second copy of
the story anywhere. Before the story prompt itself unlocks, the operator must
confirm that its concept was agreed with the parent. A current pet order already
carries the parent's species/type, colour or breed and markings from the public
form; only a legacy pet order predating that field reveals a local fallback box.
The model is never allowed to guess those details from the pet's name.
`parseStoryJson` takes the first `{` to the last `}`, because
Gemini wraps the answer in ```` ```json ```` fences and a sentence of preamble
however firmly the prompt asks it not to; that one rule handles the fences, the
preamble and the "hope this helps!" underneath, with no format to keep up with.

**How much text goes on a page is chosen before the story is written, not
after.** `TEXT_LENGTHS` in `lib/prompts.js` is short / medium / long, and
`LENGTH_SPEC` is a table rather than a sentence count because each one decides
three things at once:

| | words | who it is for | covered |
|---|---|---|---|
| `short` | 1 sentence, 6–12 | read *to* a young child; the picture carries the story | bottom 30% |
| `medium` | 1–3 sentences, 18–35 | read at bedtime — the default, and what every earlier book was | bottom 30% |
| `long` | 4–6 sentences, 45–80 | read *by* the child themselves | bottom 40% |

**The third column is why this is threaded rather than local to the prompt
panel.** Seventy words cover far more of an illustration than six, so the
length is written into the scene descriptions the story prompt asks Gemini for
*and* into the framing rule every image prompt carries — `compositionRules()`
derives both from the same table. Get them out of step and a long page composes
a face straight into the band that will sit on top of it. `OrderPanel` owns the
choice for that reason, beside the pasted JSON, and hands it to both.

**It also exposed a real divergence between the two renderers**, which is worth
recording because it is the exact failure the shared-`LAYOUT` rule exists to
prevent and it still happened. `paintPage` sized the canvas band as
`max(share, block)`; the CSS used a fixed share. Below about forty words nothing
showed. At seventy, the browser's band was shorter than its own text and the
PDF and the `.docx` rendered the same page differently. **The band now wraps the
words in both** — in CSS by being a flex container with a `min-height` rather
than a slab positioned behind them. A measurement shared but applied differently
is not shared.

**`parseStoryJson` repairs before it gives up, and says when it did.** Two
things a model reliably gets wrong inside a JSON string, both seen in real
output:

- **Unescaped quotes.** Asked for Arabic dialogue, Gemini writes
  `قال لأخته: "لا تقلقي"` — straight ASCII quotes, inside a JSON string, not
  escaped. That closes the value early and the whole reply is unparseable. The
  rule that sorts it out: a `"` inside a string is only the real end if the
  next non-whitespace character is one of `, : } ]` or the end of input.
  Anything else, the model meant it literally.
- **Raw newlines**, which JSON forbids inside a string and a model writing a
  two-line dedication produces anyway.

The repair only runs **after** a clean parse has failed, so well-formed output
is never touched, and `repaired: true` comes back so the panel can say so out
loud — a model that mangled its own quoting may have mangled something else,
and the operator is about to build a whole book on it. Whatever it cannot
rescue fails with the **line, column and the offending line itself**: a
position with nothing to look at is a puzzle, and a stray quote is a five-second
fix once you can see it.

**Parseable is not production-valid.** After parsing, `storyValidationIssues`
requires a title, parent-facing summary, dedication, character brief, supporting brief when a sidekick
exists, cover scene, exact ordered page count, sequential `page_number`, text
and illustration description on every page, and the selected word range on
every page. Any issue keeps the story out of `pagePrompts` and `BookStudio` and
is shown in Arabic by page. Once it passes, the operator must still complete a
human checklist for facts, natural language, personalisation, child safety and
visual continuity before the parent proof unlocks. The exact proof must then be
approved by the parent, and the reference sheets approved by the operator,
before page-art prompts unlock. Syntax is never called review.

**Parent text approval is a real production gate before artwork.** Once the
operator completes the human checklist, `lib/story-proof.js` creates a branded
A4 PDF containing only the title, summary, dedication and page-by-page story
copy. It never includes contact data, raw JSON, character briefs, scene
descriptions, prompts or internal notes. Arabic is shaped with the loaded Cairo
font on canvas and the rendered pages are embedded in the PDF, avoiding broken
RTL text or lost tashkeel without adding a PDF library. A deterministic `SP-…`
code hashes exactly those parent-facing words. Editing any of them clears the
approval and produces a new code; internal art-direction changes do not, since
the parent never saw them. Character sheets and page prompts stay locked until
the operator downloads that exact proof and records the parent's approval.

**The prompt attacks the same problem at the source**: inside string values it
asks for «» in Arabic and “” in English, while reserving straight `"` for JSON's
own delimiters. Those are the correct marks in both languages and they do not
break the string the answer has to come back in.

**Arabic reader-facing prose is fully vocalised.** For both `msa` and `ammiya`,
the prompt requires complete, linguistically correct tashkeel in the title,
summary, dedication and every page's text, including names. The English character briefs
and illustration descriptions are outside that rule. Jordanian colloquial is
marked for its real spoken pronunciation rather than being given invented MSA
case endings.

**“Professional” is expressed as editorial constraints, not a compliment.**
The story prompt asks Gemini to plan and revise before returning JSON, maintain
cause-and-effect between page beats, use precise natural phrasing, purposeful
rhythm, concrete action, sensory detail and character-revealing dialogue, and
remove filler, clichés, generic praise, repetitive patterns and decorative
sentences. These rules remain subordinate to the selected per-page word range.

**Story logic is mapped to the exact page count.** `storyArcSpec()` reserves
page 1 for an active opening and planted personal detail, page 2 for the
inciting change, the middle for distinct attempts and a consequence-driven
turn, the third-to-last page for the child's prepared decisive action, the
penultimate page for its concrete result, and the last page for an emotional
landing that echoes the opening. The prompt treats every transition as a
BECAUSE/THEREFORE link, tracks place/time/knowledge/objects/emotion across page
boundaries, forbids unprepared solutions and silently reverse-outlines the
draft before returning JSON. This is deliberately prompt-and-human-review
rather than brittle automated validation: syntax can count pages and words,
but it cannot prove that page 6 genuinely follows from page 5.

**Clue logic and comprehension are explicit prompt gates.** A track, footprint,
drop, crumb, mark or broken object must be shown being physically created in
the reader-facing text before a later page uses it as evidence; the private
`illustration_description` cannot carry the missing bridge. `ageVocabularySpec()`
then checks the exact age: for ages 4–6 every plot-critical noun and verb is
ordinary young-child vocabulary, while a useful local term is immediately
anchored to a familiar category, use or visible quality ("red spice called
sumac", not bare "sumac"). The point is comprehension without sanding Jordan
out of the book. The human checklist repeats both questions because neither can
be established by the JSON validator.

**Agency is age-realistic, not literal independence.** A quirk such as “I do
everything myself” still shapes how the child notices, chooses and solves, but
does not send a four-year-old out of sight through a public place, across a
road, onto a hazard, toward an unknown animal or into taking somebody's things.
A trusted adult stays nearby and aware without becoming the solver. In a
role-based story, pretending to be a police officer or explorer must also
produce a concrete strategy rather than generic bravery or hero praise.

**Generic praise fails the editorial pass.** “The child proved they were a
hero” is not a story beat; the prompt asks for the observable choice that earns
that feeling. The final page is rejected if it lists roles/traits, states a
lesson, summarises the plot or promises a generic next adventure. It has to be
one concrete present-moment image or interaction that changes the meaning of an
opening detail. The parent-facing summary and dedication also reject generic
hero/star/“anything is possible” copy, including praise of unsafe independence.

**Age controls the writing, while length controls the page.**
`ageWritingSpec()` in `lib/prompts.js` gives the model distinct editorial
direction for ages 0–3, 4–6, 7–9, 10–12 and 13+: vocabulary, syntax, dialogue,
conflict and emotional inference grow with the child. `LENGTH_SPEC` still owns
the hard sentence and word limits. Do not merge them — concise text for an
older child must become sharper and less patronising, not longer than the page.

**The title must be personalised in substance, not just possession.** It
contains the child's single story-language spelling (fully vocalised in
Arabic) and a short phrase identifying the central adventure, goal, problem,
object or setting. A title that could describe any book after swapping the name
is rejected explicitly in the prompt.

**Field descriptions go above the JSON schema, never inside it.** An earlier
version annotated the shape in place — `"character_brief": "ENGLISH. The
child's build…"` — and Gemini copied the annotation into its answer: every
description came back beginning with the literal word "ENGLISH." and ending
with the note telling it what *not* to write, all of it destined to be pasted
into an image model. The schema now holds nothing but `"..."`.

**The paste is deliberately not persisted.** It changes on every re-run, it is
not ours to keep beyond the order, and views here are state rather than routes
— so leaving the order and coming back clears the box. Re-pasting costs one
`Cmd+V`; a stale story silently generating last week's page 7 costs a reprint.
For work that spans sessions, the operator saves the approved response as
`story-approved.json` inside a local folder named for the order reference; the
dashboard still never chooses an old version automatically.

Rules in `lib/prompts.js` that are load-bearing:

- **`STYLE_DNA` is one constant repeated word for word in every image prompt**,
  and that repetition is the only thing making a dozen independently generated
  images look like one book. It was written from the real artwork in
  `public/samples/` — deep teal grounds, warm gold light with a believable
  source, cream highlights, berry accents, painterly brushwork, no line art —
  not from the "warm watercolor / pastel palette" placeholder the
  doc used to carry, which describes something else entirely. It was written to
  *describe* those samples; nothing has been generated from it yet, so the first
  book through this pipeline is also the test of it. Changing it changes every
  future book, which is why it is a reviewed constant and not a dashboard text
  box. The light source varies naturally across daylight, windows, lamps, moon
  and genuinely glowing story objects; forcing the same glowing prop into every
  scene is repetition, not consistency.
- **Customer values are facts, never instructions.** The prompt places an
  explicit security/data boundary above them: a command or prompt-like phrase
  inside any free-text answer stays quoted source material and cannot override
  the writing rules.
- **The child keeps agency without being made responsible for unsafe things.**
  A trusted adult may support or protect them, while the child still makes the
  decisive story choice. The prompt forbids humiliation, punitive shame,
  stereotypes, dangerous imitation, graphic injury, frightening escalation and
  unsupported medical or psychological claims.
- **The prompts are English, the values are the parent's own words.** Both
  models follow English instructions more reliably, and the answers are what
  the story is made of — round-tripping "بتصر تلبس البوت الأحمر حتى بالنوم"
  through English is how the detail gets sanded off. `VOCAB` maps stored slugs
  to English for this; `VALUE_LABEL` in `lib/admin.js` maps the *same* slugs to
  Arabic for the team to read, and the two cannot share a table.
- **Nothing from `order.contact` ever reaches a prompt**, and neither does
  `occasion`. These get pasted into third-party web apps; the parent's name and
  phone number are not story material. `briefText()` carries those because it
  is for the team.
- **`avoid` is deliberately absent from the image prompts.** It belongs to the
  story prompt, where a text model honours a prohibition reliably, and the
  scene descriptions were already written under it — so there is nothing left
  to exclude by the time an image prompt is built. Repeating it there does the
  opposite of what it looks like: negation is where image models are weakest,
  and it puts the word into a prompt that did not contain it.
- **`spellingRule()` exists because the form's locale and the story's language
  are separate answers.** A parent reading `/en` can order an `msa` book and
  type "Layan"; "write it exactly like this" then puts Latin letters into an
  Arabic children's book, and the reverse happens just as easily. Verbatim only
  when the scripts already agree; otherwise transliterate once and reuse that
  spelling on every page, the title and the dedication. It is one line under
  the child's details rather than a clause on each name — the long form read as
  part of the name when it landed mid-sentence.
- **Page prompts are numbered by array position, not by Gemini's
  `page_number`.** That field goes missing and occasionally repeats; a
  duplicate would give two rows the same React key, silently collapsing them,
  and the same label, leaving nothing to tell them apart.
- **`lines()` filters on `null`, not falsiness.** An empty string in those
  argument lists is a blank line between sections, and `filter(Boolean)` ate
  every one of them — collapsing the whole prompt into an unreadable wall.
  Optional lines are written as an explicit `null` so the two never collide.

The page prompts also carry the **print spec**, which is not a preference: the
interior pages are square; short/medium pages reserve the bottom 30% and long
pages the bottom 40%, matching the real 26% minimum scrim plus room for text;
the cover keeps its full upper 40% calm for the title veil; the page is trimmed
so essentials stay inside the middle 90%; and the model is
asked for 4K because 22 cm at 300 dpi is ~2600 px and the default is well under
that. All of it is derived from the real production files, and
`docs/ai-prompts.md` records the three things about those files worth settling
with the printer — including that a 10-page story cannot saddle-stitch, since
that folds in multiples of four including covers.

**Every cover/page row has its own explicit copy action.** It copies only that
row's complete, self-contained image prompt — identity anchors, shared style,
the page's own scene and its framing/print instructions — so the operator can
paste the pages into Nano Banana Pro one at a time without selecting text or
accidentally carrying the neighbouring page's scene.

**`wantsAvatar: no` skips only the main-child photo sheet** and the panel says
so rather than showing an empty photo step. No photographs were collected, so
`character_brief` is asked to be a *complete* description and is repeated
verbatim on every page. A recurring sibling, friend or pet still receives a
separate reference sheet from `supporting_character_brief`; every page prompt
asks for both approved sheets when both exist and says they are identity
references, never pose grids to reproduce.

The panel's own copy goes through `pages()` and `photos()` for its counts, like
everything else here — `${n} صفحة` produces "10 صفحة" and `${n} صور` produces
"1 صور", both ungrammatical. `photos()` was added for this and the dual is not
theoretical: the ceiling is 3, so 1 and 2 are ordinary counts.

### The book is edited and exported from the dashboard

Four files, and the split matters:

| | |
|---|---|
| `lib/book.js` | the model — `SPEC`, `LAYOUT`, `buildPages`, and the `localStorage` seam. Pure: no DOM, no React. |
| `components/admin/BookPage.jsx` | one page, in CSS, at its true printed size |
| `lib/docx.js` | the same page, painted on a canvas, wrapped in OOXML |
| `components/admin/BookStudio.jsx` | the editor and the two export buttons |

It replaced assembling every book by hand in Word, which had two silent failure
modes: **Word re-compresses images to 220 ppi when it saves**, with no warning
and no visible sign until the book is printed; and **a hand-made saddle-stitch
imposition cannot compensate for creep** — the inner leaves of a stapled book
push outward and are trimmed more, so their content has to shift toward the
spine page by page, which every printer's RIP does and a Word file cannot. The
printer gets reading-order pages and imposes them.

**The text is editable, and that is the whole point of the panel.** Gemini's
wording always needs small fixes, and before this the only way to make one was
to hand-edit the JSON and re-paste it. Each page carries its own textarea and
its own look, and story pages can be reordered.

**Story-page numbering is deliberately quiet and automatic.** Every `story`
page gets a small cream circular folio at the bottom centre; Arabic direction
formats it with Arabic-Indic digits and English with Latin digits. Its value is
the page's current story position, so a reorder renumbers the story immediately.
Covers, front matter, the back cover and saddle-stitch blank halves are not
numbered. `edits.pageNumbers` is the persistent per-order **إظهار / إخفاء**
toggle and defaults on; when off, it removes both the folio and the extra space
reserved beneath bottom-positioned text. The measurements live in `LAYOUT`, and
`BookPage` plus `paintPage` must both render it so PDF/preview and flattened Word
never diverge.

**Exports are the last human gate, not a convenience button.** The PDF and
Word actions stay disabled until every cover/story image is present, every
image has finished measuring, and the operator confirms the copy,
identity/outfit continuity, absence of generated text or watermarks, safe
placement, page order and current document mode. Below 300 dpi is a persistent
warning, not a blocker: the operator can intentionally export softer artwork.
Switching mode or changing text, style, page order, front matter, imposition or
an image clears the checks. Print adds one more confirmation: the parent
approved the final PDF proof.

**The illustration decides where the words go, so every page owns its style —
the cover included.** `DEFAULT_STYLE` in `lib/book.js` is the shape: `place`
(`top` / `center` / `bottom` / `hidden`), `offset`, `band` (`scrim` / `veil` /
`solid` / `none`), a band colour, a text colour, a size and an alignment. Five
things about it:

- **`center` exists because a scene whose action fills the bottom of the frame
  has nowhere for words down there.** It is not a variant of `bottom`; a scrim
  has no edge to fade from in the middle of a page, so at `center` it becomes a
  band that fades out on *both* sides instead.
- **`hidden` is a real choice**, not an empty state — a page that tells its part
  of the story in the picture alone. It is labelled "بلا نص" precisely so nobody
  reaches for it looking for "centred".
- **`veil` is not a weaker `scrim`, it is a different thing.** A scrim fades all
  the way to flat colour, so the words end up on paint; a veil tops out at
  `VEIL_MAX` so the artwork still reads through it. The cover has always used a
  veil — a title has to sit *on* the picture, not on a stripe pasted over it —
  and it is what any page wants when the illustration is too good to cover.
- **`offset` is millimetres, not pixels.** `place` gets the words to the right
  end of the page; `offset` is for the illustration that needs them eight
  millimetres clear of a face. Millimetres because the page is a printed
  object: a pixel has no fixed size on it, and the preview is drawn at a scale
  that changes. It moves **only the words**; the solid colour, veil or gradient
  remains anchored to its chosen top, centre or bottom position. `BookPage` and
  `paintPage` must preserve that separation so preview and export agree.
- **Colours come from a fixed swatch list, never a colour picker.** A free
  picker is how a book stops matching itself, and the palette rule (teal + gold
  + berry, never blue+orange or blue+pink) is a brand constraint rather than a
  preference.

**The cover starts from `COVER_STYLE`** — a dark veil at the top, cream title,
28 pt — which is exactly what it was before it became configurable. Two things
follow from it being a style like any other: the size scale is its own
(`COVER_SIZES`, 22/28/36 pt, because three body sizes are all far too small for
a cover), which is what `sizesFor(kind)` exists to pick; and **the cover's text
box is the book's title**, with the title page reading the same value. Editing
it in one place is the only version of this that cannot end with a cover and a
title page that disagree.

**The title, gift and dedication pages take a background too** — a colour from
the same swatches, or a full-bleed image. They start from `FRONT_STYLE` rather
than `DEFAULT_STYLE` (centred, no band, on cream) because they have no artwork
to sit on; add an image and the same `band` control that keeps story text
legible starts earning its keep there. `styleFor(kind)` picks the right default,
and it has to be used everywhere a style is created — `setStyle` takes the page
kind for exactly this reason.

**A front-matter background does not join the bulk-fill sequence.** `imagePages`
is the cover and the story pages only; a background is picked from its own
page's control and `take()` gives it exactly one file. Letting it into the
sequence would shift every story illustration by one — silently, and only
visible once the book is assembled.

`buildPages` resolves the style over `DEFAULT_STYLE` **once**, rather than each
renderer applying its own defaults — there are two of them, and a default
applied in one and missed in the other is a book that prints differently from
the one on screen. "طبّقوا على كل الصفحات" pushes one page's look onto the rest,
because twelve pages set one control at a time is the drudgery this panel
exists to remove.

**Two genuinely different documents**, toggled and defaulted from the order's
`format`:

| | Page | Bleed | Blanks | Text |
|---|---|---|---|---|
| نسخة PDF للأهل | 220 mm | none | none | live, vector |
| ملف الطباعة | 226 mm | 3 mm | none in reading order; imposed sheets only are padded | flattened into the page image |

**Print output can be imposed into printer's sheets**, because Qissati's print
partner asks for them — 446 × 226 mm, two pages a side, matching
standard 2-up saddle-stitch pairing and mirrored left/right for the binding
direction. `impose()` in `lib/book.js` owns the arrangement and `sheetSize()`
the geometry.

Three things about it:

- **Each half loses its *inner* bleed.** That edge is the fold, nothing is
  trimmed there, and two full-width halves print a 6 mm band of doubled artwork
  down the middle of every spread. The outer bleed stays.
- **Direction decides the halves, not the pairing.** An Arabic book is bound on
  the right, so on the outside sheet page 1/front cover occupies the **left**
  half: its right edge meets the centre fold. The back cover occupies the right
  half. English is the familiar mirror (back left, front right). Get it
  backwards and the book folds into a back-to-front object that still looks
  plausible while it is flat. The CSS spread therefore carries `dir="ltr"` on
  the row — `impose` has already chosen the physical sides, and the dashboard's
  RTL must not flip them a second time.
- **The page order is only correct if the press flips the sheet about its
  vertical axis** — short-edge duplex for a landscape sheet. A long-edge flip
  lands every back face upside down and the book collates into nonsense, and
  **nothing in the file itself can say which flip was used**. The panel prints
  that instruction in berry beside the toggle. These sheets are already
  imposed, so the printer must use Actual size / 100% and must not apply a
  second Booklet/imposition pass. The arrangement is verified by simulating the
  fold: assemble the leaves from the imposition, read them in order, and check
  the result is 1…N — it holds for 4/8/12/16/20/32 pages in both directions.
- **A hand-made imposition cannot compensate for creep** — the inner leaves of
  a stapled book push outward and are trimmed more, so their content should
  shift progressively toward the spine. A RIP does this; this does not. At
  12–16 pages the push-out is well under a millimetre, which is why it is
  tolerable here and would not be in a 64-page book. The panel says so.

**The toggle drives the PDF button as well as the Word one.** A switch that
silently changed only one of two adjacent export buttons is worse than no
switch. `BookPage` therefore takes `standalone`: false inside a spread, so the
page break belongs to the sheet rather than falling between its two halves.

**The generated story decides the binding direction.** Do not trust only
`order.story.language`: a marketing/test order can carry `english` while the
pasted and approved title, dedication and every page are Arabic (Q-000007 did,
and both exports consequently opened like an English book). `storyDirection()`
counts Arabic and Latin-script characters across the actual story, falls back
to the order only for empty/neutral copy, and accepts the dashboard's explicit
`edits.direction` override. `auto` is the default; the operator can force Arabic
RTL or English LTR, and changing it clears the final-review checks.

The blanks are not a nicety: saddle stitch folds in fours, so a 14-page book
physically cannot be stapled — but filler is a printing artefact, and an
operator or parent who scrolls into two empty ending pages assumes the file is
broken. `buildPages` therefore produces the real reading order with no filler.
Only `padForSaddleStitch` inserts blank halves, immediately before the back
cover, and only for imposed-sheet PDF/Word output. Single-page print files end
directly on the back cover and leave imposition to the printer.

**The back cover is content, not a teal placeholder.** `buildPages` seeds an
Arabic or English paragraph personalised with the child's name and explaining
what Qissati creates. The operator edits it through the same `edits.text` seam
as every other page. `BookPage` and `paintPage` both render the fixed transparent
Qissati mark and wordmark above that copy, so preview, browser PDF and flattened
Word output agree. The copy can change per client; the brand mark cannot be
accidentally removed.

**Every page of the `.docx` is one flattened image**, artwork and words baked
together, and that is deliberate:

- **No font dependency.** Word renders text in whatever the opening machine
  has. Cairo is not on a print shop's PC, so a substitute reflows the page and
  the book that arrives is not the book that was approved.
- **No compression surprise.** Word re-compresses on *save*, not on read. We
  write the file, so the JPEGs go in at full resolution — the degradation only
  happens if someone opens it and re-saves. The panel says so out loud.
- **Nothing to nudge.** A text box in a Word file is an invitation to drag it
  two millimetres and not notice.

The cost is raster type, which at 300 dpi and 16.5 pt is invisible in print.
The parent's PDF keeps live text, because it is read on a screen and zoomed.

Things that will bite:

- **`BookPage` (CSS) and `paintPage` (canvas) are two implementations of one
  design** — a `.docx` cannot carry a CSS gradient, so they cannot share code.
  They share `LAYOUT` in `lib/book.js` instead. **A measurement changed in one
  must be changed in the other**, and a measurement added anywhere belongs in
  `LAYOUT`.
- **Printing goes through a portal to `<body>`.** The print stylesheet hides
  every *other* direct child of the body, which is the only reliable way to
  paginate one subtree of a dashboard. The `visibility: hidden` version leaves
  the hidden layout occupying real pages, so the PDF opens on a run of blanks.
  The portal host is created in an effect and resolved through a promise,
  because a synchronous `setState` in an effect body is a React Compiler
  violation.
- **The save effect is gated on `hydrated`.** Without it the first render writes
  the empty default over an hour of stored work before the load comes back.
- **The image slot keys are the same keys `pagePrompts()` emits** — `cover`,
  `page-0`… keyed on the *original* story index, not the display position, so
  reordering pages does not detach an image from its prompt.
- **The editor's page preview is 208px.** It was 116, at which the words on a
  page were a grey smudge — and whether the text sits somewhere readable on
  *this particular illustration* is the only question the preview exists to
  answer.
- **Bulk image pick recognises the production names first.** If every selected
  file is named `cover...` or `page-01...`, those numbers decide the slots, so a
  regenerated page does not move to the end. Nano Banana Pro's raw
  `Gemini_Generated_Image_<random>.png` names carry no order; an unrenamed batch
  therefore falls back to `lastModified`, and running the prompts top to bottom
  still makes the first-pass download order the page order. Approved files live
  in a local folder named for the order reference and should be renamed as they
  are accepted.
- **Canvas size comes from the artwork and is never upscaled.** A cover-crop
  uses a `min(w, h)` region of the source, so that is the detail available;
  inventing pixels above it would hide from the operator that what they
  downloaded is too small. `pageDpi` surfaces that instead, and the panel warns
  below 300 dpi.
- **The canvas is checked for the real font before it paints.** A canvas asked
  for a font it does not have substitutes silently, so the `.docx` would ship
  set in whatever the machine had. `document.fonts.ready` is not enough — it
  settles on the fonts requested so far — so `ensureFont` loads the weights
  explicitly and then checks the **first** family: `fonts.check` is satisfied by
  any entry in a stack, and every stack ends in `sans-serif`, so checking the
  stack returns true forever. A miss warns rather than blocks; the file is still
  a book, but its type is not the type that was approved on screen.
- **Sheets are composed by decoding the page JPEGs back, two at a time.**
  Sixteen 4000px canvases is about a gigabyte of bitmap; the per-page loop
  exists precisely so only one is alive at a time, and the sheet pass keeps
  that property.
- **`lib/zip.js` is hand-written and stores rather than deflates.** `jszip` is
  ~100 KB for one feature; the page images are already-compressed JPEGs that
  would not shrink, and STORE removes the part of ZIP that could be subtly
  wrong.
- **Edits persist in `localStorage`, keyed by order reference — not on the
  server.** It needs no backend change and keeps the story text off our
  infrastructure, where it sits today. The cost is that it is one machine's
  copy. The **illustrations are not stored**: they are local files, a blob URL
  does not survive a reload, and they have no business in `localStorage`.
- **The printed page takes its direction from the story's language**, not the
  dashboard's. `/admin` is RTL, and an English book set right-to-left is as
  wrong as the reverse.

### Prices are admin-managed now

`PRICING` in `lib/order.js` is no longer the source of truth — it is the **fallback**, and every value in it stays `null`. The real table is the qissati settings singleton, edited at `/admin` → الأسعار and fetched by `lib/pricing.js`.

The `[X]` rule is unchanged and now runs end to end: an empty field in the dashboard sends `null`, which the API stores as `null`, which renders as `[X]` on the landing page, the order form's chips, the running total and the WhatsApp message. **Clearing a price sends `null`, never `0`** — 0 means "free" and would start quoting free books.

**An order freezes its own prices when it is placed.** Raising the base tomorrow does not change what a parent was quoted today, and the total is computed server-side — a client-supplied total is a total the customer chose.

### Linking

**The order page is a nav item as well as a CTA.** `NAV_LINKS` therefore holds two kinds of entry: sections (`href: "#pricing"`) and routes (`route: true`). Only sections have a section id, so:

- `NAV_SECTIONS` — the anchor entries — is what the scrollspy iterates. Feeding it a route would make it look for `document.getElementById("order")`.
- Only sections get `data-nav`, which is what the bookmark ribbon measures against. The order item has none, so the ribbon can never land on it.
- The order item gets `aria-current="page"` when you are on it, rather than the sections' `aria-current="true"` — different states, different values.

`lib/site.js` splits the two intents, and the distinction matters:

- `orderPath(lang)` → the order page. Used by every "order" CTA (header, drawer, nav item, hero, tiers, pricing). Pricing appends `?format=` to preselect, read on the **server** from `searchParams` — `useSearchParams` in the client would force a Suspense boundary and a hydration mismatch, and setting it from an effect is a React Compiler violation. (Tiers used to append `?tier=` too; that question moved to the future ready-stories page.)
- `CONTACT_URL` → the Instagram DM, for conversations rather than orders. It is pinned to Instagram *deliberately* even though a WhatsApp number now exists — see "Review before send".

**`ChoiceField` is the house pattern for a closed set; `SelectField` exists for the ones that outgrow it.** Two and three options stay radio cards. Five (`sidekickRelation`) or twelve (`city`) do not — a wall of cards would outweigh the question, and on a phone the platform's own picker beats anything rebuilt here. **Its placeholder option is `disabled` only when the field is required.** On a required select the blank is a starting state, not an answer; on an optional one the blank *is* an answer ("no city given"), and disabling it lets a parent pick a value and then be unable to take it back — the same trap a radio set has, which is why `occasion` needed an explicit "بس هيك" instead.

**Two-up field rows align on their controls, not their labels.** `FieldShell` is `h-full flex-col` with the control in an `mt-auto` wrapper. Grid items stretch, so without that a field whose hint runs to one line sits its input higher than the field beside it whose hint runs to two — which is what made "your name" float above "WhatsApp number". Don't replace it with a fixed height; the hints are translated and their line counts differ per language.

**That same mechanism makes a validation error move the field beside it, which is why `reserveError` exists.** An error appends a line to one cell; the row grows; and because `mt-auto` bottom-anchors the control, the *neighbouring* field's input is re-anchored downward — the form appears to jump around while you are trying to fix it. Measured: an error on `childName` moved `childAge`'s input 28px, with fields further down the page shifting up to 364px. `reserveError` holds a `min-h-[1.25rem]` slot open whether or not there is an error, and it is set on **every field sharing a two-up row** — set it on one and not its partner and the bug comes back (the sidekick relationship and age are now one such pair). It costs ~20px per two-up row and is deliberately **not** applied elsewhere: a full-width field's error can only push things below it, which is ordinary content growth rather than a control moving out from under the cursor. `city`/`area` are exempt because neither can error. After the fix, neighbour divergence is 0 across every two-up row.

**Don't "fix" this by absolutely positioning the error into the row gap.** It looks free, but below `sm` the two-up rows collapse to one column and the overlay lands on the next field's label, and the 28px gap it relies on stops being enough as soon as the reader zooms — trading a visible jump for a hidden collision.

`OrderButton` (`components/ui.jsx`) exists because `CtaButton` forces `target="_blank"` and external `rel`, which is wrong for a same-site route. Never pass `orderPath()` to `CtaButton`.

The route is `noindex` and renders dynamically (it reads `searchParams`); both are intentional.

## Deliberate placeholders

These are marked `TODO` in code and must not be "cleaned up" into invented values:

- **Every price**, and **the turnaround days and age range** (`[X]`, `[X-Y]` in `dict.pricing.plans` and `dict.faq`). These now have a home: the owner sets them at `/admin` → الأسعار, and until they do, the settings hold `null` and every one of them renders as a bracket. **Do not put numbers in the dictionaries or in `PRICING`** — the dictionary keeps the bracket as the fallback text, and `null` in the settings is what "not decided" means. Seeding the settings document with example prices would be the same mistake one layer down.
- **The refund policy** — not finalised, and it has no settings field, so it is still a plain TODO in both dictionaries.

Both dictionaries carry the same placeholders; translating a bracket into a plausible number in one language only is the specific failure mode to avoid. The logo is no longer among them — see "The logo".

## Dead exports

`SectionHeading` and `Squiggle` (`components/ui.jsx`) are unreferenced, and **all of `components/motion/Ambient.jsx`** (`Aurora`, `Sparkles`, `Grain`) became so when `FinalCta` dropped its blob layer. `components/ui/tracing-beam.jsx` joined them when `StepsBeam` became `StepsList`, and `components/ui/container-scroll-animation.jsx` when `BookReveal` folded into `SamplePreview`. `components/BookShowcase.jsx` and the `components/ui/3d-card.jsx` it was the only consumer of joined them when the hero moved to `HeroBook` — they are kept, unwired, so the previous hero is one import away. All of these are unreferenced — leftovers from an earlier layout. They are not the house pattern; don't build on them without checking they still fit.
