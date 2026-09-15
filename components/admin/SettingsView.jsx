"use client";

import { useEffect, useState } from "react";
import { AdminButton, AdminField, Notice, Panel, PriceField } from "./AdminUi";
import { adminApi } from "@/lib/api";

/**
 * The price table — the one screen where a wrong number quietly mis-quotes
 * every future customer.
 *
 * **Empty means "still `[X]`", not zero.** The whole site renders an undecided
 * price as a bracket rather than inventing a plausible figure, and this form is
 * where "decided" happens. Clearing a field sends `null`, which puts that
 * bracket back everywhere — on the landing page, on the order form's chips, in
 * the running total, and in the WhatsApp message. It does not send `0`, which
 * would start quoting free books.
 *
 * The two structural zeros are absent on purpose: an 8-page story and the PDF
 * format are what the base price *is*, so they have no add-on to set.
 *
 * **Existing orders are untouched by anything here.** Each order froze its own
 * prices when it was placed, so raising the base tomorrow does not change what
 * a parent was quoted today.
 */
/**
 * Fetching is a separate component from rendering, and that split is not
 * stylistic.
 *
 * With both in one component — an early `if (!form) return …` followed by JSX
 * that reads `form.ageMax` — React Compiler hoists the memoised JSX block
 * above the early return, so the very first render reads a property off
 * `null` and the page crashes with "Cannot read properties of null". Making
 * the loaded state a prop means there is no render in which it can be absent.
 */
