import { Quote } from "lucide-react";
import BookReveal from "./BookReveal";
import SampleGallery from "./SampleGallery";
import { Reveal } from "./motion/Reveal";

export default function SamplePreview({ dict }) {
  const t = dict.sample;

  return (
    <section id="sample" className="pb-24 md:pb-32">
      {/* the cover rights itself as the section scrolls through */}
      <BookReveal dict={dict} />

      {/* full-bleed: the spreads run past the container on both sides, and
          each one opens full size */}
      <div className="-mt-4">
        <SampleGallery dict={dict} />
      </div>

      <Reveal className="mx-auto mt-12 max-w-3xl px-5 sm:px-8">
        <blockquote className="relative overflow-hidden rounded-blob bg-brand-tint p-7 text-center sm:p-10">
          <Quote className="mx-auto h-8 w-8 text-brand/40" aria-hidden="true" />
          <p className="mt-4 text-xl font-bold leading-loose text-brand-deep sm:text-2xl">
{t.quote}
          </p>
          {/* TODO: replace with a real, attributed parent testimonial. */}
          <footer className="mt-4 text-sm font-semibold text-brand-deep">
{t.quoteAttribution}
          </footer>
        </blockquote>
      </Reveal>
    </section>
  );
}
