import { ar } from "./dictionaries/ar";
import { en } from "./dictionaries/en";

/** The only two locales this site serves. Order matters: `ar` is the default. */
export const LOCALES = ["ar", "en"];
export const DEFAULT_LOCALE = "ar";

const DICTIONARIES = { ar, en };

/** Right-to-left locales. Drives <html dir> and every `rtl:`/`ltr:` variant. */
const RTL_LOCALES = new Set(["ar"]);

export const isRtl = (lang) => RTL_LOCALES.has(lang);
export const dirOf = (lang) => (isRtl(lang) ? "rtl" : "ltr");

/**
 * Dictionaries are plain modules rather than dynamic imports: the page is
 * statically rendered at build time, and every consumer is a server component,
 * so nothing but the rendered strings reaches the client either way.
 */
export function getDictionary(lang) {
  return DICTIONARIES[lang] ?? DICTIONARIES[DEFAULT_LOCALE];
}

/** The locale a language toggle should switch to from `lang`. */
export const otherLocale = (lang) => (lang === "ar" ? "en" : "ar");
