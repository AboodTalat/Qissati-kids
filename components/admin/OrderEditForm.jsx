"use client";

import { useMemo, useState } from "react";
import { Save, X } from "lucide-react";
import { AdminButton, Notice, Panel } from "./AdminUi";
import { FIELD_LABEL, VALUE_LABEL } from "@/lib/admin";
import { areaOptions, cityOptions } from "@/lib/jordan";
import {
  FIELD_LIMITS,
  REQUIRED_FIELDS,
  normalizeOrderValues,
  orderProblems,
  validationIssue,
} from "@/lib/order";
import { isPhone } from "@/lib/phone";

const CONTROL =
  "control-text w-full rounded-xl border-2 border-brand-deep/25 bg-surface px-4 py-2.5 text-ink outline-none transition-colors focus:border-brand-deep aria-[invalid=true]:border-berry-deep";

const OPTIONS = {
  gender: VALUE_LABEL.gender,
  sidekickRelation: VALUE_LABEL.sidekickRelation,
  storyType: VALUE_LABEL.storyType,
  tone: VALUE_LABEL.tone,
  language: VALUE_LABEL.language,
  pages: { "8": "٨ صفحات", "10": "١٠ صفحات", "12": "١٢ صفحة" },
  format: VALUE_LABEL.format,
  isGift: VALUE_LABEL.isGift,
  occasion: VALUE_LABEL.occasion,
  wantsAvatar: VALUE_LABEL.wantsAvatar,
};

const asOptions = (values) =>
  Object.entries(values).map(([value, label]) => ({ value, label }));

/**
 * The authenticated correction form for the customer's submitted answers.
 * It deliberately sends the complete brief: the server validates it through
 * the same schema as a new order and accepts no protected order fields.
 */
