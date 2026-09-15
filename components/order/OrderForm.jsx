"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ChoiceField, FormSection, SelectField, TextAreaField, TextField } from "./Fields";
import PhotoPicker from "./PhotoPicker";
import ReviewDialog from "./ReviewDialog";
import ThankYouDialog from "./ThankYouDialog";
import { Kicker } from "../ui";
import { canAnimate } from "@/lib/motion";
import { createOrder } from "@/lib/api";
import { areaLabel, areaOptions, cityLabel, cityOptions } from "@/lib/jordan";
import { uploadOrderPhotos } from "@/lib/upload";
import { clearOrderDraft, loadOrderDraft, saveOrderDraft } from "@/lib/order-draft";
import { normalizePhone } from "@/lib/phone";
import {
  FIELD_LIMITS,
  EMPTY_ORDER,
  addonLabelFor,
  buildOrderSummary,
  extraPages,
  pagesLabel,
  isComplete,
  orderProblems,
  money,
  normalizeOrderValues,
  priceBreakdown,
  turnaroundLabel,
  validationIssue,
} from "@/lib/order";

/**
 * The order form.
 *
 * **Submitting now files the order.** The review dialog's send button POSTs
 * the answers to the qissati API, uploads the reference photos against the
 * ticket that response carries, and only then offers the WhatsApp hop — which
 * is now about arranging payment, not about carrying the brief.
 *
 * The order of those three steps is deliberate. WhatsApp last means the
 * parent's answers are already safely filed before they leave the page; and
 * because the send is asynchronous, the WhatsApp link is a real link the
 * parent clicks rather than a `window.open` after an await, which browsers
 * block as a popup.
 *
 * **The failure path is a first-class path, not an error toast.** If the API
 * is unreachable the parent is not stranded: the dialog says so, offers a
 * retry, and keeps the old phase-1 escape hatch — the full details, copyable,
 * to paste into the chat. Losing an order to a bad minute of Wi-Fi is worse
 * than any amount of interface.
 */
