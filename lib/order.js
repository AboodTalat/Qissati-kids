import { areaLabel, cityLabel } from "./jordan";
import { isPhone, normalizePhone, phoneForText } from "./phone";
import { isWholeNumberInRange, normalizeWholeNumber } from "./numbers";

/**
 * The order form's shape, and the one function that turns answers into
 * something sendable.
 *
 * **This file is the seam for phase 2.** Today `buildOrderSummary` formats the
 * answers into a message the parent sends themselves — there is no server, so
 * nothing is transmitted or stored by us. When the backend exists, the same
 * `values` object becomes the POST body; only the submit handler in
 * `components/order/OrderForm.jsx` changes. Keep this file free of DOM and of
 * React so it stays usable from a route handler.
 *
 * The field names are not arbitrary: each one fills a placeholder in the AI
 * prompt templates (Template 1 story text, Template 2 character sheet). See
 * CLAUDE.md → "The order page" for the mapping. Renaming a key here without
 * updating the prompt that consumes it breaks the pipeline silently.
 */

/**
 * What an order costs: a base story, plus what each choice adds to it.
 *
 * `0` means the choice is already in the base. **`null` means the amount is not
 * decided yet** — every price on this site is still an `[X]` placeholder (see
 * "Deliberate placeholders"), and inventing a number here would be the one
 * thing that rule forbids. `null` is what makes the UI render `[X]` rather
 * than a made-up figure, and what makes the total render `[X]` too, since a
 * sum containing an unknown is unknown.
 *
 * The arithmetic below is already correct: the day the admin dashboard serves
 * real numbers into this table, the breakdown and the total start adding up
 * with no other change. That is the point of keeping it as data.
 *
 * The admin dashboard now owns the real table: `lib/pricing.js` fetches it
 * from the server and the order page passes it down as `pricing`. What stays
 * here is the **fallback** — the shape every consumer defaults to when the API
 * is unreachable, which renders `[X]` everywhere rather than a stale number.
 * Every function below takes the live table as an argument and falls back to
 * this one, so a backend outage degrades the price to "not decided" instead of
 * quoting last week's.
 */
/** How many pages the base price already covers. */
export const BASE_PAGES = 8;

export const PRICING = {
  base: null, // an 8-page PDF story
  pages: { "8": 0, "10": null, "12": null },
  format: { pdf: 0, print: null },
  gift: null, // the gift page, when one is asked for
};

/**
 * Pages beyond the base, which is what the extra-pages charge is actually for.
 *
 * The receipt line must say this number, not `values.pages`. Choosing 10 does
 * not mean paying for 10 pages — the base already covers 8, so the add-on
 * covers 2. Labelling that row "extra pages (10)" reads as being charged twice
 * for the first eight.
 */
/**
 * "2 pages" / "صفحتين" — a page count with its language's number agreement.
 *
 * Arabic needs four forms where English needs two, so the dictionary supplies
 * a table rather than one invariant word. Concatenating a numeral to a fixed
 * noun produced "10 صفحة", which is simply ungrammatical.
 */
export function pagesLabel(n, dict) {
  const u = dict.order.fields.pages.unit;
  const form = n === 1 ? u.one : n === 2 ? u.two : n <= 10 ? u.few : u.many;
  return form.replace("{n}", String(n));
}

/**
 * "3 days" / "٣ أيام" — a turnaround with its language's number agreement.
 *
 * Same rule, and the same trap, as `pagesLabel`: "خلال 2 أيام" is
 * ungrammatical, so the dictionary supplies the forms rather than the code
 * concatenating a numeral to a fixed noun.
 *
 * `null` is not an error — it is the owner not having set a turnaround yet,
 * and it renders the site-wide `[X]` rather than a plausible invention.
 */
export function daysLabel(n, dict) {
  const u = dict.order.price.days;
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return u.unknown;
  const c = Number(n);
  const form = c === 1 ? u.one : c === 2 ? u.two : c <= 10 ? u.few : u.many;
  return form.replace("{n}", String(c));
}

/**
 * "Ready in 3 days" for the format actually chosen.
 *
 * The two formats are different jobs — the PDF is done when the book is, the
 * printed copy adds printing and a courier — so quoting one number for both
 * would be wrong for whichever it was not measured on. Returns `null` when no
 * format has been chosen: there is nothing to promise yet, which is the same
 * reason the total reads `[X]` until then.
 */
