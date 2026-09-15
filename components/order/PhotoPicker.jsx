"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

/**
 * The ceiling, and it is mirrored server-side (`MAX_PHOTOS` in the qissati
 * API's `services/uploads.ts`, which enforces it on the upload route and in
 * the atomic `$push` predicate). Changing it here alone only makes the browser
 * politer — the server is what actually decides.
 */
const MAX_PHOTOS = 3;

/**
 * The reference photos for Template 2 (character sheet).
 *
 * **The files are held here but owned by the form.** They are lifted into
 * `OrderForm` state because the upload happens at submit — after the order
 * exists and the server has minted a ticket for it — so this component cannot
 * be the only thing that knows about them. Nothing is transmitted from here.
 *
 * These are photographs of a child. What happens to them is written down: they
 * are downscaled in the browser before they leave it (see `lib/upload.js`),
 * they go to the qissati UploadThing app and nowhere else, and the dashboard
 * has a "delete the photos" action that removes them from storage for real
 * once a book is delivered.
 *
 * Object URLs are revoked on removal and on unmount; leaking them keeps the
 * decoded images alive for the life of the document, which on a phone is real
 * memory even at three photos.
 *
 * **Unmounting revokes every URL this component made**, which is why the form
 * empties `photos` whenever it hides the picker (answering "no" to the avatar
 * question). Hiding it without clearing would remount later onto an array of
 * already-revoked URLs, and every thumbnail would render broken.
 */
export default function PhotoPicker({ dict, photos, onChange, disabled = false, error = false }) {
  const t = dict.order.photos;
  const [tooMany, setTooMany] = useState(false);
  const inputRef = useRef(null);

  // Every object URL this component has created, so unmount can revoke them
  // all. Written only from event handlers and effects — updating a ref during
  // render is a React Compiler violation, and the state updaters below have to
  // stay pure because StrictMode calls them twice.
  const urlsRef = useRef(new Set());
  useEffect(() => {
    const urls = urlsRef.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  // Anything no longer in `photos` is revoked here rather than only where it
  // was removed. `photos` is a controlled prop now, and the parent clears the
  // whole array in two places — answering "no likeness", and the reset that
  // follows a finished order — neither of which goes through `remove()`. The
  // reset in particular leaves this component *mounted*, so unmount cleanup
  // never runs and the previous child's photographs would stay alive in the
  // page while the next order is filled in.
  useEffect(() => {
    const live = new Set(photos.map((p) => p.url));
    for (const url of urlsRef.current) {
      if (live.has(url)) continue;
      URL.revokeObjectURL(url);
      urlsRef.current.delete(url);
    }
  }, [photos]);

  const addFiles = (fileList) => {
    const seen = new Set(photos.map((p) => p.id));
    const incoming = [...fileList]
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
      }))
      // Picking the same file twice would collide on key and duplicate a
      // reference photo for no benefit.
      .filter((p) => !seen.has(p.id));
    if (!incoming.length) return;

    const room = Math.max(0, MAX_PHOTOS - photos.length);
    setTooMany(incoming.length > room);

    const added = incoming.slice(0, room).map((p) => {
      const url = URL.createObjectURL(p.file);
      urlsRef.current.add(url);
      return { ...p, url };
    });
    if (added.length) onChange([...photos, ...added]);
  };

  // No revoking here: the effect above does it for every photo that leaves the
  // array, wherever the removal came from. Doing it in both places would be two
  // rules to keep in step for one job.
  const remove = (id) => {
    onChange(photos.filter((p) => p.id !== id));
    setTooMany(false);
  };

  // Arabic needs the dual at 2, which a 3–7 range never reached and a 1–3
  // range hits constantly. "2 صور" is ungrammatical the same way "10 صفحة" is.
  const countLabel =
    photos.length === 1
      ? t.selectedOne
      : photos.length === 2
        ? t.selectedTwo
        : t.selectedMany.replace("{n}", String(photos.length));

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-[0.95rem] font-bold text-ink">
          {t.title}
          <span className="text-berry-deep" aria-hidden="true">
            {" "}
            *
          </span>
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t.body}</p>
        {/* Said here rather than in a policy page: this is the screen where a
            parent hands over photographs of their child, so it is the screen
            where they should read what happens to them. */}
        <p className="mt-2 text-sm leading-relaxed text-muted">{t.privacy}</p>
      </div>

      {photos.length ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((p) => (
            <li key={p.id} className="group relative">
              <span className="block aspect-square overflow-hidden rounded-xl border-2 border-brand-deep/70 bg-surface">
                {/* A blob: URL from the user's own file — next/image would only
                    add an optimiser round trip for something never served. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </span>
              <button
                type="button"
                onClick={() => remove(p.id)}
                disabled={disabled}
                aria-label={`${t.remove} — ${p.file.name}`}
                className="absolute -end-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-ink text-cream shadow-soft transition-colors hover:bg-berry-deep"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          id="photos"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || photos.length >= MAX_PHOTOS}
          aria-describedby={error ? "photos-error" : undefined}
          className={`inline-flex items-center gap-2 rounded-full border-2 bg-surface px-5 py-2.5 text-[0.95rem] font-bold text-brand-deep transition-colors hover:border-brand-deep hover:bg-brand-tint disabled:opacity-50 disabled:hover:bg-surface ${
            error ? "border-berry-deep" : "border-brand-deep/80"
          }`}
        >
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          {photos.length ? t.addMore : t.pick}
        </button>
        <span className="text-sm text-muted">
          {photos.length ? countLabel : t.range}
        </span>
      </div>

      {/* The real control. Kept out of the tab order because the styled button
          above triggers it; it carries no label of its own. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          addFiles(e.target.files);
          // Reset so re-picking the same file still fires a change event.
          e.target.value = "";
        }}
        className="sr-only"
      />

      <p
        id="photos-error"
        aria-live="polite"
        className="text-sm font-semibold text-berry-deep"
      >
        {error ? t.required : tooMany ? t.tooMany : ""}
      </p>
    </div>
  );
}
