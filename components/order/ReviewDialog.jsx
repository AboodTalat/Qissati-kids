"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { AlertCircle, Check, Copy, Loader2, Pencil, RotateCcw, X } from "lucide-react";
import { CtaButton, InstagramIcon, WhatsAppIcon } from "../ui";
import { CONTACT_URL, whatsappHref } from "@/lib/site";
import { buildWhatsAppMessage, money, priceBreakdown } from "@/lib/order";
import { canAnimate } from "@/lib/motion";

/**
 * The step between filling the form and sending it: the parent reads their own
 * answers back before anything leaves the page.
 *
 * This is a real modal — `role="dialog"`, `aria-modal`, scroll lock, initial
 * focus, a Tab trap, Escape to close, focus returned to the trigger — because
 * a review the reader can scroll away from is not a review. It follows the
 * same three-way open/closing state as `MobileDrawer` for the same reason: the
 * exit animation needs the panel mounted after the intent to close, and a
 * boolean forces a setState inside an effect, which React Compiler rejects.
 *
 * Every section carries an Edit button that closes the dialog and puts the
 * cursor in that section's first field. A review you cannot act on is a
 * speed bump, not a check.
 *
 * The footer is the send flow, in three states. **Placing the order and
 * opening WhatsApp are now two separate presses**, and that is not an extra
 * click for its own sake: the order has to be filed before the parent leaves
 * the page, and a `window.open` fired after an `await` is a popup as far as
 * the browser is concerned — it gets blocked. A link the parent taps once the
 * order is in is both honest and reliable.
 */
