import { absoluteUrl, SITE_ORIGIN } from "@/lib/seo";

const PRIVATE_PATHS = ["/admin/", "/api/", "/admin-manifest.webmanifest"];

// These product tokens cover search/retrieval, user-requested fetches and
// model-development datasets. The wildcard rule already permits them, but an
// explicit group makes the site's AI-use policy unambiguous and prevents a
// future broad wildcard restriction from accidentally hiding the public site.
const AI_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "CCBot",
];

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      {
        // Search/retrieval and model-development crawlers are allowed to read
        // the public site, while the dashboard and API remain out of scope.
        userAgent: AI_CRAWLERS,
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_ORIGIN,
  };
}
