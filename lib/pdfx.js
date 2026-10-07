/**
 * A tiny PDF/X-4 writer for Qissati's flattened printer pages.
 *
 * The browser already rendered every page into one JPEG, so a general PDF
 * library would add a large client bundle without buying layout features. The
 * only job left here is to place one colour-managed CMYK JPEG on each physical
 * page, embed the printer's CMYK ICC profile, and declare it as the document's
 * output intent.
 */

const PT_PER_MM = 72 / 25.4;
const encoder = new TextEncoder();

const bytes = (value) =>
  value instanceof Uint8Array ? value : new Uint8Array(value ?? 0);

function join(parts) {
  const size = parts.reduce((total, part) => total + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  parts.forEach((part) => {
    out.set(part, offset);
    offset += part.length;
  });
  return out;
}

function text(value) {
  return encoder.encode(String(value));
}

function pdfDate(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `D:${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
    date.getUTCDate()
  )}${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

/** A PDF hex string in UTF-16BE, safe for Arabic and profile filenames. */
function pdfString(value) {
  const source = String(value ?? "");
  let hex = "feff";
  for (let i = 0; i < source.length; i += 1) {
    hex += source.charCodeAt(i).toString(16).padStart(4, "0");
  }
  return `<${hex}>`;
}

function xml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function stream(dictionary, data) {
  const payload = bytes(data);
  return join([
    text(`<< ${dictionary} /Length ${payload.length} >>\nstream\n`),
    payload,
    text("\nendstream"),
  ]);
}

function fourCc(source, offset) {
  return String.fromCharCode(...source.slice(offset, offset + 4));
}

/**
 * Inspect only the fixed ICC header. No profile is accepted merely because its
 * filename ends in `.icc`: a printer output profile must identify itself as a
 * CMYK output-device profile and carry the ICC `acsp` signature.
 */
export function inspectIccHeader(input) {
  const source = bytes(input);
  if (source.length < 128) return { valid: false, reason: "short" };
  const signature = fourCc(source, 36);
  const colourSpace = fourCc(source, 16).trim();
  const deviceClass = fourCc(source, 12).trim();
  return {
    valid: signature === "acsp" && colourSpace === "CMYK" && deviceClass === "prtr",
    signature,
    colourSpace,
    deviceClass,
    reason:
      signature !== "acsp"
        ? "signature"
        : colourSpace !== "CMYK"
          ? "colour-space"
          : deviceClass !== "prtr"
            ? "device-class"
            : "",
  };
}

export async function inspectIccFile(file) {
  if (!file?.slice) return { valid: false, reason: "missing" };
  return inspectIccHeader(await file.slice(0, 128).arrayBuffer());
}

function documentId(seed) {
  // A stable, non-security hash is enough for PDF's document identifier.
  let a = 0x811c9dc5;
  let b = 0x9e3779b9;
  for (const char of String(seed)) {
    const code = char.charCodeAt(0);
    a = Math.imul(a ^ code, 0x01000193) >>> 0;
    b = Math.imul(b ^ code, 0x85ebca6b) >>> 0;
  }
  return [a, b, a ^ 0xa5a5a5a5, b ^ 0x5a5a5a5a]
    .map((value) => (value >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

/**
 * Build a flattened PDF/X-4 file.
 *
 * `pages[].bytes` must already be a four-channel CMYK JPEG transformed through
 * `iccProfile`. Re-labelling an RGB JPEG as CMYK here would create a corrupt
 * colour contract, so conversion happens first on the server with LittleCMS.
 */
export function buildPdfx4({
  pages,
  size,
  trimInset = 0,
  iccProfile,
  profileName,
  title,
  language = "ar-JO",
}) {
  const profile = bytes(iccProfile);
  const profileHeader = inspectIccHeader(profile);
  if (!profileHeader.valid) throw new Error("invalid-cmyk-output-profile");
  if (!Array.isArray(pages) || pages.length === 0) throw new Error("missing-pages");
  if (!(Number(size?.width) > 0) || !(Number(size?.height) > 0)) {
    throw new Error("invalid-page-size");
  }

  const now = new Date();
  const docTitle = String(title || "Qissati printer file");
  const outputCondition = String(profileName || "Printer CMYK profile");
  const width = Number(size.width) * PT_PER_MM;
  const height = Number(size.height) * PT_PER_MM;
  const inset = Math.max(0, Number(trimInset) || 0) * PT_PER_MM;
  const trim = [inset, inset, width - inset, height - inset]
    .map((value) => value.toFixed(4))
    .join(" ");
  const media = `0 0 ${width.toFixed(4)} ${height.toFixed(4)}`;

  // Fixed document objects; every physical page then uses three objects:
  // Page dictionary, CMYK JPEG XObject, and its one-line drawing stream.
  const CATALOG = 1;
  const PAGES = 2;
  const INFO = 3;
  const METADATA = 4;
  const ICC = 5;
  const OUTPUT_INTENT = 6;
  const objects = new Array(7 + pages.length * 3);
  const pageRefs = [];

  pages.forEach((page, index) => {
    const pageObject = 7 + index * 3;
    const imageObject = pageObject + 1;
    const contentObject = pageObject + 2;
    const image = bytes(page.bytes);
    if (!image.length || !(Number(page.width) > 0) || !(Number(page.height) > 0)) {
      throw new Error(`invalid-page-${index + 1}`);
    }

    pageRefs.push(`${pageObject} 0 R`);
    objects[pageObject] = text(
      `<< /Type /Page /Parent ${PAGES} 0 R /MediaBox [${media}] /CropBox [${media}] ` +
        `/BleedBox [${media}] /TrimBox [${trim}] /Resources << /XObject << /Im${index} ${imageObject} 0 R >> >> ` +
        `/Contents ${contentObject} 0 R >>`
    );
    // libjpeg CMYK samples use Adobe's inverted convention, hence Decode 1→0.
    objects[imageObject] = stream(
      `/Type /XObject /Subtype /Image /Width ${Math.round(page.width)} /Height ${Math.round(
        page.height
      )} /ColorSpace [/ICCBased ${ICC} 0 R] /BitsPerComponent 8 /Filter /DCTDecode ` +
        "/Decode [1 0 1 0 1 0 1 0] /Interpolate false",
      image
    );
    objects[contentObject] = stream(
      "",
      text(`q\n${width.toFixed(4)} 0 0 ${height.toFixed(4)} 0 0 cm\n/Im${index} Do\nQ\n`)
    );
  });

  const xmp = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:pdf="http://ns.adobe.com/pdf/1.3/" xmlns:pdfxid="http://www.npes.org/pdfx/ns/id/" xmlns:xmp="http://ns.adobe.com/xap/1.0/">
      <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${xml(docTitle)}</rdf:li></rdf:Alt></dc:title>
      <pdf:Producer>Qissati PDF/X-4 exporter</pdf:Producer>
      <pdfxid:GTS_PDFXVersion>PDF/X-4</pdfxid:GTS_PDFXVersion>
      <xmp:CreateDate>${now.toISOString()}</xmp:CreateDate>
      <xmp:ModifyDate>${now.toISOString()}</xmp:ModifyDate>
      <xmp:MetadataDate>${now.toISOString()}</xmp:MetadataDate>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

  objects[CATALOG] = text(
    `<< /Type /Catalog /Pages ${PAGES} 0 R /Metadata ${METADATA} 0 R /OutputIntents [${OUTPUT_INTENT} 0 R] ` +
      `/Lang ${pdfString(language)} /ViewerPreferences << /DisplayDocTitle true >> >>`
  );
  objects[PAGES] = text(`<< /Type /Pages /Count ${pages.length} /Kids [${pageRefs.join(" ")}] >>`);
  objects[INFO] = text(
    `<< /Title ${pdfString(docTitle)} /Producer ${pdfString("Qissati PDF/X-4 exporter")} ` +
      `/CreationDate (${pdfDate(now)}) /ModDate (${pdfDate(now)}) ` +
      "/GTS_PDFXVersion (PDF/X-4) /Trapped /False >>"
  );
  objects[METADATA] = stream("/Type /Metadata /Subtype /XML", text(xmp));
  objects[ICC] = stream("/N 4 /Alternate /DeviceCMYK", profile);
  objects[OUTPUT_INTENT] = text(
    `<< /Type /OutputIntent /S /GTS_PDFX /OutputConditionIdentifier ${pdfString(
      outputCondition
    )} /Info ${pdfString(outputCondition)} /RegistryName (http://www.color.org) ` +
      `/DestOutputProfile ${ICC} 0 R >>`
  );

  const header = join([text("%PDF-1.6\n%"), new Uint8Array([0xe2, 0xe3, 0xcf, 0xd3]), text("\n")]);
  const chunks = [header];
  const offsets = new Array(objects.length).fill(0);
  let offset = header.length;

  for (let object = 1; object < objects.length; object += 1) {
    if (!objects[object]) throw new Error(`missing-object-${object}`);
    offsets[object] = offset;
    const chunk = join([
      text(`${object} 0 obj\n`),
      objects[object],
      text("\nendobj\n"),
    ]);
    chunks.push(chunk);
    offset += chunk.length;
  }

  const xrefOffset = offset;
  const xref = ["xref", `0 ${objects.length}`, "0000000000 65535 f "];
  for (let object = 1; object < objects.length; object += 1) {
    xref.push(`${String(offsets[object]).padStart(10, "0")} 00000 n `);
  }
  const id = documentId(`${docTitle}|${outputCondition}|${now.toISOString()}`);
  const trailer =
    `${xref.join("\n")}\ntrailer\n<< /Size ${objects.length} /Root ${CATALOG} 0 R ` +
    `/Info ${INFO} 0 R /ID [<${id}> <${id}>] >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  chunks.push(text(trailer));
  return join(chunks);
}

