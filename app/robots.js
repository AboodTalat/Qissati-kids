import { absoluteUrl, SITE_ORIGIN } from "@/lib/seo";

const PRIVATE_PATHS = ["/admin/", "/api/", "/admin-manifest.webmanifest"];

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
        userAgent: [
          "OAI-SearchBot",
          "ChatGPT-User",
          "GPTBot",
          "Claude-SearchBot",
          "Claude-User",
          "ClaudeBot",
          "PerplexityBot",
          "Perplexity-User",
        ],
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_ORIGIN,
  };
}
