import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { inspectIccHeader } from "@/lib/pdfx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_PROFILE_BYTES = 12 * 1024 * 1024;
const DEFAULT_PROFILE_PATH = join(
  process.cwd(),
  "public",
  "print-profiles",
  "Coated_Fogra39L_VIGC_300.icc"
);
let defaultProfilePromise;

/** Keep one immutable profile read in memory per server process. */
function readDefaultProfile() {
  defaultProfilePromise ??= readFile(DEFAULT_PROFILE_PATH);
  return defaultProfilePromise;
}

function jsonError(error, status) {
  return Response.json({ ok: false, error }, { status });
}

/** The local converter is still an admin API and must not become a free CPU endpoint. */
async function authenticated(request) {
  const authorization = request.headers.get("authorization") || "";
  const base = (process.env.NEXT_PUBLIC_QISSATI_API || "").replace(/\/+$/, "");
  if (!base || !authorization.startsWith("Bearer ")) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${base}/auth/me`, {
      headers: { Authorization: authorization },
      cache: "no-store",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Colour-manage one flattened page through the bundled coated-print profile
 * or the printer's optional output-profile override.
 *
 * The source artwork never leaves Qissati's origin and nothing is retained:
 * Sharp/libvips performs the LittleCMS transform, the temporary ICC file is
 * deleted in `finally`, and the CMYK JPEG is returned directly to the browser.
 * The browser assembles the final PDF/X-4 so a whole book is never posted in
 * one oversized serverless request.
 */
export async function POST(request) {
  if (!(await authenticated(request))) return jsonError("unauthorized", 401);

  let form;
  try {
    form = await request.formData();
  } catch {
    return jsonError("invalid-form", 400);
  }

  const image = form.get("image");
  const customProfile = form.get("profile");
  if (!image?.arrayBuffer) return jsonError("missing-image", 400);
  if (
    image.size > MAX_IMAGE_BYTES ||
    (customProfile?.arrayBuffer && customProfile.size > MAX_PROFILE_BYTES)
  ) {
    return jsonError("file-too-large", 413);
  }

  let source;
  let icc;
  try {
    [source, icc] = await Promise.all([
      image.arrayBuffer().then((value) => Buffer.from(value)),
      customProfile?.arrayBuffer
        ? customProfile.arrayBuffer().then((value) => Buffer.from(value))
        : readDefaultProfile(),
    ]);
  } catch {
    return jsonError("profile-unavailable", 500);
  }
  if (!inspectIccHeader(icc).valid) return jsonError("invalid-cmyk-profile", 422);

  const directory = await mkdtemp(join(tmpdir(), "qissati-cmyk-"));
  const profilePath = join(directory, "printer.icc");
  try {
    await writeFile(profilePath, icc);
    const output = await sharp(source)
      .flatten({ background: "#ffffff" })
      // The PDF embeds this once as its ICCBased colour space and output
      // intent; repeating a large profile inside every JPEG only bloats books.
      .withIccProfile(profilePath, { attach: false })
      .jpeg({ quality: 94, chromaSubsampling: "4:4:4", progressive: false })
      .toBuffer();
    const metadata = await sharp(output).metadata();
    if (metadata.space !== "cmyk" || metadata.channels !== 4) {
      return jsonError("conversion-not-cmyk", 422);
    }

    return new Response(output, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(output.length),
        "Cache-Control": "no-store",
        "X-Qissati-Colourspace": "CMYK",
        "X-Qissati-Channels": "4",
      },
    });
  } catch {
    return jsonError("conversion-failed", 422);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