export function turnaroundLabel(dict, pricing = PRICING, format) {
  if (format !== "pdf" && format !== "print") return null;
  const days =
    format === "print" ? pricing?.turnaroundDaysPrint : pricing?.turnaroundDaysPdf;
  return dict.order.price.turnaround.replace("{days}", daysLabel(days ?? null, dict));
}

export function extraPages(values) {
  const n = Number(values.pages);
  return Number.isFinite(n) ? Math.max(0, n - BASE_PAGES) : 0;
}

/** True when every component of a price is a real number. */
const known = (...parts) => parts.every((p) => typeof p === "number");

/**
 * The price breakdown for a set of answers.
 *
 * Every amount is either a number or `null` (= not decided). `total` is `null`
 * if any component is, because a total that silently drops an unknown add-on
 * is worse than no total at all.
 */
export function priceBreakdown(values, pricing = PRICING) {
  const pages = pricing.pages[values.pages] ?? null;
  // Nothing has been chosen yet — an unselected format must not put a
  // "printed copy" line in the breakdown for something nobody asked for.
  const hasFormat = Boolean(values.format);
  const format = hasFormat ? pricing.format[values.format] ?? null : null;
  // Not a gift means the page is not being bought, so it contributes 0 —
  // not `null`, which would make the whole total unknown for no reason.
  const wantsGift = values.isGift === "yes";
  const gift = wantsGift ? pricing.gift ?? null : 0;

  return {
    base: pricing.base,
    pages,
    format,
    gift,
    // Own line only when the choice actually adds something (or might).
    showPages: pages === null || pages > 0,
    showFormat: hasFormat && (format === null || format > 0),
    showGift: wantsGift && (gift === null || gift > 0),
    total:
      hasFormat && known(pricing.base, pages, format, gift)
        ? pricing.base + pages + format + gift
        : null,
  };
}

/** An amount as text: the real number, or the site-wide `[X]` placeholder. */
export function money(amount, dict) {
  const currency = dict.pricing.currency;
  return amount === null || amount === undefined
    ? `[X] ${currency}`
    : `${amount} ${currency}`;
}

/** The label a choice chip shows: the base price, "included", or "+extra". */
export function addonLabelFor(amount, dict) {
  const f = dict.order.fields;
  if (amount === 0) return f.addon.included;
  if (amount === null || amount === undefined) return f.addon.extra;
  return `+${amount} ${dict.pricing.currency}`;
}

/** Blank answers. Also the list of every field the form knows about. */
export const EMPTY_ORDER = {
  // Template 1: child details + Template 2: likeness
  childName: "",
  childAge: "",
  gender: "",
  trait1: "",
  trait2: "",
  favourite: "",
  sidekick: "",
  // Which of brother/sister/friend/pet that name is. Arabic pronouns and
  // adjective endings all hinge on it, so a named sidekick without one leaves
  // the story generator guessing. Required only when `sidekick` is filled.
  sidekickRelation: "",
  // The supporting character's age shapes their dialogue, behaviour and
  // appearance. Required alongside the relation when `sidekick` is filled.
  sidekickAge: "",
  // Asked only for a pet. A name and age cannot tell the writer or illustrator
  // whether this is a grey cat, a golden dog or a green parrot, so the parent
  // supplies the species/type, colour and any distinctive markings up front.
  petDescription: "",
  quirk: "",
  // Template 1: story shape
  storyType: "",
  storyChoice: "",
  // Where it happens. Optional — blank means the writer picks a setting.
  setting: "",
  // What must stay OUT. Optional, and the only field that constrains the story
  // rather than describing the child. Template 1 reads it as a prohibition.
  avoid: "",
  tone: "",
  language: "",
  pages: "10",
  // The product. `tier` is deliberately absent: choosing between an
  // avatar-only and a fully personalised story belongs to the ready-stories
  // order page, which does not exist yet. Everything this form asks for — the
  // quirk, the traits, the real habit — only makes sense for the fully
  // personalised flow, so asking again here would be a question with one
  // honest answer.
  format: "",
  // A governorate slug from `lib/jordan.js`, and an area slug inside it. Both
  // optional, and only asked for a printed copy. Delivery zone, not address —
  // the exact address is arranged in the WhatsApp conversation that follows.
  city: "",
  area: "",
  // A gift page is a product add-on, not a story input: it fills no
  // placeholder in the AI prompts, it is an extra printed page carrying the
  // buyer's own words. It is now the ONLY place the buyer's own words appear —
  // the story's own dedication is written by us (Template 1 emits it), which
  // is why the form no longer asks for one.
  // What the book is for. Not a story input — it fills no prompt placeholder;
  // it shapes what the gift page should say and is what a future birthday
  // reminder would be keyed on.
  occasion: "",
  isGift: "no",
  giftMessage: "",
  // Whether the illustrations should carry the child's likeness. "no" means a
  // general character is drawn instead, Template 2 is skipped entirely, and
  // **no photographs of the child are collected or uploaded at all** — which is
  // why it sits directly above the picker rather than among the book options.
  // Defaults to "yes": that is the product the landing page sells.
  wantsAvatar: "yes",
  // Reaching the parent
  parentName: "",
  contactHandle: "",
  notes: "",
};

