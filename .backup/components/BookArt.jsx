import Image from "next/image";

/**
 * The book's artwork. These are illustrations of the real sample story,
 * "حذاء ليان الأحمر وشجاعة الليل" — deliberately generated textless so the
 * Arabic title is set in Cairo as an HTML overlay rather than baked into the
 * image, where it would come out mangled. That choice also pays off for the
 * English locale: the same files carry an English title overlay unchanged.
 *
 * This file owns the *files* — paths, intrinsic dimensions, and the order the
 * spreads appear in. Every string (title, category, note, alt) is per-locale
 * and comes from `dict.book`, so the same artwork serves both languages.
 *
 * TODO: swap the files in /public/samples/ for scans of the printed book once
 * they exist. The component API does not need to change.
 */

export const COVER = {
  src: "/samples/cover.jpg",
  width: 1045,
  height: 1400,
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

// TODO: replace with real spreads photographed from Layan's printed book.
// Order is the reading order of the book; ids key into dict.book.spreads.
const SPREAD_FILES = [
  { id: "room", src: "/samples/spread-bed.jpg" },
  { id: "shoes", src: "/samples/spread-shoes.jpg" },
  { id: "hallway", src: "/samples/spread-hallway.jpg" },
  { id: "morning", src: "/samples/spread-morning.jpg" },
];

/** Merge the artwork with the active locale's copy. */
export function getSpreads(dict) {
  return SPREAD_FILES.map(({ id, src }) => ({ id, src, ...dict.book.spreads[id] }));
}

const SPREAD_W = 1600;
const SPREAD_H = 1194;

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
