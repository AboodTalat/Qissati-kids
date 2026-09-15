"use client";

import { STATUS_LABEL, STATUS_TONE } from "@/lib/admin";

/**
 * The dashboard's shared parts.
 *
 * They follow the same rules the public site does — ruled rows rather than
 * cards, hairlines rather than shadows, one accent doing one job — because a
 * dashboard bolted onto a brand in a different visual language reads as a
 * different product. The palette is the site's tokens, unchanged.
 */

export function AdminButton({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50";
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-2.5 text-[0.95rem]",
  };
  const variants = {
    // `ring-cream/70` for the same reason the site's primary button carries it:
    // berry and the teals sit close in luminance, so the fill alone does not
    // give the control a perceivable edge (WCAG 1.4.11).
    primary: "bg-berry text-white ring-1 ring-cream/70 hover:bg-berry-deep",
    outline:
      "border-2 border-brand-deep/80 bg-surface text-brand-deep hover:border-brand-deep hover:bg-brand-tint",
    ghost: "text-brand-deep hover:bg-brand-tint",
    danger: "border-2 border-berry-deep/80 text-berry-deep hover:bg-berry/10",
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-bold ${
        STATUS_TONE[status] ?? STATUS_TONE.new
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

/** A labelled text input. `hint` sits under the label, never as a placeholder. */
export function AdminField({ label, hint, id, className = "", ...props }) {
  return (
    <label htmlFor={id} className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-sm font-bold text-ink">{label}</span>
      {hint ? <span className="text-xs leading-relaxed text-muted">{hint}</span> : null}
      <input
        id={id}
        className="control-text mt-auto rounded-xl border-2 border-brand-deep/25 bg-surface px-4 py-2.5 text-ink outline-none transition-colors focus:border-brand-deep"
        {...props}
      />
    </label>
  );
}

/**
 * A price input.
 *
 * Empty is `null`, not `0`. That distinction is the whole placeholder rule:
 * `null` means "still `[X]`" and 0 means "free", and a control that turned a
 * cleared field into zero would silently start quoting free books.
 */
export function PriceField({ label, hint, id, value, onChange, currency }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-sm font-bold text-ink">{label}</span>
      {hint ? <span className="text-xs leading-relaxed text-muted">{hint}</span> : null}
      <span className="mt-auto flex items-center gap-2">
        <input
          id={id}
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={value ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === "" ? null : Number(raw));
          }}
          placeholder="[X]"
          className="control-text w-full rounded-xl border-2 border-brand-deep/25 bg-surface px-4 py-2.5 tabular-nums text-ink outline-none transition-colors focus:border-brand-deep"
        />
        <span className="shrink-0 text-sm font-bold text-muted">{currency}</span>
      </span>
    </label>
  );
}

/** One row of a definition list — the dashboard's unit of reading. */
export function Row({ label, children }) {
  return (
    <div className="grid gap-1 border-b border-ink/10 py-3 last:border-b-0 sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-[0.95rem] leading-relaxed text-ink">{children || "—"}</dd>
    </div>
  );
}

/** A section of the dashboard: a ruled heading and its content. */
export function Panel({ title, action, children, className = "" }) {
  return (
    <section className={className}>
      <div className="flex items-center justify-between gap-4 border-b-2 border-ink/10 pb-3">
        <h2 className="text-lg font-extrabold text-ink">{title}</h2>
        {action}
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}

/**
 * One live region for whatever just happened.
 *
 * Every mutating action in this dashboard reports through here rather than
 * through a toast that disappears before it is read — an operator who missed
 * "the price did not save" would go on believing it did.
 */
export function Notice({ tone = "info", children }) {
  if (!children) return null;
  const tones = {
    info: "border-brand-deep/40 bg-brand-tint text-brand-deep",
    error: "border-berry-deep/50 bg-berry/10 text-berry-deep",
    success: "border-brand-deep bg-brand-tint text-brand-deep",
  };
  return (
    <p
      aria-live="polite"
      className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold ${tones[tone]}`}
    >
      {children}
    </p>
  );
}

export function Empty({ children }) {
  return (
    <p className="border-t border-ink/10 py-12 text-center text-sm text-muted">
      {children}
    </p>
  );
}
