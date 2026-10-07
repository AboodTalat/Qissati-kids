"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp, Download, ImagePlus, Printer } from "lucide-react";
import { AdminButton, Notice, Panel } from "./AdminUi";
import BookPage from "./BookPage";
import {
  ALIGNS,
  ALIGN_LABEL,
  BANDS,
  BAND_LABEL,
  BAND_SWATCHES,
  BOOK_FONTS,
  DEFAULT_BOOK_FONT,
  fontFor,
  styleFor,
  PLACEMENTS,
  PLACEMENT_LABEL,
  SIZE_LABEL,
  SPEC,
  sizesFor,
  TEXT_SWATCHES,
  buildPages,
  padForSaddleStitch,
  loadEdits,
  reorder,
  saveEdits,
  sheetSize,
  impose,
} from "@/lib/book";
import { buildDocx, download, renderBook, renderSheets } from "@/lib/docx";
import { loadArtwork, removeArtwork, saveArtwork } from "@/lib/book-artwork";
import { buildPdfx4, inspectIccFile } from "@/lib/pdfx";

const DEFAULT_CMYK_PROFILE = {
  name: "Coated_Fogra39L_VIGC_300.icc",
  label: "FOGRA39 Coated 300%",
  url: "/print-profiles/Coated_Fogra39L_VIGC_300.icc",
};

/**
 * Where the book actually gets made.
 *
 * The panel above it produces prompts; this is the other half — drop each
 * generated illustration into its page, fix the words on it, and press one
 * button for the file. It replaced assembling every book by hand in Word,
 * which had two silent failure modes: Word re-compresses images to 220 ppi
 * when it saves, and a hand-made saddle-stitch imposition cannot compensate
 * for creep. Both are gone; the printer gets reading-order pages and imposes
 * them itself.
 *
 * **The text is editable, and that is the point.** Gemini's wording always
 * needs small fixes — a phrase that reads awkwardly, a line too long for the
 * page, a change the parent asked for after seeing a draft — and the only
 * alternative was hand-editing the JSON and re-pasting it.
 *
 * **The source illustrations are never uploaded or persisted on the server.**
 * Selected files are copied into browser-local IndexedDB and read back as
 * object URLs. A CMYK export sends one already-flattened page at a time to this
 * same origin for its ICC transform; the route returns it immediately and
 * retains neither the page nor the printer profile.
 */

const DEFAULT_EDITS = {
  text: {},
  style: {},
  order: null,
  direction: "auto",
  pageNumbers: true,
  font: DEFAULT_BOOK_FONT,
  front: { title: true, dedication: true },
};

/** Below this, warn the operator; 300 DPI remains the preferred print standard. */
const MIN_DPI = 300;

const FINAL_REVIEW_ITEMS = [
  { id: "copy", label: "قرأنا كل النصوص والأسماء والإهداء وكلمة الهدية بصوت عالٍ." },
  { id: "art", label: "الشخصيات واللبس ثابتين، وما في نص أو علامة مائية داخل الرسمات." },
  { id: "layout", label: "الوجوه والأيدي والتفاصيل المهمة بعيدة عن النص وحواف القص." },
  { id: "order", label: "ترتيب الصفحات ونوع الملف وصفحات المقدمة كلهم صح." },
];

/** Recognise the local production names; provider filenames carry no order. */
function productionFileOrder(file) {
  const name = String(file?.name ?? "").toLowerCase();
  if (/^cover(?:[-_. ]|$)/.test(name)) return 0;
  const page = /^page[-_ ]?(\d+)/.exec(name);
  return page ? Number(page[1]) : null;
}

/** Load the bundled standard profile once, only when a printer export starts. */
async function loadDefaultIccProfile() {
  const response = await fetch(DEFAULT_CMYK_PROFILE.url, { cache: "force-cache" });
  if (!response.ok) throw new Error("default-cmyk-profile");
  const file = new File([await response.blob()], DEFAULT_CMYK_PROFILE.name, {
    type: "application/vnd.iccprofile",
  });
  const profile = await inspectIccFile(file);
  if (!profile.valid) throw new Error("default-cmyk-profile");
  return file;
}

