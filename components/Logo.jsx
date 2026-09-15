import Image from "next/image";

// The delivered brand mark: a child stepping out of an open book, reaching for
// a star. It is illustrative rather than geometric, so it needs room — below
// ~44px the book and the figure collapse into one teal smudge. Callers set the
// height and the width follows the 1.051 aspect; never force a square.
//
// The master (untrimmed, as delivered) is kept at /brand/logo-source.png.
// /brand/logo.png is that file trimmed to its alpha bounds so the mark sits
// flush against the wordmark with no invisible padding.
const MARK_SRC = "/brand/logo.png";
const MARK_W = 640;
const MARK_H = 610;

export function LogoMark({ className = "", priority = false }) {
  return (
    <Image
      src={MARK_SRC}
      width={MARK_W}
      height={MARK_H}
      alt=""
      aria-hidden="true"
      priority={priority}
      className={`w-auto ${className}`}
    />
  );
}

export function Logo({
  className = "",
  markClass = "h-11",
  wordClass = "text-brand-deep",
  // The mark is language-neutral; only the wordmark beside it changes. It is
  // set as "قصتي" in Arabic and "Qissati" in English (dict.brand.wordmark).
  wordmark,
  priority = false,
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClass} priority={priority} />
      <span className={`text-2xl font-extrabold leading-none ${wordClass}`}>
        {wordmark}
      </span>
    </span>
  );
}
