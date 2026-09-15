/**
 * A parent-facing approval PDF for the story text, generated in the browser.
 *
 * This is deliberately separate from the finished-book PDF. It contains only
 * what a parent is being asked to approve: the title, story summary,
 * dedication and page-by-page copy. Character briefs, illustration prompts,
 * customer contact data and internal notes never enter this file.
 *
 * Arabic is painted through the browser's canvas so shaping and tashkeel are
 * preserved. Each A4 page is embedded as a JPEG in a small PDF writer below;
 * that avoids a large PDF dependency and, unlike placing raw Arabic strings in
 * a PDF content stream, does not require us to implement font subsetting and
 * bidirectional text shaping ourselves.
 */

const CANVAS = { width: 1240, height: 1754 };
const PDF_PAGE = { width: 595.276, height: 841.89 };
const COLOR = {
  cream: "#f7f1e3",
  surface: "#fffdf7",
  ink: "#26231f",
  muted: "#665f58",
  teal: "#146466",
  tealDeep: "#0d4547",
  gold: "#c99a35",
  berry: "#9e3150",
};

const COPY = {
  rtl: {
    brand: "قِصَّتِي",
    proof: "نُسْخَةُ مُرَاجَعَةِ الْقِصَّةِ",
    summary: "مُلَخَّصُ الْقِصَّةِ",
    dedication: "الْإِهْدَاءُ",
    review: "لِلْمُرَاجَعَةِ وَالِاعْتِمَادِ",
    reviewBody:
      "هٰذِهِ نُسْخَةٌ لِمُرَاجَعَةِ نَصِّ الْقِصَّةِ فَقَطْ. سَيَبْدَأُ تَصْمِيمُ الرُّسُومِ بَعْدَ مُوَافَقَتِكُمْ.",
    response:
      "يُرْجَى الْمُوَافَقَةُ عَلَى هٰذِهِ النُّسْخَةِ، أَوْ إِرْسَالُ التَّعْدِيلَاتِ مَجْمُوعَةً فِي رِسَالَةٍ وَاحِدَةٍ.",
    page: "صَفْحَة",
    reference: "رَقْمُ الطَّلَبِ",
    proofCode: "رَمْزُ النُّسْخَةِ",
  },
  ltr: {
    brand: "QISSATI",
    proof: "STORY APPROVAL PROOF",
    summary: "STORY SUMMARY",
    dedication: "DEDICATION",
    review: "FOR REVIEW AND APPROVAL",
    reviewBody:
      "This proof is for reviewing the story text only. Illustration and final design begin after your approval.",
    response:
      "Please approve this exact version, or send all requested changes together in one message.",
    page: "PAGE",
    reference: "ORDER",
    proofCode: "PROOF",
  },
};

const encoder = new TextEncoder();
const ascii = (value) => encoder.encode(value);

