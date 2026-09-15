/**
 * The book itself: what pages it has, how big they are, and how it is stored
 * between editing sessions.
 *
 * Pure — no DOM, no React — because three things consume it and must not
 * disagree: the on-screen editor, the print stylesheet, and the `.docx`
 * generator, which paints the same page onto a canvas. **Every measurement
 * either side of that split lives here**, so a change to the scrim or the type
 * size cannot land in the CSS and miss the canvas.
 */

/**
 * The two deliverables, which are genuinely different documents.
 *
 * - **print**: 220 mm trim with 3 mm bleed on every side, so the page is
 *   226 mm and the artwork runs past the cut. Reading-order files are not
 *   padded; `padForSaddleStitch` adds the physically necessary blank halves
 *   only when the operator explicitly asks for imposed sheets.
 * - **pdf**: what the parent receives. Exactly 220 mm, no bleed, and **no
 *   blanks** — filler is a printing artefact, and a reader who scrolls into two
 *   empty pages assumes the file is broken.
 */
export const SPEC = {
  print: { page: 226, trim: 220, bleed: 3, safe: 11 },
  pdf: { page: 220, trim: 220, bleed: 0, safe: 8 },
};

/** Same-origin transparent mark, shared by the browser and canvas renderers. */
export const BACK_LOGO_SRC = "/brand/logo.png";

/**
 * Everything the two renderers have to agree on.
 *
 * The CSS page and the canvas page are separate implementations of one design
 * — unavoidable, since a `.docx` cannot carry a CSS gradient — so the numbers
 * are shared and only the drawing differs.
 */
export const LAYOUT = {
  /** How much of the page's height the cream scrim occupies. */
  scrimShare: 0.26,
  /** Where the scrim reaches full opacity, as a share of its own height. */
  scrimSolidAt: 0.68,
  /** Body text, in points on the printed page. */
  bodyPt: 16.5,
  bodyLine: 1.9,
  titlePt: 24,
  coverTitlePt: 28,
  notePt: 16,
  cream: "#fdf8f0",
  ink: "#2e2a26",
  brandDeep: "#146466",
  gold: "#f4b740",
  /** The cover's title scrim, over the top of the frame. */
  coverScrimShare: 0.4,
  backLogoMm: 52,
  backWordPt: 26,
  backBodyPt: 13.5,
  backGapMm: 6,
  /** A quiet folio below the story text, shared by CSS and canvas. */
  folioMm: 8.5,
  folioPt: 10.5,
};

/**
 * Where a page's text sits.
 *
 * `center` exists because the illustration decides this, not a house rule: a
 * scene whose action fills the bottom of the frame has nowhere for words down
 * there. `hidden` is a full-bleed illustration with no words at all — a real
 * choice for a page that carries the story in the picture, and deliberately
 * labelled "بلا نص" rather than left as an empty text box.
 */
export const PLACEMENTS = ["top", "center", "bottom", "hidden"];
export const PLACEMENT_LABEL = {
  top: "فوق",
  center: "بالنص",
  bottom: "تحت",
  hidden: "بلا نص",
};

/**
 * What sits behind the words.
 *
 * `scrim` is the house default — a soft fade out of the artwork, never a hard
 * box (the site's rule for text over an image, and what the Word file's opaque
 * white rectangle got wrong). `solid` is a real band for a busy illustration
 * that a fade cannot rescue, and `none` puts the words straight onto the
 * picture, which only works where the art is already calm.
 */
export const BANDS = ["scrim", "veil", "solid", "none"];
export const BAND_LABEL = {
  scrim: "تدرّج",
  veil: "غشاوة",
  solid: "لون كامل",
  none: "بدون",
};

/**
 * How far a veil is allowed to go.
 *
 * A `scrim` fades all the way to flat colour, so the words end up on paint. A
 * `veil` never does — it tops out translucent, so the artwork still reads
 * through it. That is what the cover has always used: a title has to sit on
 * the illustration, not on a stripe pasted over it.
 */
export const VEIL_MAX = 0.72;

/** Brand colours only. A free colour picker is how a book stops matching itself. */
export const BAND_SWATCHES = [
  { value: "#fdf8f0", label: "كريمي" },
  { value: "#ffffff", label: "أبيض" },
  { value: "#146466", label: "أخضر" },
  { value: "#2e2a26", label: "غامق" },
  { value: "#f4b740", label: "ذهبي" },
];
export const TEXT_SWATCHES = [
  { value: "#2e2a26", label: "غامق" },
  { value: "#fdf8f0", label: "كريمي" },
  { value: "#146466", label: "أخضر" },
];

