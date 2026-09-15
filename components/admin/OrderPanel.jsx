"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, Pencil, Trash2 } from "lucide-react";
import { AdminButton, Notice, Panel, Row, StatusPill } from "./AdminUi";
import PromptStudio from "./PromptStudio";
import BookStudio from "./BookStudio";
import {
  FIELD_LABEL,
  STATUSES,
  STATUS_LABEL,
  briefText,
  fileSize,
  label,
  money,
  pages,
  placeLabel,
  when,
} from "@/lib/admin";
import { adminApi } from "@/lib/api";
import { parseStoryJson } from "@/lib/prompts";
import { isPhone, toWhatsAppDigits } from "@/lib/phone";
import OrderEditForm from "./OrderEditForm";

/**
 * One order, in full — the screen the book is actually made from.
 *
 * It reads in the order the parent answered, because that is the order the AI
 * prompt templates consume: the child, then the story, then the product, then
 * how to reach them. `quirk` gets its own emphasis for the same reason it gets
 * the biggest control on the form — it is the single field that separates a
 * personalised story from a template with the name swapped.
 *
 * Two destructive actions live here, and they are deliberately different:
 * deleting the *photos* is routine hygiene once a book is delivered, and
 * deleting the *order* is not. Both confirm; only the second is admin-only.
 */
