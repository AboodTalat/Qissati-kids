"use client";

import { useState } from "react";
import { Check, Copy, Download, LoaderCircle } from "lucide-react";
import { AdminButton, Notice, Panel } from "./AdminUi";
import { pages as pagesLabel, photos as photosLabel } from "@/lib/admin";
import {
  LENGTH_HINT,
  LENGTH_LABEL,
  TEXT_LENGTHS,
  characterSheetPrompt,
  pagePrompts,
  storyPrompt,
  supportingCharacterSheetPrompt,
} from "@/lib/prompts";
import {
  buildStoryApprovalPdf,
  downloadStoryApprovalPdf,
  storyProofFilename,
  storyProofId,
} from "@/lib/story-proof";

const BASE_REVIEW_ITEMS = [
  { id: "facts", label: "الأسماء والأعمار والجنس وصلة رفيق القصة كلهم مطابقين للطلب." },
  { id: "language", label: "قرأنا النص بصوت عالٍ؛ اللغة طبيعية والاسم مكتوب بنفس الطريقة بكل الصفحات." },
  {
    id: "logic",
    label:
      "راجعنا القصة من الصفحة الأولى للأخيرة: سبب كل أثر أو دليل ظاهر بالنص قبل استخدامه، وكل صفحة بتحضّر للي بعدها.",
  },
  {
    id: "ageWords",
    label:
      "كل كلمة ضرورية لفهم الحدث مناسبة لعمر الطفل، وأي كلمة جديدة مفهومة فوراً من وصف بسيط بنفس الجملة.",
  },
  { id: "personal", label: "عادة الطفل وصفاته بتحرّك القصة، والطفل هو صاحب القرار بالحل." },
  {
    id: "safe",
    label:
      "تصرفات الطفل مناسبة لعمره؛ عند الحاجة الكبير قريب، والطفل مع هيك هو اللي بلاحظ وبختار وبيحل.",
  },
  { id: "visual", label: "أوصاف الرسمات متسلسلة ومتنوعة وما فيها نصوص أو تفاصيل متناقضة." },
];

/**
 * The six gated steps that turn one approved concept into finished artwork.
 *
 * The prompts themselves live in `lib/prompts.js`; this is the bench they are
 * worked from. It exists because the drudgery is real: a ten-page book is
 * twelve image prompts that differ only in one paragraph, and an operator
 * assembling those by hand in a text editor will eventually paste page 6's
 * scene under page 7's number — a mistake nobody catches until the printed
 * book is wrong.
 *
 * **Step 2 is why this is a component and not five buttons.** Gemini's JSON is
 * the hub: the character sheet needs the outfit out of it and every page
 * prompt needs that page's scene. So the operator pastes the answer back, and
 * the review, reference sheets and page prompts are derived from it during
 * render — no effect, no fetch, no
 * second copy of the story anywhere.
 *
 * That paste is deliberately not persisted. The story is not ours to store
 * beyond the order itself, it changes on every re-run, and the dashboard's
 * views are state rather than routes — so going back to the list and returning
 * clears it. Re-pasting costs one Cmd+V; a stale story silently generating
 * last week's page 7 costs a reprint.
 *
 * **The paste itself lives in `OrderPanel`, not here.** `BookPrint` lays the
 * finished book out from the same JSON, so this panel cannot be the only thing
 * that knows about it — the same reason `PhotoPicker` is controlled by
 * `OrderForm`. One paste, two panels.
 */