export default function OrderEditForm({ initialValues, photoCount, busy, onCancel, onSave }) {
  const [values, setValues] = useState(() => ({ ...initialValues }));
  const [submitted, setSubmitted] = useState(false);
  const problems = useMemo(() => {
    const found = orderProblems(values);
    // Orders from before the phone-only form may hold an Instagram handle.
    // Preserve it when the operator is correcting another field; once they
    // touch the contact value, the current phone rule applies.
    if (
      values.contactHandle === initialValues.contactHandle &&
      initialValues.contactHandle &&
      !isPhone(initialValues.contactHandle)
    ) {
      return found.filter((key) => key !== "contactHandle");
    }
    return found;
  }, [initialValues.contactHandle, values]);

  const required = (key) =>
    REQUIRED_FIELDS.includes(key) ||
    (Boolean(values.sidekick?.trim()) &&
      (key === "sidekickRelation" || key === "sidekickAge")) ||
    (values.sidekickRelation === "pet" && key === "petDescription") ||
    (values.isGift === "yes" && key === "giftMessage");

  const errorText = (key) => {
    if (!submitted || !problems.includes(key)) return "";
    const issue = validationIssue(values, key);
    if (issue === "age") return "اكتبوا العمر كرقم صحيح.";
    if (issue === "phone") return "اكتبوا رقم واتساب صحيح.";
    if (issue === "tooLong") return "النص أطول من الحد المسموح.";
    if (issue === "choice") return "اختاروا قيمة من القائمة.";
    return "هاد الحقل مطلوب.";
  };

  const set = (key, value) => {
    setValues((previous) => {
      const next = { ...previous, [key]: value };
      if (key === "sidekick" && !value.trim()) {
        next.sidekickRelation = "";
        next.sidekickAge = "";
        next.petDescription = "";
      }
      if (key === "sidekickRelation" && value !== "pet") next.petDescription = "";
      if (key === "format" && value !== "print") {
        next.city = "";
        next.area = "";
      }
      if (key === "city" && value !== previous.city) next.area = "";
      if (key === "isGift" && value !== "yes") {
        next.occasion = "";
        next.giftMessage = "";
      }
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    const normalized = normalizeOrderValues(values);
    const nextProblems =
      normalized.contactHandle === initialValues.contactHandle &&
      initialValues.contactHandle &&
      !isPhone(initialValues.contactHandle)
        ? orderProblems(normalized).filter((key) => key !== "contactHandle")
        : orderProblems(normalized);
    if (nextProblems.length) {
      document.getElementById(`edit-${nextProblems[0]}`)?.focus();
      return;
    }
    await onSave(normalized);
  };

  const currentOption = (options, value) =>
    value && !options.some((option) => option.value === value)
      ? [{ value, label: value }, ...options]
      : options;

  return (
    <Panel
      title="تعديل بيانات الطلب"
      action={
        <AdminButton type="button" variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
          <X className="h-4 w-4" aria-hidden="true" />
          إلغاء
        </AdminButton>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-9" noValidate>
        <Notice>
          عدّلوا المعلومات اللي أكّدها العميل. رقم الطلب والصور والحالة والسعر المثبّت ما
          بتتغيّر من هون؛ إذا تغيّرت الصفحات أو الصيغة أو الهدية، راجعوا فرق السعر مع
          العميل.
        </Notice>

        <EditGroup title="الطفل">
          <Input name="childName" value={values.childName} onChange={set} required={required("childName")} error={errorText("childName")} />
          <Input name="childAge" value={values.childAge} onChange={set} required={required("childAge")} error={errorText("childAge")} inputMode="numeric" />
          <Select name="gender" value={values.gender} onChange={set} required={required("gender")} error={errorText("gender")} options={asOptions(OPTIONS.gender)} />
          <Input name="trait1" value={values.trait1} onChange={set} required={required("trait1")} error={errorText("trait1")} />
          <Input name="trait2" value={values.trait2} onChange={set} required={required("trait2")} error={errorText("trait2")} />
          <Input name="favourite" value={values.favourite} onChange={set} required={required("favourite")} error={errorText("favourite")} />
          <Input name="sidekick" value={values.sidekick} onChange={set} required={false} error={errorText("sidekick")} />
          {values.sidekick?.trim() ? (
            <>
              <Select name="sidekickRelation" value={values.sidekickRelation} onChange={set} required error={errorText("sidekickRelation")} options={asOptions(OPTIONS.sidekickRelation)} />
              <Input name="sidekickAge" value={values.sidekickAge} onChange={set} required error={errorText("sidekickAge")} inputMode="numeric" />
              {values.sidekickRelation === "pet" ? (
                <Textarea name="petDescription" value={values.petDescription} onChange={set} required error={errorText("petDescription")} className="sm:col-span-2" rows={3} />
              ) : null}
            </>
          ) : null}
          <Textarea name="quirk" value={values.quirk} onChange={set} required={required("quirk")} error={errorText("quirk")} className="sm:col-span-2" rows={5} />
        </EditGroup>

        <EditGroup title="القصة">
          <Select name="storyType" value={values.storyType} onChange={set} required={required("storyType")} error={errorText("storyType")} options={asOptions(OPTIONS.storyType)} />
          <Input name="storyChoice" value={values.storyChoice} onChange={set} required={required("storyChoice")} error={errorText("storyChoice")} />
          <Input name="setting" value={values.setting} onChange={set} required={false} error={errorText("setting")} />
          <Select name="tone" value={values.tone} onChange={set} required={required("tone")} error={errorText("tone")} options={asOptions(OPTIONS.tone)} />
          <Select name="language" value={values.language} onChange={set} required={required("language")} error={errorText("language")} options={asOptions(OPTIONS.language)} />
          <Select name="pages" value={values.pages} onChange={set} required options={asOptions(OPTIONS.pages)} error={errorText("pages")} />
          <Textarea name="avoid" value={values.avoid} onChange={set} required={false} error={errorText("avoid")} className="sm:col-span-2" rows={3} />
          {initialValues.dedication ? (
            <Textarea name="dedication" value={values.dedication} onChange={set} required={false} error="" className="sm:col-span-2" rows={3} />
          ) : null}
        </EditGroup>

        <EditGroup title="الكتاب والتوصيل">
          <Select name="format" value={values.format} onChange={set} required options={asOptions(OPTIONS.format)} error={errorText("format")} />
          {values.format === "print" ? (
            <>
              <Select name="city" value={values.city} onChange={set} required={false} options={currentOption(cityOptions(), values.city)} error={errorText("city")} />
              <Select name="area" value={values.area} onChange={set} required={false} options={currentOption(areaOptions(values.city), values.area)} error={errorText("area")} />
            </>
          ) : null}
          <Select name="isGift" value={values.isGift} onChange={set} required options={asOptions(OPTIONS.isGift)} error={errorText("isGift")} />
          {values.isGift === "yes" ? (
            <>
              <Select name="occasion" value={values.occasion} onChange={set} required={false} options={asOptions(OPTIONS.occasion)} error={errorText("occasion")} />
              <Textarea name="giftMessage" value={values.giftMessage} onChange={set} required error={errorText("giftMessage")} className="sm:col-span-2" rows={3} />
            </>
          ) : null}
          <Select name="wantsAvatar" value={values.wantsAvatar} onChange={set} required options={asOptions(OPTIONS.wantsAvatar)} error={errorText("wantsAvatar")} />
          {values.wantsAvatar === "no" && photoCount > 0 ? (
            <p className="self-end text-sm font-semibold leading-relaxed text-berry-deep">
              الطلب عليه صور. بعد الحفظ احذفوها من قسم الصور إذا العميل ما عاد بده نستخدم
              شبه الطفل.
            </p>
          ) : null}
        </EditGroup>

        <EditGroup title="التواصل">
          <Input name="parentName" value={values.parentName} onChange={set} required error={errorText("parentName")} autoComplete="name" />
          <Input name="contactHandle" value={values.contactHandle} onChange={set} required error={errorText("contactHandle")} inputMode="tel" autoComplete="tel" dir="ltr" />
          <Textarea name="notes" value={values.notes} onChange={set} required={false} error={errorText("notes")} className="sm:col-span-2" rows={4} />
        </EditGroup>

        {submitted && problems.length ? (
          <Notice tone="error">راجعوا الحقول المعلّمة قبل الحفظ.</Notice>
        ) : null}

        <div className="flex flex-wrap gap-3 border-t-2 border-ink/10 pt-5">
          <AdminButton type="submit" disabled={busy}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {busy ? "عم نحفظ…" : "احفظوا التعديلات"}
          </AdminButton>
          <AdminButton type="button" variant="outline" onClick={onCancel} disabled={busy}>
            إلغاء
          </AdminButton>
        </div>
      </form>
    </Panel>
  );
}

function EditGroup({ title, children }) {
  return (
    <fieldset>
      <legend className="mb-5 w-full border-b border-ink/10 pb-2 text-base font-extrabold text-ink">
        {title}
      </legend>
      <div className="grid gap-6 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function FieldShell({ name, required, error, className = "", children }) {
  const id = `edit-${name}`;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <label htmlFor={id} className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-sm font-bold text-ink">
        {FIELD_LABEL[name]}
        {required ? <span className="text-berry-deep"> *</span> : null}
      </span>
      {children(id, errorId)}
      {error ? (
        <span id={errorId} className="text-sm font-semibold text-berry-deep">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function Input({ name, value, onChange, required, error, ...props }) {
  return (
    <FieldShell name={name} required={required} error={error}>
      {(id, errorId) => (
        <input
          id={id}
          value={value ?? ""}
          onChange={(event) => onChange(name, event.target.value)}
          maxLength={FIELD_LIMITS[name]}
          required={required}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={errorId}
          className={CONTROL}
          {...props}
        />
      )}
    </FieldShell>
  );
}

function Textarea({ name, value, onChange, required, error, className, rows }) {
  return (
    <FieldShell name={name} required={required} error={error} className={className}>
      {(id, errorId) => (
        <textarea
          id={id}
          rows={rows}
          value={value ?? ""}
          onChange={(event) => onChange(name, event.target.value)}
          maxLength={FIELD_LIMITS[name]}
          required={required}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={errorId}
          className={`${CONTROL} leading-loose`}
        />
      )}
    </FieldShell>
  );
}

function Select({ name, value, onChange, required, error, options }) {
  return (
    <FieldShell name={name} required={required} error={error}>
      {(id, errorId) => (
        <select
          id={id}
          value={value ?? ""}
          onChange={(event) => onChange(name, event.target.value)}
          required={required}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={errorId}
          className={`${CONTROL} cursor-pointer`}
        >
          <option value="" disabled={required}>اختاروا…</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}
