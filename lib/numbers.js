/**
 * Number input shared by the order form's age fields and phone normalisation.
 *
 * Arabic keyboards commonly produce either Arabic-Indic digit block. HTML
 * `type="number"` support for those varies by browser, so the form keeps a
 * text control with a numeric keypad and validates the folded value itself.
 */

/** Arabic-Indic (٠-٩) and Extended Arabic-Indic (۰-۹) → ASCII. */
export function asciiDigits(input) {
  return String(input ?? "").replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

/** A canonical non-negative whole number, or "" when the input is not one. */
export function normalizeWholeNumber(input) {
  const value = asciiDigits(input).trim();
  if (!/^\d+$/.test(value)) return "";
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? String(number) : "";
}

/** Whether the input is a whole number inside an inclusive range. */
export function isWholeNumberInRange(input, min, max) {
  const value = normalizeWholeNumber(input);
  if (value === "") return false;
  const number = Number(value);
  return number >= min && number <= max;
}