export default function SettingsView({ token }) {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    adminApi.settings(token).then((res) => {
      if (cancelled) return;
      if (!res.ok) {
        setError("ما قدرنا نجيب الإعدادات.");
        return;
      }
      setSettings(res.data.settings);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!settings) return <p className="py-16 text-center text-sm text-muted">عم نحمّل…</p>;
  return <SettingsForm token={token} initial={settings} />;
}

function SettingsForm({ token, initial }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");

    const res = await adminApi.saveSettings(token, {
      currency: form.currency,
      basePrice: form.basePrice,
      pages10Price: form.pages10Price,
      pages12Price: form.pages12Price,
      printPrice: form.printPrice,
      giftPagePrice: form.giftPagePrice,
      turnaroundDaysPdf: form.turnaroundDaysPdf,
      turnaroundDaysPrint: form.turnaroundDaysPrint,
      ageMin: form.ageMin,
      ageMax: form.ageMax,
      notifyEmail: form.notifyEmail,
      ordersOpen: form.ordersOpen,
    });
    setBusy(false);

    if (!res.ok) {
      setError(res.error || "ما انحفظت الإعدادات.");
      return;
    }
    setForm(res.data.settings);
    // The landing page caches the price table for five minutes and the order
    // page for thirty seconds, so say so rather than letting someone reload
    // the site, see the old number, and assume the save failed.
    setNotice("انحفظت الأسعار. بتظهر على الموقع خلال دقائق.");
  };

  const currency = form.currency || "JOD";

  return (
    <form onSubmit={save} className="flex flex-col gap-8">
      <Notice tone="error">{error}</Notice>
      <Notice tone="success">{notice}</Notice>

      <Panel title="الأسعار">
        <p className="text-sm leading-relaxed text-muted">
          خلّوا الخانة فاضية لأي سعر لسا ما تقرر — بيضل يطلع{" "}
          <span className="font-bold text-ink">[X]</span> على الموقع بدل رقم
          مخترع. الطلبات القديمة ما بتتأثر: كل طلب بيحفظ سعره وقت ما انطلب.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <PriceField
            id="basePrice"
            label="القصة الأساسية"
            hint="٨ صفحات، نسخة PDF — هاد الأساس اللي بينبني عليه الباقي."
            value={form.basePrice}
            onChange={set("basePrice")}
            currency={currency}
          />
          <PriceField
            id="printPrice"
            label="زيادة النسخة المطبوعة"
            hint="بينضاف على الأساس، مش بدل عنه."
            value={form.printPrice}
            onChange={set("printPrice")}
            currency={currency}
          />
          <PriceField
            id="pages10Price"
            label="زيادة ١٠ صفحات"
            hint="سعر الصفحتين الزيادة عن الأساس."
            value={form.pages10Price}
            onChange={set("pages10Price")}
            currency={currency}
          />
          <PriceField
            id="pages12Price"
            label="زيادة ١٢ صفحة"
            hint="سعر الأربع صفحات الزيادة عن الأساس."
            value={form.pages12Price}
            onChange={set("pages12Price")}
            currency={currency}
          />
          <PriceField
            id="giftPagePrice"
            label="صفحة الهدية"
            hint="صفحة مطبوعة زيادة فيها كلمة المُهدي."
            value={form.giftPagePrice}
            onChange={set("giftPagePrice")}
            currency={currency}
          />
          <AdminField
            id="currency"
            label="العملة"
            hint="بتظهر بالإيصالات وبلوحة التحكم."
            value={currency}
            onChange={(e) => set("currency")(e.target.value)}
          />
        </div>
      </Panel>

      <Panel title="مدة التجهيز">
        <p className="text-sm leading-relaxed text-muted">
          مدتين مختلفتين لأنهم شغلتين مختلفتين: النسخة الرقمية بتخلص لما تخلص
          القصة، والمطبوعة بدها طباعة وتوصيل كمان — فعادةً بتكون أطول. بتظهروا
          بصفحة الطلب حسب الصيغة اللي بيختارها الأهل، وبصفحة الأسئلة الشائعة.
          اتركوا أي وحدة فاضية وبتضل تطلع [X] لحد ما تقرروها.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <NumberField
            id="turnaroundDaysPdf"
            label="النسخة الرقمية PDF (أيام)"
            value={form.turnaroundDaysPdf}
            onChange={set("turnaroundDaysPdf")}
          />
          <NumberField
            id="turnaroundDaysPrint"
            label="النسخة المطبوعة (أيام)"
            value={form.turnaroundDaysPrint}
            onChange={set("turnaroundDaysPrint")}
          />
        </div>
      </Panel>

      <Panel title="تفاصيل الموقع">
        <p className="text-sm leading-relaxed text-muted">
          هدول بيعبّوا الأقواس اللي لسا مكتوبة [X-Y] بصفحة الأسئلة الشائعة.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <NumberField
            id="ageMin"
            label="أصغر عمر"
            value={form.ageMin}
            onChange={set("ageMin")}
          />
          <NumberField
            id="ageMax"
            label="أكبر عمر"
            value={form.ageMax}
            onChange={set("ageMax")}
          />
        </div>
      </Panel>

      <Panel title="الطلبات والإشعارات">
        <div className="grid gap-6 sm:grid-cols-2">
          <AdminField
            id="notifyEmail"
            label="إيميل إشعار الطلبات"
            hint="بنبعتلكم إشعار مختصر مع كل طلب. خلّوها فاضية لتوقفوا الإشعارات."
            type="email"
            value={form.notifyEmail ?? ""}
            onChange={(e) => set("notifyEmail")(e.target.value)}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-ink">استقبال الطلبات</span>
            <span className="text-xs leading-relaxed text-muted">
              لما تكون مقفلة، صفحة الطلب بتقول للأهل يراسلونا بدل ما يبعتوا طلب.
            </span>
            <span className="mt-auto flex items-center gap-3 rounded-xl border-2 border-brand-deep/25 bg-surface px-4 py-2.5">
              <input
                type="checkbox"
                checked={form.ordersOpen !== false}
                onChange={(e) => set("ordersOpen")(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-brand-deep)]"
              />
              <span className="text-[0.95rem] font-semibold text-ink">
                {form.ordersOpen !== false ? "مفتوحة" : "موقوفة"}
              </span>
            </span>
          </label>
        </div>
      </Panel>

      <div>
        <AdminButton type="submit" disabled={busy}>
          {busy ? "لحظة…" : "احفظوا التعديلات"}
        </AdminButton>
      </div>
    </form>
  );
}

/** Same empty-is-null contract as `PriceField`, without the currency suffix. */
function NumberField({ id, label, value, onChange }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-sm font-bold text-ink">{label}</span>
      <input
        id={id}
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        value={value ?? ""}
        placeholder="[X]"
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="control-text rounded-xl border-2 border-brand-deep/25 bg-surface px-4 py-2.5 tabular-nums text-ink outline-none transition-colors focus:border-brand-deep"
      />
    </label>
  );
}