export default function ReviewDialog({
  state, // "open" | "closing"
  onDismiss,
  onExited,
  onEdit,
  dict,
  values,
  sections,
  copied,
  onCopyFull,
  returnFocusRef,
  pricing,
  send,
  onSend,
  onFinish,
}) {
  const t = dict.order;
  const r = t.review;
  const panelRef = useRef(null);
  const scrimRef = useRef(null);

  const open = state === "open";
  const price = priceBreakdown(values, pricing);
  // The reference is what turns this from "someone messaged us" into a row in
  // the dashboard, so the message is rebuilt once the order is filed. It is
  // empty on the failure path, and `buildWhatsAppMessage` answers that with a
  // different message rather than the same one missing a line.
  const waHref = whatsappHref(
    buildWhatsAppMessage(values, dict, pricing, send.result?.reference ?? "")
  );

  const sending = send.state === "sending";
  const sent = send.state === "done";
  const failed = send.state === "failed";

  useEffect(() => {
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    if (!panel || !scrim) return;

    if (!canAnimate()) {
      if (!open) onExited();
      return;
    }

    if (open) {
      animate(scrim, { opacity: [0, 1], duration: 220, ease: "outQuad" });
      animate(panel, {
        opacity: [0, 1],
        translateY: [24, 0],
        scale: [0.97, 1],
        duration: 420,
        ease: "outExpo",
      });
      return;
    }

    animate(scrim, { opacity: 0, duration: 180, ease: "inQuad" });
    const out = animate(panel, {
      opacity: 0,
      translateY: 16,
      duration: 200,
      ease: "inQuad",
      onComplete: onExited,
    });
    return () => out.pause();
  }, [open, onExited]);

  // Modal duties: scroll lock, initial focus, Tab trap.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !open) return;

    const returnTo = returnFocusRef?.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      [...panel.querySelectorAll("a[href], button:not([disabled])")];
    focusables()[0]?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        onDismiss();
        return;
      }
      if (e.key !== "Tab") return;
      const els = focusables();
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener("keydown", onKey);
    return () => {
      panel.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      returnTo?.focus();
    };
  }, [open, onDismiss, returnFocusRef]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <div
        ref={scrimRef}
        onClick={onDismiss}
        aria-hidden="true"
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.75rem] bg-cream shadow-lift sm:max-h-[85dvh] sm:rounded-[1.75rem]"
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b-2 border-ink/10 px-6 py-5 sm:px-8">
          <div>
            <h2
              id="review-title"
              className="text-xl font-extrabold text-ink sm:text-2xl"
            >
              {r.dialogTitle}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {r.dialogLead}
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            disabled={sending}
            aria-label={r.close}
            className="shrink-0 rounded-full border-2 border-brand-deep/70 p-2 text-brand-deep transition-colors hover:bg-brand-tint disabled:opacity-40"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* answers */}
        <div className="flex-1 overflow-y-auto px-6 py-2 sm:px-8">
          {sections.map((section) => (
            <section key={section.key} className="border-b border-ink/10 py-5 last:border-b-0">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-[0.95rem] font-extrabold text-ink">
                  {section.title}
                </h3>
                <button
                  type="button"
                  onClick={() => onEdit(section.firstField)}
                  disabled={sending || sent}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-brand-deep transition-colors hover:bg-brand-tint disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  {r.edit}
                </button>
              </div>

              <dl className="mt-3 flex flex-col gap-2.5">
                {section.rows.map((row) => (
                  <div
                    key={row.label}
                    className="grid gap-1 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-4"
                  >
                    <dt className="text-sm text-muted">{row.label}</dt>
                    <dd className="text-[0.95rem] leading-relaxed text-ink">
                      {row.value ? (
                        // A phone number is LTR text on an RTL page: without
                        // an isolate, a leading `+` renders on the wrong end.
                        row.ltr ? <bdi dir="ltr">{row.value}</bdi> : row.value
                      ) : (
                        r.empty
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        {/* total + actions */}
        <div className="border-t-2 border-ink/10 bg-cream-deep/50 px-6 py-5 sm:px-8">
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-bold text-ink">{t.price.total}</span>
            <span className="text-xl font-extrabold tabular-nums text-berry-deep">
              {money(price.total, dict)}
            </span>
          </div>

          {/* One live region for the whole flow, so a screen reader hears the
              order being filed, the photos going up, and the outcome — rather
              than a button that silently changes label. */}
          <div aria-live="polite" className="mt-3">
            {sent ? (
              <>
                <p className="text-[0.95rem] font-extrabold text-brand-deep">
                  {r.doneTitle}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {r.doneBody.replace("{reference}", send.result?.reference ?? "")}
                </p>
                {/* Zero photos means two opposite things. For an avatar order
                    it is a gap to chase in the chat; for a no-likeness order it
                    is the correct outcome, and "send them in the chat" would
                    contradict the answer the parent just gave. */}
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {values.wantsAvatar === "no"
                    ? r.donePhotosSkipped
                    : send.result?.photosFailed
                      ? r.donePhotosFailed
                      : send.result?.photos
                        ? r.donePhotos.replace("{n}", String(send.result.photos))
                        : r.donePhotosNone}
                </p>
                {/* The form behind this dialog is still editable, and an edit
                    cannot reach an order that is already in the dashboard. The
                    rows above are frozen to what was filed (`shown` in
                    OrderForm); this says why, so a parent who wants a change
                    knows where to ask for it. */}
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {r.doneLocked}
                </p>
              </>
            ) : failed ? (
              <>
                <p className="flex items-center gap-2 text-[0.95rem] font-extrabold text-berry-deep">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  {r.failedTitle}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {r.failedBody}
                </p>
              </>
            ) : (
              <p className="text-sm leading-relaxed text-muted">
                {sending
                  ? send.progress > 0
                    ? r.uploadingPhotos.replace(
                        "{done}",
                        String(Math.round(send.progress * 100))
                      )
                    : r.sending
                  : r.whyWhatsapp}
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {/* Before the order is filed: one button, and it files it. */}
            {!sent ? (
              <button
                type="button"
                onClick={onSend}
                disabled={sending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-berry px-6 py-3.5 text-base font-bold text-white shadow-soft ring-1 ring-cream/70 transition-all duration-200 hover:bg-berry-deep disabled:opacity-70"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : failed ? (
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                ) : null}
                {sending ? r.sending : failed ? r.retry : r.placeOrder}
              </button>
            ) : null}

            {/* WhatsApp: after the order is in, it is only about payment. It
                stays available in the failure branch too — a parent whose
                order we could not file must still have a way to reach us. */}
            {/* Tapping this on a filed order is the end of the flow: the form
                resets behind the dialog and the thank-you takes over, so the
                next child can be ordered for without a reload. On the FAILED
                branch it does none of that — nothing was filed, so the answers
                on screen are still the only copy of the brief. */}
            {sent || failed ? (
              <CtaButton
                href={waHref ?? CONTACT_URL}
                size="md"
                className="w-full"
                onClick={sent ? () => onFinish(waHref) : undefined}
              >
                {waHref ? (
                  <WhatsAppIcon className="h-5 w-5" />
                ) : (
                  <InstagramIcon className="h-5 w-5" aria-hidden="true" />
                )}
                {waHref ? r.send : r.sendFallback}
              </CtaButton>
            ) : null}

            {/* The phase-1 escape hatch, kept for exactly one case: the send
                failed, so nothing carries the brief but the parent. Once the
                order IS filed this button would only invite someone to paste a
                wall of text we already have. */}
            {failed ? (
              <button
                type="button"
                onClick={onCopyFull}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-brand-deep/80 bg-surface px-6 py-3 text-base font-bold text-brand-deep transition-colors hover:border-brand-deep hover:bg-brand-tint"
              >
                {copied ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                {copied ? r.copiedFull : r.copyFull}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
