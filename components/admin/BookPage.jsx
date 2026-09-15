"use client";

import { BACK_LOGO_SRC, LAYOUT, VEIL_MAX, sizesFor } from "@/lib/book";

/**
 * One page of the book, at its true printed size.
 *
 * Used three times over: as a thumbnail in the editor, at full size in the
 * print sheet, and — redrawn on a canvas by `lib/docx.js` — as the flattened
 * page inside the Word file. The canvas version cannot share this code, so
 * both read their measurements from `LAYOUT` in `lib/book.js`. **Anything
 * changed here has to change in `paintPage` too.**
 */
export default function BookPage({
  page,
  spec,
  dir,
  image,
  title,
  childName,
  // False when this page is one half of an imposed sheet: the break belongs to
  // the sheet, and leaving it here would paginate between the two halves.
  standalone = true,
}) {
  const side = `${spec.page}mm`;
  const pad = `${spec.safe}mm`;

  const base = {
    width: side,
    height: side,
    position: "relative",
    overflow: "hidden",
    background: LAYOUT.cream,
    breakAfter: standalone ? "page" : "auto",
    breakInside: "avoid",
    // Without this the browser drops every background and the pages come out
    // white. The operator still has to tick "Background graphics".
    printColorAdjust: "exact",
    WebkitPrintColorAdjust: "exact",
  };

  if (page.kind === "blank") return <div style={base} />;

  if (page.kind === "back") {
    return (
      <div style={{ ...base, background: LAYOUT.brandDeep }} dir={dir}>
        <Centre inset={pad}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BACK_LOGO_SRC}
            alt=""
            style={{ width: `${LAYOUT.backLogoMm}mm`, height: "auto" }}
          />
          <span
            style={{
              marginTop: `${LAYOUT.backGapMm}mm`,
              color: LAYOUT.cream,
              fontSize: `${LAYOUT.backWordPt}pt`,
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            {page.wordmark}
          </span>
          <p
            style={{
              marginTop: `${LAYOUT.backGapMm}mm`,
              maxWidth: "150mm",
              color: LAYOUT.cream,
              fontSize: `${LAYOUT.backBodyPt}pt`,
              fontWeight: 600,
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
            }}
          >
            {page.body}
          </p>
        </Centre>
      </div>
    );
  }

  if (page.kind === "title" || page.kind === "note") {
    const st = page.style ?? {};
    const isTitle = page.kind === "title";
    return (
      <div style={{ ...base, background: st.bg ?? LAYOUT.cream }} dir={dir}>
        {/* A background image is optional here and full-bleed when present.
            The band below is what keeps the words legible on top of it — the
            same control the story pages use, for the same reason. */}
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}
        <Block spec={spec} pad={pad} st={st}>
          <span
            style={{
              width: isTitle ? "18mm" : "12mm",
              height: "1.2mm",
              background: page.accent ?? (isTitle ? LAYOUT.gold : LAYOUT.brandDeep),
            }}
          />
          {isTitle ? (
            <>
              <h1
                style={{
                  marginTop: "8mm",
                  color: st.textColor,
                  fontSize: `${LAYOUT.titlePt}pt`,
                  fontWeight: 800,
                  lineHeight: 1.5,
                }}
              >
                {title}
              </h1>
              <p
                style={{
                  marginTop: "6mm",
                  color: st.textColor,
                  opacity: 0.75,
                  fontSize: "13pt",
                  fontWeight: 700,
                }}
              >
                {dir === "ltr"
                  ? `A story made for ${childName}`
                  : `قصة مخصصة لـ ${childName}`}
              </p>
            </>
          ) : (
            <p
              style={{
                marginTop: "8mm",
                color: st.textColor,
                fontSize: `${sizesFor(page.kind)[st.size] ?? sizesFor(page.kind).m}pt`,
                lineHeight: 2,
                maxWidth: "80%",
                whiteSpace: "pre-wrap",
              }}
            >
              {page.body}
            </p>
          )}
        </Block>
      </div>
    );
  }

  const isCover = page.kind === "cover";
  const st = page.style ?? {};
  const place = st.place ?? "bottom";
  const hasText = place !== "hidden" && Boolean(String(page.body ?? "").trim());

  return (
    <div style={base} dir={dir}>
      {image ? (
        // Plain <img>: a local object URL already at print resolution, which
        // next/image would only route through an optimiser that downsamples it.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.url}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f7eee0",
            color: "#8a8580",
            fontSize: "11pt",
          }}
        >
          {page.label}
        </div>
      )}

      {hasText ? <Words page={page} spec={spec} pad={pad} /> : null}
      {page.kind === "story" && page.number != null ? (
        <PageNumber number={page.number} spec={spec} dir={dir} />
      ) : null}
    </div>
  );
}

/** A small modern folio; covers, front matter and production blanks omit it. */
function PageNumber({ number, spec, dir }) {
  const diameter = LAYOUT.folioMm;
  const label =
    dir === "rtl"
      ? new Intl.NumberFormat("ar-JO", { useGrouping: false }).format(number)
      : String(number);

  return (
    <span
      aria-label={`صفحة ${label}`}
      style={{
        position: "absolute",
        zIndex: 2,
        left: "50%",
        bottom: `${Math.max(4, spec.safe - diameter / 2)}mm`,
        width: `${diameter}mm`,
        height: `${diameter}mm`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: "translateX(-50%)",
        borderRadius: "999px",
        background: "rgba(253,248,240,0.86)",
        color: LAYOUT.brandDeep,
        fontSize: `${LAYOUT.folioPt}pt`,
        fontWeight: 800,
        lineHeight: 1,
      }}
    >
      {label}
    </span>
  );
}