/** Point sizes on the printed page, not CSS pixels. */
export const TEXT_SIZES = { s: 13.5, m: 16.5, l: 20 };
/** A cover title is a different instrument; three body sizes are all too small. */
export const COVER_SIZES = { s: 22, m: 28, l: 36 };
export const SIZE_LABEL = { s: "صغير", m: "عادي", l: "كبير" };

export const sizesFor = (kind) => (kind === "cover" ? COVER_SIZES : TEXT_SIZES);

export const ALIGNS = ["start", "center"];
export const ALIGN_LABEL = { start: "للطرف", center: "بالنص" };

/** What a story page looks like before anyone touches it. */
export const DEFAULT_STYLE = {
  place: "bottom",
  band: "scrim",
  bandColor: "#fdf8f0",
  textColor: "#2e2a26",
  size: "m",
  align: "start",
  /** The page's own ground, seen wherever no illustration covers it. */
  bg: "#fdf8f0",
  /**
   * Millimetres down from wherever `place` put the text; negative is up.
   *
   * `place` gets the words to the right end of the page; this is for the
   * illustration that needs them eight millimetres clear of a face. Measured
   * in mm rather than px because the page is a printed object — a pixel has no
   * fixed size here, and the preview is drawn at a scale that changes.
   */
  offset: 0,
};

/**
 * The title, gift and dedication pages start somewhere else.
 *
 * They are typographic by default — centred on cream, no band, because there is
 * no artwork to sit on. Give one a background image and the same `band` control
 * that keeps story text legible starts earning its keep here too.
 */
export const FRONT_STYLE = {
  ...DEFAULT_STYLE,
  place: "center",
  align: "center",
  band: "none",
};

/**
 * The cover.
 *
 * A dark veil at the top and a cream title, which is what it has always been —
 * but now as a style like any other, so it can be moved, recoloured and
 * resized. `#143234` is the dark teal the veil was already mixed from.
 */
export const COVER_STYLE = {
  ...DEFAULT_STYLE,
  place: "top",
  align: "center",
  band: "veil",
  bandColor: "#143234",
  textColor: "#fdf8f0",
  size: "m",
};

/** Which default a page starts from. */
export const styleFor = (kind) =>
  kind === "cover"
    ? COVER_STYLE
    : kind === "title" || kind === "note"
      ? FRONT_STYLE
      : DEFAULT_STYLE;

const txt = (value) => String(value ?? "").trim();

/**
 * The generated story is the authority for reading direction.
 *
 * Marketing/test orders can carry a stale requested-language answer (Q-000007
 * did), while the pasted and approved story is plainly Arabic. Counting script
 * characters makes that mismatch visible without trusting a title alone. The
 * order answer remains the fallback for empty or genuinely neutral copy, and
 * the dashboard can override either result explicitly through `edits.direction`.
 */
export function storyDirection(order, story, override = "auto") {
  if (override === "rtl" || override === "ltr") return override;

  const copy = [
    story?.title,
    story?.summary,
    story?.dedication,
    ...(story?.pages ?? []).map((page) => page?.text),
  ].join(" ");
  const arabic = (copy.match(/[\u0600-\u06ff]/g) ?? []).length;
  const latin = (copy.match(/[A-Za-z]/g) ?? []).length;

  if (arabic > latin) return "rtl";
  if (latin > arabic) return "ltr";
  return order?.story?.language === "english" ? "ltr" : "rtl";
}

/**
 * The pages, in reading order, with the operator's edits applied.
 *
 * `edits` is what the editor owns: `text` overrides a page's words, `place`
 * moves them, `order` permutes the story pages, and `front` turns the title
 * and dedication leaves on or off. Everything in it is keyed by the page key,
 * and the story page keys are **the same keys `pagePrompts()` emits** — so the
 * prompt the operator ran is the image that belongs in that slot.
 */