export default function PromptStudio({ order, raw, onRawChange, parsed, length, onLengthChange }) {
  // Which button last succeeded, not a boolean: there are up to fourteen of
  // them on this panel and they must not all tick at once.
  const [copiedKey, setCopiedKey] = useState("");
  const [conceptApproved, setConceptApproved] = useState(false);
  // New orders collect this from the parent on the public form. The local
  // fallback exists only for pet orders placed before that field existed.
  const [legacyPetDescription, setLegacyPetDescription] = useState("");
  const [reviewChecks, setReviewChecks] = useState({});
  const [proofBusy, setProofBusy] = useState(false);
  const [proofError, setProofError] = useState("");
  const [downloadedProofId, setDownloadedProofId] = useState("");
  const [parentApproved, setParentApproved] = useState(false);
  const [referencesApproved, setReferencesApproved] = useState(false);

  const copy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(""), 2400);
    } catch {
      // Blocked clipboard (an insecure context, usually). Every prompt on this
      // panel is also on screen inside a disclosure and selectable by hand, so
      // there is still a way through — say nothing rather than raise an error
      // for something the operator can just do themselves.
      setCopiedKey("");
    }
  };

  const story = parsed.state === "ok" ? parsed.story : null;

  const withLikeness = (order.book?.wantsAvatar ?? "yes") !== "no";
  const hasSidekick = Boolean(order.child?.sidekick?.trim());
  const isPet = hasSidekick && order.child?.sidekickRelation === "pet";
  const storedPetDescription = order.child?.petDescription?.trim() ?? "";
  const petDescription = storedPetDescription || legacyPetDescription.trim();
  const photoCount = order.photos?.length ?? 0;
  const written = story?.pages?.length ?? 0;
  const prompts = story ? pagePrompts(order, story, length) : [];
  const currentProofId = story ? storyProofId(story) : "";
  const proofDownloaded = Boolean(currentProofId && downloadedProofId === currentProofId);
  const reviewItems = isPet
    ? [
        ...BASE_REVIEW_ITEMS,
        {
          id: "pet",
          label: "نوع الحيوان ولونه وعلاماته مطابقين لوصف الأهل، مش تفاصيل اخترعها النموذج.",
        },
      ]
    : BASE_REVIEW_ITEMS;
  const storyReady = Boolean(conceptApproved && (!isPet || petDescription));
  const reviewReady =
    Boolean(story) && storyReady && reviewItems.every((item) => reviewChecks[item.id]);
  const parentReviewReady = Boolean(reviewReady && proofDownloaded && parentApproved);
  const needsReferenceSheet = withLikeness || hasSidekick;
  const referenceReady =
    parentReviewReady &&
    (!withLikeness || photoCount > 0) &&
    (!needsReferenceSheet || referencesApproved);
  const attachmentHint = withLikeness
    ? hasSidekick
      ? "، وبكل مرة أرفقوا ورقة الطفل وورقة رفيق القصة"
      : "، وبكل مرة أرفقوا نفس ورقة الطفل"
    : hasSidekick
      ? "، وبكل مرة أرفقوا ورقة رفيق القصة"
      : "";

  const changeRaw = (value) => {
    onRawChange(value);
    setReviewChecks({});
    setProofError("");
    setDownloadedProofId("");
    setParentApproved(false);
    setReferencesApproved(false);
  };

  const changeLength = (value) => {
    onLengthChange(value);
    setReviewChecks({});
    setProofError("");
    setDownloadedProofId("");
    setParentApproved(false);
    setReferencesApproved(false);
  };

  const createParentProof = async () => {
    if (!story || !reviewReady || proofBusy) return;
    setProofBusy(true);
    setProofError("");
    try {
      const result = await buildStoryApprovalPdf(order, story);
      if (!result.fontOk) {
        setProofError(
          "خط Cairo ما اكتمل تحميله، فما نزّلنا ملف ممكن يطلع بخط غلط. حدّثوا الصفحة وجربوا كمان مرة."
        );
        return;
      }
      downloadStoryApprovalPdf(
        result.bytes,
        storyProofFilename(order, result.proofId)
      );
      setDownloadedProofId(result.proofId);
      if (downloadedProofId !== result.proofId) setParentApproved(false);
    } catch {
      setProofError("ما قدرنا نبني ملف مراجعة القصة. حدّثوا الصفحة وجربوا كمان مرة.");
    } finally {
      setProofBusy(false);
    }
  };

  return (
    <Panel title="برومبتات الذكاء الاصطناعي">
      <p className="text-sm leading-loose text-muted">
        ست خطوات بالترتيب. البرومبتات بتنبنى من الطلب، وبعد المراجعة الداخلية بننزّل
        نسخة نص واضحة للأهل. القصة بتنكتب بمسار سببي من أول صفحة لآخر صفحة، وما
        بتنفتح رسمات الصفحات قبل موافقة الأهل عليها.
      </p>

      <div className="mt-7 flex flex-col gap-7">
        {/* ── 1 ─────────────────────────────────────────────────────────── */}
        <Step
          number="١"
          title="نص القصة"
          hint="الصقوه بـ Gemini. البرومبت بخطّط مسار القصة صفحة بصفحة، وبيرجّع العنوان، الملخّص، الإهداء، نص كل صفحة ووصف رسمتها بصيغة JSON."
        >
          {/* Not a knob: the length decides how many words, who the book is
              for, and how much of each illustration the text will cover — and
              that last one is written into the scene descriptions, so it has to
              be chosen before the story is generated, not after. */}
          <div className="mb-4 flex flex-col gap-2">
            <span className="text-xs text-muted">طول النص بكل صفحة:</span>
            <div className="flex flex-wrap gap-2">
              {TEXT_LENGTHS.map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={length === l}
                  onClick={() => changeLength(l)}
                  className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors ${
                    length === l
                      ? "border-brand-deep bg-brand-deep text-cream"
                      : "border-brand-deep/25 text-brand-deep hover:bg-brand-tint"
                  }`}
                >
                  {LENGTH_LABEL[l]}
                </button>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-muted">{LENGTH_HINT[length]}</p>
          </div>

          {isPet && !storedPetDescription ? (
            <label htmlFor="pet-prompt-details" className="mb-4 flex flex-col gap-1.5">
              <span className="text-sm font-bold text-ink">وصف الحيوان للطلب القديم</span>
              <span className="text-xs leading-relaxed text-muted">
                هاد الطلب انعمل قبل ما نضيف سؤال وصف الحيوان للنموذج. اكتبوا هون
                النوع واللون أو السلالة وأي علامة مميزة بعد تأكيدها.
              </span>
              <textarea
                id="pet-prompt-details"
                rows={3}
                value={legacyPetDescription}
                onChange={(e) => {
                  setLegacyPetDescription(e.target.value);
                  setReviewChecks({});
                  setProofError("");
                  setDownloadedProofId("");
                  setParentApproved(false);
                  setReferencesApproved(false);
                }}
                className="control-text rounded-xl border-2 border-brand-deep/25 bg-surface px-4 py-3 leading-relaxed text-ink outline-none transition-colors focus:border-brand-deep"
              />
            </label>
          ) : null}

          <label className="mb-4 flex min-h-[24px] cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink">
            <input
              type="checkbox"
              checked={conceptApproved}
              onChange={(e) => {
                setConceptApproved(e.target.checked);
                setReviewChecks({});
                setProofError("");
                setDownloadedProofId("");
                setParentApproved(false);
                setReferencesApproved(false);
              }}
              className="mt-1 h-4 w-4 shrink-0 accent-brand-deep"
            />
            <span>اتفقنا مع الأهل على فكرة القصة والتفاصيل قبل توليد النص الكامل.</span>
          </label>

          {!storyReady ? (
            <Notice>
              {isPet && !petDescription
                ? "أضيفوا وصف الحيوان المؤكد لهذا الطلب القديم ووافقوا مع الأهل على الفكرة أول."
                : "وافقوا مع الأهل على فكرة القصة أول، وبعدها بينفتح برومبت النص."}
            </Notice>
          ) : null}

          <PromptBlock
            id={`story-${length}`}
            text={storyPrompt(order, length, { petDetails: petDescription })}
            copiedKey={copiedKey}
            onCopy={copy}
            buttonLabel="انسخوا برومبت القصة"
            disabled={!storyReady}
          />
        </Step>

        {/* ── 2 ─────────────────────────────────────────────────────────── */}
        <Step
          number="٢"
          title="الصقوا رد Gemini"
          hint="انسخوا الرد كامل والصقوه هون. مش لازم تشيلوا الكلام اللي قبله أو بعده ولا علامات الـ code block — بنطلّع الـ JSON من بينهم."
        >
          <textarea
            rows={5}
            value={raw}
            onChange={(e) => changeRaw(e.target.value)}
            dir="ltr"
            aria-label="رد Gemini"
            className="control-text w-full rounded-xl border-2 border-brand-deep/25 bg-surface px-4 py-3 text-start font-mono leading-relaxed text-ink outline-none transition-colors focus:border-brand-deep"
          />
          <div className="mt-3 flex flex-col gap-3">
            {parsed.state === "invalid" ? (
              <div className="flex flex-col gap-2">
                <Notice tone="error">
                  ما قدرنا نقرأ الـ JSON.
                  {parsed.where?.line
                    ? ` المشكلة بالسطر ${parsed.where.line}، الحرف ${parsed.where.column}.`
                    : ""}{" "}
                  أكتر سبب: Gemini حط علامة تنصيص مزدوجة {'"'} جوّا النص — خلّوه يعيد
                  الرد ويستعمل «» بدلها.
                </Notice>
                {/* The line itself, not just its number. An operator can fix a
                    stray quote by hand in seconds once they can see it; a
                    position with nothing to look at is a puzzle. */}
                {parsed.where?.source ? (
                  <pre
                    dir="ltr"
                    className="overflow-x-auto rounded-xl border-2 border-berry-deep/40 bg-berry/5 p-3 text-start font-mono text-xs leading-relaxed text-ink"
                  >
                    {parsed.where.source}
                  </pre>
                ) : null}
              </div>
            ) : null}
            {parsed.state === "incomplete" ? (
              <div className="flex flex-col gap-2">
                <Notice tone="error">
                  قدرنا نقرأ الـ JSON، بس لسا مش كتاب كامل. ما بتنفتح الرسمات قبل ما
                  تصلّحوا كل النقاط:
                </Notice>
                <ul className="list-disc space-y-1 ps-6 text-sm leading-relaxed text-berry-deep">
                  {(parsed.issues ?? []).map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {/* Said out loud, never silently. A model that mangled its own
                quoting may have mangled something else, and the operator is
                about to build a whole book on this. */}
            {story && parsed.repaired ? (
              <Notice tone="error">
                الـ JSON كان فيه علامات تنصيص مش مظبوطة وصلّحناها لحالنا. اقرأوا نصوص
                الصفحات تحت وتأكدوا إنها طالعة صح قبل ما تكملوا.
              </Notice>
            ) : null}
            {story ? (
              <Notice tone="success">
                {/* `pagesLabel`, not `${n} صفحة` — Arabic needs four forms and
                    the bare concatenation produces "10 صفحة". Same rule the
                    order form and the rest of the dashboard follow. */}
                تمام — {pagesLabel(written)}
                {story.title ? ` · ${story.title}` : ""}
              </Notice>
            ) : null}
          </div>
        </Step>

        {/* ── 3 ─────────────────────────────────────────────────────────── */}
        <Step
          number="٣"
          title="المراجعة البشرية"
          hint="نجاح الـ JSON يعني إن بنيته كاملة، مش إن القصة صارت جاهزة للرسم. لازم شخص يقرأها ويوافق عليها."
        >
          {!story ? (
            <p className="text-sm leading-loose text-muted">
              ألصقوا قصة كاملة وصالحة بالخطوة ٢، وبعدها بتظهر قائمة المراجعة.
            </p>
          ) : (
            <fieldset className="flex flex-col gap-3">
              <legend className="sr-only">قائمة مراجعة القصة</legend>
              {reviewItems.map((item) => (
                <label
                  key={item.id}
                  className="flex min-h-[24px] cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(reviewChecks[item.id])}
                    onChange={(e) =>
                      setReviewChecks((current) => ({
                        ...current,
                        [item.id]: e.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-brand-deep"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
              {reviewReady ? (
                <Notice tone="success">
                  تمت مراجعة القصة — نزّلوا نسخة الأهل بالخطوة ٤ وخذوا موافقتهم.
                </Notice>
              ) : (
                <Notice>كمّلوا كل نقاط المراجعة عشان تنفتح نسخة موافقة الأهل.</Notice>
              )}
            </fieldset>
          )}
        </Step>

        {/* ── 4 ─────────────────────────────────────────────────────────── */}
        <Step
          number="٤"
          title="موافقة الأهل على النص"
          hint="ملف PDF مرتب فيه العنوان، ملخّص القصة، الإهداء، ونص كل صفحة فقط. ما فيه JSON ولا برومبتات أو تعليمات داخلية."
        >
          {!reviewReady ? (
            <Notice>كمّلوا المراجعة البشرية بالخطوة ٣ أول.</Notice>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <AdminButton onClick={createParentProof} disabled={proofBusy}>
                  {proofBusy ? (
                    <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download aria-hidden="true" className="h-4 w-4" />
                  )}
                  {proofBusy
                    ? "جاري تجهيز الملف..."
                    : proofDownloaded
                      ? "نزّلوا ملف الـ PDF مرة ثانية"
                      : "نزّلوا ملف مراجعة القصة PDF"}
                </AdminButton>
                {proofDownloaded ? (
                  <span dir="ltr" className="font-mono text-sm font-bold text-brand-deep">
                    {currentProofId}
                  </span>
                ) : null}
              </div>

              {proofError ? <Notice tone="error">{proofError}</Notice> : null}
              {proofDownloaded ? (
                <>
                  <Notice tone="success">
                    نزلت النسخة {currentProofId}. ابعثوا نفس الملف للأهل؛ الرمز بيثبت
                    أي نص وافقوا عليه.
                  </Notice>
                  <label className="flex min-h-[24px] cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink">
                    <input
                      type="checkbox"
                      checked={parentApproved}
                      onChange={(e) => {
                        setParentApproved(e.target.checked);
                        setReferencesApproved(false);
                      }}
                      className="mt-1 h-4 w-4 shrink-0 accent-brand-deep"
                    />
                    <span>
                      الأهل وافقوا بوضوح على النسخة{" "}
                      <bdi dir="ltr" className="font-mono font-bold">
                        {currentProofId}
                      </bdi>
                      ، أو طلبوا تعديلات وانعملت قبل تنزيل هالنسخة.
                    </span>
                  </label>
                  {parentApproved ? (
                    <Notice tone="success">
                      تم اعتماد النص من الأهل — بتقدروا تثبّتوا الشخصيات.
                    </Notice>
                  ) : (
                    <Notice>استنوا رد الأهل قبل ما تبدأوا بالشخصيات والرسمات.</Notice>
                  )}
                </>
              ) : (
                <Notice>
                  الملف مربوط بكلمات القصة نفسها. أي تعديل على النص بيلغي هالموافقة
                  وبيطلع رمز نسخة جديد.
                </Notice>
              )}
            </div>
          )}
        </Step>

        {/* ── 5 ─────────────────────────────────────────────────────────── */}
        <Step
          number="٥"
          title="أوراق الشخصيات"
          hint="كل شخصية متكررة إلها مرجع ثابت. صور الطفل بتنرفع مرة وحدة هون، وبعدها منستعمل أوراق الشخصيات فقط."
        >
          {!parentReviewReady ? (
            <Notice>نزّلوا نسخة النص وخذوا موافقة الأهل بالخطوة ٤ أول.</Notice>
          ) : (
            <div className="flex flex-col gap-5">
              {withLikeness ? (
                photoCount === 0 ? (
                  <Notice tone="error">
                    ما في صور مرفوعة مع هالطلب، فما في إشي نبني عليه ورقة الطفل. اطلبوها
                    من الأهل بالمحادثة.
                  </Notice>
                ) : (
                  <PromptBlock
                    id="sheet-main"
                    text={characterSheetPrompt(order, story)}
                    copiedKey={copiedKey}
                    onCopy={copy}
                    buttonLabel={`انسخوا برومبت ورقة الطفل (${photosLabel(photoCount)})`}
                  />
                )
              ) : (
                <div className="border-s-[3px] border-gold ps-5">
                  <p className="text-[0.95rem] leading-loose text-ink">
                    الأهل اختاروا شخصية عامة، فما في ورقة مبنية من صور. وصف{" "}
                    <code dir="ltr" className="font-mono text-sm">
                      character_brief
                    </code>{" "}
                    هو المرجع الثابت للطفل.
                  </p>
                </div>
              )}

              {hasSidekick ? (
                <PromptBlock
                  id="sheet-sidekick"
                  text={supportingCharacterSheetPrompt(order, story)}
                  copiedKey={copiedKey}
                  onCopy={copy}
                  buttonLabel="انسخوا برومبت ورقة رفيق القصة"
                />
              ) : null}

              {(!withLikeness || photoCount > 0) && needsReferenceSheet ? (
                <label className="flex min-h-[24px] cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink">
                  <input
                    type="checkbox"
                    checked={referencesApproved}
                    onChange={(e) => setReferencesApproved(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-brand-deep"
                  />
                  <span>
                    ولّدنا أوراق الشخصيات وراجعنا العمر والشكل واللبس والعلامات، واعتمدنا
                    النسخ النهائية.
                  </span>
                </label>
              ) : null}
            </div>
          )}
        </Step>

        {/* ── 6 ─────────────────────────────────────────────────────────── */}
        <Step
          number="٦"
          title="رسمات الصفحات"
          hint={`كل وحدة لحالها بـ Nano Banana Pro${attachmentHint}. زر كل صفحة بنسخ برومبتها وتعليماتها كاملة لحالها؛ استعملوا الأوراق كمراجع هوية فقط، ونزّلوا الملفات بالترتيب.`}
        >
          {!story ? (
            <p className="text-sm leading-loose text-muted">
              ألصقوا رد Gemini بالخطوة ٢ وبتظهر هون.
            </p>
          ) : !referenceReady ? (
            <Notice>
              خذوا موافقة الأهل واعتمدوا أوراق الشخصيات بالخطوتين ٤ و٥ عشان تنفتح
              الرسمات.
            </Notice>
          ) : (
            <ul>
              {prompts.map((p) => (
                <li
                  key={p.key}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 py-3 last:border-b-0"
                >
                  <span className="text-[0.95rem] font-bold text-ink">{p.label}</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <PromptPeek text={p.text} />
                    <AdminButton
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label={`نسخ البرومبت والتعليمات لـ ${p.label}`}
                      onClick={() => copy(p.key, p.text)}
                    >
                      <CopyIcon done={copiedKey === p.key} />
                      <span aria-live="polite">
                        {copiedKey === p.key
                          ? "تم نسخ البرومبت والتعليمات"
                          : "انسخوا البرومبت والتعليمات"}
                      </span>
                    </AdminButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Step>
      </div>
    </Panel>
  );
}

/**
 * One step: a hanging Arabic numeral, a heading, an optional line, the body.
 *
 * The same shape the site's HowItWorks uses — hanging numerals against a rule
 * rather than numbers in tinted circles — so the dashboard keeps reading as
 * the same product.
 */
function Step({ number, title, hint, children }) {
  return (
    <section className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
      <span
        aria-hidden="true"
        className="self-start text-2xl font-extrabold tabular-nums text-brand-deep/45"
      >
        {number}
      </span>
      <div>
        <h3 className="text-base font-extrabold text-ink">{title}</h3>
        {hint ? <p className="mt-1.5 text-sm leading-loose text-muted">{hint}</p> : null}
      </div>
      <div className="col-start-2">{children}</div>
    </section>
  );
}

/** A copy button with the prompt itself one disclosure away. */
function PromptBlock({ id, text, copiedKey, onCopy, buttonLabel, disabled = false }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <AdminButton
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onCopy(id, text)}
      >
        <CopyIcon done={copiedKey === id} />
        {copiedKey === id ? "تم النسخ" : buttonLabel}
      </AdminButton>
      {!disabled ? <PromptPeek text={text} /> : null}
    </div>
  );
}

/**
 * The prompt, readable and selectable.
 *
 * It is the clipboard's fallback — `navigator.clipboard` is unavailable on an
 * insecure origin and blocked by some policies — and it is also the only way
 * to check what is about to be sent to a third-party web app before sending
 * it. `dir="ltr"` because the prompts are English inside an RTL page; without
 * it every line's punctuation lands on the wrong end.
 */
function PromptPeek({ text }) {
  return (
    <details className="group">
      <summary className="inline-flex min-h-[24px] cursor-pointer list-none items-center py-1 text-sm font-bold text-brand-deep underline underline-offset-4 hover:text-brand">
        <span className="group-open:hidden">شوفوا البرومبت</span>
        <span className="hidden group-open:inline">إخفاء</span>
      </summary>
      <pre
        dir="ltr"
        className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border-2 border-brand-deep/25 bg-surface p-4 text-start font-mono text-xs leading-relaxed text-ink"
      >
        {text}
      </pre>
    </details>
  );
}

function CopyIcon({ done }) {
  return done ? (
    <Check className="h-4 w-4" aria-hidden="true" />
  ) : (
    <Copy className="h-4 w-4" aria-hidden="true" />
  );
}
