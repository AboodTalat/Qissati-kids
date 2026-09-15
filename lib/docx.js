/**
 * The book as a Word document, for the print shop.
 *
 * **Every page is one flattened image**, artwork and words baked together,
 * rather than a picture with a Word text box over it. That is the decision the
 * whole file turns on, and it is about what can go wrong at the printer:
 *
 * - **No font dependency.** Word text renders in whatever the opening machine
 *   has installed. Cairo is not on a print shop's PC, so the substitute font
 *   reflows the page and the book that arrives is not the book that was
 *   approved. A flattened page cannot reflow.
 * - **No compression surprise.** Word re-compresses images to 220 ppi when it
 *   *saves*, not when it reads. We write the file, so the JPEGs go in at full
 *   resolution; the degradation only happens if someone opens it and re-saves.
 *   The UI says so.
 * - **Nothing to nudge by accident.** A text box in a Word file is an
 *   invitation to drag it two millimetres and not notice.
 *
 * The cost is that the type is raster rather than vector. At 300 dpi and
 * 16.5 pt — a size chosen to be read aloud to a five-year-old — that is
 * invisible in print. The parent's PDF keeps live text, because it is read on
 * a screen and zoomed.
 *
 * This is the second implementation of one design: `BookPage` draws it in CSS,
 * `paintPage` here draws it on a canvas. They cannot share code, so they share
 * `LAYOUT` in `lib/book.js` instead — change a measurement there and both move.
 */

import {
  BACK_LOGO_SRC,
  LAYOUT,
  VEIL_MAX,
  impose,
  sheetSize,
  sizesFor,
} from "./book";
import { zip } from "./zip";

const MM_TO_EMU = 36000;
const MM_TO_TWIP = 1440 / 25.4;
/** Points across a page, used to turn a print type size into canvas pixels. */
const mmToPt = (mm) => (mm / 25.4) * 72;

/** The font stack the dashboard actually resolved — `next/font` hashes the family name. */
function fontStack() {
  if (typeof window === "undefined") return "sans-serif";
  return getComputedStyle(document.body).fontFamily || "sans-serif";
}

/**
 * Make sure Cairo is really loaded before anything is painted.
 *
 * A canvas asked for a font it does not have does not fail — it silently
 * substitutes, and the `.docx` then ships with the book set in whatever the
 * machine had lying around. `document.fonts.ready` alone is not enough: it
 * settles once the fonts *requested so far* are done, which says nothing about
 * the weights this file asks for. So load them explicitly, then check.
 *
 * The check has to name the **first** family, not the stack: `fonts.check` is
 * satisfied by any entry in a list, and every stack ends in `sans-serif`, which
 * is always available. Checking the stack would return true forever.
 */
