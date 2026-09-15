import { COVER } from "@/components/BookArt";
import {
  INSTAGRAM_URL,
  WHATSAPP_DISPLAY,
} from "@/lib/site";
import { fillPlaceholders } from "@/lib/pricing";

const LOCAL_ORIGIN = "http://localhost:3000";

/**
 * The one trusted public origin used by metadata, sitemaps and structured data.
 *
 * Never derive canonical URLs from the request Host header: proxies forward it,
 * local previews change it, and an untrusted host must not become a canonical.
 * Production should set NEXT_PUBLIC_SITE_URL to the final https origin. Vercel's
 * build-time host variables are safe fallbacks; localhost keeps local builds
 * and CI usable before a domain has been connected.
 */
function siteOrigin() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (!configured) return LOCAL_ORIGIN;

  try {
    const withProtocol = /^https?:\/\//i.test(configured)
      ? configured
      : `https://${configured}`;
    return new URL(withProtocol).origin;
  } catch {
    return LOCAL_ORIGIN;
  }
}

export const SITE_ORIGIN = siteOrigin();

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_ORIGIN}/`).toString();
}

export function languageAlternates(suffix = "") {
  return {
    "ar-JO": `/ar${suffix}`,
    en: `/en${suffix}`,
    "x-default": `/ar${suffix}`,
  };
}

export function verificationMetadata() {
  const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  const bing = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;
  if (!google && !bing) return undefined;

  return {
    ...(google ? { google } : {}),
    ...(bing ? { other: { "msvalidate.01": bing } } : {}),
  };
}

function startingPrice(format, pricing) {
  const base = pricing?.base;
  if (typeof base !== "number") return null;
  if (format === "pdf") return base;

  const print = pricing?.format?.print;
  return typeof print === "number" ? base + print : null;
}

function productOffers(dict, lang, pricing) {
  const image = absoluteUrl(COVER.src);

  return ["pdf", "print"].flatMap((format) => {
    const price = startingPrice(format, pricing);
    if (price === null) return [];

    const plan = dict.pricing.plans[format];
    const offerId = absoluteUrl(`/${lang}#offer-${format}`);
    const productId = absoluteUrl(`/${lang}#product-${format}`);
    return [
      {
        "@type": "Offer",
        "@id": offerId,
        name: plan.name,
        url: absoluteUrl(`/${lang}#pricing`),
        price,
        priceCurrency: "JOD",
        availability: pricing?.ordersOpen === false
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@id": absoluteUrl("/#organization") },
        itemOffered: {
          "@type": "Product",
          "@id": productId,
          name: plan.name,
          description: `${plan.note}. ${plan.points.join(". ")}`,
          image,
          category: "Personalised children's storybook",
          brand: { "@id": absoluteUrl("/#organization") },
          offers: { "@id": offerId },
        },
      },
    ];
  });
}

/**
 * Public, page-matching JSON-LD. It describes only claims a visitor can read
 * on the landing page. Prices become offers only after the owner has supplied
 * real numeric values; `[X]` must never leak into machine-readable commerce.
 */
export function landingStructuredData({ dict, lang, pricing }) {
  const pageUrl = absoluteUrl(`/${lang}`);
  const organizationId = absoluteUrl("/#organization");
  const websiteId = absoluteUrl("/#website");
  const offers = productOffers(dict, lang, pricing);
  const language = lang === "ar" ? "ar-JO" : "en";
  const otherLanguage = lang === "ar" ? "en" : "ar-JO";
  const faqItems = dict.faq.items.flatMap(({ q, a }) => {
    const answer = fillPlaceholders(a, pricing, dict);
    // Unresolved operational placeholders stay visible on the page, but they
    // are not factual answers and therefore do not belong in structured data.
    if (/\[[A-Z-]+\]/.test(answer)) return [];
    return [
      {
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: answer },
      },
    ];
  });

  const graph = [
    {
      "@type": "OnlineStore",
      "@id": organizationId,
      name: "Qissati",
      alternateName: "قصتي",
      url: absoluteUrl("/"),
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/brand/logo-512.png"),
        contentUrl: absoluteUrl("/brand/logo-512.png"),
        width: 512,
        height: 512,
      },
      image: absoluteUrl(COVER.src),
      description: dict.meta.description,
      sameAs: [INSTAGRAM_URL],
      areaServed: { "@type": "Country", name: "Jordan" },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: WHATSAPP_DISPLAY,
        contactType: "customer service",
        areaServed: "JO",
        availableLanguage: ["Arabic", "English"],
      },
      ...(offers.length
        ? {
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: dict.pricing.title,
              itemListElement: offers,
            },
          }
        : {}),
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: absoluteUrl("/"),
      name: "Qissati",
      alternateName: "قصتي",
      inLanguage: ["ar-JO", "en"],
      publisher: { "@id": organizationId },
    },
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: dict.meta.title,
      description: dict.meta.description,
      inLanguage: language,
      isPartOf: { "@id": websiteId },
      about: { "@id": organizationId },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: absoluteUrl(COVER.src),
        caption: dict.book.coverAlt,
      },
      ...(lang === "ar"
        ? {
            workTranslation: {
              "@type": "WebPage",
              url: absoluteUrl("/en"),
              inLanguage: otherLanguage,
            },
          }
        : {
            translationOfWork: {
              "@type": "WebPage",
              url: absoluteUrl("/ar"),
              inLanguage: otherLanguage,
            },
          }),
    },
  ];

  if (faqItems.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      url: `${pageUrl}#faq`,
      inLanguage: language,
      mainEntity: faqItems,
      isPartOf: { "@id": `${pageUrl}#webpage` },
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

/** Escape the only character that can terminate a script element. */
export function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
