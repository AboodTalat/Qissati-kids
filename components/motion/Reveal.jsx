import { Fragment } from "react";

/**
 * Entrances and scroll reveals — server components, zero client JS.
 *
 * `Enter` plays on load and is for above-the-fold content. `Reveal` is tied to
 * a CSS scroll-driven timeline and is for everything below it. Both are
 * visible by default: the animation only ever removes and restores the
 * finished state, so a browser without scroll timelines, or a visitor whose
 * CSS or JS never arrives, still gets a complete, readable page.
 */

/** Above-the-fold entrance. `delay` is seconds. */
export function Enter({
  children,
  delay = 0,
  variant = "up",
  className = "",
  as: Tag = "div",
}) {
  return (
    <Tag
      data-enter={variant}
      style={delay ? { "--enter-delay": `${delay}s` } : undefined}
      className={className}
    >
      {children}
    </Tag>
  );
}

/**
 * Scroll reveal. `delay` is kept in seconds for a consistent call signature
 * and converted to a shift along the scroll range, since a scroll-driven
 * animation has no wall-clock delay to apply.
 */
export function Reveal({
  children,
  delay = 0,
  variant = "up",
  className = "",
  as: Tag = "div",
}) {
  return (
    <Tag
      data-reveal={variant}
      style={delay ? { "--reveal-shift": `${Math.round(delay * 55)}%` } : undefined}
      className={className}
    >
      {children}
    </Tag>
  );
}

/**
 * Word-by-word headline entrance. Splits on whitespace only — a per-character
 * split would break Arabic ligature shaping and leave letters in their
 * isolated forms.
 */
export function WordReveal({ text, delay = 0, stagger = 0.07, className = "" }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span
            data-enter="word"
            style={{ "--enter-delay": `${delay + i * stagger}s` }}
            className="inline-block"
          >
            {word}
          </span>
          {/* The separator has to sit OUTSIDE the inline-block: a trailing
              space at the end of an inline-block's line box is stripped by
              whitespace processing, which glued multi-word phrases together
              ("حكايتهالخاصة", "theirownstory"). */}
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}

