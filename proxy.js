import { NextResponse } from "next/server";
import { GATE_COOKIE, gateCookieValid, gatePin } from "@/lib/admin-gate";

/**
 * The gate in front of `/admin`, and the dashboard's Content-Security-Policy.
 *
 * **This file is `proxy.js`, not `middleware.js`.** Next 16 renamed the
 * convention; both names still resolve, but having both in one project is a
 * build error and the build tells you to keep the proxy. See `lib/admin-gate.js`
 * for what the gate is and — more importantly — what it is not.
 *
 * A locked request is **rewritten**, not redirected. A redirect would publish
 * `/admin/gate` as a URL of its own and leave `/admin` visibly guarded; a
 * rewrite means the dashboard's own URL simply answers with the PIN prompt,
 * and answers with the dashboard the moment the cookie is good. It also means
 * the dashboard's HTML and its bundle are never served to a locked visitor.
 */
export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

/**
 * A fresh nonce per request.
 *
 * Next reads it back out of the `Content-Security-Policy` **request** header
 * and stamps it onto every script tag it emits, which is what lets the policy
 * below refuse inline scripts without refusing Next's own hydration payload.
 * That is also why the dashboard pages can no longer be `force-static`: a
 * nonce baked in at build time would be the same for every visitor, which is
 * the same as having none.
 */
function makeNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

/**
 * The dashboard's policy.
 *
 * The session is a bearer token in `localStorage`, so the honest threat is a
 * script that should not be running. `script-src` is the directive that earns
 * its keep here; the rest is cheap.
 *
 * Two entries are looser than they look, deliberately:
 *
 * - **`style-src` allows `'unsafe-inline'`** because React writes real `style`
 *   attributes (`next/image` alone emits `style="color:transparent"`), and CSP
 *   governs those through `style-src`. A stylesheet cannot execute; buying
 *   nothing by breaking every image is not a trade.
 * - **`img-src` allows any `https:`** because the reference photographs are
 *   served from UploadThing, whose host reaches this app inside an API
 *   response and is written down nowhere in this repo. Pinning a guess would
 *   silently blank the photographs the team needs to draw the book — a
 *   visible, load-bearing failure — to constrain the one thing that cannot
 *   execute anyway.
 *
 * `connect-src` is the strict one that matters, and it is derived from the
 * same `NEXT_PUBLIC_QISSATI_API` the client fetches with, so the two cannot
 * drift apart.
 */
function contentSecurityPolicy(nonce) {
  const dev = process.env.NODE_ENV === "development";

  let apiOrigin = "";
  try {
    const base = (process.env.NEXT_PUBLIC_QISSATI_API || "").trim();
    if (base) apiOrigin = new URL(base).origin;
  } catch {
    // An unparseable base URL is already broken everywhere else; a CSP that
    // omits it is not the thing to fix here.
    apiOrigin = "";
  }

  return [
    "default-src 'self'",
    // `unsafe-eval` only in development, where React Refresh needs it.
    `script-src 'self' 'nonce-${nonce}'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    // The dev server's HMR socket, and the API the dashboard actually calls.
    `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ""}${dev ? " ws: wss:" : ""}`,
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

export default async function proxy(request) {
  const pin = gatePin();
  const onGatePage = request.nextUrl.pathname === "/admin/gate";

  // No PIN configured means no gate — see `gatePin()` for why that fails open.
  const unlocked =
    pin === null ||
    (await gateCookieValid(request.cookies.get(GATE_COOKIE)?.value, pin));

  // The prompt is only ever reached by rewrite, so an unlocked visitor typing
  // that URL wants the dashboard. No body, so no policy to attach.
  if (unlocked && onGatePage) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const nonce = makeNonce();
  const csp = contentSecurityPolicy(nonce);

  // On the request so Next can find the nonce; on the response so the browser
  // enforces the policy.
  const headers = new Headers(request.headers);
  headers.set("content-security-policy", csp);
  headers.set("x-nonce", nonce);
  const init = { request: { headers } };

  const response =
    unlocked || onGatePage
      ? NextResponse.next(init)
      : NextResponse.rewrite(new URL("/admin/gate", request.url), init);

  response.headers.set("Content-Security-Policy", csp);
  return response;
}