export function buildPages(order, story, edits = {}) {
  const book = order?.book ?? {};
  const front = edits.front ?? { title: true, dedication: true };
  const text = edits.text ?? {};
  const style = edits.style ?? {};
  const out = [];
  const childName = order?.child?.childName ?? "";
  const dir = storyDirection(order, story, edits.direction);

  // The style is resolved here rather than in the renderers, because there are
  // two of them — CSS and canvas — and a default applied in one and missed in
  // the other is a book that prints differently from the one on screen.
  const withEdits = (page) => ({
    ...page,
    body: page.key in text ? text[page.key] : page.body,
    style: { ...styleFor(page.kind), ...(style[page.key] ?? {}) },
  });

  // The cover's text IS the book's title, and the title page reads the same
  // value — editing it in one place is the only version of this that cannot
  // end up with a book whose cover and title page disagree.
  const bookTitle = "cover" in text ? text.cover : txt(story?.title);
  out.push({
    key: "cover",
    kind: "cover",
    label: "الغلاف",
    image: true,
    body: bookTitle,
  });

  // Optional, and genuinely optional: the layout the team already prints
  // (`Layan-saddle-stitch-imposition.docx`) is cover + story + back cover with
  // no front matter at all. Three extra leaves is a third more paper.
  if (front.title) out.push({ key: "title", kind: "title", label: "صفحة العنوان" });

  if (book.isGift === "yes" && txt(book.giftMessage)) {
    out.push({
      key: "gift",
      kind: "note",
      label: "صفحة الهدية",
      body: book.giftMessage,
      accent: LAYOUT.gold,
    });
  }
  if (front.dedication && txt(story?.dedication)) {
    out.push({
      key: "dedication",
      kind: "note",
      label: "الإهداء",
      body: story.dedication,
    });
  }

  const storyPages = story?.pages ?? [];
  // A permutation of positions, not of page numbers — Gemini's `page_number`
  // goes missing and occasionally repeats, so the array index is the only
  // identity a page reliably has.
  const sequence =
    Array.isArray(edits.order) && edits.order.length === storyPages.length
      ? edits.order
      : storyPages.map((_, i) => i);

  sequence.forEach((index, position) => {
    const page = storyPages[index];
    if (!page) return;
    out.push({
      key: `page-${index}`,
      kind: "story",
      label: `صفحة ${position + 1}`,
      number: edits.pageNumbers === false ? null : position + 1,
      body: page?.text ?? "",
      image: true,
      index,
      position,
    });
  });

  const backBody =
    dir === "ltr"
      ? `This story was created especially for ${childName}.\n\nQissati creates fully personalised illustrated stories, written from scratch around each child's name, personality and world — turning their adventure into a book to keep.`
      : `صُنِعَتْ هٰذِهِ القِصَّةُ خِصِّيصًا لِـ${childName}.\n\nقِصَّتِي تَصْنَعُ قِصَصًا مُصَوَّرَةً مُخَصَّصَةً بِالْكَامِلِ لِكُلِّ طِفْلٍ، تُكْتَبُ مِنَ الصِّفْرِ حَوْلَ اسْمِهِ وَشَخْصِيَّتِهِ وَعَالَمِهِ، لِتُصْبِحَ مُغَامَرَتُهُ كِتَابًا يَحْتَفِظُ بِهِ.`;

  out.push({
    key: "back",
    kind: "back",
    label: "الغلاف الخلفي",
    body: backBody,
    wordmark: dir === "ltr" ? "Qissati" : "قصتي",
  });

  return {
    pages: out.map(withEdits),
    childName,
    title: bookTitle,
    // The story's own language decides the printed page's direction. `/admin`
    // is RTL, and an English book set right-to-left is as wrong as the reverse.
    dir,
  };
}

/**
 * Add blank halves only for an imposed saddle-stitched file.
 *
 * They sit immediately before the back cover, so the real book still ends on
 * Qissati's mark. Reading-order PDF/Word files never call this helper and
 * therefore never acquire unexplained blank ending pages.
 */
export function padForSaddleStitch(pages) {
  const clean = pages.filter((page) => page.kind !== "blank");
  const need = (4 - (clean.length % 4)) % 4;
  if (!need) return clean;

  const backAt = clean.findIndex((page) => page.kind === "back");
  const insertAt = backAt === -1 ? clean.length : backAt;
  const blanks = Array.from({ length: need }, (_, i) => ({
    key: `blank-${i}`,
    kind: "blank",
    label: "نصف فارغ للتدبيس",
  }));
  return [...clean.slice(0, insertAt), ...blanks, ...clean.slice(insertAt)];
}

