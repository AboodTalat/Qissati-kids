"use client";

import { ChevronDown } from "lucide-react";

/**
 * Form primitives for the order page, in the page's own language: hairlines
 * and type, no rounded pills or tinted tiles.
 *
 * The border weight is a contrast constraint, not a style choice. These
 * controls are a white fill on a cream page (≈1.05:1), so the border is the
 * only thing that makes them perceivable as controls — WCAG 1.4.11 wants 3:1
 * against the adjacent background. `brand-deep/70` measures 3.42:1 on cream;
 * anything lighter fails, the same way the old `outline` button's `brand/25`
 * did at 1.36:1.
 */

const CONTROL =
  "w-full rounded-xl border-2 border-brand-deep/70 bg-surface px-4 py-3 text-base " +
  "text-ink placeholder:text-muted/70 transition-colors hover:border-brand-deep " +
  "aria-[invalid=true]:border-berry-deep";

/**
 * Label + hint + error, shared by every control below.
 *
 * `h-full` + `mt-auto` on the control is what keeps a two-up row aligned. Grid
 * items stretch, so without it a field whose hint runs to one line sits its
 * input higher than the field beside it whose hint runs to two — which is why
 * "your name" floated above "WhatsApp number". Pushing the control to the
 * bottom of the cell aligns the inputs regardless of how long the labels and
 * hints above them turn out to be.
 */
