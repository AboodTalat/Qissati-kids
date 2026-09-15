// Central place for brand + contact constants so every CTA points at one source.
// Phase 1 is front-end only: CTAs open Instagram DM, they do not submit a form.

export const INSTAGRAM_HANDLE = "@qissati_kids";
export const INSTAGRAM_URL = "https://instagram.com/qissati_kids";

// Instagram's direct-message deep link. Opens the DM thread in the IG app,
// falls back to the profile on desktop.
export const INSTAGRAM_DM_URL = "https://ig.me/m/qissati_kids";

/**
 * The WhatsApp business number.
 *
 * The number as dialled is 00962 777 390 118. **wa.me wants digits only, country
 * code first, with no `+` and no `00` international prefix** — those are the
 * classic way to break this, because wa.me does not error on a malformed
 * number, it just opens an empty chat with nobody. So: 962 (Jordan) followed by
 * the subscriber number.
 */
export const WHATSAPP_NUMBER = "962777390118";

/** Human-readable, for anywhere the number is shown rather than linked. */
export const WHATSAPP_DISPLAY = "+962 7 7739 0118";

export const WHATSAPP_URL = WHATSAPP_NUMBER
  ? `https://wa.me/${WHATSAPP_NUMBER}`
  : null;

/** A wa.me link carrying a prefilled message, or null if there is no number. */
export function whatsappHref(text) {
  if (!WHATSAPP_NUMBER) return null;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/**
 * Where a "talk to us" CTA goes — the closing section, the drawer, the footer.
 *
 * Deliberately still Instagram even though a WhatsApp number now exists: every
 * line of copy on the page says Instagram ("راسلونا على إنستغرام", "We reply on
 * Instagram within hours"), and pointing these at WhatsApp without rewriting
 * that copy would send people somewhere the page did not promise. Orders are
 * different — those go to WhatsApp, because that is where payment happens.
 *
 * To move conversations to WhatsApp too, set this to `WHATSAPP_URL` and update
 * the four Instagram mentions in both dictionaries.
 */
export const CONTACT_URL = INSTAGRAM_DM_URL;

/**
 * Where an "order" CTA goes: the order page, in the reader's own locale.
 *
 * This is an internal route, so it must NOT be passed to `CtaButton` — that
 * component forces `target="_blank"` and external `rel`, which is wrong for a
 * same-site link. Use `OrderButton` / a plain `next/link` instead.
 */
export const orderPath = (lang) => `/${lang}/order`;

/**
 * The header and drawer navigation.
 *
 * `key` indexes into `dict.nav`. Two kinds of entry:
 *
 *  - **`href`** — an in-page anchor, locale-independent, so only the label
 *    changes between languages. `href.slice(1)` is the target section's id,
 *    which is also what the scrollspy and the bookmark indicator key off.
 *  - **`route: true`** — a page of its own rather than a section. It has no
 *    section id, so it is excluded from the scrollspy and never receives the
 *    gold bookmark; it gets `aria-current="page"` when you are on it instead.
 */
export const NAV_LINKS = [
  { key: "how", href: "#how" },
  { key: "tiers", href: "#tiers" },
  { key: "sample", href: "#sample" },
  { key: "pricing", href: "#pricing" },
  { key: "faq", href: "#faq" },
  { key: "order", route: true },
];

/** Just the anchor entries — what the scrollspy can actually track. */
export const NAV_SECTIONS = NAV_LINKS.filter((l) => l.href);