/** Browser limits mirror the API's Zod caps exactly. */
export const FIELD_LIMITS = {
  childName: 80,
  trait1: 80,
  trait2: 80,
  favourite: 120,
  sidekick: 120,
  petDescription: 400,
  quirk: 1200,
  storyChoice: 200,
  setting: 200,
  avoid: 600,
  dedication: 400,
  city: 80,
  area: 80,
  giftMessage: 400,
  parentName: 120,
  contactHandle: 120,
  notes: 1000,
};

/** Ages are stored as canonical strings because HTML form values are strings. */
export const AGE_LIMITS = {
  childAge: { min: 0, max: 18 },
  // A companion may be an older sibling or a pet, so this is a sanity bound
  // rather than the children's product range used for the main character.
  sidekickAge: { min: 0, max: 120 },
};

const CHOICES = {
  gender: ["boy", "girl"],
  sidekickRelation: ["brother", "sister", "friendBoy", "friendGirl", "pet"],
  storyType: ["goal", "role"],
  tone: ["funny", "sweet", "adventurous"],
  language: ["msa", "ammiya", "english"],
  pages: ["8", "10", "12"],
  format: ["pdf", "print"],
  isGift: ["yes", "no"],
  occasion: ["birthday", "eid", "newSibling", "justBecause"],
  wantsAvatar: ["yes", "no"],
};

/** The DOM/focus order, including optional and conditionally visible fields. */
const FORM_FIELD_ORDER = [
  "childName",
  "childAge",
  "gender",
  "trait1",
  "trait2",
  "favourite",
  "sidekick",
  "sidekickRelation",
  "sidekickAge",
  "petDescription",
  "quirk",
  "storyType",
  "storyChoice",
  "setting",
  "tone",
  "language",
  "pages",
  "avoid",
  "format",
  "city",
  "area",
  "isGift",
  "occasion",
  "giftMessage",
  "parentName",
  "contactHandle",
  "notes",
  "wantsAvatar",
];

/**
 * Required to write a story at all. `sidekick`, `setting`, `avoid`, `city` and
 * `notes` are deliberately optional — a parent who leaves them blank still
 * gets a complete brief.
 */
export const REQUIRED_FIELDS = [
  "childName",
  "childAge",
  "gender",
  "trait1",
  "trait2",
  "favourite",
  "quirk",
  "storyType",
  "storyChoice",
  "tone",
  "language",
  "format",
  "parentName",
  "contactHandle",
];

/**
 * Field keys that are missing, in form order.
 *
 * Three fields are conditionally required, and all follow the same rule: they
 * are only asked once the answer they depend on makes them meaningful.
 *
 * - `giftMessage` when a gift page was actually asked for — a paid page with
 *   nothing printed on it is not something to let through.
 * - `sidekickRelation` when a sidekick was actually named. The relationship is
 *   what makes the Arabic grammar around that name correct, so a name without
 *   one is worse than no name at all; the control only appears once there is a
 *   name, so this can never block a parent who skipped the field entirely.
 * - `sidekickAge` in that same branch. Without it the writer and illustrator
 *   still have to guess whether the companion is a toddler, peer or older
 *   sibling (and the same applies to a pet).
 * - `petDescription` when that sidekick is a pet. It captures the animal's
 *   type, colour and distinctive markings before fulfilment starts.
 */
export function missingFields(values) {
  const required = new Set(REQUIRED_FIELDS);
  if (String(values.sidekick ?? "").trim()) {
    required.add("sidekickRelation");
    required.add("sidekickAge");
  }
  if (
    String(values.sidekick ?? "").trim() &&
    values.sidekickRelation === "pet"
  ) {
    required.add("petDescription");
  }
  if (values.isGift === "yes") required.add("giftMessage");
  return FORM_FIELD_ORDER.filter(
    (key) => required.has(key) && !String(values[key] ?? "").trim()
  );
}

