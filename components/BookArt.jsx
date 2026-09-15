import Image from "next/image";

/**
 * The book's artwork. These are the approved illustrations for the fictional
 * marketing order Q-000002, "ليان والهريرة الخائفة" — deliberately generated
 * textless so the Arabic title is set in Cairo as an HTML overlay rather than
 * baked into the image, where it would come out mangled. That choice also pays
 * off for the English locale: the same files carry an English title overlay.
 *
 * This file owns the *files* — paths, intrinsic dimensions, and the order the
 * spreads appear in. Every string (title, category, note, alt) is per-locale
 * and comes from `dict.book`, so the same artwork serves both languages.
 *
 * The first supplied image is the cover; the remaining ten are the story pages
 * in the exact order supplied for Q-000002.
 */

export const COVER = {
  src: "/samples/q-000002/cover.jpg",
  width: 1024,
  height: 1024,
};

export function BookCover({ className = "", priority = false, sizes, alt }) {
  return (
    <Image
      src={COVER.src}
      width={COVER.width}
      height={COVER.height}
      alt={alt}
      priority={priority}
      sizes={sizes}
      className={className}
    />
  );
}

// Order is the reading order supplied by the owner; ids key into
// dict.book.spreads so the files remain locale-independent.
const SPREAD_FILES = [
  { id: "page1", src: "/samples/q-000002/page-01.jpg" },
  { id: "page2", src: "/samples/q-000002/page-02.jpg" },
  { id: "page3", src: "/samples/q-000002/page-03.jpg" },
  { id: "page4", src: "/samples/q-000002/page-04.jpg" },
  { id: "page5", src: "/samples/q-000002/page-05.jpg" },
  { id: "page6", src: "/samples/q-000002/page-06.jpg" },
  { id: "page7", src: "/samples/q-000002/page-07.jpg" },
  { id: "page8", src: "/samples/q-000002/page-08.jpg" },
  { id: "page9", src: "/samples/q-000002/page-09.jpg" },
  { id: "page10", src: "/samples/q-000002/page-10.jpg" },
];

/** Merge the artwork with the active locale's copy. */
export function getSpreads(dict) {
  return SPREAD_FILES.map(({ id, src }) => ({ id, src, ...dict.book.spreads[id] }));
}

const SPREAD_W = 1024;
const SPREAD_H = 1024;

export function SpreadImage({ spread, className = "", sizes }) {
  return (
    <Image
      src={spread.src}
      width={SPREAD_W}
      height={SPREAD_H}
      alt={spread.alt}
      sizes={sizes}
      className={className}
    />
  );
}