/** One line of the price breakdown. `total` gives it the closing rule. */
function PriceRow({ label, amount, total = false }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-2 ${
        total ? "mt-1 border-t-2 border-ink/10 pt-3" : ""
      }`}
    >
      <dt className={total ? "font-bold text-ink" : "text-sm text-muted"}>
        {label}
      </dt>
      <dd
        className={`tabular-nums ${
          total
            ? "text-lg font-extrabold text-berry-deep"
            : "text-sm font-semibold text-ink/80"
        }`}
      >
        {amount}
      </dd>
    </div>
  );
}

/**
 * Put the reader on one form answer, whatever control renders it.
 *
 * Text inputs, selects and the photo button have an `id`. ChoiceField is a
 * group of radios instead, so its answer is found by `name` and the whole
 * fieldset is used as the scroll target. Waiting for the next frame lets React
 * paint the validation messages first; otherwise their new height can move the
 * requested field after the browser has already centred it.
 */
function focusOrderField(id) {
  window.requestAnimationFrame(() => {
    const direct = document.getElementById(id);
    const named = document.getElementsByName(id)[0];
    const focusTarget = direct ?? named;
    const scrollTarget = named?.closest("fieldset") ?? direct;

    focusTarget?.focus({ preventScroll: true });
    scrollTarget?.scrollIntoView({
      block: "center",
      behavior: canAnimate() ? "smooth" : "instant",
    });
  });
}

export default function OrderForm({ dict, lang, initialFormat, pricing }) {
  const t = dict.order;
  const f = t.fields;

  const [values, setValues] = useState(() => ({
    ...EMPTY_ORDER,
    // Preselected from the pricing row that sent the reader here. Resolved on
    // the server from searchParams, so there is no hydration mismatch and no
    // setState-in-effect.
    format: initialFormat ?? "",
  }));
  // Loading happens after hydration so the server and first client render are
  // identical. Saving is gated until that load settles, or the first blank
  // render would overwrite a real draft before it had a chance to come back.
  const [draftHydrated, setDraftHydrated] = useState(false);
  // Once the API accepts an order, its answers are no longer a draft. This
  // also prevents a reload after a successful POST from offering to file the
  // same order again while its photos are still uploading.
  const [draftActive, setDraftActive] = useState(true);

  // Chip labels and the running total both read from the same table, so they
  // can never disagree. The table is the live one from the admin dashboard,
  // falling back to all-`null` (→ `[X]`) when the API is unreachable.
  const chipPrice = (kind, key) =>
    addonLabelFor(kind === "gift" ? pricing.gift : pricing[kind][key], dict);
  const price = priceBreakdown(values, pricing);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  // The reference photos live here rather than inside PhotoPicker: they are
  // uploaded at submit, after the order exists, so the form has to own them.
  const [photos, setPhotos] = useState([]);
  // "idle" | "sending" | "done" | "failed" — what the dialog's footer shows.
  const [send, setSend] = useState({ state: "idle", progress: 0, result: null, error: null });
  // "closed" | "open" | "closing" — the same three-way state as the mobile
  // drawer, so the dialog can animate out without a setState inside an effect.
  const [review, setReview] = useState("closed");
  const [thanks, setThanks] = useState("closed");
  // What the thank-you dialog reads, captured BEFORE the form is reset. The
  // reference is the parent's only record of the order once the answers are
  // gone, and `waHref` has to be the link built from the answers as they were.
  const [finished, setFinished] = useState(null);
  // Set from the WhatsApp button's click handler, read once the review dialog
  // has finished animating out. The reset cannot happen in the handler itself:
  // it unmounts the very anchor the browser is about to follow, and whether
  // the navigation survives that is a guess about scheduling rather than a
  // guarantee. Doing it on the way out is ~200ms later and certain. A ref
  // rather than state for the same reason as `sendingRef` — it must not
  // change `reviewExited`'s identity, which the dialog's effect depends on.
  const finishRef = useRef(null);
  const submitRef = useRef(null);
  const headingRef = useRef(null);
  // Read by `dismissReview`, which is memoised and must not re-create itself
  // every time the send state ticks — a new `onDismiss` identity tears down
  // and re-runs the dialog's modal effect on every progress update.
  // Two jobs, one ref: it tells `dismissReview` not to close the dialog
  // mid-send (a memoised callback, so it cannot read `send.state` without
  // getting a new identity on every progress tick), and it is the in-flight
  // guard `sendOrder` checks before starting. Written from an effect and from
  // event handlers only — never during render, which React Compiler rejects.
  const sendingRef = useRef(false);
  useEffect(() => {
    if (send.state !== "sending") sendingRef.current = false;
  }, [send.state]);

  // Land at the top, instantly, every time.
  //
  // `globals.css` turns on `scroll-behavior: smooth` after hydration, and that
  // applies to the router's own scroll-to-top as well as to anchor clicks. A
  // reader arriving from the pricing row is ~5300px down a 7700px page landing
  // on a 3800px one, so the animation starts already clamped past this page's
  // maximum scroll — and if it is interrupted by the form laying out, it stops
  // there and the reader opens the order page at its footer. An explicit
  // instant scroll overrides the CSS behaviour and cannot be interrupted.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const stored = loadOrderDraft();
    let live = true;
    // React Compiler rejects synchronous state writes in an effect body. The
    // promise also makes the load sequence explicit: read, then hydrate, then
    // let the save effect below begin observing changes.
    Promise.resolve().then(() => {
      if (!live) return;
      if (stored) {
        setValues({
          ...EMPTY_ORDER,
          ...stored,
          // A format explicitly chosen from a pricing CTA wins; otherwise an
          // unfinished draft keeps the parent's previous choice.
          format: initialFormat || stored.format || "",
        });
      }
      setDraftHydrated(true);
    });
    return () => {
      live = false;
    };
  }, [initialFormat]);

  useEffect(() => {
    if (draftHydrated && draftActive) saveOrderDraft(values);
  }, [draftHydrated, draftActive, values]);

  const set = (key) => (v) => setValues((prev) => ({ ...prev, [key]: v }));

  // The area list is per-city, so changing the city has to clear the area —
  // otherwise an order reads "الزرقاء / خلدا", naming a place in a
  // governorate the parent just moved away from. Same rule as sidekick.
  const setCity = (v) =>
    setValues((prev) => ({
      ...prev,
      city: v,
      area: v === prev.city ? prev.area : "",
    }));

  // Delivery fields only describe a printed copy. Switching back to PDF hides
  // them, so clear them at the same moment rather than filing invisible data.
  const setFormat = (v) =>
    setValues((prev) => ({
      ...prev,
      format: v,
      city: v === "print" ? prev.city : "",
      area: v === "print" ? prev.area : "",
    }));

  // Saying the book is not a gift clears both dependent answers. The controls
  // are hidden in that case, so leftover values would be submitted — and be
  // uneditable — for an order that has no gift page. Same rule as
  // `setSidekick`, `setFormat` and `setWantsAvatar`.
  const setIsGift = (v) =>
    setValues((prev) => ({
      ...prev,
      isGift: v,
      occasion: v === "yes" ? prev.occasion : "",
      giftMessage: v === "yes" ? prev.giftMessage : "",
    }));

  // Answering "no" drops any photos already picked. Two reasons, and the first
  // is the important one: a parent who says they do not want their child drawn
  // must not have that child's photographs uploaded anyway. The second is
  // mechanical — PhotoPicker revokes its object URLs on unmount, so keeping a
  // stale `photos` array would remount it later onto dead blob URLs and render
  // broken thumbnails.
  const setWantsAvatar = (v) => {
    setValues((prev) => ({ ...prev, wantsAvatar: v }));
    if (v === "no") setPhotos([]);
  };

  // Clearing the name has to clear every dependent detail with it. The
  // controls are hidden when there is no name, so leftover values would
  // otherwise be submitted — and be uneditable — for a sidekick who is no
  // longer in the story.
  const setSidekick = (v) =>
    setValues((prev) => ({
      ...prev,
      sidekick: v,
      sidekickRelation: v.trim() ? prev.sidekickRelation : "",
      sidekickAge: v.trim() ? prev.sidekickAge : "",
      petDescription: v.trim() ? prev.petDescription : "",
    }));

  // A pet description belongs only to the pet branch. If the parent changes
  // the relationship, clear the now-hidden answer so it cannot be filed for a
  // sibling or friend.
  const setSidekickRelation = (v) =>
    setValues((prev) => ({
      ...prev,
      sidekickRelation: v,
      petDescription: v === "pet" ? prev.petDescription : "",
    }));

  // One ordered list drives both the send gate and the focus jump. The helper
  // combines missing and invalid answers without losing their DOM order.
  const problems = useMemo(() => orderProblems(values), [values]);
  // A likeness cannot be drawn without a reference. The upload itself happens
  // only after the order exists (the response mints its secure upload ticket),
  // so this gate is about selecting at least one file before review opens.
  const photosMissing = values.wantsAvatar === "yes" && photos.length === 0;
  const complete = problems.length === 0 && !photosMissing;
  const summary = useMemo(
    () => (complete ? buildOrderSummary(values, dict, pricing) : ""),
    [complete, values, dict, pricing]
  );

  // Only mark a field red once the reader has tried to submit — flagging
  // blanks while someone is still working down the page is just noise.
  const errorOn = (key) => submitted && problems.includes(key);
  // "Required" is not an answer to an invalid age, stale choice, long answer
  // or malformed phone number. Keep each message short because paired fields
  // reserve one line for it.
  const errorTextFor = (key) => {
    const issue = validationIssue(values, key);
    if (issue === "age") return t.invalidAge;
    if (issue === "phone") return t.invalidPhone;
    if (issue === "tooLong") return t.tooLong;
    if (issue === "choice") return t.invalidChoice;
    return t.required;
  };

  // Nothing leaves this page without the parent reading it back first.
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    const normalized = normalizeOrderValues(values);
    const nextProblems = orderProblems(normalized);
    const nextPhotosMissing = normalized.wantsAvatar === "yes" && photos.length === 0;
    setValues(normalized);
    if (!isComplete(normalized) || nextPhotosMissing) {
      focusOrderField(nextProblems[0] ?? "photos");
      return;
    }
    // Settle whitespace, ages and the phone on the way into review, not on
    // every keystroke: rewriting while someone types is hostile, while review
    // is exactly where they should see the canonical values being filed.
    // A filed order stays filed. Reopening the review after a successful send
    // shows its done state — reference, WhatsApp link, no send button — rather
    // than offering to file the same answers a second time. Editing a field
    // afterwards does nothing to the order that is already with us, so it must
    // not unlock a re-send either; the way to place another order is to finish
    // this one (the WhatsApp button), which resets the form.
    if (send.state !== "done") {
      setSend({ state: "idle", progress: 0, result: null, error: null });
    }
    setReview("open");
  };

  /**
   * File the order, then push the photos.
   *
   * The photo upload is deliberately NOT allowed to fail the order. If the
   * brief lands and the images don't, the team has everything except the
   * likeness and can ask for it in the chat — so that case reports itself and
   * carries on, rather than telling a parent whose order we already have that
   * nothing worked.
   */
  const sendOrder = useCallback(async () => {
    // The send button is `disabled` while this runs, but that only takes
    // effect on the next render — a fast double-tap on a slow phone would
    // otherwise file the order twice and leave the parent with two references
    // and one payment to make.
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSend({ state: "sending", progress: 0, result: null, error: null });

    const res = await createOrder(values, lang);
    if (!res.ok) {
      setSend({ state: "failed", progress: 0, result: null, error: res.error });
      return;
    }

    // The server has the order now. Clear its local draft immediately rather
    // than waiting for the optional photo upload or WhatsApp handoff: a reload
    // anywhere after this line must not make the same order submit-able again.
    clearOrderDraft();
    setDraftActive(false);

    const reference = res.data?.order?.reference ?? "";
    const ticket = res.data?.upload?.ticket;
    const files = photos.map((p) => p.file);

    if (!files.length) {
      setSend({
        state: "done",
        progress: 1,
        result: { reference, photos: 0, photosFailed: false, values },
        error: null,
      });
      return;
    }

    const upload = await uploadOrderPhotos(files, ticket, (progress) =>
      setSend((prev) => (prev.state === "sending" ? { ...prev, progress } : prev))
    );

    setSend({
      state: "done",
      progress: 1,
      result: {
        reference,
        photos: upload.ok ? upload.uploaded : 0,
        photosFailed: !upload.ok,
        // The answers exactly as they were filed. Once the order is in, the
        // dialog stops being a review and becomes a receipt — see `shown`.
        values,
      },
      error: null,
    });
  }, [values, lang, photos]);

  // These three are memoised on purpose. The dialog's modal effect lists
  // `onDismiss` in its deps, so an inline function would make that effect tear
  // down and re-run on *every* parent render — unlocking body scroll and
  // yanking focus back to the submit button while the dialog is still open.
  // Closing mid-send would leave the parent with no idea whether their order
  // went through, so the dialog is modal in the real sense until it resolves.
  const dismissReview = useCallback(() => {
    if (sendingRef.current) return;
    setReview((m) => (m !== "open" ? m : canAnimate() ? "closing" : "closed"));
  }, []);
  const reviewExited = useCallback(() => {
    setReview("closed");
    const finish = finishRef.current;
    if (!finish) return;
    finishRef.current = null;
    setFinished(finish);
    // A fresh form for a second child. `format` survives because the URL still
    // says `?format=print` — wiping it would leave the page contradicting its
    // own address. Clearing `photos` unmounts the picker, which is what revokes
    // its object URLs.
    setValues({ ...EMPTY_ORDER, format: initialFormat ?? "" });
    setPhotos([]);
    setSubmitted(false);
    setCopied(false);
    setSend({ state: "idle", progress: 0, result: null, error: null });
    setDraftActive(true);
    setThanks("open");
    // `setPhotos` is a `useState` setter and never changes identity, but the
    // compiler infers it as a dependency here and rejects the callback without
    // it. Listing it costs nothing and keeps this component optimised.
  }, [initialFormat, setPhotos]);

  /**
   * The parent has tapped through to WhatsApp on a filed order — the last step
   * of the flow, so the form goes back to blank and the thank-you takes over.
   *
   * Wired to the `sent` branch only. The same button in the `failed` branch
   * must leave everything alone: no order was filed, so the answers on screen
   * are the only copy of the brief, and the "copy the full details" button
   * beside it exists precisely so they can be pasted into that chat.
   *
   * Always routes through `"closing"`, even when `canAnimate()` is false —
   * "closed" would unmount the anchor during the click that is following it.
   */
  const finishOrder = useCallback(
    (waHref) => {
      finishRef.current = { reference: send.result?.reference ?? "", waHref };
      setReview((m) => (m === "open" ? "closing" : m));
    },
    [send.result]
  );

  const dismissThanks = useCallback(
    () => setThanks((m) => (m !== "open" ? m : canAnimate() ? "closing" : "closed")),
    []
  );
  // The form under the dialog is blank now, so start it at the top rather than
  // leaving the reader in the middle of an empty contact section. Deferred to
  // here because the body scroll lock swallows a scroll made while it is up.
  const thanksExited = useCallback(() => {
    setThanks("closed");
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  // Close the dialog and drop the reader into the field they wanted to change.
  const editField = useCallback((id) => {
    setReview("closed");
    focusOrderField(id);
  }, []);

  // What the dialog reads back, grouped the way the form is. `firstField` is
  // where the section's Edit button lands.
  const pickLabel = (group, key) => group?.options?.[key] ?? "";
  /**
   * What the dialog reads: the live answers while the order is still being
   * reviewed, and the answers **as filed** once it is in.
   *
   * The form stays editable after a successful send — nothing stops a parent
   * closing the dialog, fixing a typo in their child's name and pressing
   * submit again. That edit cannot reach the order, which is already in the
   * dashboard, so showing it back beside that order's reference would be a
   * receipt for something we were never sent. The dialog says as much in
   * words (`review.doneLocked`); this is the same promise in the rows.
   */
  const shown = send.state === "done" && send.result?.values ? send.result.values : values;

  const reviewSections = [
    {
      key: "child",
      title: t.steps.child.title,
      firstField: "childName",
      rows: [
        { label: f.childName.label, value: shown.childName },
        { label: f.childAge.label, value: shown.childAge },
        { label: f.gender.label, value: pickLabel(f.gender, shown.gender) },
        { label: f.trait1.label, value: shown.trait1 },
        { label: f.trait2.label, value: shown.trait2 },
        { label: f.favourite.label, value: shown.favourite },
        { label: f.sidekick.label, value: shown.sidekick },
        // Only ever set alongside a name, so it never appears alone.
        ...(shown.sidekick.trim()
          ? [
              {
                label: f.sidekickRelation.label,
                value: pickLabel(f.sidekickRelation, shown.sidekickRelation),
              },
              { label: f.sidekickAge.label, value: shown.sidekickAge },
              ...(shown.sidekickRelation === "pet"
                ? [
                    {
                      label: f.petDescription.label,
                      value: shown.petDescription,
                    },
                  ]
                : []),
            ]
          : []),
        { label: f.quirk.label, value: shown.quirk },
      ],
    },
    {
      key: "story",
      title: t.steps.story.title,
      firstField: "storyType",
      rows: [
        { label: f.storyType.label, value: pickLabel(f.storyType, shown.storyType) },
        { label: f.storyChoice.label, value: shown.storyChoice },
        { label: f.setting.label, value: shown.setting },
        { label: f.avoid.label, value: shown.avoid },
        { label: f.tone.label, value: pickLabel(f.tone, shown.tone) },
        { label: f.language.label, value: pickLabel(f.language, shown.language) },
        { label: f.pages.label, value: pagesLabel(Number(shown.pages), dict) },
      ],
    },
    {
      key: "book",
      title: t.steps.book.title,
      firstField: "format",
      rows: [
        {
          label: f.format.label,
          value: dict.pricing.plans[shown.format]?.name ?? "",
        },
        { label: f.city.label, value: cityLabel(shown.city, lang) },
        { label: f.area.label, value: areaLabel(shown.area, lang) },
        { label: f.isGift.label, value: f.isGift.options[shown.isGift] },
        ...(shown.isGift === "yes"
          ? [
              { label: f.occasion.label, value: pickLabel(f.occasion, shown.occasion) },
              { label: f.giftMessage.label, value: shown.giftMessage },
            ]
          : []),
        {
          label: f.wantsAvatar.label,
          value: f.wantsAvatar.options[shown.wantsAvatar],
        },
      ],
    },
    {
      key: "contact",
      title: t.steps.contact.title,
      firstField: "parentName",
      rows: [
        { label: f.parentName.label, value: shown.parentName },
        {
          label: f.contactHandle.label,
          value: normalizePhone(shown.contactHandle) || shown.contactHandle,
          // Latin digits and a leading `+` in an Arabic paragraph: without an
          // isolate the `+` renders on the wrong end of the number.
          ltr: true,
        },
        { label: f.notes.label, value: shown.notes },
      ],
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // Clipboard can be blocked (insecure context, permissions). The summary
      // is on screen and selectable, so there is still a way through.
      setCopied(false);
    }
  };

  const resetForm = () => {
    if (!draftActive || sendingRef.current) return;
    if (!window.confirm(t.draft.resetConfirm)) return;
    clearOrderDraft();
    setValues({ ...EMPTY_ORDER, format: initialFormat ?? "" });
    setPhotos([]);
    setSubmitted(false);
    setCopied(false);
    setSend({ state: "idle", progress: 0, result: null, error: null });
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    headingRef.current?.focus({ preventScroll: true });
  };

  const storyHint =
    values.storyType === "role" ? f.storyChoice.hintRole : f.storyChoice.hintGoal;

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-28 sm:px-8 md:pb-32 md:pt-36">
      {/* A plain <a>, not next/link — the same reasoning as the language
          toggle. A client-side transition back to the long landing page keeps
          the router's cached scroll offset for that route, so the reader is
          returned to wherever they were when they left (near the footer, if
          they came from the pricing row) rather than to the top. A document
          navigation always starts at the top, deterministically. */}
      <a
        href={`/${lang}`}
        className="group inline-flex items-center gap-2 text-sm font-bold text-brand-deep transition-colors hover:text-brand"
      >
        {/* "Back" points toward the start edge: right under rtl, left under ltr */}
        <ArrowRight className="h-4 w-4 ltr:hidden" aria-hidden="true" />
        <ArrowLeft className="h-4 w-4 rtl:hidden" aria-hidden="true" />
        {t.backToHome}
      </a>

      <header className="mt-8 max-w-2xl">
        <Kicker>{t.kicker}</Kicker>
        {/* `tabIndex={-1}` so the thank-you dialog can hand focus back here
            rather than to the submit button it was opened from. That button is
            at the FOOT of a form that has just been emptied, and returning to
            it would leave a parent who might want a second story staring at the
            bottom of a blank page. The heading is the top of the new form, and
            a screen reader announces it — which is exactly the "you are back at
            the start" message the dialog just made in words. */}
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-5 text-3xl font-extrabold leading-[1.25] text-ink sm:text-4xl md:text-[2.75rem]"
        >
          {t.title}
        </h1>
        <p className="mt-4 text-lg leading-loose text-muted">{t.lead}</p>

        {/* The promise that justifies the length of this form. Without it the
            questions read as bureaucracy; with it they read as the product. */}
        <div className="mt-8 border-s-[3px] border-gold ps-5">
          <p className="text-[0.95rem] font-extrabold text-ink">
            {t.promise.title}
          </p>
          <p className="mt-2 text-base leading-loose text-muted">
            {t.promise.body}
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} noValidate className="mt-12">
        <FormSection {...t.steps.child}>
          <div className="grid gap-7 sm:grid-cols-2">
            <TextField
              id="childName"
              label={f.childName.label}
              hint={f.childName.hint}
              required
              error={errorOn("childName")}
              errorText={errorTextFor("childName")}
              reserveError
              maxLength={FIELD_LIMITS.childName}
              value={values.childName}
              onChange={set("childName")}
            />
            <TextField
              id="childAge"
              label={f.childAge.label}
              hint={f.childAge.hint}
              required
              inputMode="numeric"
              pattern="[0-9٠-٩۰-۹]+"
              maxLength={3}
              error={errorOn("childAge")}
              errorText={errorTextFor("childAge")}
              reserveError
              value={values.childAge}
              onChange={set("childAge")}
            />
          </div>

          <ChoiceField
            id="gender"
            label={f.gender.label}
            required
            error={errorOn("gender")}
            errorText={errorTextFor("gender")}
            value={values.gender}
            onChange={set("gender")}
            options={[
              { value: "boy", label: f.gender.options.boy },
              { value: "girl", label: f.gender.options.girl },
            ]}
          />

          <div className="grid gap-7 sm:grid-cols-2">
            <TextField
              id="trait1"
              label={f.trait1.label}
              hint={f.trait1.hint}
              required
              error={errorOn("trait1")}
              errorText={errorTextFor("trait1")}
              reserveError
              maxLength={FIELD_LIMITS.trait1}
              value={values.trait1}
              onChange={set("trait1")}
            />
            <TextField
              id="trait2"
              label={f.trait2.label}
              hint={f.trait2.hint}
              required
              error={errorOn("trait2")}
              errorText={errorTextFor("trait2")}
              reserveError
              maxLength={FIELD_LIMITS.trait2}
              value={values.trait2}
              onChange={set("trait2")}
            />
          </div>

          <TextField
            id="favourite"
            label={f.favourite.label}
            hint={f.favourite.hint}
            required
            error={errorOn("favourite")}
            errorText={errorTextFor("favourite")}
            maxLength={FIELD_LIMITS.favourite}
            value={values.favourite}
            onChange={set("favourite")}
          />

          {/* The relationship and age appear only once a name is entered.
              Both are required from that moment on: the first fixes Arabic
              grammar, and the second keeps the companion's dialogue,
              behaviour and appearance true to their age. A pet then reveals
              one more required answer so its species and colouring are never
              guessed later in the admin workflow. */}
          <TextField
            id="sidekick"
            label={`${f.sidekick.label} (${t.optional})`}
            hint={f.sidekick.hint}
            error={errorOn("sidekick")}
            errorText={errorTextFor("sidekick")}
            maxLength={FIELD_LIMITS.sidekick}
            value={values.sidekick}
            onChange={setSidekick}
          />
          {values.sidekick.trim() ? (
            <div className="grid gap-7 sm:grid-cols-2">
              <SelectField
                id="sidekickRelation"
                label={f.sidekickRelation.label}
                hint={f.sidekickRelation.hint}
                placeholder={f.sidekickRelation.placeholder}
                required
                error={errorOn("sidekickRelation")}
                errorText={errorTextFor("sidekickRelation")}
                reserveError
                value={values.sidekickRelation}
                onChange={setSidekickRelation}
                options={[
                  { value: "brother", label: f.sidekickRelation.options.brother },
                  { value: "sister", label: f.sidekickRelation.options.sister },
                  { value: "friendBoy", label: f.sidekickRelation.options.friendBoy },
                  { value: "friendGirl", label: f.sidekickRelation.options.friendGirl },
                  { value: "pet", label: f.sidekickRelation.options.pet },
                ]}
              />
              <TextField
                id="sidekickAge"
                label={f.sidekickAge.label}
                hint={f.sidekickAge.hint}
                required
                inputMode="numeric"
                pattern="[0-9٠-٩۰-۹]+"
                maxLength={3}
                error={errorOn("sidekickAge")}
                errorText={errorTextFor("sidekickAge")}
                reserveError
                value={values.sidekickAge}
                onChange={set("sidekickAge")}
              />
            </div>
          ) : null}
          {values.sidekick.trim() && values.sidekickRelation === "pet" ? (
            <TextAreaField
              id="petDescription"
              label={f.petDescription.label}
              hint={f.petDescription.hint}
              required
              rows={3}
              error={errorOn("petDescription")}
              errorText={errorTextFor("petDescription")}
              maxLength={FIELD_LIMITS.petDescription}
              value={values.petDescription}
              onChange={set("petDescription")}
            />
          ) : null}

          {/* The differentiator. It gets the most room and the longest hint
              because a vague answer here produces a generic story. */}
          <TextAreaField
            id="quirk"
            label={f.quirk.label}
            hint={f.quirk.hint}
            required
            rows={4}
            error={errorOn("quirk")}
            errorText={errorTextFor("quirk")}
            maxLength={FIELD_LIMITS.quirk}
            value={values.quirk}
            onChange={set("quirk")}
          />
        </FormSection>

        <FormSection {...t.steps.story}>
          <ChoiceField
            id="storyType"
            label={f.storyType.label}
            required
            error={errorOn("storyType")}
            errorText={errorTextFor("storyType")}
            value={values.storyType}
            onChange={set("storyType")}
            options={[
              {
                value: "goal",
                label: f.storyType.options.goal,
                hint: f.storyType.hints.goal,
              },
              {
                value: "role",
                label: f.storyType.options.role,
                hint: f.storyType.hints.role,
              },
            ]}
          />

          <TextField
            id="storyChoice"
            label={f.storyChoice.label}
            hint={storyHint}
            required
            error={errorOn("storyChoice")}
            errorText={errorTextFor("storyChoice")}
            maxLength={FIELD_LIMITS.storyChoice}
            value={values.storyChoice}
            onChange={set("storyChoice")}
          />

          <TextField
            id="setting"
            label={`${f.setting.label} (${t.optional})`}
            hint={f.setting.hint}
            placeholder={f.setting.placeholder}
            error={errorOn("setting")}
            errorText={errorTextFor("setting")}
            maxLength={FIELD_LIMITS.setting}
            value={values.setting}
            onChange={set("setting")}
          />

          <ChoiceField
            id="tone"
            label={f.tone.label}
            required
            columns={3}
            error={errorOn("tone")}
            errorText={errorTextFor("tone")}
            value={values.tone}
            onChange={set("tone")}
            options={[
              { value: "funny", label: f.tone.options.funny },
              { value: "sweet", label: f.tone.options.sweet },
              { value: "adventurous", label: f.tone.options.adventurous },
            ]}
          />

          <ChoiceField
            id="language"
            label={f.language.label}
            required
            columns={3}
            error={errorOn("language")}
            errorText={errorTextFor("language")}
            value={values.language}
            onChange={set("language")}
            options={[
              { value: "msa", label: f.language.options.msa },
              { value: "ammiya", label: f.language.options.ammiya },
              { value: "english", label: f.language.options.english },
            ]}
          />

          <ChoiceField
            id="pages"
            label={f.pages.label}
            columns={3}
            error={errorOn("pages")}
            errorText={errorTextFor("pages")}
            value={values.pages}
            onChange={set("pages")}
            options={["8", "10", "12"].map((n) => ({
              value: n,
              label: pagesLabel(Number(n), dict),
              // 8 pages IS the base story, so it adds nothing. It used to show
              // the base price, which beside "10 صفحات +[X]" read as a second
              // charge for the same thing rather than as the default.
              addon:
                n === "8" ? f.addon.includedInBase : chipPrice("pages", n),
            }))}
          />

          {/* Last in the section on purpose: it is a constraint on everything
              above it, not another description of the story. */}
          <TextAreaField
            id="avoid"
            label={`${f.avoid.label} (${t.optional})`}
            hint={f.avoid.hint}
            rows={3}
            error={errorOn("avoid")}
            errorText={errorTextFor("avoid")}
            maxLength={FIELD_LIMITS.avoid}
            value={values.avoid}
            onChange={set("avoid")}
          />
        </FormSection>

        <FormSection {...t.steps.book}>
          <ChoiceField
            id="format"
            label={f.format.label}
            required
            error={errorOn("format")}
            errorText={errorTextFor("format")}
            value={values.format}
            onChange={setFormat}
            options={[
              {
                value: "pdf",
                label: dict.pricing.plans.pdf.name,
                hint: dict.pricing.plans.pdf.note,
                addon: chipPrice("format", "pdf"),
              },
              {
                value: "print",
                label: dict.pricing.plans.print.name,
                hint: dict.pricing.plans.print.note,
                addon: chipPrice("format", "print"),
              },
            ]}
          />

          {/* Only for a printed copy, as before — but two dependent selects
              now, because one free-text box produced answers nobody could
              dispatch a courier from. The area list follows the city, and
              appears only once a city is picked. */}
          {values.format === "print" ? (
            <div className="grid gap-7 sm:grid-cols-2">
              <SelectField
                id="city"
                label={`${f.city.label} (${t.optional})`}
                hint={f.city.hint}
                placeholder={f.city.placeholder}
                value={values.city}
                onChange={setCity}
                options={cityOptions(lang)}
              />
              {values.city ? (
                <SelectField
                  id="area"
                  label={`${f.area.label} (${t.optional})`}
                  hint={f.area.hint}
                  placeholder={f.area.placeholder}
                  value={values.area}
                  onChange={set("area")}
                  options={areaOptions(values.city, lang)}
                />
              ) : null}
            </div>
          ) : null}

          <ChoiceField
            id="isGift"
            label={f.isGift.label}
            hint={f.isGift.hint}
            error={errorOn("isGift")}
            errorText={errorTextFor("isGift")}
            value={values.isGift}
            onChange={setIsGift}
            options={[
              {
                value: "yes",
                label: f.isGift.options.yes,
                addon: chipPrice("gift", "gift"),
              },
              { value: "no", label: f.isGift.options.no },
            ]}
          />

          {/* The occasion only means something once the book IS a gift — it
              exists to shape what the gift page says. Asking every parent,
              including the ones keeping the book, was a question most of them
              had no reason to answer. It sits above the message it informs:
              pick the occasion, then write the words. Optional even here, and
              "بس هيك" is the honest none — a radio set cannot be unpicked, so
              the neutral answer has to be one of the options. */}
          {values.isGift === "yes" ? (
            <ChoiceField
              id="occasion"
              label={`${f.occasion.label} (${t.optional})`}
              hint={f.occasion.hint}
              error={errorOn("occasion")}
              errorText={errorTextFor("occasion")}
              value={values.occasion}
              onChange={set("occasion")}
              options={[
                { value: "birthday", label: f.occasion.options.birthday },
                { value: "eid", label: f.occasion.options.eid },
                { value: "newSibling", label: f.occasion.options.newSibling },
                { value: "justBecause", label: f.occasion.options.justBecause },
              ]}
            />
          ) : null}

          {/* Required only when a gift page was actually asked for — see
              missingFields(). A paid page with nothing on it helps nobody. */}
          {values.isGift === "yes" ? (
            <TextAreaField
              id="giftMessage"
              label={f.giftMessage.label}
              hint={f.giftMessage.hint}
              required
              rows={3}
              error={errorOn("giftMessage")}
              errorText={errorTextFor("giftMessage")}
              maxLength={FIELD_LIMITS.giftMessage}
              value={values.giftMessage}
              onChange={set("giftMessage")}
            />
          ) : null}

          {/* Running total. Every amount is still `[X]` until the admin
              dashboard serves real numbers — the arithmetic is already right,
              so it starts adding up the day they land. */}
          <div className="rounded-xl border-2 border-brand-deep/70 bg-surface p-5">
            <h3 className="text-[0.95rem] font-bold text-ink">{t.price.title}</h3>
            <dl className="mt-4 flex flex-col">
              <PriceRow label={t.price.base} amount={money(price.base, dict)} />
              {price.showPages ? (
                <PriceRow
                  // the pages *beyond* the base 8, not the total page count
                  label={`${t.price.extraPages} (${pagesLabel(extraPages(values), dict)})`}
                  amount={money(price.pages, dict)}
                />
              ) : null}
              {price.showFormat ? (
                <PriceRow
                  label={t.price.printed}
                  amount={money(price.format, dict)}
                />
              ) : null}
              {price.showGift ? (
                <PriceRow
                  label={t.price.giftPage}
                  amount={money(price.gift, dict)}
                />
              ) : null}
              <PriceRow
                label={t.price.total}
                amount={money(price.total, dict)}
                total
              />
            </dl>
            {/* Only while a price genuinely is undecided. Once the dashboard
                serves real amounts, "pricing is still being set" would be a
                sentence contradicting the total printed right above it. */}
            {/* The first thing a parent wonders once they have a total, so it
                lives inside the price box: "what does it cost and when do I get
                it" is one question. It is a conditional row like the ones
                above — the PDF and the printed copy have different turnarounds,
                so until a format is chosen there is no single answer to give,
                which is the same reason the total reads `[X]` until then. Once
                chosen it still renders "[X] أيام" while the owner has not set
                that format's number. */}
            {turnaroundLabel(dict, pricing, values.format) ? (
              <p className="mt-4 border-t-2 border-ink/10 pt-4 text-sm font-bold text-brand-deep">
                {turnaroundLabel(dict, pricing, values.format)}
              </p>
            ) : null}
            {price.total === null ? (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {t.price.pending}
              </p>
            ) : null}
          </div>
        </FormSection>

        <FormSection {...t.steps.contact}>
          <div className="grid gap-7 sm:grid-cols-2">
            <TextField
              id="parentName"
              label={f.parentName.label}
              required
              autoComplete="name"
              error={errorOn("parentName")}
              errorText={errorTextFor("parentName")}
              reserveError
              maxLength={FIELD_LIMITS.parentName}
              value={values.parentName}
              onChange={set("parentName")}
            />
            {/* `type="tel"` is what puts a phone keypad in front of a parent
                on a phone, which is most of them. `dir="ltr"` keeps a leading
                `+` at the start of the number on the Arabic page. */}
            <TextField
              id="contactHandle"
              label={f.contactHandle.label}
              hint={f.contactHandle.hint}
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              error={errorOn("contactHandle")}
              errorText={errorTextFor("contactHandle")}
              reserveError
              maxLength={FIELD_LIMITS.contactHandle}
              value={values.contactHandle}
              onChange={set("contactHandle")}
            />
          </div>

          <TextAreaField
            id="notes"
            label={`${f.notes.label} (${t.optional})`}
            rows={3}
            error={errorOn("notes")}
            errorText={errorTextFor("notes")}
            maxLength={FIELD_LIMITS.notes}
            value={values.notes}
            onChange={set("notes")}
          />

          {/* Sits directly above the picker because it decides whether the
              picker exists. Same adjacency as sidekick → its details. */}
          <ChoiceField
            id="wantsAvatar"
            label={f.wantsAvatar.label}
            hint={f.wantsAvatar.hint}
            error={errorOn("wantsAvatar")}
            errorText={errorTextFor("wantsAvatar")}
            value={values.wantsAvatar}
            onChange={setWantsAvatar}
            options={[
              { value: "yes", label: f.wantsAvatar.options.yes },
              { value: "no", label: f.wantsAvatar.options.no },
            ]}
          />

          {values.wantsAvatar === "yes" ? (
            <PhotoPicker
              dict={dict}
              photos={photos}
              onChange={setPhotos}
              disabled={send.state !== "idle"}
              error={submitted && photosMissing}
            />
          ) : null}
        </FormSection>

        {/* ── Send ───────────────────────────────────────────────────── */}
        <div className="border-t-2 border-ink/10 pt-10 md:pt-12">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
            <div>
              <h2 className="text-xl font-extrabold leading-tight text-ink sm:text-2xl">
                {t.review.title}
              </h2>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
                {t.review.body}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  ref={submitRef}
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-berry px-8 py-4 text-lg font-bold text-white shadow-soft ring-1 ring-cream/70 transition-all duration-200 hover:-translate-y-0.5 hover:bg-berry-deep hover:shadow-lift active:scale-[0.97] sm:w-auto"
                >
                  {t.review.title}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={!draftActive || send.state === "sending"}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full border-2 border-brand-deep/80 bg-surface px-6 py-3 text-[0.95rem] font-bold text-brand-deep transition-colors hover:border-brand-deep hover:bg-brand-tint disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {t.draft.reset}
                </button>
              </div>

              <p className="text-sm leading-relaxed text-muted">
                {t.draft.saved}
              </p>

              {/* aria-live so a blocked submit is announced, not just coloured */}
              <p
                aria-live="polite"
                className="min-h-[1.25rem] text-sm font-semibold text-berry-deep"
              >
                {submitted && !complete ? t.review.incomplete : ""}
              </p>

              <p className="text-sm leading-relaxed text-muted">
                {t.review.afterNote}
              </p>
            </div>
          </div>
        </div>
      </form>

      {review !== "closed" ? (
        <ReviewDialog
          state={review}
          onDismiss={dismissReview}
          onExited={reviewExited}
          onEdit={editField}
          dict={dict}
          values={shown}
          sections={reviewSections}
          copied={copied}
          onCopyFull={handleCopy}
          returnFocusRef={submitRef}
          pricing={pricing}
          send={send}
          onSend={sendOrder}
          onFinish={finishOrder}
        />
      ) : null}

      {thanks !== "closed" ? (
        <ThankYouDialog
          state={thanks}
          onDismiss={dismissThanks}
          onExited={thanksExited}
          dict={dict}
          result={finished}
          returnFocusRef={headingRef}
        />
      ) : null}
    </div>
  );
}