/** Transform one flattened RGB page without posting the whole book at once. */
async function convertPageToCmyk(page, customProfile, token) {
  const form = new FormData();
  form.append(
    "image",
    new Blob([page.bytes], { type: "image/jpeg" }),
    `${page.key || "page"}.jpeg`
  );
  // The route owns the bundled default profile, so it is not re-uploaded for
  // every page. A partner override still travels only with its conversion.
  if (customProfile) {
    form.append("profile", customProfile, customProfile.name || "printer.icc");
  }
  const response = await fetch("/admin/cmyk-page", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("cmyk-conversion");
  if (
    response.headers.get("x-qissati-colourspace") !== "CMYK" ||
    response.headers.get("x-qissati-channels") !== "4"
  ) {
    throw new Error("cmyk-verification");
  }
  return {
    ...page,
    bytes: new Uint8Array(await response.arrayBuffer()),
  };
}

export default function BookStudio({ order, story, token }) {
  const reference = order?.reference ?? "";
  const [mode, setMode] = useState(order?.book?.format === "print" ? "print" : "pdf");
  const [edits, setEdits] = useState(DEFAULT_EDITS);
  const [hydrated, setHydrated] = useState(false);
  const [slots, setSlots] = useState({});
  const [host, setHost] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [iccProfile, setIccProfile] = useState(null);
  const [cmykProgress, setCmykProgress] = useState("");
  // Imposed sheets rather than single pages, because Qissati's print partner
  // asks for them. Off by default: most shops impose themselves and do it
  // better, since a RIP compensates for creep and this cannot.
  const [spreads, setSpreads] = useState(false);
  const [finalChecks, setFinalChecks] = useState({});

  // Every object URL minted here, revoked in one place when the panel goes
  // away. Replacing an image deliberately leaves the old URL in the list
  // rather than revoking on the spot: a revoke races an <img> still painting
  // it, and the cost of holding one is a pointer until unmount.
  const urlsRef = useRef([]);
  useEffect(() => {
    const urls = urlsRef.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  // Restore browser-local artwork for this order. Current in-memory choices
  // win if a slow IndexedDB read finishes after the operator selects a file.
  useEffect(() => {
    let live = true;
    const minted = [];
    loadArtwork(reference).then((entries) => {
      if (!live) return;
      const restored = {};
      entries.forEach((entry) => {
        if (!(entry?.blob instanceof Blob) || !entry.key) return;
        const url = URL.createObjectURL(entry.blob);
        minted.push(url);
        urlsRef.current.push(url);
        restored[entry.key] = {
          url,
          name: entry.name || `${entry.key}.png`,
          w: Number(entry.w) || 0,
          h: Number(entry.h) || 0,
        };
      });
      setSlots((current) => ({ ...restored, ...current }));
    });
    return () => {
      live = false;
      minted.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [reference]);

  // Restore the operator's edits. Resolved through a promise because a
  // synchronous setState in an effect body is a React Compiler violation.
  useEffect(() => {
    const stored = loadEdits(reference);
    let live = true;
    Promise.resolve().then(() => {
      if (!live) return;
      if (stored) setEdits({ ...DEFAULT_EDITS, ...stored });
      setHydrated(true);
    });
    return () => {
      live = false;
    };
  }, [reference]);

  // ...and keep them. Gated on `hydrated`, or the first render would write the
  // empty default over an hour of real work before the load came back.
  useEffect(() => {
    if (hydrated) saveEdits(reference, edits);
  }, [hydrated, reference, edits]);

  // A print target that is a direct child of <body>, so the print stylesheet
  // can hide its siblings.
  useEffect(() => {
    const el = document.createElement("div");
    el.setAttribute("data-book-print", "");
    document.body.appendChild(el);
    let live = true;
    Promise.resolve().then(() => {
      if (live) setHost(el);
    });
    return () => {
      live = false;
      el.remove();
    };
  }, []);

  const spec = SPEC[mode];
  const { pages, childName, title, dir } = buildPages(order, story, edits);
  const fontProfile = fontFor(edits.font);
  // Blank halves are a property of saddle-stitch imposition, not of the book's
  // reading order. Keeping this separate prevents two unexplained empty ending
  // pages in ordinary print PDF/Word files such as Q-000007.
  const exportPages =
    mode === "print" && spreads ? padForSaddleStitch(pages) : pages;
  const saddleBlankCount = exportPages.length - pages.length;
  // The bulk-fill sequence is the cover and the story pages only. A background
  // added to the title page is picked from that page's own control; letting it
  // into this list would shift every story illustration by one.
  const imagePages = pages.filter((p) => p.image);
  const filled = imagePages.filter((p) => slots[p.key]).length;
  const storyCount = story?.pages?.length ?? 0;
  const sequence =
    Array.isArray(edits.order) && edits.order.length === storyCount
      ? edits.order
      : Array.from({ length: storyCount }, (_, i) => i);

  const worstDpi = imagePages.reduce((worst, page) => {
    const s = slots[page.key];
    if (!s?.w || !s?.h) return worst;
    return Math.min(worst, Math.round(Math.min(s.w, s.h) / (spec.page / 25.4)));
  }, Infinity);

  const finalReviewItems =
    mode === "print"
      ? [
          ...FINAL_REVIEW_ITEMS,
          { id: "proof", label: "الأهل وافقوا على نسخة الـ PDF النهائية قبل الطباعة." },
        ]
      : FINAL_REVIEW_ITEMS;
  const imagesReady = imagePages.length > 0 && filled === imagePages.length;
  const dimensionsReady =
    imagesReady && imagePages.every((page) => slots[page.key]?.w && slots[page.key]?.h);
  const hasLowDpi =
    dimensionsReady && Number.isFinite(worstDpi) && worstDpi < MIN_DPI;
  const finalReviewReady = finalReviewItems.every((item) => finalChecks[item.id]);
  // Resolution is advisory: all artwork must be present and measurable, but a
  // deliberate low-DPI export is allowed after the normal human review.
  const exportReady = dimensionsReady && finalReviewReady;

  const setText = (key, value) => {
    setFinalChecks({});
    setEdits((p) => ({ ...p, text: { ...p.text, [key]: value } }));
  };
  const setStyle = (key, kind, patch) => {
    setFinalChecks({});
    setEdits((p) => ({
      ...p,
      style: {
        ...p.style,
        [key]: { ...styleFor(kind), ...(p.style[key] ?? {}), ...patch },
      },
    }));
  };
  const move = (position, delta) => {
    setFinalChecks({});
    setEdits((p) => ({ ...p, order: reorder(sequence, position, delta) }));
  };

  /**
   * Push one page's look onto every other story page.
   *
   * Twelve pages set one control at a time is the drudgery this panel exists
   * to remove, and a book whose pages are styled differently by accident is
   * worse than one styled plainly on purpose.
   */
  const applyStyleToAll = (from) => {
    const source = pages.find((p) => p.key === from)?.style;
    if (!source) return;
    setFinalChecks({});
    setEdits((p) => {
      const style = { ...p.style };
      pages.filter((x) => x.kind === "story").forEach((x) => {
        style[x.key] = { ...source };
      });
      return { ...p, style };
    });
    setNotice("انطبّق التنسيق على كل صفحات القصة.");
    window.setTimeout(() => setNotice(""), 2600);
  };

  /** Take dropped or picked files into slots, starting at `startKey`. */
  const take = (fileList, startKey) => {
    // Approved production names (`cover`, `page-01`...) win when every selected
    // file follows them, which keeps a regenerated page in its real slot. Raw
    // Nano Banana names carry no order, so an unrenamed batch falls back to
    // download time — running prompts top to bottom still works for a first pass.
    const files = [...(fileList ?? [])].filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    const named = files.every((file) => productionFileOrder(file) !== null);
    files.sort((a, b) =>
      named
        ? productionFileOrder(a) - productionFileOrder(b)
        : (a.lastModified ?? 0) - (b.lastModified ?? 0) ||
          a.name.localeCompare(b.name, undefined, { numeric: true })
    );
    setFinalChecks({});

    const keys = imagePages.map((p) => p.key);
    const inSequence = startKey ? keys.indexOf(startKey) : 0;
    const next = {};
    const measure = [];

    // A page outside the sequence (a front-matter background) takes exactly one
    // file into itself and spills into nothing.
    const targets =
      inSequence === -1
        ? [startKey]
        : keys.slice(Math.max(0, inSequence));

    files.forEach((file, i) => {
      const key = targets[i];
      if (!key) return;
      const url = URL.createObjectURL(file);
      urlsRef.current.push(url);
      next[key] = { url, name: file.name };
      measure.push([key, url, file]);
    });
    setSlots((prev) => ({ ...prev, ...next }));

    // Dimensions decide the printed resolution, which is the one thing about
    // an illustration the operator cannot see by looking at it.
    measure.forEach(([key, url, file]) => {
      const img = new Image();
      img.onload = () => {
        setSlots((prev) =>
          prev[key]?.url === url
            ? { ...prev, [key]: { ...prev[key], w: img.naturalWidth, h: img.naturalHeight } }
            : prev
        );
        void saveArtwork(reference, key, file, {
          w: img.naturalWidth,
          h: img.naturalHeight,
        }).then((saved) => {
          if (!saved) {
            setError(
              "الرسمات محمّلة بهاي الجلسة، بس المتصفح ما سمح نحفظها محلياً للرجعة الجاية."
            );
          }
        });
      };
      img.src = url;
    });
  };

  /** Drop a front-matter background. The object URL is revoked at unmount. */
  const clearImage = (key) => {
    setFinalChecks({});
    void removeArtwork(reference, key);
    setSlots((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const chooseIccProfile = async (file) => {
    setError("");
    setNotice("");
    setIccProfile(null);
    if (!file) return;
    try {
      const profile = await inspectIccFile(file);
      if (!profile.valid) {
        setError(
          "هذا مش بروفايل إخراج CMYK صالح. اطلبوا من المطبعة ملف ICC أو ICM من نوع CMYK Output Profile."
        );
        return;
      }
      setIccProfile(file);
      setNotice(`تم اعتماد بروفايل المطبعة: ${file.name}`);
    } catch {
      setError("ما قدرنا نقرأ بروفايل الألوان. جرّبوا ملف ICC أو ICM ثاني من المطبعة.");
    }
  };

  const exportDocx = async () => {
    if (!exportReady) return;
    setBusy("docx");
    setError("");
    try {
      const rendered = await renderBook({
        pages: exportPages,
        images: slots,
        spec,
        dir,
        title,
        childName,
        fontProfile,
      });

      const imposed = spreads ? await renderSheets(rendered, spec, dir) : null;
      if (spreads && !imposed) {
        setError("عدد الصفحات لازم يكون من مضاعفات ٤ عشان تنطلع أفرخ. بدّلوا لملف الطباعة.");
        setBusy("");
        return;
      }
      if (rendered.fontOk === false) {
        // Not fatal — the file is still a book — but the type in it is not the
        // type that was approved on screen, and nothing else would say so.
        setError(
          `تحذير: خط ${fontProfile.label} ما انحمّل، فنص الملف انرسم بخط ثاني. حدّثوا الصفحة ونزّلوه من جديد.`
        );
      }
      const size = imposed
        ? sheetSize(spec)
        : { width: spec.page, height: spec.page };
      const bytes = buildDocx(imposed ?? rendered, size);
      download(
        bytes,
        `${reference || "book"}-${imposed ? "sheets" : mode}.docx`,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
    } catch {
      setError("ما قدرنا نبني ملف الوورد. تأكدوا إنه كل الرسمات محمّلة وجربوا كمان مرة.");
    }
    setBusy("");
  };

  /**
   * The printer deliverable: flattened pages transformed through the bundled
   * coated-print profile (or a partner override) and wrapped in PDF/X-4.
   */
  const exportCmykPdf = async () => {
    if (!exportReady || mode !== "print") return;
    setBusy("cmyk");
    setCmykProgress("");
    setError("");
    setNotice("");
    try {
      const profileFile = iccProfile ?? (await loadDefaultIccProfile());
      const rendered = await renderBook({
        pages: exportPages,
        images: slots,
        spec,
        dir,
        title,
        childName,
        fontProfile,
      });
      const imposed = spreads ? await renderSheets(rendered, spec, dir) : null;
      if (spreads && !imposed) throw new Error("imposition");
      const source = imposed ?? rendered;
      const converted = [];
      for (let index = 0; index < source.length; index += 1) {
        setCmykProgress(`${index + 1}/${source.length}`);
        // `null` tells the server route to use the same bundled profile loaded
        // above. Only a partner override must be sent with the page.
        converted.push(await convertPageToCmyk(source[index], iccProfile, token));
      }

      const profileBytes = new Uint8Array(await profileFile.arrayBuffer());
      const size = imposed ? sheetSize(spec) : { width: spec.page, height: spec.page };
      const pdf = buildPdfx4({
        pages: converted,
        size,
        // An imposed sheet is already the physical media. Reading-order pages
        // keep the 3mm inset as their explicit PDF TrimBox.
        trimInset: imposed ? 0 : spec.bleed,
        iccProfile: profileBytes,
        profileName: iccProfile?.name || DEFAULT_CMYK_PROFILE.label,
        title: `${reference || "Qissati"} printer file`,
        language: dir === "rtl" ? "ar-JO" : "en",
      });
      download(
        pdf,
        `${reference || "book"}-${imposed ? "sheets-" : ""}printer-cmyk-pdfx4.pdf`,
        "application/pdf"
      );
      setNotice(
        `نزل ملف المطبعة PDF/X-4 بألوان CMYK وبروفايل ${
          iccProfile ? "المطبعة" : "الطباعة القياسي التلقائي"
        } مضمّن داخله.`
      );
      if (rendered.fontOk === false) {
        setError(
          `تحذير: خط ${fontProfile.label} ما انحمّل، فنص ملف المطبعة انرسم بخط ثاني. حدّثوا الصفحة وصدّروه من جديد.`
        );
      }
    } catch {
      setError(
        "ما قدرنا نبني ملف CMYK. تأكدوا من اكتمال الرسمات واتصال الصفحة، وجربوا كمان مرة."
      );
    } finally {
      setBusy("");
      setCmykProgress("");
    }
  };

  // When the printer wants sheets, the PDF has to be sheets too. A toggle that
  // silently changed only the Word file would hand someone single pages from
  // the button right next to it.
  const plan = spreads && mode === "print" ? impose(exportPages.length, dir) : null;
  const paper = plan ? sheetSize(spec) : { width: spec.page, height: spec.page };

  const sheet = (
    <>
      <style>{`
        @page { size: ${paper.width}mm ${paper.height}mm; margin: 0; }
        [data-book-print] { display: none; }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          /* One subtree paginates; everything else goes. Not visibility:hidden
             — that leaves the hidden layout occupying real pages, so the PDF
             opens on a run of blanks. */
          body > *:not([data-book-print]) { display: none !important; }
          [data-book-print] { display: block !important; }
        }
      `}</style>
      {plan
        ? plan.map((leaf) => (
            <Spread
              key={`${leaf.sheet}-${leaf.side}`}
              leaf={leaf}
              pages={exportPages}
              spec={spec}
              dir={dir}
              slots={slots}
              title={title}
              childName={childName}
              fontProfile={fontProfile}
            />
          ))
        : pages.map((page) => (
            <BookPage
              key={page.key}
              page={page}
              spec={spec}
              dir={dir}
              image={slots[page.key]}
              title={title}
              childName={childName}
              fontProfile={fontProfile}
            />
          ))}
    </>
  );

  if (!story) {
    return (
      <Panel title="الكتاب">
        <p className="text-sm leading-loose text-muted">
          ألصقوا رد Gemini بلوحة البرومبتات فوق، وبينبنى الكتاب من هون.
        </p>
      </Panel>
    );
  }

  return (
    <Panel title="الكتاب">
      {/* ── What we are making ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {["pdf", "print"].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setFinalChecks({});
            }}
            aria-current={mode === m ? "true" : undefined}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors ${
              mode === m
                ? "border-brand-deep bg-brand-deep text-cream"
                : "border-brand-deep/25 text-brand-deep hover:bg-brand-tint"
            }`}
          >
            {m === "pdf" ? "نسخة PDF للأهل" : "ملف الطباعة"}
          </button>
        ))}
        <span className="text-sm text-muted">
          {spec.page} × {spec.page} مم · {pages.length} صفحة
          {spec.bleed ? ` · حواف قص ${spec.bleed} مم` : " · بلا حواف قص"}
        </span>
      </div>

      {mode === "print" ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted">شكل ملف الطباعة:</span>
            {[
              { v: false, label: "صفحات مفردة" },
              { v: true, label: "أفرخ للتدبيس" },
            ].map((o) => (
              <button
                key={String(o.v)}
                type="button"
                aria-pressed={spreads === o.v}
                onClick={() => {
                  setSpreads(o.v);
                  setFinalChecks({});
                }}
                className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors ${
                  spreads === o.v
                    ? "border-brand-deep bg-brand-deep text-cream"
                    : "border-brand-deep/25 text-brand-deep hover:bg-brand-tint"
                }`}
              >
                {o.label}
              </button>
            ))}
            {spreads ? (
              <span className="text-sm tabular-nums text-muted">
                {Math.round(sheetSize(spec).width)} × {Math.round(sheetSize(spec).height)} مم ·{" "}
                {exportPages.length / 4} فرخ
                {saddleBlankCount ? ` · ${saddleBlankCount} أنصاف فاضية للتدبيس` : ""}
              </span>
            ) : null}
          </div>
          <div className="mt-4 border-s-[3px] border-berry-deep ps-5">
            <p className="text-[0.95rem] font-bold leading-loose text-berry-deep">
              ملف CMYK للمطبعة صار تلقائي — ما لازم تختاروا ICC كل مرة.
            </p>
            <p className="mt-1 text-sm leading-loose text-ink">
              زر المطبعة يستعمل تلقائياً بروفايل قياسي للورق المطلي، يحوّل الصفحات إلى
              CMYK ويبني PDF/X-4 جاهز للتنزيل. ملف المراجعة من المتصفح يظل RGB.
            </p>
            <p className="mt-1 text-sm leading-loose text-muted">
              الافتراضي: {DEFAULT_CMYK_PROFILE.label}. إذا أعطتكم المطبعة بروفايلها
              الخاص، اختاروه تحت ليحل محل الافتراضي ويعطي تطابق أدق مع ورقهم وماكينتهم.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-berry-deep/70 bg-surface px-4 py-2 text-sm font-bold text-berry-deep transition-colors hover:bg-berry-tint">
                اختياري: استبدلوا ببروفايل المطبعة
                <input
                  type="file"
                  accept=".icc,.icm,application/vnd.iccprofile,application/octet-stream"
                  className="sr-only"
                  onChange={(event) => void chooseIccProfile(event.target.files?.[0])}
                />
              </label>
              <span className="text-sm text-muted">
                {iccProfile
                  ? `مخصص: ${iccProfile.name}`
                  : `تلقائي: ${DEFAULT_CMYK_PROFILE.label}`}
              </span>
              {iccProfile ? (
                <button
                  type="button"
                  className="min-h-[24px] py-1 text-sm font-bold text-brand-deep underline underline-offset-4"
                  onClick={() => {
                    setIccProfile(null);
                    setError("");
                    setNotice("رجعنا للبروفايل القياسي التلقائي.");
                  }}
                >
                  ارجعوا للتلقائي
                </button>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">صفحات المقدمة:</span>
        {[
          { key: "title", label: "صفحة العنوان" },
          { key: "dedication", label: "الإهداء" },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={edits.front[f.key]}
            onClick={() => {
              setFinalChecks({});
              setEdits((p) => ({
                ...p,
                front: { ...p.front, [f.key]: !p.front[f.key] },
              }));
            }}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors ${
              edits.front[f.key]
                ? "border-gold bg-gold/20 text-ink"
                : "border-ink/20 text-muted hover:border-ink/40"
            }`}
          >
            {edits.front[f.key] ? "✓ " : ""}
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">اتجاه الكتاب:</span>
        {[
          { v: "auto", label: `تلقائي — ${dir === "rtl" ? "عربي RTL" : "English LTR"}` },
          { v: "rtl", label: "عربي — RTL" },
          { v: "ltr", label: "English — LTR" },
        ].map((option) => (
          <button
            key={option.v}
            type="button"
            aria-pressed={(edits.direction ?? "auto") === option.v}
            onClick={() => {
              setFinalChecks({});
              setEdits((current) => ({ ...current, direction: option.v }));
            }}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors ${
              (edits.direction ?? "auto") === option.v
                ? "border-brand-deep bg-brand-deep text-cream"
                : "border-brand-deep/25 text-brand-deep hover:bg-brand-tint"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">أرقام الصفحات:</span>
        {[
          { v: true, label: "إظهار" },
          { v: false, label: "إخفاء" },
        ].map((option) => (
          <button
            key={String(option.v)}
            type="button"
            aria-pressed={(edits.pageNumbers ?? true) === option.v}
            onClick={() => {
              setFinalChecks({});
              setEdits((current) => ({ ...current, pageNumbers: option.v }));
            }}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors ${
              (edits.pageNumbers ?? true) === option.v
                ? "border-brand-deep bg-brand-deep text-cream"
                : "border-brand-deep/25 text-brand-deep hover:bg-brand-tint"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm text-muted">خط نص الكتاب:</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {BOOK_FONTS.map((font) => {
            const selected = fontProfile.value === font.value;
            return (
              <button
                key={font.value}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setFinalChecks({});
                  setEdits((current) => ({ ...current, font: font.value }));
                }}
                className={`rounded-xl border-2 px-4 py-3 text-start transition-colors ${
                  selected
                    ? "border-brand-deep bg-brand-tint text-brand-deep"
                    : "border-ink/15 bg-surface text-ink hover:border-brand-deep/50"
                }`}
              >
                <span className="block text-xs font-bold">{font.label}</span>
                <span
                  lang="ar"
                  dir="rtl"
                  style={{ fontFamily: font.family, lineHeight: font.bodyLine }}
                  className="mt-1 block text-xl"
                >
                  نَصٌّ عَرَبِيٌّ مُشَكَّلٌ
                </span>
                <span className="mt-1 block text-xs text-muted">{font.note}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          الاختيار يطبّق على المعاينة وملف Word معاً. التباعد الرأسي مضبوط لكل خط حتى
          ما تتزاحم الحركات بين السطور.
        </p>
      </fieldset>

      {mode === "print" && spreads ? (
        <>
          <p className="mt-4 text-sm leading-loose text-muted">
            كل فرخ فيه صفحتين جنب بعض بترتيب التدبيس، والكعب عاليمين لأن الكتاب عربي.
            الحافة اللي عند الطية بتنشال من كل نص عشان ما تتكرر الرسمة بالوسط.
          </p>
          <p className="mt-2 text-sm font-bold leading-loose text-brand-deep">
            {dir === "rtl"
              ? "للتأكد: أول وجه بالملف لازم يكون فيه الغلاف الأمامي عاليسار والغلاف الخلفي عاليمين."
              : "للتأكد: أول وجه بالملف لازم يكون فيه الغلاف الخلفي عاليسار والغلاف الأمامي عاليمين."}
          </p>
          {/* The single instruction the whole imposition depends on. The page
              order is only correct if the press turns the sheet about its
              vertical axis; a long-edge flip lands every back upside down, and
              nothing in the file itself can say which was used. */}
          <div className="mt-4 border-s-[3px] border-berry-deep ps-5">
            <p className="text-[0.95rem] font-bold leading-loose text-berry-deep">
              قولوا للمطبعة: طباعة وجهين مع القلب على الحافة القصيرة (short-edge / قلب
              عمودي).
            </p>
            <p className="mt-2 text-sm leading-loose text-ink">
              إذا قلبوا على الحافة الطويلة بتطلع كل الوجوه الخلفية مقلوبة، وترتيب الصفحات
              بينخرب — والملف نفسه ما بيقدر يقول لهم أي قلب استعملوا.
            </p>
            <p className="mt-2 text-sm font-bold leading-loose text-ink">
              الملف مفروض وجاهز: لا تختاروا Booklet أو فرض كتيّب مرة ثانية بالمطبعة.
              اطبعوه Actual size / 100%، وجهين، مع short-edge flip.
            </p>
            <p className="mt-2 text-sm leading-loose text-muted">
              والتوزيع اليدوي ما بيعوّض زحف الورق: بكتاب ١٢ أو ١٦ صفحة الفرق أقل من
              ملّي، بس إذا كبر الكتاب خلّوا المطبعة توزّع بنفسها.
            </p>
          </div>
        </>
      ) : null}

      <p className="mt-4 text-sm leading-loose text-muted">
        {mode === "print"
          ? spreads
            ? "الصفحة أكبر من المقاس النهائي بـ ٣ مم من كل جهة. أنصاف الورق الفارغة المطلوبة لمضاعف ٤ بتنضاف داخل أفرخ التدبيس فقط، والغلاف الخلفي بضل آخر صفحة فعلية."
            : "الصفحة أكبر من المقاس النهائي بـ ٣ مم من كل جهة، والرسمة بتطلع لبرا هالحد لأنه بينقص. الملف بترتيب القراءة وبنتهي مباشرة بالغلاف الخلفي، بلا صفحات فاضية مضافة."
          : "هاي النسخة اللي بتوصل للأهل: مقاس نهائي بلا حواف قص وبلا صفحات فاضية."}
      </p>

      {/* ── Load the illustrations ─────────────────────────────────────── */}
      <div className="mt-7 flex flex-wrap items-center gap-4 border-t-2 border-ink/10 pt-6">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-brand-deep/80 bg-surface px-4 py-2 text-sm font-bold text-brand-deep transition-colors hover:bg-brand-tint">
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          حمّلوا كل الرسمات
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => take(e.target.files)}
          />
        </label>
        <span className="text-sm text-muted">
          {filled} من {imagePages.length} — إذا الأسماء cover وpage-01 بنرتبهم بالاسم؛
          غير هيك بترتيب التنزيل. أي وحدة بمحلها الغلط بدّلوها لحالها من تحت.
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {filled > 0 && filled < imagePages.length ? (
          <Notice tone="error">
            لسا في {imagePages.length - filled} رسمة ناقصة.
          </Notice>
        ) : null}
        {hasLowDpi ? (
          <Notice>
            أوضح رسمة عندنا بتطلع {worstDpi} نقطة بالإنش على مقاس {spec.page} مم، والمطبعة
            بتفضّل {MIN_DPI}. الأفضل تنزّلوا النسخة الكبيرة (4K)، بس التصدير مسموح إذا
            بدكم تكملوا بهاي الرسمة.
          </Notice>
        ) : null}
        <Notice tone="error">{error}</Notice>
        <Notice tone="success">{notice}</Notice>
      </div>

      {/* ── The pages ──────────────────────────────────────────────────── */}
      <ul className="mt-6 border-t-2 border-ink/10">
        {pages.map((page) => (
          <PageRow
            key={page.key}
            page={page}
            spec={spec}
            dir={dir}
            image={slots[page.key]}
            title={title}
            childName={childName}
            fontProfile={fontProfile}
            onImage={(files) => take(files, page.key)}
            onText={(v) => setText(page.key, v)}
            onStyle={(patch) => setStyle(page.key, page.kind, patch)}
            onApplyAll={() => applyStyleToAll(page.key)}
            onClearImage={() => clearImage(page.key)}
            onMove={page.kind === "story" ? (d) => move(page.position, d) : null}
            canMoveUp={page.kind === "story" && page.position > 0}
            canMoveDown={page.kind === "story" && page.position < storyCount - 1}
          />
        ))}
      </ul>

      {/* ── Out ────────────────────────────────────────────────────────── */}
      <div className="mt-8 border-t-2 border-ink/10 pt-6">
        <h3 className="text-base font-extrabold text-ink">مراجعة ما قبل التصدير</h3>
        <p className="mt-1.5 text-sm leading-loose text-muted">
          التصدير بينفتح بعد اكتمال الرسمات وقراءة أبعادها ومراجعة النسخة الحالية. الدقة
          الأقل من {MIN_DPI} بتظهر كتنبيه وما بتمنع التصدير.
        </p>

        <fieldset className="mt-4 flex flex-col gap-3">
          <legend className="sr-only">قائمة مراجعة الكتاب النهائية</legend>
          {finalReviewItems.map((item) => (
            <label
              key={item.id}
              className="flex min-h-[24px] cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink"
            >
              <input
                type="checkbox"
                checked={Boolean(finalChecks[item.id])}
                onChange={(e) =>
                  setFinalChecks((current) => ({
                    ...current,
                    [item.id]: e.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 shrink-0 accent-brand-deep"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </fieldset>

        <div className="mt-4 flex flex-col gap-3">
          {!imagesReady ? (
            <Notice tone="error">حمّلوا الغلاف وكل رسمات الصفحات قبل التصدير.</Notice>
          ) : !dimensionsReady ? (
            <Notice>استنوا لحظة لحد ما نقرأ دقة كل الرسمات.</Notice>
          ) : finalReviewReady ? (
            <Notice tone="success">النسخة جاهزة للتصدير.</Notice>
          ) : (
            <Notice>كمّلوا كل نقاط المراجعة عشان تنفتح أزرار التصدير.</Notice>
          )}
          {hasLowDpi ? (
            <Notice>
              في رسمة دقتها أقل من {MIN_DPI} DPI. التصدير مسموح، بس ممكن تبين أنعم
              بالطباعة.
            </Notice>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4 border-t-2 border-ink/10 pt-6">
        <AdminButton
          onClick={() => {
            if (exportReady) window.print();
          }}
          disabled={Boolean(busy) || !exportReady}
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          {mode === "pdf" ? "احفظوا PDF للأهل" : "احفظوا PDF للمراجعة (RGB)"}
        </AdminButton>
        {mode === "print" ? (
          <AdminButton
            onClick={exportCmykPdf}
            disabled={Boolean(busy) || !exportReady}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {busy === "cmyk"
              ? `عم نبني ملف CMYK${cmykProgress ? ` ${cmykProgress}` : "…"}`
              : "نزّلوا PDF/X-4 CMYK للمطبعة"}
          </AdminButton>
        ) : null}
        <AdminButton
          variant="outline"
          onClick={exportDocx}
          disabled={Boolean(busy) || !exportReady}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {busy === "docx" ? "عم نبني الملف…" : "نزّلوا ملف Word"}
        </AdminButton>
      </div>

      <div className="mt-5 border-s-[3px] border-gold ps-5">
        <p className="text-[0.95rem] leading-loose text-ink">
          بمربع الطباعة بالمتصفح: الوجهة <strong>Save as PDF</strong>، الهوامش{" "}
          <strong>None</strong>، و<strong>Background graphics</strong> لازم تكون مفعّلة —
          بدونها بتطلع الصفحات بيضا بلا رسمات.
          {mode === "print"
            ? " هاي نسخة RGB للتحضير والمراجعة فقط. زر CMYK الثاني ما بفتح مربع الطباعة؛ بنزّل ملف المطبعة مباشرة بالبروفايل التلقائي أو ببروفايل المطبعة إذا اخترتوه."
            : ""}
        </p>
        {mode === "print" ? (
          <p className="mt-3 text-[0.95rem] leading-loose text-ink">
            ملف المطبعة هو <strong>PDF/X-4</strong>، وكل صفحة فيه صورة CMYK مسطّحة مع
            بروفايل ICC مضمّن وTrimBox على مقاس القص. الافتراضي قياسي للورق المطلي؛
            بروفايل المطبعة يظل الأدق إذا وفّروه. ابعثوه كما هو ولا تعملوا عليه تحويل ألوان
            ثاني.
          </p>
        ) : null}
        <p className="mt-3 text-[0.95rem] leading-loose text-ink">
          ملف الـ Word كل صفحة فيه صورة وحدة جاهزة بأعلى دقة، عشان ما يعتمد على خطوط
          مركّبة عند المطبعة. <strong>ابعثوه زي ما هو</strong> — إذا فتحتوه بالوورد وحفظتوه
          من جديد، الوورد بيضغط الصور لـ ٢٢٠ نقطة بالإنش وبتخرب.
        </p>
        <p className="mt-3 text-sm leading-loose text-muted">
          التعديلات والرسمات بتنحفظ محلياً بهالمتصفح لكل طلب لحاله، وبتترجع لما
          تفتحوا الطلب من نفس الجهاز. ملفات الإنتاج المسمّاة بتضل النسخة الأساسية عندكم.
        </p>
      </div>

      {host ? createPortal(sheet, host) : null}
    </Panel>
  );
}

/**
 * One page in the editor: what it looks like, what it says, and where.
 *
 * The preview is the real `BookPage` shrunk with a transform rather than a
 * separate small rendering, so what the operator approves is what prints.
 */
function PageRow({
  page,
  spec,
  dir,
  image,
  title,
  childName,
  fontProfile,
  onImage,
  onText,
  onStyle,
  onApplyAll,
  onClearImage,
  onMove,
  canMoveUp,
  canMoveDown,
}) {
  // Big enough to judge. At 116px the words on a page were a grey smudge and
  // the whole point of a preview — seeing whether the text sits somewhere
  // readable on *this* illustration — was unanswerable.
  const box = 208;
  const scale = box / (spec.page * (96 / 25.4));
  // The cover's box is the book's title, and the title page follows it.
  const editable =
    page.kind === "story" ||
    page.kind === "note" ||
    page.kind === "cover" ||
    page.kind === "back";
  // The title, gift and dedication pages. They take a background — a colour or
  // an image — and the same text controls as a story page.
  const frontMatter = page.kind === "title" || page.kind === "note";
  const styled = page.kind === "story" || page.kind === "cover" || frontMatter;
  const st = page.style ?? {};

  return (
    <li className="grid gap-4 border-b border-ink/10 py-5 sm:grid-cols-[auto_1fr]">
      <div dir="ltr" className="w-[208px]">
        <div
          style={{ width: box, height: box, overflow: "hidden" }}
          className="rounded-xl border-2 border-brand-deep/25 bg-surface"
        >
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <BookPage
              page={page}
              spec={spec}
              dir={dir}
              image={image}
              title={title}
              childName={childName}
              fontProfile={fontProfile}
            />
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[0.95rem] font-bold text-ink">{page.label}</span>

          {page.image || frontMatter ? (
            <label className="inline-flex min-h-[24px] cursor-pointer items-center py-1 text-sm font-bold text-brand-deep underline underline-offset-4 hover:text-brand">
              {frontMatter
                ? image
                  ? "بدّلوا الخلفية"
                  : "خلفية صورة"
                : image
                  ? "بدّلوا الرسمة"
                  : "حمّلوا رسمة"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => onImage(e.target.files)}
              />
            </label>
          ) : null}

          {image?.w ? (
            <span className="text-xs tabular-nums text-muted">
              {image.w}×{image.h}
            </span>
          ) : null}

          {frontMatter && image ? (
            <button
              type="button"
              onClick={onClearImage}
              className="text-xs font-bold text-berry-deep underline underline-offset-4"
            >
              شيلوا الخلفية
            </button>
          ) : null}

          {onMove ? (
            <span className="flex items-center gap-1">
              <IconButton label="فوق" disabled={!canMoveUp} onClick={() => onMove(-1)}>
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              </IconButton>
              <IconButton label="تحت" disabled={!canMoveDown} onClick={() => onMove(1)}>
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            </span>
          ) : null}
        </div>

        {page.kind === "cover" ? (
          <p className="mt-3 text-xs leading-relaxed text-muted">
            هذا عنوان الكتاب — بينحط على الغلاف وعلى صفحة العنوان مع بعض.
          </p>
        ) : null}

        {page.kind === "back" ? (
          <p className="mt-3 text-xs leading-relaxed text-muted">
            شعار قصتي ثابت، والنص تحته قابل للتعديل للعميل. النص الافتراضي يشرح شو هي
            قصتي ومخصّص باسم الطفل.
          </p>
        ) : null}

        {editable ? (
          <textarea
            rows={page.kind === "back" ? 5 : 2}
            value={page.body ?? ""}
            onChange={(e) => onText(e.target.value)}
            aria-label={
              page.kind === "cover"
                ? "عنوان الكتاب"
                : page.kind === "back"
                  ? "نص الغلاف الخلفي"
                  : `نص ${page.label}`
            }
            className="control-text mt-3 w-full rounded-xl border-2 border-brand-deep/25 bg-surface px-4 py-2.5 leading-loose text-ink outline-none transition-colors focus:border-brand-deep"
          />
        ) : null}

        {styled ? (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">مكان النص:</span>
              {PLACEMENTS.filter(
                (p) => !((frontMatter || page.kind === "cover") && p === "hidden")
              ).map((p) => (
                <Pill key={p} on={st.place === p} onClick={() => onStyle({ place: p })}>
                  {PLACEMENT_LABEL[p]}
                </Pill>
              ))}
            </div>

            {st.place !== "hidden" ? (
              <details className="mt-2 group">
                <summary className="inline-flex min-h-[24px] cursor-pointer list-none items-center py-1 text-xs font-bold text-brand-deep underline underline-offset-4">
                  <span className="group-open:hidden">تنسيق النص</span>
                  <span className="hidden group-open:inline">إخفاء التنسيق</span>
                </summary>

                <div className="mt-3 flex flex-col gap-3 border-s-2 border-ink/10 ps-4">
                  {frontMatter && !image ? (
                    <Control label="لون الصفحة">
                      {BAND_SWATCHES.map((c) => (
                        <Swatch
                          key={c.value}
                          colour={c.value}
                          label={c.label}
                          on={st.bg === c.value}
                          onClick={() => onStyle({ bg: c.value })}
                        />
                      ))}
                    </Control>
                  ) : null}

                  <Control label="خلف النص">
                    {BANDS.map((b) => (
                      <Pill key={b} on={st.band === b} onClick={() => onStyle({ band: b })}>
                        {BAND_LABEL[b]}
                      </Pill>
                    ))}
                  </Control>

                  {st.band !== "none" ? (
                    <Control label="لون الخلفية">
                      {BAND_SWATCHES.map((c) => (
                        <Swatch
                          key={c.value}
                          colour={c.value}
                          label={c.label}
                          on={st.bandColor === c.value}
                          onClick={() => onStyle({ bandColor: c.value })}
                        />
                      ))}
                    </Control>
                  ) : null}

                  <Control label="لون الخط">
                    {TEXT_SWATCHES.map((c) => (
                      <Swatch
                        key={c.value}
                        colour={c.value}
                        label={c.label}
                        on={st.textColor === c.value}
                        onClick={() => onStyle({ textColor: c.value })}
                      />
                    ))}
                  </Control>

                  <Control label="إزاحة النص">
                    <Nudge
                      value={Number(st.offset) || 0}
                      onChange={(v) => onStyle({ offset: v })}
                    />
                  </Control>

                  <Control label="حجم الخط">
                    {Object.keys(sizesFor(page.kind)).map((k) => (
                      <Pill key={k} on={st.size === k} onClick={() => onStyle({ size: k })}>
                        {SIZE_LABEL[k]}
                      </Pill>
                    ))}
                  </Control>

                  <Control label="محاذاة">
                    {ALIGNS.map((a) => (
                      <Pill key={a} on={st.align === a} onClick={() => onStyle({ align: a })}>
                        {ALIGN_LABEL[a]}
                      </Pill>
                    ))}
                  </Control>

                  {page.kind === "story" ? (
                    <div>
                      <button
                        type="button"
                        onClick={onApplyAll}
                        className="text-xs font-bold text-brand-deep underline underline-offset-4 hover:text-brand"
                      >
                        طبّقوا هذا التنسيق على كل صفحات القصة
                      </button>
                    </div>
                  ) : null}
                </div>
              </details>
            ) : null}
          </>
        ) : null}
      </div>
    </li>
  );
}

/**
 * One printer's sheet: two pages side by side, each with its inner bleed
 * clipped off at the fold.
 *
 * `dir="ltr"` on the row is not a mistake — `impose` already decided which page
 * belongs on the physical left, so the flex order must not be flipped again by
 * the dashboard's RTL. Each page keeps its own direction inside.
 */
function Spread({ leaf, pages, spec, dir, slots, title, childName, fontProfile }) {
  const { half } = sheetSize(spec);
  return (
    <div
      dir="ltr"
      style={{
        width: `${half * 2}mm`,
        height: `${spec.page}mm`,
        display: "flex",
        overflow: "hidden",
        background: "#ffffff",
        breakAfter: "page",
        breakInside: "avoid",
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
      }}
    >
      {["left", "right"].map((side) => {
        const page = pages[leaf[side]];
        return (
          <div
            key={side}
            style={{
              width: `${half}mm`,
              height: `${spec.page}mm`,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* The left half keeps its left edge and loses its right; the right
                half is the reverse. What overflows is the bleed at the fold. */}
            <div style={{ position: "absolute", top: 0, [side]: 0 }}>
              {page ? (
                <BookPage
                  page={page}
                  spec={spec}
                  dir={dir}
                  image={slots[page.key]}
                  title={title}
                  childName={childName}
                  fontProfile={fontProfile}
                  standalone={false}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Millimetres up or down from wherever `place` landed.
 *
 * Millimetres, not pixels: the page is a printed object, a pixel has no fixed
 * size on it, and the preview is drawn at a scale that changes. The buttons
 * exist because the useful moves are small and repeated — nudging a caption
 * clear of a face is four taps, not a number anyone wants to type.
 */
function Nudge({ value, onChange }) {
  const clamp = (v) => Math.max(-60, Math.min(60, v));
  return (
    <span className="flex items-center gap-1">
      <IconButton label="لفوق" onClick={() => onChange(clamp(value - 2))}>
        <ChevronUp className="h-4 w-4" aria-hidden="true" />
      </IconButton>
      <input
        type="number"
        value={value}
        min={-60}
        max={60}
        step={1}
        onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
        aria-label="إزاحة النص بالمليمتر"
        className="control-text w-16 rounded-lg border-2 border-brand-deep/25 bg-surface px-2 py-1 text-center tabular-nums text-ink outline-none focus:border-brand-deep"
      />
      <IconButton label="لتحت" onClick={() => onChange(clamp(value + 2))}>
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </IconButton>
      <span className="text-xs text-muted">مم — بالسالب لفوق</span>
      {value !== 0 ? (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="text-xs font-bold text-berry-deep underline underline-offset-4"
        >
          صفّروا
        </button>
      ) : null}
    </span>
  );
}

function Control({ label, children }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 shrink-0 text-xs text-muted">{label}</span>
      {children}
    </div>
  );
}

function Pill({ on, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
        on
          ? "border-brand-deep bg-brand-tint text-brand-deep"
          : "border-ink/20 text-muted hover:border-ink/40"
      }`}
    >
      {children}
    </button>
  );
}

/** A colour is shown, not named — but it carries its name for a screen reader. */
function Swatch({ colour, label, on, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{ background: colour }}
      className={`h-6 w-6 rounded-full border-2 transition-transform ${
        on ? "scale-110 border-brand-deep" : "border-ink/25 hover:border-ink/50"
      }`}
    />
  );
}

function IconButton({ label, disabled, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-full border border-ink/20 p-1 text-brand-deep transition-colors hover:bg-brand-tint disabled:opacity-30"
    >
      {children}
    </button>
  );
}
