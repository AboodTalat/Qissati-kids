import { PRICING, daysLabel } from "./order";
import { fetchPricing } from "./api";

/**
 * The live price table, fetched on the server, with the bundled table as its
 * floor.
 *
 * **Failing soft is the whole point.** Every amount on this site is still an
 * `[X]` placeholder until the owner fills it in, and `null` is what renders
 * that placeholder. So when the API is down, misconfigured, or simply not
 * deployed yet, this returns the bundled table — every price `null`, every
 * figure `[X]` — and the page renders exactly as it did before there was a
 * backend. A pricing fetch must never be able to take the landing page down.
 *
 * **The two readers make opposite trades, on purpose.**
 *
 * The landing page is deliberately NOT `no-store`: it is otherwise static, and
 * an uncached per-request fetch would trade that away for freshness nobody
 * needs — a price changes a few times a year. Five minutes of staleness there
 * is the right side of that trade.
 *
 * The order page is the opposite, and `revalidate` was the wrong tool for it.
 * A cached read means an admin who changes a price and reloads the order page
 * keeps seeing the old one until the window lapses — no number of reloads
 * helps, because the staleness is in the server's data cache, not the
 * browser's. That reads as "the site needs a hard refresh", which is a
 * diagnosis the interface invites and cannot be true: a hard reload cannot
 * clear a server-side cache. It is also the page where the number becomes a
 * quote, so it is the one place a stale price actually costs something.
 * `no-store` makes the next ordinary reload correct.
 */

/** What the site falls back to: the bundled table, everything undecided. */
export const FALLBACK_PRICING = {
  ...PRICING,
  turnaroundDaysPdf: null,
  turnaroundDaysPrint: null,
  ageMin: null,
  ageMax: null,
  ordersOpen: true,
};

async function load(options) {
  const res = await fetchPricing(options);
  if (!res.ok || !res.data?.pricing) return FALLBACK_PRICING;

  const p = res.data.pricing;
  return {
    // Merge over the fallback so a server that predates a new field still
    // yields a complete table rather than `undefined` in a price slot.
    ...FALLBACK_PRICING,
    ...p,
    pages: { ...FALLBACK_PRICING.pages, ...(p.pages ?? {}) },
    format: { ...FALLBACK_PRICING.format, ...(p.format ?? {}) },
  };
}

/** For the landing page: prices, turnaround, age range. Cached 5 minutes. */
export function getPricing() {
  return load({ next: { revalidate: 300 } });
}

/**
 * For the order page, where the number becomes a quote: never cached, so an
 * admin edit shows up on the very next ordinary reload.
 *
 * The route is already dynamic (it reads `searchParams`) and `noindex`, so
 * this adds one localhost-to-API round trip per view rather than costing a
 * prerender. The short timeout is the point of the exercise: this now runs on
 * every render, so a slow API must degrade to `[X]` quickly instead of holding
 * the page. `request()` applies it because no `next` option is passed.
 */
export function getOrderPricing() {
  return load({ cache: "no-store", timeout: 6000 });
}

/**
 * Fill the `[X]` / `[X-Y]` placeholders in a line of copy.
 *
 * The dictionaries keep the brackets, in both languages, precisely so an
 * undecided value stays visibly undecided instead of becoming a plausible
 * invention. This substitutes only what the owner has actually decided, and
 * leaves the rest as brackets.
 */
export function fillPlaceholders(text, pricing, dict) {
  if (typeof text !== "string") return text;
  let out = text;
  if (pricing?.ageMin != null && pricing?.ageMax != null) {
    out = out.replace(/\[X-Y\]/g, `${pricing.ageMin}-${pricing.ageMax}`);
  }
  // `[X]` is the digital turnaround and `[Y]` the printed one — two different
  // jobs, so two numbers. Neither token can match inside `[X-Y]` above.
  //
  // Both go through `daysLabel` rather than pasting a bare numeral: "خلال 2
  // أيام" is the Arabic agreement bug this codebase keeps having to fix. That
  // is also why `dict` is a parameter — the forms live in the dictionary.
  const days = (n) =>
    dict ? daysLabel(n, dict) : String(n);
  if (pricing?.turnaroundDaysPdf != null) {
    out = out.replace(/\[X\]/g, days(pricing.turnaroundDaysPdf));
  }
  if (pricing?.turnaroundDaysPrint != null) {
    out = out.replace(/\[Y\]/g, days(pricing.turnaroundDaysPrint));
  }
  return out;
}
