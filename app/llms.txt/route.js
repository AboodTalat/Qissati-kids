import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  const body = `# Qissati (قصتي)

> Qissati is a bilingual Jordan-based business that creates fully personalised illustrated children's storybooks in Arabic or English. Each fully personalised story is written from scratch around the child's name, age, personality, interests and chosen adventure; it is not a stock story with only the name changed.

## Canonical public pages

- [Arabic home](${absoluteUrl("/ar")}): the primary Jordanian Arabic version.
- [English home](${absoluteUrl("/en")}): the English version of the same service.
- [Arabic order form](${absoluteUrl("/ar/order")}): order a personalised story.
- [English order form](${absoluteUrl("/en/order")}): order a personalised story in English.
- [Detailed machine-readable overview](${absoluteUrl("/llms-full.txt")}): facts, formats, process and contact details.

## Key facts

- Brand names: Qissati in English; قصتي in Arabic.
- Based in Jordan. Printed-book delivery is offered within Jordan.
- Formats: a digital PDF or a printed book.
- Story languages: simple Modern Standard Arabic, Jordanian Arabic or English.
- The public sample featuring Layan is a fictional illustrative marketing sample, not a customer testimonial.
- Current prices, turnaround times and age ranges are published on the website only after the business owner sets them.

## Contact

- [Instagram](https://instagram.com/qissati_kids): @qissati_kids
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