/**
 * Fields that were answered, but not with something we can use.
 *
 * Ages, choice values, overlong text and the phone can be wrong rather than
 * merely absent. Choice and length checks duplicate the API intentionally:
 * the browser gives the parent an actionable error, while the server remains
 * the authority if this code is bypassed.
 *
 * Kept separate from `missingFields` because the two need different words on
 * screen: "required" is not an answer to "that number is nine digits long".
 */
export function invalidFields(values) {
  return FORM_FIELD_ORDER.filter((key) => validationIssue(values, key));
}

/** Why one answered field is unusable; null means it is valid or blank. */
export function validationIssue(values, key) {
  const value = String(values[key] ?? "").trim();
  if (!value) return null;

  const age = AGE_LIMITS[key];
  if (age && !isWholeNumberInRange(value, age.min, age.max)) return "age";
  if (key === "contactHandle" && !isPhone(value)) return "phone";
  if (FIELD_LIMITS[key] && value.length > FIELD_LIMITS[key]) return "tooLong";
  if (CHOICES[key] && !CHOICES[key].includes(value)) return "choice";
  return null;
}

/**
 * Everything standing between these answers and a sendable order, in form
 * order — which is what `handleSubmit` focuses, so the reader lands on the
 * first thing to fix rather than the last.
 */
export function orderProblems(values) {
  const missing = missingFields(values);
  const invalid = invalidFields(values);
  const problems = new Set([...missing, ...invalid]);
  return FORM_FIELD_ORDER.filter((key) => problems.has(key));
}

export const isComplete = (values) => orderProblems(values).length === 0;

/**
 * The canonical payload shown in review and sent to the API.
 *
 * Trim outer whitespace, fold both Arabic digit blocks in ages, normalise the
 * phone, and discard answers whose controlling choice now hides them. This is
 * done on review rather than on every keystroke so typing never fights a
 * formatter.
 */
export function normalizeOrderValues(values) {
  const normalized = Object.fromEntries(
    Object.entries({ ...EMPTY_ORDER, ...values }).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value,
    ])
  );

  for (const key of Object.keys(AGE_LIMITS)) {
    normalized[key] = normalizeWholeNumber(normalized[key]) || normalized[key];
  }
  normalized.contactHandle =
    normalizePhone(normalized.contactHandle) || normalized.contactHandle;

  if (!normalized.sidekick) {
    normalized.sidekickRelation = "";
    normalized.sidekickAge = "";
    normalized.petDescription = "";
  } else if (normalized.sidekickRelation !== "pet") {
    normalized.petDescription = "";
  }
  if (normalized.format !== "print") {
    normalized.city = "";
    normalized.area = "";
  } else if (!normalized.city) {
    normalized.area = "";
  }
  if (normalized.isGift !== "yes") {
    normalized.occasion = "";
    normalized.giftMessage = "";
  }

  return normalized;
}

/**
 * The message that opens in WhatsApp.
 *
 * Deliberately **not** the brief. WhatsApp is where payment gets arranged, so
 * this carries only what both sides need to pick the conversation up: who is
 * writing, whose story it is, which order it is, what it costs. The full
 * answers are in the dashboard, which is easier to act on than a thread — a
 * parent should not have to send a wall of text in order to pay.
 *
 * It is written in the **first person** throughout, because the parent is the
 * one pressing send. Every line has to read as something they would actually
 * say and, at the same time, be the line the team needs to act:
 *
 * - the **reference** is what turns "someone messaged about a story" into a
 *   row in the dashboard, and it is why this takes `reference` at all;
 * - the **name** sits in the greeting rather than in a labelled row, because
 *   that is where a person puts their own name;
 * - the **number** is repeated even though WhatsApp already shows who is
 *   writing. Parents message from a shared family phone, or fill in a spouse's
 *   number; when the two differ, that difference is the thing to notice, and
 *   it is invisible unless the form's answer is in the message.
 *
 * `reference` is empty on the failure path, and that is a different message
 * rather than the same one with a line missing: no order was filed, so the
 * team has to take it from the chat, and the parent has to be told to expect
 * that. Sending the confident version with the reference silently dropped
 * would have them waiting on an order nobody has.
 */