function joinBytes(parts) {
  const size = parts.reduce((total, part) => total + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** The dashboard's resolved next/font family, including its generated name. */
function fontStack() {
  if (typeof window === "undefined") return "sans-serif";
  return getComputedStyle(document.body).fontFamily || "sans-serif";
}

/** Load both weights used in the proof before canvas silently substitutes. */
async function ensureFont(family) {
  if (typeof document === "undefined" || !document.fonts) return true;
  const first = family.split(",")[0].trim().replace(/^["']|["']$/g, "");
  try {
    await Promise.all([
      document.fonts.load(`400 80px "${first}"`),
      document.fonts.load(`800 80px "${first}"`),
    ]);
    await document.fonts.ready;
    return document.fonts.check(`400 80px "${first}"`);
  } catch {
    return false;
  }
}

function canvasPage() {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS.width;
  canvas.height = CANVAS.height;
  return canvas;
}

function setType(ctx, family, size, weight = 400) {
  ctx.font = `${weight} ${size}px ${family}`;
}

/** Wrap on words so Arabic letters and their combining marks are never split. */
function wrapText(ctx, text, maxWidth) {
  const lines = [];
  for (const paragraph of String(text ?? "").split("\n")) {
    const words = paragraph.split(/\s+/u).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (!line || ctx.measureText(candidate).width <= maxWidth) line = candidate;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

function drawLines(ctx, lines, { x, y, lineHeight, align, dir, color }) {
  ctx.save();
  ctx.direction = dir;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = color;
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  ctx.restore();
  return y + lines.length * lineHeight;
}

function fittedLines(ctx, text, family, maxWidth, maxLines, startSize, minSize, weight) {
  let size = startSize;
  let lines = [];
  while (size >= minSize) {
    setType(ctx, family, size, weight);
    lines = wrapText(ctx, text, maxWidth);
    if (lines.length <= maxLines) break;
    size -= 2;
  }
  return { lines, size };
}

function edge(dir, margin = 108) {
  return dir === "rtl" ? CANVAS.width - margin : margin;
}

function align(dir) {
  return dir === "rtl" ? "right" : "left";
}

function arabicDigits(value) {
  return String(value).replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
}

function shownNumber(value, dir) {
  return dir === "rtl" ? arabicDigits(value) : String(value);
}

function paintFooter(ctx, family, dir, copy, reference, proofId) {
  ctx.strokeStyle = COLOR.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(108, 1652);
  ctx.lineTo(CANVAS.width - 108, 1652);
  ctx.stroke();

  setType(ctx, family, 23, 600);
  drawLines(ctx, [`${copy.reference}: ${reference}`], {
    x: edge(dir),
    y: 1697,
    lineHeight: 30,
    align: align(dir),
    dir,
    color: COLOR.muted,
  });
  drawLines(ctx, [`${copy.proofCode}: ${proofId}`], {
    x: edge(dir === "rtl" ? "ltr" : "rtl"),
    y: 1697,
    lineHeight: 30,
    align: align(dir === "rtl" ? "ltr" : "rtl"),
    dir: "ltr",
    color: COLOR.muted,
  });
}

function paintCover({ story, family, dir, copy, reference, proofId }) {
  const canvas = canvasPage();
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = COLOR.tealDeep;
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

  ctx.fillStyle = COLOR.gold;
  ctx.fillRect(0, 0, CANVAS.width, 18);

  setType(ctx, family, 42, 800);
  drawLines(ctx, [copy.brand], {
    x: CANVAS.width / 2,
    y: 155,
    lineHeight: 50,
    align: "center",
    dir,
    color: COLOR.cream,
  });

  setType(ctx, family, 25, 700);
  drawLines(ctx, [copy.proof], {
    x: CANVAS.width / 2,
    y: 245,
    lineHeight: 34,
    align: "center",
    dir,
    color: COLOR.gold,
  });

  ctx.strokeStyle = COLOR.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(300, 300);
  ctx.lineTo(CANVAS.width - 300, 300);
  ctx.stroke();

  const title = fittedLines(ctx, story.title, family, 920, 5, 72, 46, 800);
  setType(ctx, family, title.size, 800);
  const titleHeight = title.lines.length * (title.size * 1.35);
  drawLines(ctx, title.lines, {
    x: CANVAS.width / 2,
    y: 610 - titleHeight / 2,
    lineHeight: title.size * 1.35,
    align: "center",
    dir,
    color: COLOR.cream,
  });

  ctx.fillStyle = COLOR.cream;
  ctx.fillRect(108, 1125, CANVAS.width - 216, 2);

  setType(ctx, family, 28, 700);
  drawLines(ctx, [copy.review], {
    x: CANVAS.width / 2,
    y: 1205,
    lineHeight: 38,
    align: "center",
    dir,
    color: COLOR.gold,
  });

  setType(ctx, family, 26, 400);
  drawLines(ctx, wrapText(ctx, copy.reviewBody, 880), {
    x: CANVAS.width / 2,
    y: 1270,
    lineHeight: 45,
    align: "center",
    dir,
    color: COLOR.cream,
  });

  setType(ctx, family, 23, 600);
  drawLines(ctx, [`${copy.reference}: ${reference}`, `${copy.proofCode}: ${proofId}`], {
    x: CANVAS.width / 2,
    y: 1515,
    lineHeight: 44,
    align: "center",
    dir,
    color: COLOR.cream,
  });
  return canvas;
}

function paintSummary({ story, family, dir, copy, reference, proofId }) {
  const canvas = canvasPage();
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = COLOR.cream;
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

  setType(ctx, family, 24, 800);
  drawLines(ctx, [copy.brand], {
    x: edge(dir),
    y: 110,
    lineHeight: 32,
    align: align(dir),
    dir,
    color: COLOR.teal,
  });
  ctx.fillStyle = COLOR.gold;
  ctx.fillRect(108, 145, CANVAS.width - 216, 4);

  setType(ctx, family, 31, 800);
  drawLines(ctx, [copy.summary], {
    x: edge(dir),
    y: 245,
    lineHeight: 42,
    align: align(dir),
    dir,
    color: COLOR.berry,
  });

  const summary = fittedLines(ctx, story.summary, family, 1024, 13, 36, 28, 400);
  setType(ctx, family, summary.size, 400);
  const summaryEnd = drawLines(ctx, summary.lines, {
    x: edge(dir),
    y: 320,
    lineHeight: summary.size * 1.65,
    align: align(dir),
    dir,
    color: COLOR.ink,
  });

  const dedicationY = Math.max(920, summaryEnd + 95);
  ctx.strokeStyle = COLOR.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(108, dedicationY - 42);
  ctx.lineTo(CANVAS.width - 108, dedicationY - 42);
  ctx.stroke();

  setType(ctx, family, 31, 800);
  drawLines(ctx, [copy.dedication], {
    x: edge(dir),
    y: dedicationY,
    lineHeight: 42,
    align: align(dir),
    dir,
    color: COLOR.berry,
  });
  setType(ctx, family, 35, 600);
  drawLines(ctx, wrapText(ctx, story.dedication, 1024), {
    x: edge(dir),
    y: dedicationY + 78,
    lineHeight: 58,
    align: align(dir),
    dir,
    color: COLOR.tealDeep,
  });

  setType(ctx, family, 25, 400);
  drawLines(ctx, wrapText(ctx, copy.response, 1024), {
    x: edge(dir),
    y: 1480,
    lineHeight: 43,
    align: align(dir),
    dir,
    color: COLOR.muted,
  });
  paintFooter(ctx, family, dir, copy, reference, proofId);
  return canvas;
}

function paintStoryPage({ story, page, family, dir, copy, reference, proofId }) {
  const canvas = canvasPage();
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = COLOR.surface;
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

  setType(ctx, family, 22, 700);
  drawLines(ctx, [story.title], {
    x: edge(dir),
    y: 105,
    lineHeight: 30,
    align: align(dir),
    dir,
    color: COLOR.teal,
  });
  ctx.fillStyle = COLOR.gold;
  ctx.fillRect(108, 142, CANVAS.width - 216, 4);

  setType(ctx, family, 30, 800);
  drawLines(ctx, [`${copy.page} ${shownNumber(page.page_number, dir)}`], {
    x: edge(dir),
    y: 245,
    lineHeight: 42,
    align: align(dir),
    dir,
    color: COLOR.berry,
  });

  const body = fittedLines(ctx, page.text, family, 1024, 18, 46, 32, 500);
  setType(ctx, family, body.size, 500);
  const lineHeight = body.size * 1.7;
  const textHeight = body.lines.length * lineHeight;
  const startY = Math.max(420, 880 - textHeight / 2);
  drawLines(ctx, body.lines, {
    x: edge(dir),
    y: startY,
    lineHeight,
    align: align(dir),
    dir,
    color: COLOR.ink,
  });

  paintFooter(ctx, family, dir, copy, reference, proofId);
  return canvas;
}

function jpegBytes(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("jpeg"));
          return;
        }
        resolve(new Uint8Array(await blob.arrayBuffer()));
      },
      "image/jpeg",
      0.92
    );
  });
}