export default function OrderPanel({ token, orderId, role, onBack, onChanged }) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  // Gemini's answer, owned here because two panels below read it: the prompt
  // studio builds the image prompts from it and `BookPrint` lays the finished
  // book out from it. Asking the operator to paste the same JSON twice is how
  // the two end up disagreeing about what page 7 says.
  const [storyRaw, setStoryRaw] = useState("");
  // How much text goes on a page. Owned here rather than in the prompt panel
  // because it is written into the scene descriptions the story prompt asks
  // for AND into the framing rule every image prompt carries — the two have to
  // agree, or a long page composes a face straight into the band that will sit
  // on top of it.
  const [storyLength, setStoryLength] = useState("medium");
  const [orderValues, setOrderValues] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi.order(token, orderId).then((res) => {
      if (cancelled) return;
      if (!res.ok) {
        setError("ما قدرنا نجيب الطلب.");
        return;
      }
      setOrder(res.data.order);
      setOrderValues(res.data.values);
      setNotes(res.data.order.adminNotes ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [token, orderId]);

  const patch = async (body, message) => {
    setBusy(true);
    setNotice("");
    const res = await adminApi.updateOrder(token, orderId, body);
    setBusy(false);
    if (!res.ok) {
      setError("ما انحفظ التعديل.");
      return;
    }
    setError("");
    setOrder(res.data.order);
    if (res.data.values) setOrderValues(res.data.values);
    setNotice(message);
    // The list behind this panel shows status and photo count, so it has to be
    // told; otherwise going back shows the state from before the edit.
    onChanged?.();
    return res.data;
  };

  const removePhotos = async () => {
    if (!window.confirm("بدكم تحذفوا صور الطفل نهائياً؟ ما بنقدر نرجّعها.")) return;
    setBusy(true);
    const res = await adminApi.deleteOrderPhotos(token, orderId);
    setBusy(false);
    if (!res.ok || !res.data?.order) {
      // 502 is the specific one: the store did not confirm, so the API kept
      // the photos rather than clearing the row and calling it done. Saying
      // which it was matters — "try again" is useless advice if the operator
      // thinks the photos are already gone.
      setError(
        res.status === 502
          ? "التخزين ما أكّد الحذف، فالصور لسا موجودة. جربوا كمان مرة."
          : "ما قدرنا نحذف الصور."
      );
      return;
    }
    setOrder(res.data.order);
    // Only reachable when the store confirmed — this sentence is a promise the
    // API now actually checks before letting us make it.
    setNotice("انحذفت الصور من التخزين.");
    onChanged?.();
  };

  const removeOrder = async () => {
    if (!window.confirm("حذف الطلب كامل مع صوره؟ ما بنقدر نرجّعه.")) return;
    setBusy(true);
    const res = await adminApi.deleteOrder(token, orderId);
    setBusy(false);
    if (!res.ok) {
      setError(
        res.status === 502
          ? "التخزين ما أكّد حذف الصور، فما انحذف الطلب. جربوا كمان مرة."
          : "ما قدرنا نحذف الطلب."
      );
      return;
    }
    onChanged?.();
    onBack();
  };

  const copyBrief = async () => {
    try {
      await navigator.clipboard.writeText(briefText(order));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // Clipboard can be blocked (insecure context). The brief is on screen
      // and selectable, so there is still a way through.
      setCopied(false);
    }
  };

  if (error && !order) {
    return (
      <div className="flex flex-col gap-5">
        <BackButton onClick={onBack} />
        <Notice tone="error">{error}</Notice>
      </div>
    );
  }
  if (!order) return <p className="py-16 text-center text-sm text-muted">عم نحمّل…</p>;

  const { child, story, book, contact, price, photos } = order;
  const parsedStory = parseStoryJson(storyRaw, {
    expectedPages: story.pages,
    length: storyLength,
    requiresSupportingCharacter: Boolean(child.sidekick?.trim()),
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <BackButton onClick={onBack} />
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <h1 className="text-3xl font-extrabold tabular-nums text-ink">
            {order.reference}
          </h1>
          <StatusPill status={order.status} />
          <span className="text-sm text-muted">{when(order.createdAt)}</span>
        </div>
      </div>

      <Notice tone="error">{error}</Notice>
      <Notice tone="success">{notice}</Notice>

      {editing && orderValues ? (
        <OrderEditForm
          key={order.updatedAt}
          initialValues={orderValues}
          photoCount={photos.length}
          busy={busy}
          onCancel={() => setEditing(false)}
          onSave={async (answers) => {
            const saved = await patch(
              { answers },
              "انحفظت تعديلات بيانات العميل وصارت نسخة الطلب محدثة."
            );
            if (saved) setEditing(false);
          }}
        />
      ) : null}

      {/* ── The pipeline ───────────────────────────────────────────────── */}
      <Panel title="حالة الطلب">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy || s === order.status}
              onClick={() => patch({ status: s }, `صارت الحالة: ${STATUS_LABEL[s]}`)}
              aria-current={s === order.status ? "true" : undefined}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors disabled:cursor-default ${
                s === order.status
                  ? "border-brand-deep bg-brand-deep text-cream"
                  : "border-brand-deep/25 text-brand-deep hover:bg-brand-tint disabled:opacity-50"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        {order.deliveredAt ? (
          <p className="mt-4 text-sm text-muted">
            تم التسليم: {when(order.deliveredAt)}
          </p>
        ) : null}
      </Panel>

      {/* ── The brief ──────────────────────────────────────────────────── */}
      <Panel
        title="الطفل"
        action={
          <div className="flex flex-wrap justify-end gap-2">
            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              disabled={busy || editing}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              عدّلوا بيانات العميل
            </AdminButton>
            <AdminButton variant="outline" size="sm" onClick={copyBrief}>
              {copied ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              {copied ? "تم النسخ ✓" : "انسخوا الملخص"}
            </AdminButton>
          </div>
        }
      >
        <dl>
          <Row label={FIELD_LABEL.childName}>{child.childName}</Row>
          <Row label={FIELD_LABEL.childAge}>{child.childAge}</Row>
          <Row label={FIELD_LABEL.gender}>{label("gender", child.gender)}</Row>
          <Row label={FIELD_LABEL.trait1}>{child.trait1}</Row>
          <Row label={FIELD_LABEL.trait2}>{child.trait2}</Row>
          <Row label={FIELD_LABEL.favourite}>{child.favourite}</Row>
          <Row label={FIELD_LABEL.sidekick}>{child.sidekick}</Row>
          {child.sidekick ? (
            <Row label={FIELD_LABEL.sidekickRelation}>
              {label("sidekickRelation", child.sidekickRelation)}
            </Row>
          ) : null}
          {child.sidekick ? (
            <Row label={FIELD_LABEL.sidekickAge}>{child.sidekickAge}</Row>
          ) : null}
          {child.sidekickRelation === "pet" && child.petDescription ? (
            <Row label={FIELD_LABEL.petDescription}>{child.petDescription}</Row>
          ) : null}
        </dl>

        {/* The quirk is set apart because the story is built on it — the prompt
            weaves it through at two or more points. Burying it as row eight of
            a definition list is how it gets skimmed past. */}
        <div className="mt-6 border-s-[3px] border-gold ps-5">
          <p className="text-sm font-bold text-ink">{FIELD_LABEL.quirk}</p>
          <p className="mt-2 whitespace-pre-wrap text-base leading-loose text-ink">
            {child.quirk}
          </p>
        </div>
      </Panel>

      <Panel title="القصة">
        <dl>
          <Row label={FIELD_LABEL.storyType}>{label("storyType", story.storyType)}</Row>
          <Row label={FIELD_LABEL.storyChoice}>{story.storyChoice}</Row>
          <Row label={FIELD_LABEL.setting}>{story.setting}</Row>
          <Row label={FIELD_LABEL.tone}>{label("tone", story.tone)}</Row>
          <Row label={FIELD_LABEL.language}>{label("language", story.language)}</Row>
          <Row label={FIELD_LABEL.pages}>{pages(story.pages)}</Row>
          {/* The order form no longer asks for this — the story's dedication
              is written by us. Orders placed while it was still asked do carry
              one, so the row survives, shown only when there is something in
              it rather than as a permanent "—" on every new order. */}
          {story.dedication ? (
            <Row label={FIELD_LABEL.dedication}>{story.dedication}</Row>
          ) : null}
        </dl>
      </Panel>

      {story.avoid ? (
        <div className="border-s-[3px] border-berry-deep ps-5">
          <p className="text-sm font-bold text-berry-deep">
            {FIELD_LABEL.avoid} — لازم ما تنذكر بالقصة
          </p>
          <p className="mt-2 whitespace-pre-wrap text-base leading-loose text-ink">
            {story.avoid}
          </p>
        </div>
      ) : null}

      <Panel title="الكتاب والسعر">
        <dl>
          <Row label={FIELD_LABEL.format}>{label("format", book.format)}</Row>
          <Row label={FIELD_LABEL.city}>{placeLabel("city", book.city)}</Row>
          <Row label={FIELD_LABEL.area}>{placeLabel("area", book.area)}</Row>
          <Row label={FIELD_LABEL.isGift}>{label("isGift", book.isGift)}</Row>
          {book.isGift === "yes" || book.occasion ? (
            <Row label={FIELD_LABEL.occasion}>{label("occasion", book.occasion)}</Row>
          ) : null}
          {book.isGift === "yes" ? (
            <Row label={FIELD_LABEL.giftMessage}>{book.giftMessage}</Row>
          ) : null}
          <Row label={FIELD_LABEL.wantsAvatar}>
            {label("wantsAvatar", book.wantsAvatar)}
          </Row>
        </dl>

        {/* The price the parent was quoted, frozen at the moment they ordered.
            It does NOT move when the price table changes — an order in the
            queue costs what it cost when it was placed. */}
        <dl className="mt-6 rounded-xl border-2 border-brand-deep/25 bg-surface p-5">
          <Row label="القصة الأساسية">{money(price.base, price.currency)}</Row>
          {price.extraPages > 0 ? (
            <Row label={`صفحات إضافية (${pages(price.extraPages)})`}>
              {money(price.pages, price.currency)}
            </Row>
          ) : null}
          {price.format ? (
            <Row label="نسخة مطبوعة">{money(price.format, price.currency)}</Row>
          ) : null}
          {price.gift ? (
            <Row label="صفحة هدية">{money(price.gift, price.currency)}</Row>
          ) : null}
          <div className="flex items-baseline justify-between gap-4 border-t-2 border-ink/10 pt-3">
            <span className="font-bold text-ink">المجموع</span>
            <span className="text-lg font-extrabold tabular-nums text-berry-deep">
              {money(price.total, price.currency)}
            </span>
          </div>
        </dl>
      </Panel>

      <Panel title="التواصل">
        <dl>
          <Row label={FIELD_LABEL.parentName}>{contact.parentName}</Row>
          {/* The order form takes a phone number now, so the usual next move
              is to open the chat — one tap instead of copying digits out of a
              row. Guarded on `isPhone` because orders placed while the field
              accepted an Instagram handle still hold one, and `wa.me` does not
              error on a bad number, it opens a chat with nobody. `bdi` keeps a
              leading `+` at the start of a foreign number on this RTL page. */}
          <Row label={FIELD_LABEL.contactHandle}>
            {isPhone(contact.contactHandle) ? (
              <a
                href={`https://wa.me/${toWhatsAppDigits(contact.contactHandle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-brand-deep underline underline-offset-4 hover:text-brand"
              >
                <bdi dir="ltr">{contact.contactHandle}</bdi>
              </a>
            ) : (
              contact.contactHandle
            )}
          </Row>
          <Row label={FIELD_LABEL.notes}>{contact.notes}</Row>
        </dl>
      </Panel>

      {/* ── The photographs ────────────────────────────────────────────── */}
      <Panel
        title={`الصور المرجعية (${photos.length})`}
        action={
          photos.length ? (
            <AdminButton variant="danger" size="sm" onClick={removePhotos} disabled={busy}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              احذفوا الصور
            </AdminButton>
          ) : null
        }
      >
        {photos.length ? (
          <>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {photos.map((p) => (
                <li key={p.key}>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square overflow-hidden rounded-xl border-2 border-brand-deep/25 bg-surface"
                  >
                    {/* Remote host, no loader configured for it, and these are
                        thumbnails behind a login — next/image would only add an
                        optimiser round trip and a domain allowlist to maintain. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt={p.name || "صورة مرجعية"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </a>
                  <p className="mt-1.5 truncate text-xs text-muted">{fileSize(p.size)}</p>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-relaxed text-muted">
              روابط الصور مش مخمّنة بس مفتوحة لأي حدا معه الرابط — الحذف هو الطريقة
              الوحيدة لإلغائها. احذفوها بعد ما تسلّموا الكتاب.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">
            {book.wantsAvatar === "no"
              ? "ما في صور، وهاد صح — الأهل اختاروا شخصية عامة مش شبه طفلهم."
              : "ما في صور مع هالطلب. اطلبوها من الأهل بالمحادثة."}
          </p>
        )}
      </Panel>

      {/* ── Making the book ────────────────────────────────────────────
          Sits after the photographs on purpose: step 3 attaches them, so an
          operator who scrolls into this panel has just seen whether there are
          any. The prompts are built from `order` — see `lib/prompts.js`. */}
      <PromptStudio
        order={order}
        raw={storyRaw}
        onRawChange={setStoryRaw}
        parsed={parsedStory}
        length={storyLength}
        onLengthChange={setStoryLength}
      />

      {/* Laid out from the same paste, so the book and the prompts can never
          be built from two different versions of the story. */}
      <BookStudio order={order} story={parsedStory.state === "ok" ? parsedStory.story : null} />

      {/* ── Our own notes ──────────────────────────────────────────────── */}
      <Panel title="ملاحظاتنا">
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="control-text w-full rounded-xl border-2 border-brand-deep/25 bg-surface px-4 py-3 leading-relaxed text-ink outline-none transition-colors focus:border-brand-deep"
        />
        <div className="mt-4">
          <AdminButton
            onClick={() => patch({ adminNotes: notes }, "انحفظت الملاحظات.")}
            disabled={busy || notes === (order.adminNotes ?? "")}
          >
            احفظوا الملاحظات
          </AdminButton>
        </div>
      </Panel>

      {role === "admin" ? (
        <Panel title="حذف الطلب">
          <p className="text-sm leading-relaxed text-muted">
            بينحذف الطلب وصوره نهائياً. استعملوها بس للطلبات المكررة أو التجريبية.
          </p>
          <div className="mt-4">
            <AdminButton variant="danger" onClick={removeOrder} disabled={busy}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              احذفوا الطلب
            </AdminButton>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 text-sm font-bold text-brand-deep transition-colors hover:text-brand"
    >
      {/* "Back" points toward the start edge: right under rtl, left under ltr */}
      <ArrowRight className="h-4 w-4 ltr:hidden" aria-hidden="true" />
      <ArrowLeft className="h-4 w-4 rtl:hidden" aria-hidden="true" />
      رجوع للطلبات
    </button>
  );
}
