"use client";

import { useState } from "react";
import { Logo } from "../Logo";
import { AdminButton, AdminField, Notice } from "./AdminUi";
import { adminApi, apiConfigured } from "@/lib/api";

/**
 * The sign-in screen.
 *
 * The error message is whatever the server said, and the server deliberately
 * says the same thing for a wrong email and a wrong password — telling an
 * attacker which half they got right is how an account list gets enumerated.
 *
 * `expired` distinguishes the two ways this screen is reached. Arriving here
 * because a token ran out mid-queue is not the same event as opening the
 * dashboard cold, and a login form that says nothing about it reads as the
 * dashboard having thrown the work away.
 */
export default function LoginView({ onSignedIn, expired = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const configured = apiConfigured();

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    const res = await adminApi.login(email.trim(), password);
    setBusy(false);

    // An ok response with no token is not a sign-in. `request()` returns a
    // null body when the response would not parse as JSON — a gateway error
    // page, say — and reading `.token` off that used to throw inside this
    // handler, which left the form looking untouched: no error, no progress,
    // nothing to try.
    if (res.ok && !res.data?.token) {
      setError("وصلنا رد مش مفهوم من الخادم. جربوا كمان مرة.");
      return;
    }

    if (!res.ok) {
      setError(
        res.error === "network" || res.error === "timeout"
          ? "ما قدرنا نوصل للخادم. تأكدوا من الاتصال وجربوا كمان مرة."
          : res.error === "not-configured"
            ? "عنوان الخادم مش مضبوط (NEXT_PUBLIC_QISSATI_API)."
            : "الإيميل أو كلمة السر غلط."
      );
      return;
    }
    onSignedIn(res.data.token, res.data.user);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-16">
      <Logo markClass="h-11" wordmark="قصتي" priority />

      <h1 className="mt-8 text-3xl font-extrabold leading-[1.3] text-ink">
        لوحة تحكم قصتي
      </h1>
      <p className="mt-3 text-base leading-loose text-muted">
        سجّلوا الدخول لمتابعة الطلبات وتعديل الأسعار.
      </p>

      {expired ? (
        <div className="mt-6">
          <Notice tone="info">
            انتهت الجلسة. سجّلوا الدخول من جديد — شغلكم محفوظ.
          </Notice>
        </div>
      ) : null}

      {!configured ? (
        <div className="mt-6">
          <Notice tone="error">
            متغيّر NEXT_PUBLIC_QISSATI_API مش معرّف، فما في خادم نتصل فيه.
          </Notice>
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
        <AdminField
          id="admin-email"
          label="الإيميل"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AdminField
          id="admin-password"
          label="كلمة السر"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Notice tone="error">{error}</Notice>

        <AdminButton type="submit" disabled={busy || !configured}>
          {busy ? "لحظة…" : "تسجيل الدخول"}
        </AdminButton>
      </form>
    </main>
  );
}
