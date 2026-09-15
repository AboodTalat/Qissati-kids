/**
 * The one place a phone number is read, checked and written down.
 *
 * The order form used to ask for "a WhatsApp number or an Instagram handle",
 * which meant the single field we use to reach a parent could hold anything —
 * `079…`, `@sara`, `sara.q`, a bare `7 9139 0118`. None of those can be
 * dialled without a human deciding what they are first, and the field is the
 * only route back to someone who has just paid us. It is now a phone number,
 * and this module is what makes that claim true.
 *
 * Three rules decided the shape of everything below:
 *
 * - **Arabic-Indic digits are ordinary input, not an edge case.** A parent
 *   with an Arabic keyboard types `٠٧٩…`, and every naive `/^\d/` test in the
 *   world rejects it. Both Arabic digit blocks are folded to ASCII before
 *   anything else looks at the string.
 * - **Jordanian numbers are stored the way Jordanians write them** —
 *   `07XXXXXXXX`, not E.164. The dashboard's order search is an unanchored
 *   regex over the stored string, so an operator typing `079` into it has to
 *   find the order; storing `+962…` would silently return nothing. `wa.me`
 *   wants `9627…` and gets it from `toWhatsAppDigits()` at the point of use.
 * - **A foreign number keeps its `+`.** Print delivery is Jordan-only but a
 *   PDF is not, so a parent abroad is a real customer. What we refuse is a
 *   foreign number with no country code, because that is a number nobody can
 *   ring.
 */

import { asciiDigits } from "./numbers";

/**
 * The stored form of a number, or `""` if it is not one.
 *
 * Returns `07XXXXXXXX` for a Jordanian mobile however it was written, `+…` for
 * a foreign number, and `""` for a handle, a landline, or a number too short
 * to ring. `""` is what `isPhone` reads, so "cannot be normalised" and
 * "invalid" are the same answer by construction — there is no second set of
 * rules to drift out of step with these.
 */
export function normalizePhone(input) {
  // Bidi marks travel with anything pasted out of an RTL message.
  const cleaned = asciiDigits(input)
    .replace(/[\s‎‏؜().\-‐-―]/g, "")
    .trim();
  if (!cleaned) return "";

  // 00 is how the international prefix is dialled here; + is how it is written.
  const plus = cleaned.startsWith("+")
    ? cleaned.slice(1)
    : cleaned.startsWith("00")
      ? cleaned.slice(2)
      : null;
  const digits = plus ?? cleaned;

  // Anything left that is not a digit means this was never a number.
  if (!/^\d+$/.test(digits)) return "";

  // Jordan, in any of the four ways it gets written.
  if (digits.startsWith("962")) {
    const local = digits.slice(3);
    return /^7\d{8}$/.test(local) ? `0${local}` : "";
  }
  if (/^07\d{8}$/.test(digits)) return digits;
  // The trunk zero dropped — `791234567` is unambiguous, so accept it rather
  // than making a parent retype a number that is already complete.
  if (/^7\d{8}$/.test(digits)) return `0${digits}`;

  // A local-looking number that is not a Jordanian mobile: a landline, or a
  // mobile with a digit missing. WhatsApp cannot reach either, and this field
  // exists to reach someone on WhatsApp.
  if (digits.startsWith("0")) return "";

  // Foreign, and only with a country code — which is exactly what the leading
  // + or 00 asserted. Without one there is nothing to dial.
  if (plus === null) return "";
  return /^\d{8,15}$/.test(digits) ? `+${digits}` : "";
}

/** Whether this is a number we could actually reach someone on. */
export function isPhone(input) {
  return normalizePhone(input) !== "";
}

/**
 * The digits `wa.me` wants: country code first, no `+`, no `00`.
 *
 * Getting this wrong does not error — wa.me opens a chat with nobody — which
 * is why the conversion lives here rather than at each call site.
 */
export function toWhatsAppDigits(input) {
  const normalized = normalizePhone(input);
  if (!normalized) return "";
  return normalized.startsWith("+")
    ? normalized.slice(1)
    : `962${normalized.slice(1)}`;
}

/**
 * A number as it should appear inside a line of **plain text** — a WhatsApp
 * message, the copyable summary — rather than in HTML we control.
 *
 * A leading `+` in an Arabic sentence does not stay put. Measured in the
 * browser: `رقمي: +14155552671` renders the `+` to the *right* of the last
 * digit, so the parent sends `14155552671+` and the team reads a number that
 * looks mistyped. HTML gets `<bdi dir="ltr">`; plain text has no markup, so
 * the fix is the Unicode isolate the markup compiles down to — LRI…PDI.
 *
 * Applied only when there is a `+` to protect. A local `0791234567` is all
 * digits and renders correctly unaided, and invisible formatting characters
 * are not worth sending to every parent for a case that cannot arise.
 */
export function phoneForText(input) {
  const value = normalizePhone(input) || String(input ?? "").trim();
  return value.startsWith("+") ? `⁦${value}⁩` : value;
}