/** A tiny image-only PDF writer; every text page is already shaped on canvas. */
function imagePdf(images) {
  const objects = [];
  const pageIds = images.map((_, index) => 5 + index * 3);
  objects.push({ id: 1, parts: [ascii("<< /Type /Catalog /Pages 2 0 R >>")] });
  objects.push({
    id: 2,
    parts: [
      ascii(
        `<< /Type /Pages /Count ${images.length} /Kids [${pageIds
          .map((id) => `${id} 0 R`)
          .join(" ")}] >>`
      ),
    ],
  });

  images.forEach((image, index) => {
    const imageId = 3 + index * 3;
    const contentId = imageId + 1;
    const pageId = imageId + 2;
    const imageName = `Im${index + 1}`;
    const command = `q ${PDF_PAGE.width} 0 0 ${PDF_PAGE.height} 0 0 cm /${imageName} Do Q\n`;
    objects.push({
      id: imageId,
      parts: [
        ascii(
          `<< /Type /XObject /Subtype /Image /Width ${CANVAS.width} /Height ${CANVAS.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`
        ),
        image,
        ascii("\nendstream"),
      ],
    });
    objects.push({
      id: contentId,
      parts: [
        ascii(`<< /Length ${ascii(command).length} >>\nstream\n${command}endstream`),
      ],
    });
    objects.push({
      id: pageId,
      parts: [
        ascii(
          `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE.width} ${PDF_PAGE.height}] /Resources << /XObject << /${imageName} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`
        ),
      ],
    });
  });

  objects.sort((a, b) => a.id - b.id);
  const chunks = [ascii("%PDF-1.4\n%QISSATI\n")];
  const offsets = [0];
  let size = chunks[0].length;
  for (const object of objects) {
    offsets[object.id] = size;
    const start = ascii(`${object.id} 0 obj\n`);
    const end = ascii("\nendobj\n");
    chunks.push(start, ...object.parts, end);
    size += start.length + object.parts.reduce((sum, part) => sum + part.length, 0) + end.length;
  }

  const xrefOffset = size;
  const xref = ["xref", `0 ${objects.length + 1}`, "0000000000 65535 f "];
  for (let id = 1; id <= objects.length; id += 1) {
    xref.push(`${String(offsets[id]).padStart(10, "0")} 00000 n `);
  }
  xref.push(
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
    ""
  );
  chunks.push(ascii(xref.join("\n")));
  return joinBytes(chunks);
}

