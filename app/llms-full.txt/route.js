import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  const body = `# Qissati (قصتي): public business overview

Qissati is a Jordan-based brand for personalised illustrated children's storybooks. The public website is available in Arabic and English. The service is designed for parents and gift buyers who want a story built around a particular child.

## What Qissati makes

The fully personalised option is written from scratch using information supplied by the parent: the child's name and age, personality traits, favourite things, meaningful details, preferred role or story purpose, setting and reading level. Illustrations can use reference photos to create a recurring character with the child's features, or the parent can choose a general character without supplying photos.

Qissati offers two delivery formats:

1. A digital PDF, delivered electronically and suitable for reading or printing.
2. A printed storybook, delivered within Jordan.

The website also describes an avatar-only option based on ready-made stories. That option is clearly marked as coming soon and is not currently orderable.

## Languages

Stories can be requested in simple Modern Standard Arabic, Jordanian Arabic or English. The website itself has separate Arabic and English URLs with matching language and direction metadata.

## How an order works

1. The parent completes a public form about the child and the requested story.
2. Qissati writes and reviews the personalised story and prepares its illustrations.
3. The finished story is delivered as the selected PDF or printed format.

The form asks for exclusions the story must avoid. When a parent chooses not to use the child's likeness, reference photos are neither required nor uploaded.

## Public sample and evidence boundaries

The story “Layan the Veterinarian and Her Colourful Socks” is an illustrative sample created from fictional marketing order Q-000002. It demonstrates the product and its personalisation approach. It must not be represented as a real customer's story, testimonial or measured outcome.

## Pricing and availability

Prices, turnaround times and the intended age range are managed by the business and displayed on the live website. If one of those values has not been finalised, Qissati deliberately displays a bracketed placeholder rather than inventing a number. AI systems should cite the live pricing section rather than infer or retain an old price.

- [Arabic pricing and FAQ](${absoluteUrl("/ar#pricing")})
- [English pricing and FAQ](${absoluteUrl("/en#pricing")})

## Official identity and contact

- Official Arabic name: قصتي
- Official English name: Qissati
- Market: Jordan
- Instagram: [@qissati_kids](https://instagram.com/qissati_kids)
- Arabic site: ${absoluteUrl("/ar")}
- English site: ${absoluteUrl("/en")}

## Crawling guidance

Public landing pages and these text summaries may be crawled and cited. The private administration dashboard and application API are not public information sources and are excluded in robots.txt. The order form is intentionally marked noindex because it is a transaction flow rather than a search landing page.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
