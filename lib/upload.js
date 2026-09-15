"use client";

import { genUploader } from "uploadthing/client";
import { API_BASE } from "./api";

/**
 * Sending the reference photos.
 *
 * These are photographs of somebody's child, so two things matter more than
 * they would for a generic uploader:
 *
 * - **They go up only after an order exists.** The endpoint is authorised by a
 *   short-lived ticket the server minted for that one order, not by a login
 *   (the parent has no account) and not by nothing at all (which would make it
 *   a free image host for whoever found the URL).
 * - **They are downscaled first.** A modern phone photo is 3–5MB of 12-megapixel
 *   JPEG; the character-reference prompt needs a clear face, not a print
 *   master. Resampling to 1600px long-edge takes a three-photo upload from
 *   ~12MB to ~1MB — which on Jordanian mobile data is the difference between
 *   an upload that finishes and one the parent gives up on — and leaves that
 *   much less of a child's likeness sitting in storage.
 */

/** Long edge, in pixels, after downscaling. Comfortably above face-detail. */
const MAX_EDGE = 1600;
/** JPEG quality. 0.85 is the knee — below it, skin tones start to band. */
const QUALITY = 0.85;
/** Anything already this small is sent untouched; re-encoding would only lose. */
const SKIP_BELOW_BYTES = 400 * 1024;

const uploader = () => {
  if (!API_BASE) return null;
  // `url` is the route handler, not the API root: the qissati sub-app mounts
  // UploadThing at /uploadthing.
  return genUploader({
    url: `${API_BASE}/uploadthing`,
    package: "qissati-order-form",
  });
};

/**
 * Resample one image down to `MAX_EDGE` on its long side.
 *
 * Returns the original file untouched if anything goes wrong — a failed
 * resize must not become a failed order. `imageOrientation: "from-image"`
 * matters: without it, a photo taken in portrait on an iPhone lands sideways
 * in the character sheet, because the rotation lives in EXIF rather than in
 * the pixels.
 */
async function downscale(file) {
  if (!file.type.startsWith("image/") || file.size <= SKIP_BELOW_BYTES) return file;
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return file;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    // Keep a recognisable name — it is what the dashboard shows beside the
    // thumbnail, and "IMG_4821" is how the parent will refer to it.
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  } finally {
    bitmap.close?.();
  }
}

/**
 * Upload the reference photos for an order.
 *
 * `onProgress(fraction)` is called as bytes move, so the review dialog can
 * show something honest instead of an indeterminate spinner while a parent on
 * 3G waits. Resolves `{ ok, uploaded, error }`; a partial upload still counts
 * what landed, because the team can work from four photos and ask for the
 * rest in the chat — losing the whole order over the fifth would be worse.
 */
export async function uploadOrderPhotos(files, ticket, onProgress) {
  if (!files?.length) return { ok: true, uploaded: 0, error: null };

  const ut = uploader();
  if (!ut || !ticket) return { ok: false, uploaded: 0, error: "not-configured" };

  let prepared;
  try {
    prepared = await Promise.all(files.map(downscale));
  } catch {
    prepared = files;
  }

  try {
    const result = await ut.uploadFiles("orderPhoto", {
      files: prepared,
      headers: { Authorization: `Bearer ${ticket}` },
      onUploadProgress: ({ totalProgress }) => {
        onProgress?.(Math.min(1, (totalProgress ?? 0) / 100));
      },
    });
    onProgress?.(1);
    return { ok: true, uploaded: result?.length ?? prepared.length, error: null };
  } catch (err) {
    return { ok: false, uploaded: 0, error: err?.message || "upload-failed" };
  }
}