async function ensureFont(family) {
  if (typeof document === "undefined" || !document.fonts) return true;
  const first = family.split(",")[0].trim().replace(/^["']|["']$/g, "");
  try {
    await Promise.all([
      document.fonts.load(`400 100px "${first}"`),
      document.fonts.load(`800 100px "${first}"`),
    ]);
    await document.fonts.ready;
    return document.fonts.check(`400 100px "${first}"`);
  } catch {
    return false;
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

function pageNumberLabel(number, dir) {
  return dir === "rtl"
    ? new Intl.NumberFormat("ar-JO", { useGrouping: false }).format(number)
    : String(number);
}

/** Draw the same quiet circular folio used by `BookPage`. */
function paintPageNumber(ctx, page, spec, dir, family, S) {
  if (page.kind !== "story" || page.number == null) return;
  const mm = S / spec.page;
  const pt = S / mmToPt(spec.page);
  const radius = (LAYOUT.folioMm * mm) / 2;
  const x = S / 2;
  const y = S - spec.safe * mm;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(253,248,240,0.86)";
  ctx.fill();

  ctx.direction = dir;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = LAYOUT.brandDeep;
  ctx.font = `800 ${LAYOUT.folioPt * pt}px ${family}`;
  ctx.fillText(pageNumberLabel(page.number, dir), x, y);
}

/** Wrap into lines that fit, honouring newlines the operator typed. */
function wrapText(ctx, text, maxWidth) {
  const out = [];
  for (const para of String(text ?? "").split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (!line || ctx.measureText(test).width <= maxWidth) line = test;
      else {
        out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out;
}

/**
 * How big to draw a page.
 *
 * Taken from the illustration rather than from a constant, and deliberately
 * **never upscaled**: a cover-crop into a square uses a `min(w, h)` region of
 * the source, so that is exactly the detail available. Inventing pixels above
 * it would only hide from the operator that the artwork they downloaded is too
 * small — which is what `pageDpi` is for.
 */
function canvasSide(img, spec) {
  const fromArt = img ? Math.min(img.naturalWidth, img.naturalHeight) : 0;
  const forType = Math.round((spec.page / 25.4) * 300);
  return Math.min(4000, Math.max(fromArt || forType, 600));
}

/** Effective print resolution of a page, so the UI can warn before the printer does. */
export function pageDpi(img, spec) {
  if (!img) return Infinity;
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  return Math.round(side / (spec.page / 25.4));
}

/**
 * Paint one page onto a canvas at print size.
 *
 * Mirrors `BookPage`'s CSS exactly. Anything changed here has to change there.
 */
function paintPage(canvas, { page, img, logo, spec, dir, family }) {
  const S = canvas.width;
  const ctx = canvas.getContext("2d");
  const safe = (spec.safe / spec.page) * S;
  // A print point, expressed in this canvas's pixels.
  const pt = S / mmToPt(spec.page);

  ctx.fillStyle = LAYOUT.cream;
  ctx.fillRect(0, 0, S, S);

  if (page.kind === "blank") return;

  if (page.kind === "back") {
    ctx.fillStyle = LAYOUT.brandDeep;
    ctx.fillRect(0, 0, S, S);
    const mm = S / spec.page;
    const logoW = LAYOUT.backLogoMm * mm;
    const logoH = logo
      ? logoW * (logo.naturalHeight / logo.naturalWidth)
      : 0;
    const gap = LAYOUT.backGapMm * mm;
    const wordSize = LAYOUT.backWordPt * pt;
    const bodySize = LAYOUT.backBodyPt * pt;
    const lead = bodySize * 1.8;

    ctx.fillStyle = LAYOUT.cream;
    ctx.direction = dir;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = `600 ${bodySize}px ${family}`;
    const lines = wrapText(ctx, page.body, S - safe * 4);
    const totalH = logoH + gap + wordSize + gap + lines.length * lead;
    let y = (S - totalH) / 2;

    if (logo) {
      ctx.drawImage(logo, (S - logoW) / 2, y, logoW, logoH);
      y += logoH;
    }
    y += gap + wordSize;
    ctx.font = `800 ${wordSize}px ${family}`;
    ctx.fillText(page.wordmark || (dir === "ltr" ? "Qissati" : "قصتي"), S / 2, y);

    y += gap + bodySize;
    ctx.font = `600 ${bodySize}px ${family}`;
    for (const line of lines) {
      ctx.fillText(line, S / 2, y);
      y += lead;
    }
    return;
  }

  if (page.kind === "title" || page.kind === "note") {
    const st = page.style ?? {};
    const isTitle = page.kind === "title";

    ctx.fillStyle = st.bg || LAYOUT.cream;
    ctx.fillRect(0, 0, S, S);
    if (img) {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const side = Math.min(iw, ih);
      ctx.drawImage(img, (iw - side) / 2, (ih - side) / 2, side, side, 0, 0, S, S);
    }

    ctx.direction = dir;
    ctx.textAlign = st.align === "start" ? "start" : "center";
    ctx.textBaseline = "alphabetic";

    const mm = S / spec.page;
    const bodySize = (isTitle ? LAYOUT.titlePt : sizesFor(page.kind)[st.size] ?? sizesFor(page.kind).m) * pt;
    const subSize = 13 * pt;
    ctx.font = `${isTitle ? 800 : 400} ${bodySize}px ${family}`;
    const lines = wrapText(ctx, isTitle ? page.title : page.body, S - safe * 2 - S * 0.1);
    const lead = bodySize * (isTitle ? 1.5 : 2);
    const ruleH = Math.max(2, 1.2 * mm);
    const gap = 8 * mm;
    const padBlock = safe * (st.band === "none" ? 1 : 1.6);
    const blockH =
      ruleH + gap + lines.length * lead + (isTitle ? 6 * mm + subSize : 0) + padBlock * 2;

    const centred = st.place === "center" || !st.place;
    const off = (Number(st.offset) || 0) * mm;
    // The band is anchored by `place`; only the text content is nudged by
    // `offset`, matching the browser preview.
    const bandTop = centred ? (S - blockH) / 2 : st.place === "top" ? 0 : S - blockH;

    if (st.band === "solid") {
      ctx.fillStyle = st.bandColor || LAYOUT.cream;
      ctx.fillRect(0, bandTop, S, blockH);
    } else if (st.band === "scrim") {
      const colour = st.bandColor || LAYOUT.cream;
      const [r, g, b] = hexRgb(colour);
      const grad = ctx.createLinearGradient(0, bandTop, 0, bandTop + blockH);
      grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
      grad.addColorStop(0.26, colour);
      grad.addColorStop(0.74, colour);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, bandTop, S, blockH);
    }

    const x = st.align === "start" ? (dir === "rtl" ? S - safe : safe) : S / 2;
    const ruleW = (isTitle ? 18 : 12) * mm;
    let y = bandTop + padBlock + off;

    ctx.fillStyle = page.accent || (isTitle ? LAYOUT.gold : LAYOUT.brandDeep);
    const ruleX = st.align === "start" ? (dir === "rtl" ? S - safe - ruleW : safe) : (S - ruleW) / 2;
    ctx.fillRect(ruleX, y, ruleW, ruleH);
    y += ruleH + gap + bodySize;

    ctx.fillStyle = st.textColor || LAYOUT.ink;
    ctx.font = `${isTitle ? 800 : 400} ${bodySize}px ${family}`;
    for (const line of lines) {
      ctx.fillText(line, x, y);
      y += lead;
    }

    if (isTitle) {
      ctx.globalAlpha = 0.75;
      ctx.font = `700 ${subSize}px ${family}`;
      ctx.fillText(
        dir === "ltr" ? `A story made for ${page.childName}` : `قصة مخصصة لـ ${page.childName}`,
        x,
        y - lead + 6 * mm + subSize
      );
      ctx.globalAlpha = 1;
    }
    return;
  }

  // Cover and story pages: the illustration, cover-cropped into the square.
  if (img) {
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const side = Math.min(iw, ih);
    ctx.drawImage(img, (iw - side) / 2, (ih - side) / 2, side, side, 0, 0, S, S);
  } else {
    ctx.fillStyle = "#f7eee0";
    ctx.fillRect(0, 0, S, S);
  }

  const st = page.style ?? {};
  if (st.place === "hidden" || !String(page.body ?? "").trim()) {
    paintPageNumber(ctx, page, spec, dir, family, S);
    return;
  }

  // Mirrors `Words` in `components/admin/BookPage.jsx`. Both read their
  // measurements from LAYOUT and the size tables; a change in one belongs in
  // both.
  const isCover = page.kind === "cover";
  const table = sizesFor(page.kind);
  const size = (table[st.size] ?? table.m) * pt;
  const lead = size * (isCover ? 1.45 : LAYOUT.bodyLine);
  const off = (Number(st.offset) || 0) * (S / spec.page);
  ctx.direction = dir;
  ctx.font = `${isCover ? 800 : 400} ${size}px ${family}`;
  const lines = wrapText(ctx, page.body, S - safe * 2);
  const folioReserve =
    page.kind === "story" && page.number != null && st.place === "bottom"
      ? (LAYOUT.folioMm + 2) * (S / spec.page)
      : 0;
  const blockH = lines.length * lead + safe * 2 + folioReserve;

  const centred = st.place === "center";
  const top = st.place === "top";
  const colour = st.bandColor || LAYOUT.cream;
  const [r, g, b] = hexRgb(colour);

  const veil = st.band === "veil";
  const peak = veil ? VEIL_MAX : 1;
  const share = isCover ? LAYOUT.coverScrimShare : LAYOUT.scrimShare;

  if (st.band === "scrim" || veil) {
    if (centred) {
      const h = Math.max(blockH * 1.6, S * share);
      const y0 = (S - h) / 2;
      const grad = ctx.createLinearGradient(0, y0, 0, y0 + h);
      grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
      grad.addColorStop(0.28, `rgba(${r},${g},${b},${peak})`);
      grad.addColorStop(0.72, `rgba(${r},${g},${b},${peak})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, y0, S, h);
    } else {
      const h = Math.max(S * share, blockH);
      const grad = veil
        ? top
          ? ctx.createLinearGradient(0, 0, 0, h)
          : ctx.createLinearGradient(0, S, 0, S - h)
        : top
          ? ctx.createLinearGradient(0, h, 0, 0)
          : ctx.createLinearGradient(0, S - h, 0, S);
      if (veil) {
        grad.addColorStop(0, `rgba(${r},${g},${b},${VEIL_MAX})`);
        grad.addColorStop(0.55, `rgba(${r},${g},${b},${VEIL_MAX * 0.62})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      } else {
        grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
        grad.addColorStop(0.52, `rgba(${r},${g},${b},0.92)`);
        grad.addColorStop(LAYOUT.scrimSolidAt, colour);
        grad.addColorStop(1, colour);
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, top ? 0 : S - h, S, h);
    }
  } else if (st.band === "solid") {
    ctx.fillStyle = colour;
    const y = centred ? (S - blockH) / 2 : top ? 0 : S - blockH;
    ctx.fillRect(0, y, S, blockH);
  }

  ctx.textAlign = st.align === "center" ? "center" : "start";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = st.textColor || LAYOUT.ink;

  // `start` is the right edge under rtl and the left under ltr; canvas resolves
  // that from `direction`, but the origin has to be given explicitly.
  const x = st.align === "center" ? S / 2 : dir === "rtl" ? S - safe : safe;
  const firstBaseline =
    (centred
      ? (S - blockH) / 2 + safe + size
      : top
        ? safe + size
        : S - safe - folioReserve - (lines.length - 1) * lead) + off;
  let y = firstBaseline;
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += lead;
  }
  paintPageNumber(ctx, page, spec, dir, family, S);
}

/** `#rrggbb` to its three channels, for a gradient that needs a clear end. */
function hexRgb(hex) {
  const h = String(hex ?? "#ffffff").replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Render every page to a JPEG at print resolution. */
export async function renderBook({ pages, images, spec, dir, title, childName }) {
  const family = fontStack();
  const fontOk = await ensureFont(family);
  const logo = pages.some((page) => page.kind === "back")
    ? await loadImage(BACK_LOGO_SRC).catch(() => null)
    : null;
  const out = [];

  for (const page of pages) {
    const src = images[page.key]?.url;
    const img = src ? await loadImage(src).catch(() => null) : null;
    const side = canvasSide(img, spec);
    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;
    paintPage(canvas, {
      page: { ...page, title, childName },
      img,
      logo,
      spec,
      dir,
      family,
    });
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.94));
    out.push({
      key: page.key,
      bytes: new Uint8Array(await blob.arrayBuffer()),
      dpi: pageDpi(img, spec),
      hasImage: Boolean(img),
      needsImage: Boolean(page.image),
    });
  }
  // `fontOk` rides along on the array rather than changing the return shape:
  // every caller wants the pages, and only one wants to know the type may be
  // wrong.
  out.fontOk = fontOk;
  return out;
}

/**
 * Fold the rendered pages into printer's sheets.
 *
 * Each half loses its inner bleed — that edge is the fold, nothing is trimmed
 * there, and two full-width halves would print a 6 mm band of doubled artwork
 * down the middle of every spread. The outer bleed stays, because the outer
 * edge really is cut.
 *
 * Pages are decoded back from their JPEGs two at a time rather than kept as
 * canvases: sixteen 4000px canvases is about a gigabyte of bitmap, and the
 * whole point of the per-page loop above is that only one exists at a time.
 */
export async function renderSheets(rendered, spec, dir) {
  const plan = impose(rendered.length, dir);
  if (!plan) return null;
  const { half, cut } = sheetSize(spec);
  const out = [];

  const decode = async (page) => {
    const url = URL.createObjectURL(new Blob([page.bytes], { type: "image/jpeg" }));
    try {
      return { img: await loadImage(url), url };
    } catch {
      URL.revokeObjectURL(url);
      return null;
    }
  };

  for (const leaf of plan) {
    const a = await decode(rendered[leaf.left]);
    const b = await decode(rendered[leaf.right]);
    const S = Math.max(a?.img.naturalHeight ?? 0, b?.img.naturalHeight ?? 0) || 1200;
    const halfPx = Math.round((half / spec.page) * S);
    const cutPx = Math.round((cut / spec.page) * S);

    const canvas = document.createElement("canvas");
    canvas.width = halfPx * 2;
    canvas.height = S;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, S);

    // The left half keeps its left edge and loses its right; the right half is
    // the reverse. Which page is which was already decided by `impose`, which
    // is where the book's direction is applied.
    if (a?.img) {
      const src = a.img;
      const k = src.naturalHeight / S;
      ctx.drawImage(src, 0, 0, src.naturalWidth - cutPx * k, src.naturalHeight, 0, 0, halfPx, S);
    }
    if (b?.img) {
      const src = b.img;
      const k = src.naturalHeight / S;
      ctx.drawImage(
        src,
        cutPx * k,
        0,
        src.naturalWidth - cutPx * k,
        src.naturalHeight,
        halfPx,
        0,
        halfPx,
        S
      );
    }

    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.94));
    out.push({
      key: `sheet-${leaf.sheet}-${leaf.side}`,
      label: `فرخ ${leaf.sheet} — ${leaf.side === "front" ? "وجه" : "ظهر"}`,
      pages: [leaf.left + 1, leaf.right + 1],
      bytes: new Uint8Array(await blob.arrayBuffer()),
    });

    [a, b].forEach((x) => x && URL.revokeObjectURL(x.url));
  }
  return out;
}

