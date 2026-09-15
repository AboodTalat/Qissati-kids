import GateView from "@/components/admin/GateView";

/**
 * Its own title, overriding the layout's.
 *
 * The gate is served *at* `/admin`, so whatever `<title>` it carries is what a
 * stranger who guesses the URL reads. "لوحة تحكم قصتي" confirms for them that
 * they found a real dashboard; this says nothing. It is the smallest possible
 * piece of the same argument the rewrite makes — see CLAUDE.md → "The PIN gate".
 */
export const metadata = {
  title: "قصتي",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The PIN prompt, reached by rewrite from `/admin` — `proxy.js` redirects an
 * already-unlocked visitor away from this URL, so it is never a second door.
 *
 * It sits inside `(admin)` to inherit the dashboard's root layout: Arabic,
 * RTL, Cairo, and the `noindex, nofollow` that keeps the whole surface out of
 * search results.
 */
// Not `force-static`: `proxy.js` mints a per-request CSP nonce, and a nonce
// prerendered at build time would be the same one for every visitor — which
// is the same as having none. Nothing is lost: this page is an empty shell
// and already carries `Cache-Control: no-store`.
export const dynamic = "force-dynamic";

export default function AdminGatePage() {
  return <GateView />;
}