/**
 * The words on an illustrated page — the story text, or the cover's title.
 *
 * Four backgrounds, and the difference between two of them is the whole point:
 * a **scrim** fades all the way to flat colour, so the words end up on paint;
 * a **veil** tops out translucent, so the artwork still reads through it. The
 * cover has always used a veil, because a title has to sit *on* the picture
 * rather than on a stripe pasted over it.
 *
 * A scrim only reads as a fade against an edge, so at `center` both it and the
 * veil become a band that fades out on *both* sides instead.
 *
 * `offset` is millimetres down from wherever `place` landed — for the
 * illustration that needs the words a few millimetres clear of a face. It
 * belongs to the words only: the chosen background stays anchored to the
 * page's top, centre or bottom.
 *
 * `paintPage` in `lib/docx.js` draws all of this again on a canvas. Both read
 * their measurements from `LAYOUT`; anything changed here has to change there.
 */
function Words({ page, spec, pad }) {
  const st = page.style;
  const isCover = page.kind === "cover";
  const centred = st.place === "center";
  const top = st.place === "top";
  const colour = st.bandColor;
  const offset = Number(st.offset) || 0;
  const banded = st.band === "scrim" || st.band === "veil";
  const peak = st.band === "veil" ? VEIL_MAX : 1;
  const bandShare = isCover ? LAYOUT.coverScrimShare : LAYOUT.scrimShare;

  const gradient = centred
    ? `linear-gradient(to bottom, ${rgba(colour, 0)} 0%, ${rgba(colour, peak)} 28%, ${rgba(
        colour,
        peak
      )} 72%, ${rgba(colour, 0)} 100%)`
    : st.band === "veil"
      ? `linear-gradient(to ${top ? "bottom" : "top"}, ${rgba(colour, VEIL_MAX)} 0%, ${rgba(
          colour,
          VEIL_MAX * 0.62
        )} 55%, ${rgba(colour, 0)} 100%)`
      : `linear-gradient(to ${top ? "top" : "bottom"}, ${rgba(colour, 0)} 0%, ${rgba(
          colour,
          0.92
        )} 52%, ${colour} ${LAYOUT.scrimSolidAt * 100}%)`;

  return (
    <div
      style={{
        position: "absolute",
        insetInline: 0,
        display: "flex",
        alignItems: top ? "flex-start" : centred ? "center" : "flex-end",
        ...(centred
          ? { top: "50%", transform: "translateY(-50%)" }
          : top
            ? { top: 0 }
            : { bottom: 0 }),
        // **The band wraps the words rather than being a fixed slab behind
        // them**, so it is never shorter than what it has to cover. That is not
        // a nicety: `paintPage` sizes the canvas band as `max(share, block)`,
        // and a fixed share here meant a long page printed one way through the
        // browser and exported another through the `.docx`. A `long` story —
        // seventy words on a page — is exactly where the two came apart.
        ...(banded && !centred ? { minHeight: `${bandShare * 100}%` } : null),
        ...(banded
          ? { background: gradient }
          : st.band === "solid"
            ? { background: colour }
            : null),
        // A fade needs somewhere to happen when there is no page edge to run to.
        ...(banded && centred ? { paddingBlock: `calc(${pad} * 0.6)` } : null),
      }}
    >
      <p
        style={{
          width: "100%",
          padding: pad,
          ...(page.kind === "story" && page.number != null && st.place === "bottom"
            ? { paddingBottom: `calc(${pad} + ${LAYOUT.folioMm + 2}mm)` }
            : null),
          color: st.textColor,
          fontSize: `${sizesFor(page.kind)[st.size] ?? sizesFor(page.kind).m}pt`,
          fontWeight: isCover ? 800 : 400,
          lineHeight: isCover ? 1.45 : LAYOUT.bodyLine,
          textAlign: st.align,
          whiteSpace: "pre-wrap",
          // Move the copy without moving or resizing the colour/gradient
          // behind it. This is the per-page margin the operator controls.
          transform: `translateY(${offset}mm)`,
        }}
      >
        {page.body}
      </p>
    </div>
  );
}

function Block({ spec, pad, st, children }) {
  const centred = st.place === "center" || !st.place;
  const top = st.place === "top";
  const colour = st.bandColor ?? LAYOUT.cream;
  const off = Number(st.offset) || 0;

  const band =
    st.band === "solid"
      ? { background: colour }
      : st.band === "scrim"
        ? {
            background: `linear-gradient(to bottom, ${rgba(colour, 0)} 0%, ${colour} 26%, ${colour} 74%, ${rgba(colour, 0)} 100%)`,
          }
        : null;

  return (
    <div
      style={{
        position: "absolute",
        insetInline: 0,
        padding: `calc(${pad} * ${band ? 1.6 : 1})`,
        textAlign: st.align === "start" ? "start" : "center",
        ...(centred
          ? { top: "50%", transform: "translateY(-50%)" }
          : top
            ? { top: 0 }
            : { bottom: 0 }),
        ...band,
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: st.align === "start" ? "flex-start" : "center",
          transform: `translateY(${off}mm)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Centre({ inset = 0, children }) {
  return (
    <div
      style={{
        position: "absolute",
        inset,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

/** `#rrggbb` at an alpha — a gradient needs a transparent end of its own colour. */
function rgba(hex, alpha) {
  const h = String(hex ?? "#ffffff").replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