// ── The Word file ───────────────────────────────────────────────────────────

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

const NS = [
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"',
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"',
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"',
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"',
  'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"',
].join(" ");

/** One full-bleed page: an anchored picture pinned to the page's own corner. */
function pageXml(index, emuW, emuH) {
  const id = index + 1;
  return `<w:p><w:pPr>${
    index > 0 ? "<w:pageBreakBefore/>" : ""
  }<w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="${id}" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionV><wp:extent cx="${emuW}" cy="${emuH}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="${id}" name="page${id}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="page${id}.jpeg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${emuW}" cy="${emuH}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></w:p>`;
}

/**
 * Assemble the `.docx`.
 *
 * Zero page margins, a square page the exact size of the deliverable, and one
 * anchored picture per page pinned to the page corner — so nothing depends on
 * Word's text flow, and opening the file on any machine shows the same book.
 */
export function buildDocx(rendered, size) {
  const emuW = Math.round(size.width * MM_TO_EMU);
  const emuH = Math.round(size.height * MM_TO_EMU);
  const twipW = Math.round(size.width * MM_TO_TWIP);
  const twipH = Math.round(size.height * MM_TO_TWIP);

  const body = rendered.map((_, i) => pageXml(i, emuW, emuH)).join("");
  const sect = `<w:sectPr><w:pgSz w:w="${twipW}" w:h="${twipH}" w:orient="${
    size.width > size.height ? "landscape" : "portrait"
  }"/><w:pgMar w:top="0" w:right="0" w:bottom="0" w:left="0" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>`;

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document ${NS}><w:body>${body}${sect}</w:body></w:document>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rendered
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/page${
          i + 1
        }.jpeg"/>`
    )
    .join("")}</Relationships>`;

  return zip([
    { name: "[Content_Types].xml", data: CONTENT_TYPES },
    { name: "_rels/.rels", data: ROOT_RELS },
    { name: "word/document.xml", data: document },
    { name: "word/_rels/document.xml.rels", data: rels },
    ...rendered.map((page, i) => ({
      name: `word/media/page${i + 1}.jpeg`,
      data: page.bytes,
    })),
  ]);
}

/** Hand the finished file to the operator. */
export function download(bytes, filename, type) {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // The click is synchronous; the browser has taken the blob by the next tick.
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
