"use client";

import { useState } from "react";
import { Logo } from "../Logo";
import { AdminButton, AdminField, Notice } from "./AdminUi";

/**
 * The PIN prompt.
 *
 * It is deliberately quieter than `LoginView`: no wordmark beyond the logo,
 * no mention of orders or prices, no hint that a dashboard is behind it. A
 * visitor who guessed the URL should learn nothing from this screen, and the
 * team already knows what they are unlocking.
 *
 * The PIN is posted and checked on the server — see `lib/admin-gate.js` for
 * why it can never be checked here — and the answer arrives as an httpOnly
 * cookie this component cannot read. So on success it simply reloads: the
 * proxy is what decides what `/admin` renders, and now it will decide
 * differently.
 */
export default function GateView() {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    let res;
    try {
      res = await fetch("/api/admin-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
    } catch {
      setBusy(false);
      setError("ما قدرنا نوصل للخادم. تأكدوا من الاتصال وجربوا كمان مرة.");
      return;
    }

    if (res.ok) {
      // Not a router refresh: the gate lives in the proxy, above the router,
      // so the whole document has to be asked for again.
      window.location.reload();
      return;
    }

    setBusy(false);
    setError(
      res.status === 429
        ? "محاولات كتير. جرّبوا بعد ربع ساعة."
        : "الرمز غلط."
    );
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-16">
      <Logo markClass="h-11" wordmark="قصتي" priority />

      <h1 className="mt-8 text-2xl font-extrabold leading-[1.3] text-ink">
        رمز الدخول
      </h1>
      <p className="mt-3 text-base leading-loose text-muted">
        هاي الصفحة للفريق. أدخلوا الرمز للمتابعة.
      </p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
        <AdminField
          id="admin-gate-pin"
          label="الرمز"
          type="password"
          autoComplete="off"
          autoFocus
          required
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />

        <Notice tone="error">{error}</Notice>

        <AdminButton type="submit" disabled={busy || pin.trim() === ""}>
          {busy ? "لحظة…" : "متابعة"}
        </AdminButton>
      </form>
    </main>
  );
}