/** Stable identity for exactly the parent-facing words in one proof. */
export function storyProofId(story) {
  const parentText = JSON.stringify({
    title: story?.title ?? "",
    summary: story?.summary ?? "",
    dedication: story?.dedication ?? "",
    pages: (story?.pages ?? []).map((page) => page?.text ?? ""),
  });
  let hash = 2166136261;
  for (let index = 0; index < parentText.length; index += 1) {
    hash ^= parentText.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `SP-${(hash >>> 0).toString(16).toUpperCase().padStart(8, "0")}`;
}

export function storyProofFilename(order, proofId) {
  const reference = String(order?.reference ?? "story").replace(/[^a-zA-Z0-9_-]/g, "-");
  return `${reference}-story-approval-${proofId}.pdf`;
}

/** Build the complete approval proof without sending any story data anywhere. */
export async function buildStoryApprovalPdf(order, story) {
  if (typeof document === "undefined") throw new Error("browser");
  const dir = order?.story?.language === "english" ? "ltr" : "rtl";
  const copy = COPY[dir];
  const reference = String(order?.reference ?? "—");
  const proofId = storyProofId(story);
  const family = fontStack();
  const fontOk = await ensureFont(family);
  const images = [];
  // Encode immediately so only one ~9 MB canvas is alive at a time. A
  // twelve-page story plus cover and summary should not cost the dashboard
  // more than 100 MB of uncompressed bitmap memory just to make a proof.
  images.push(
    await jpegBytes(paintCover({ story, family, dir, copy, reference, proofId }))
  );
  images.push(
    await jpegBytes(paintSummary({ story, family, dir, copy, reference, proofId }))
  );
  for (const page of story?.pages ?? []) {
    images.push(
      await jpegBytes(
        paintStoryPage({ story, page, family, dir, copy, reference, proofId })
      )
    );
  }
  return { bytes: imagePdf(images), proofId, fontOk };
}

/** Trigger the browser's ordinary file download for a generated proof. */
export function downloadStoryApprovalPdf(bytes, filename) {
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
