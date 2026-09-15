/**
 * The dashboard's Arabic vocabulary, and the small amount of shared logic
 * behind it.
 *
 * The dashboard is single-locale (see `app/(admin)/admin/layout.js`), so these
 * are plain constants rather than a dictionary keyed by locale — there is no
 * second language to key.
 *
 * **The option labels have to agree with the order form's dictionary.** A
 * `tone` of `sweet` is "حنونة" on the form and must not become something else
 * here, or the team reads back a different answer than the parent gave. The
 * values themselves are the AI prompt templates' vocabulary and are never
 * translated in storage — only for display.
 */

import { areaLabel, cityLabel } from "./jordan";

export const STATUSES = [
  "new",
  "paid",
  "writing",
  "illustrating",
  "review",
  "delivered",
  "cancelled",
];

export const STATUS_LABEL = {
  new: "جديد",
  paid: "مدفوع",
  writing: "قيد الكتابة",
  illustrating: "قيد الرسم",
  review: "مراجعة",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

/**
 * Status colours, as full class strings.
 *
 * Written out rather than composed (`bg-${tone}-tint`) because Tailwind scans
 * source text for complete class names — an interpolated one is simply absent
 * from the stylesheet, with no error anywhere.
 */
export const STATUS_TONE = {
  new: "bg-gold/20 text-ink border-gold",
  paid: "bg-brand-tint text-brand-deep border-brand-deep/40",
  writing: "bg-brand-tint text-brand-deep border-brand-deep/40",
  illustrating: "bg-brand-tint text-brand-deep border-brand-deep/40",
  review: "bg-cream-deep text-ink border-ink/25",
  delivered: "bg-brand-deep text-cream border-brand-deep",
  cancelled: "bg-cream-deep text-muted border-muted-soft",
};

export const FIELD_LABEL = {
  childName: "اسم الطفل",
  childAge: "العمر",
  gender: "البنت أو الولد",
  trait1: "صفة أولى",
  trait2: "صفة ثانية",
  favourite: "أكثر شي بحبه",
  sidekick: "رفيق القصة",
  sidekickRelation: "شو بيجي للطفل",
  sidekickAge: "عمر رفيق القصة",
  petDescription: "وصف الحيوان الأليف",
  quirk: "العادة الخاصة فيه",
  storyType: "نوع القصة",
  storyChoice: "التفاصيل",
  setting: "مكان القصة",
  avoid: "نتجنب",
  tone: "أجواء القصة",
  language: "لغة القصة",
  pages: "عدد الصفحات",
  // No longer asked on the order form; kept for orders that predate its removal.
  dedication: "الإهداء",
  format: "الصيغة",
  city: "المدينة",
  area: "المنطقة",
  occasion: "المناسبة",
  isGift: "هدية؟",
  giftMessage: "كلمة الهدية",
  wantsAvatar: "شخصية تشبه الطفل؟",
  parentName: "اسم ولي الأمر",
  contactHandle: "طريقة التواصل",
  notes: "ملاحظات",
};

/** Chip values → the words the parent actually chose on the form. */
export const VALUE_LABEL = {
  gender: { boy: "ولد", girl: "بنت" },
  storyType: { goal: "هدف بدنا نوصله", role: "مهنة أو دور" },
  tone: { funny: "مضحكة", sweet: "حنونة", adventurous: "مغامرة" },
  language: { msa: "فصحى مبسّطة", ammiya: "عامية أردنية", english: "إنجليزي" },
  format: { pdf: "نسخة PDF", print: "نسخة مطبوعة" },
  // The relation the story's Arabic has to agree with — the reason the form
  // asks at all, so the team can check the wording against it.
  sidekickRelation: {
    brother: "أخ",
    sister: "أخت",
    friendBoy: "صديق",
    friendGirl: "صديقة",
    pet: "حيوان أليف",
  },
  occasion: {
    birthday: "عيد ميلاد",
    eid: "عيد",
    newSibling: "أخ جديد",
    justBecause: "بس هيك",
  },
  isGift: { yes: "نعم", no: "لا" },
  // "لا" here means skip Template 2 entirely and draw a general character —
  // the team must not go looking for reference photos that were never asked for.
  wantsAvatar: { yes: "نعم — نرسمه من الصور", no: "لا — شخصية عامة" },
};

export const label = (key, value) => VALUE_LABEL[key]?.[value] ?? value;

/**
 * City and area are slugs from `lib/jordan.js`, not a `VALUE_LABEL` table —
 * the map is too big to duplicate here and it is shared with the order form.
 * Both helpers fall back to the raw value, so an order placed before the field
 * became a dropdown still shows the Arabic the parent typed by hand.
 */
export const placeLabel = (key, value) =>
  key === "city" ? cityLabel(value) : key === "area" ? areaLabel(value) : value;

/**
 * A page count with Arabic number agreement — the dashboard's copy of the rule
 * `pagesLabel()` enforces on the site. Arabic needs four forms where English
 * needs two, and `${n} صفحة` produces "10 صفحة", which is ungrammatical.
 */
export function pages(n) {
  const count = Number(n);
  if (count === 1) return "صفحة واحدة";
  if (count === 2) return "صفحتين";
  if (count <= 10) return `${count} صفحات`;
  return `${count} صفحة`;
}

/**
 * A photo count with Arabic number agreement.
 *
 * Same rule as `pages()`, and the dual is not theoretical here: `MAX_PHOTOS`
 * is 3, so 1 and 2 are ordinary counts and "1 صور" / "2 صور" are both simply
 * wrong. `PhotoPicker` needed its own `selectedTwo` for exactly this.
 */
export function photos(n) {
  const count = Number(n);
  if (count === 1) return "صورة وحدة";
  if (count === 2) return "صورتين";
  if (count <= 10) return `${count} صور`;
  return `${count} صورة`;
}

/** An amount, or the site-wide `[X]` when no price has been decided. */
export function money(amount, currency = "JOD") {
  return amount === null || amount === undefined
    ? `[X] ${currency}`
    : `${amount} ${currency}`;
}

/** Bytes, for the photo list. */
export function fileSize(bytes) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} م.ب` : `${Math.round(bytes / 1024)} ك.ب`;
}

/**
 * A date in Gregorian Arabic.
 *
 * `ar-JO-u-ca-gregory` matters: plain `ar` resolves to the Islamic calendar in
 * some runtimes, so an order placed today would print a Hijri date beside a
 * Gregorian one from another part of the interface.
 */
export function when(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ar-JO-u-ca-gregory", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

/**
 * The brief, as the AI prompt templates want to read it.
 *
 * The dashboard's "copy the brief" action pastes this into whatever runs the
 * prompts. Labels are Arabic because the person pasting reads Arabic; the
 * VALUES are the parent's own words, untranslated, which is what the templates
 * are filled with.
 */
export function briefText(order) {
  const groups = [
    ["الطفل", order.child, ["childName", "childAge", "gender", "trait1", "trait2", "favourite", "sidekick", "sidekickRelation", "sidekickAge", "petDescription", "quirk"]],
    ["القصة", order.story, ["storyType", "storyChoice", "setting", "avoid", "tone", "language", "pages", "dedication"]],
    ["الكتاب", order.book, ["format", "city", "area", "isGift", "occasion", "giftMessage", "wantsAvatar"]],
    ["التواصل", order.contact, ["parentName", "contactHandle", "notes"]],
  ];

  const lines = [`طلب ${order.reference}`];
  for (const [heading, group, keys] of groups) {
    const rows = keys
      .map((k) => {
        const raw = group?.[k];
        if (!String(raw ?? "").trim()) return null;
        const value =
          k === "pages"
            ? pages(raw)
            : k === "city" || k === "area"
              ? placeLabel(k, raw)
              : label(k, raw);
        return `• ${FIELD_LABEL[k]}: ${value}`;
      })
      .filter(Boolean);
    if (rows.length) lines.push("", `— ${heading} —`, ...rows);
  }
  return lines.join("\n");
}