/** Move one story page up or down the running order. */
export function reorder(sequence, position, delta) {
  const next = [...sequence];
  const to = position + delta;
  if (to < 0 || to >= next.length) return sequence;
  [next[position], next[to]] = [next[to], next[position]];
  return next;
}

// ── Keeping the work ────────────────────────────────────────────────────────

/**
 * Edits survive a reload, because an hour of corrections across twelve pages
 * is not something to lose to an accidental ⌘W.
 *
 * **In the browser, not on the server**, and that is a deliberate limit rather
 * than a shortcut: it needs no backend change, and the story text stays off our
 * infrastructure, which is where it sits today. The cost is that it is one
 * machine's copy — a teammate opening the same order sees an empty editor.
 *
 * The illustrations are **not** stored. They are local files on the operator's
 * disk; a blob URL does not survive a reload and the files themselves have no
 * business in `localStorage`. Text and page order come back, images are
 * re-picked.
 */
const KEY = (reference) => `qissati.book.${reference}`;

export function loadEdits(reference) {
  if (!reference || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY(reference));
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Private mode, a full quota, or a value from an older shape. An editor
    // that opens empty is a far better failure than one that will not open.
    return null;
  }
}

export function saveEdits(reference, edits) {
  if (!reference || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY(reference), JSON.stringify(edits));
  } catch {
    // Nothing useful to say and nothing to do — the export still works from
    // what is on screen.
  }
}

export function clearEdits(reference) {
  if (!reference || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY(reference));
  } catch {
    /* see above */
  }
}

// ── Imposition ──────────────────────────────────────────────────────────────

/**
 * Saddle-stitch imposition: which two pages share each side of each sheet.
 *
 * This is the printer's job, and doing it here is a deliberate exception made
 * because Qissati's print partner asks for imposed sheets. **The thing a
 * hand-made imposition cannot do is creep** — the inner leaves of a stapled
 * book push outward and are trimmed more, so their content should shift
 * progressively toward the spine. A RIP compensates; this does not. At 12–16
 * pages on ordinary stock the push-out is well under a millimetre, which is
 * why it is tolerable here and would not be in a 64-page book.
 *
 * The pairing is standard 2-up saddle stitch: the outer sheet joins the first
 * and last pages, its reverse joins the second and penultimate, and each inner
 * sheet walks toward the centre. Binding direction mirrors only the physical
 * left/right halves.
 *
 * **Direction decides the halves, not the pairing.** On the outside sheet of
 * a right-bound Arabic book, the front cover (page 1) is the left half because
 * its right edge meets the spine; the back cover is the right half. A
 * left-bound English book is the familiar mirror: back cover left, front cover
 * right. Get this backwards and the flat PDF still looks plausible but the
 * folded book opens from the wrong side.
 */
export function impose(pageCount, dir = "rtl") {
  if (pageCount % 4 !== 0) return null;
  const rtl = dir !== "ltr";
  const sheets = [];

  for (let k = 1; k <= pageCount / 4; k += 1) {
    const pairs = [
      // Outside of the sheet: the first page of this pair and the last.
      [pageCount - 2 * k + 2, 2 * k - 1],
      // Inside, which is the same leaf turned over — so the halves swap sides.
      [2 * k, pageCount - 2 * k + 1],
    ];
    pairs.forEach(([a, b], i) => {
      // `b` lands on the left of a right-bound Arabic sheet. For the outer
      // front that is page 1; its right edge meets the centre fold. English is
      // the mirror, with the final page on the left and page 1 on the right.
      sheets.push({
        side: i === 0 ? "front" : "back",
        sheet: k,
        left: (rtl ? b : a) - 1,
        right: (rtl ? a : b) - 1,
      });
    });
  }
  return sheets;
}

/**
 * The sheet's dimensions, in mm.
 *
 * Each half loses its **inner** bleed: that edge is the fold, nothing is
 * trimmed there, and leaving both halves at full width would print a 6 mm band
 * of doubled artwork down the middle of every spread. The outer bleed stays,
 * because the outer edge really is cut.
 */
export function sheetSize(spec) {
  const half = spec.page - spec.bleed;
  return { width: half * 2, height: spec.page, half, cut: spec.bleed };
}
