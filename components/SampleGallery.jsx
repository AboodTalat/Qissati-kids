"use client";

import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import { getSpreads } from "./BookArt";

/**
 * Aceternity's Apple Cards Carousel over the sample spreads. Clicking a card
 * opens it full size with a note on why that page was written the way it was —
 * the brief calls this the strongest trust-building section on the page, and a
 * card a parent can actually open beats a thumbnail strip they can only watch.
 */
export default function SampleGallery({ dict }) {
  const labels = dict.gallery;

  return (
    <Carousel
      labels={labels}
      items={getSpreads(dict).map((card, index) => (
        <Card key={card.id} card={card} index={index} labels={labels} layout />
      ))}
    />
  );
}