function FieldShell({ id, label, hint, required, error, errorText, reserveError, children }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-error` : undefined;

  return (
    <div className="flex h-full flex-col gap-2">
      <label htmlFor={id} className="text-[0.95rem] font-bold text-ink">
        {label}
        {required ? (
          <span className="text-berry-deep" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}
      <div className="mt-auto pt-1">{children({ hintId, errId })}</div>
      {/* `reserveError` keeps the slot even when there is no error, and it is
          set on every field that shares a two-up row. Grid items stretch, and
          `mt-auto` bottom-anchors the control — so a field growing by one line
          of error text re-anchors the control of the field BESIDE it, which
          reads as the form jumping around while you are trying to fix it.
          Measured before this existed: an error on `childName` moved
          `childAge`'s input down 28px. Holding the line costs ~20px per
          two-up row and nothing anywhere else. */}
      {reserveError ? (
        <p
          id={errId}
          aria-live="polite"
          className="min-h-[1.25rem] text-sm font-semibold text-berry-deep"
        >
          {error ? errorText : ""}
        </p>
      ) : error ? (
        <p id={errId} className="text-sm font-semibold text-berry-deep">
          {errorText}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  id,
  label,
  hint,
  required,
  error,
  errorText,
  reserveError,
  value,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
  maxLength,
  pattern,
  // A phone number is LTR text however the page reads. Without this, a leading
  // `+` on an RTL page resolves against the paragraph and renders on the wrong
  // end of the number — `+962…` shows as `962…+`.
  dir,
  placeholder,
}) {
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      required={required}
      error={error}
      errorText={errorText}
      reserveError={reserveError}
    >
      {({ hintId, errId }) => (
        <input
          id={id}
          name={id}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          maxLength={maxLength}
          pattern={pattern}
          dir={dir}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={[hintId, errId].filter(Boolean).join(" ") || undefined}
          className={CONTROL}
        />
      )}
    </FieldShell>
  );
}

export function TextAreaField({
  id,
  label,
  hint,
  required,
  error,
  errorText,
  reserveError,
  value,
  onChange,
  rows = 4,
  maxLength,
}) {
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      required={required}
      error={error}
      errorText={errorText}
      reserveError={reserveError}
    >
      {({ hintId, errId }) => (
        <textarea
          id={id}
          name={id}
          rows={rows}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={[hintId, errId].filter(Boolean).join(" ") || undefined}
          className={`${CONTROL} leading-loose`}
        />
      )}
    </FieldShell>
  );
}

/**
 * A short closed list, as a native `<select>`.
 *
 * `ChoiceField` is the house pattern for a closed set, and it stays that for
 * two and three options. This exists for the one field with five, where five
 * radio cards would outweigh the optional question they belong to. Native
 * because the platform's own picker is better than anything rebuilt here on a
 * phone, and it keeps keyboard and screen-reader behaviour for free.
 *
 * The placeholder option is `disabled` only when the field is required: there
 * the blank is a starting state, not an answer. On an optional select the
 * blank IS an answer ("no city given"), and disabling it would let a parent
 * pick a value and then be unable to take it back.
 */
export function SelectField({
  id,
  label,
  hint,
  required,
  error,
  errorText,
  reserveError,
  value,
  onChange,
  placeholder,
  options, // [{ value, label }]
}) {
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      required={required}
      error={error}
      errorText={errorText}
      reserveError={reserveError}
    >
      {({ hintId, errId }) => (
        // `appearance-none` strips the platform's own arrow, so one has to be
        // drawn back — without it the control is indistinguishable from a text
        // input and nobody knows it opens. It sits on the END edge (`end-4`,
        // logical) so it lands left under RTL and right under LTR, and it is
        // `pointer-events-none` so clicking the arrow still opens the select.
        // `pe-11` keeps a long option label from running underneath it.
        <div className="relative">
          <select
            id={id}
            name={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={[hintId, errId].filter(Boolean).join(" ") || undefined}
            // `bg-surface` is repeated from CONTROL on purpose — a <select>
            // otherwise takes the UA's own control background, which is not the
            // page's cream and reads as a foreign widget.
            className={`${CONTROL} cursor-pointer appearance-none bg-surface pe-11`}
          >
            <option value="" disabled={Boolean(required)}>
              {placeholder}
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute end-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-deep"
          />
        </div>
      )}
    </FieldShell>
  );
}

/**
 * A set of choices. Real radios, visually hidden but focusable — so arrow keys,
 * screen readers and the browser's own validation all keep working, which a
 * div-with-onClick would throw away.
 */
export function ChoiceField({
  id,
  label,
  hint,
  required,
  error,
  errorText,
  value,
  onChange,
  options, // [{ value, label, hint, addon }]
  columns = 2,
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-error` : undefined;

  return (
    <fieldset
      className="flex flex-col gap-2"
      aria-invalid={error ? "true" : undefined}
      aria-describedby={[hintId, errId].filter(Boolean).join(" ") || undefined}
    >
      <legend className="text-[0.95rem] font-bold text-ink">
        {label}
        {required ? (
          <span className="text-berry-deep" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </legend>
      {hint ? (
        <p id={hintId} className="text-sm leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}

      <div
        className={`mt-1 grid gap-3 ${
          columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
        }`}
      >
        {options.map((opt) => {
          const checked = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`group flex cursor-pointer flex-col gap-1 rounded-xl border-2 px-4 py-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                checked
                  ? "border-brand-deep bg-brand-deep text-cream"
                  : "border-brand-deep/70 bg-surface text-ink hover:border-brand-deep"
              }`}
            >
              <input
                type="radio"
                name={id}
                value={opt.value}
                checked={checked}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-[0.95rem] font-bold">{opt.label}</span>
                {opt.addon ? (
                  <span
                    className={`text-sm font-bold ${
                      checked ? "text-gold-soft" : "text-berry-deep"
                    }`}
                  >
                    {opt.addon}
                  </span>
                ) : null}
              </span>
              {opt.hint ? (
                <span
                  className={`text-sm leading-relaxed ${
                    checked ? "text-cream/80" : "text-muted"
                  }`}
                >
                  {opt.hint}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>

      {error ? (
        <p id={errId} className="text-sm font-semibold text-berry-deep">
          {errorText}
        </p>
      ) : null}
    </fieldset>
  );
}

/** One numbered chapter of the form, matching the contents page in HowItWorks. */
export function FormSection({ n, title, note, children }) {
  return (
    <section className="border-t-2 border-ink/10 py-10 md:py-12">
      <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <div className="flex items-baseline gap-4">
            <span
              aria-hidden="true"
              className="text-3xl font-extrabold leading-none text-brand tabular-nums md:text-4xl"
            >
              {n}
            </span>
            <h2 className="text-xl font-extrabold leading-tight text-ink sm:text-2xl">
              {title}
            </h2>
          </div>
          {note ? (
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">{note}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-7">{children}</div>
      </div>
    </section>
  );
}
