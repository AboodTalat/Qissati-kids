/** @type {import('next').NextConfig} */
const nextConfig = {
  // `X-Powered-By: Next.js` tells a scanner exactly which stack to look up
  // advisories for, and buys nothing in return.
  poweredByHeader: false,
  reactCompiler: true,

  // The root layout lives at app/[lang]/layout.js, so `/` itself has no page.
  // Arabic is the default locale (the market is Jordan); a temporary redirect
  // leaves room to add Accept-Language detection later without a cached 308.
  async redirects() {
    return [{ source: "/", destination: "/ar", permanent: false }];
  },

  /**
   * Response headers.
   *
   * The dashboard's session is a bearer token in `localStorage`, and the trade
   * that makes that acceptable is that this origin renders no user-supplied
   * HTML and loads no third-party script. These headers are the other half of
   * that bargain — they narrow what a script would be able to do with the
   * token if one ever did get in, and they stop the dashboard being framed.
   *
   * **There is deliberately no `script-src` here.** `/admin` is `force-static`,
   * and a strict script CSP needs a per-request nonce, which would force the
   * page dynamic; the alternative — a CSP with `'unsafe-inline'` — announces a
   * protection it does not provide. That is its own decision, not a header to
   * slip in. `frame-ancestors` has no such cost, so it is here.
   */
  async headers() {
    const baseline = [
      // A response the browser refuses to re-interpret as a script.
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ];

    return [
      { source: "/:path*", headers: baseline },
      {
        source: "/qissati-sw.js",
        headers: [
          ...baseline,
          // Always revalidate the tiny worker so a notification bug does not
          // stay installed after the next deployment.
          { key: "Cache-Control", value: "no-cache" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          ...baseline,
          // Clickjacking. `frame-ancestors` now lives in the full policy that
          // `proxy.js` builds — it needs a per-request nonce, which only the
          // proxy can mint — so all that is left here is the legacy header,
          // for browsers that understand it and not `frame-ancestors`.
          { key: "X-Frame-Options", value: "DENY" },
          // A dashboard URL should never ride along to another origin.
          { key: "Referrer-Policy", value: "no-referrer" },
          // The dashboard HTML is an empty shell — every figure in it arrives
          // later over an authenticated fetch — so there is nothing to gain by
          // caching it, and two things to lose: a shared cache could serve the
          // shell to someone the PIN gate turned away, and the back button
          // could redraw it after sign-out.
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