export function buildWhatsAppMessage(values, dict, pricing = PRICING, reference = "") {
  const t = dict.order;
  const w = t.whatsapp;
  const price = priceBreakdown(values, pricing);
  const filed = Boolean(String(reference).trim());

  const what = [
    pagesLabel(Number(values.pages), dict),
    dict.pricing.plans[values.format]?.name,
  ]
    .filter(Boolean)
    .join(" · ");

  const row = (label, value) => (value ? `${label}: ${value}` : null);

  return [
    w.greeting
      .replace("{parent}", values.parentName.trim())
      .replace("{child}", values.childName.trim()),
    filed ? null : w.notFiled,
    "",
    filed ? row(w.reference, String(reference).trim()) : null,
    row(w.order, what),
    row(w.total, money(price.total, dict)),
    // Normalised, so the team reads the same digits the dashboard stores, and
    // isolated so a leading `+` does not migrate to the far end of the line.
    row(w.phone, phoneForText(values.contactHandle)),
    "",
    filed ? w.closing : w.closingNotFiled,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/**
 * Format the answers as a message the parent can send.
 *
 * Labels come from the dictionary so the message reads in whatever language
 * the parent filled the form in — they are the one sending it, so it has to be
 * legible to them, not only to us.
 */
export function buildOrderSummary(values, dict, pricing = PRICING) {
  const t = dict.order;
  const f = t.fields;

  const line = (label, value) =>
    String(value ?? "").trim() ? `• ${label}: ${String(value).trim()}` : null;

  const pick = (group, key) => group?.options?.[key] ?? key;

  const price = priceBreakdown(values, pricing);

  const block = (heading, lines) => {
    const kept = lines.filter(Boolean);
    return kept.length ? `${heading}\n${kept.join("\n")}` : null;
  };

  const sections = [
    block(`— ${t.summary.child} —`, [
      line(f.childName.label, values.childName),
      line(f.childAge.label, values.childAge),
      line(f.gender.label, pick(f.gender, values.gender)),
      line(f.trait1.label, values.trait1),
      line(f.trait2.label, values.trait2),
      line(f.favourite.label, values.favourite),
      line(f.sidekick.label, values.sidekick),
      // Only meaningful beside a name, and only ever set when there is one.
      line(
        f.sidekickRelation.label,
        values.sidekick.trim() ? pick(f.sidekickRelation, values.sidekickRelation) : ""
      ),
      line(f.sidekickAge.label, values.sidekick.trim() ? values.sidekickAge : ""),
      line(
        f.petDescription.label,
        values.sidekickRelation === "pet" ? values.petDescription : ""
      ),
      line(f.quirk.label, values.quirk),
    ]),
    block(`— ${t.summary.story} —`, [
      line(f.storyType.label, pick(f.storyType, values.storyType)),
      line(f.storyChoice.label, values.storyChoice),
      line(f.setting.label, values.setting),
      line(f.avoid.label, values.avoid),
      line(f.tone.label, pick(f.tone, values.tone)),
      line(f.language.label, pick(f.language, values.language)),
      line(f.pages.label, pagesLabel(Number(values.pages), dict)),
    ]),
    block(`— ${t.summary.book} —`, [
      line(
        f.format.label,
        dict.pricing.plans[values.format]?.name ?? values.format
      ),
      // Slugs are stored, labels are shown — the parent must not read "amman".
      line(f.city.label, cityLabel(values.city, dict.lang)),
      line(f.area.label, areaLabel(values.area, dict.lang)),
      line(f.isGift.label, f.isGift.options[values.isGift]),
      // Both only mean something once the book is a gift.
      line(
        f.occasion.label,
        values.isGift === "yes" ? pick(f.occasion, values.occasion) : ""
      ),
      line(f.giftMessage.label, values.isGift === "yes" ? values.giftMessage : ""),
      line(f.wantsAvatar.label, f.wantsAvatar.options[values.wantsAvatar]),
    ]),
    // The price the parent was shown, so both sides quote the same figure.
    block(`— ${t.summary.price} —`, [
      line(t.price.base, money(price.base, dict)),
      price.showPages
        ? line(
            `${t.price.extraPages} (${pagesLabel(extraPages(values), dict)})`,
            money(price.pages, dict)
          )
        : null,
      price.showFormat ? line(t.price.printed, money(price.format, dict)) : null,
      price.showGift ? line(t.price.giftPage, money(price.gift, dict)) : null,
      line(t.price.total, money(price.total, dict)),
    ]),
    block(`— ${t.summary.contact} —`, [
      line(f.parentName.label, values.parentName),
      line(f.contactHandle.label, phoneForText(values.contactHandle)),
      line(f.notes.label, values.notes),
    ]),
  ];

  // A no-likeness order sends no photographs, so promising them in the chat
  // would be a line that contradicts the answer three rows above it.
  const photosLine =
    values.wantsAvatar === "no" ? t.summary.photosSkipped : t.summary.photosPending;

  return [t.summary.heading, ...sections.filter(Boolean), photosLine].join("\n\n");
}
