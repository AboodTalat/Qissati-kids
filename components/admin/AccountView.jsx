"use client";

import { useState } from "react";
import { AdminButton, AdminField, Notice, Panel } from "./AdminUi";
import { adminApi } from "@/lib/api";
import DeviceNotifications from "./DeviceNotifications";

/**
 * Your own account.
 *
 * This exists for one reason: **a password you cannot change is a password you
 * cannot rotate.** `adminApi.changePassword` was in the client from the start
 * and nothing called it, so an operator who suspected their password had
 * leaked had no move at all — the best they could do was ask an admin to
 * delete and re-create their account.
 *
 * It is a tab every role sees, not part of الحسابات, which is admin-only:
 * changing *your own* password is not an administrative act, and putting it
 * there would leave staff exactly as stuck as before.
 *
 * The three failures worth telling apart are told apart — a wrong current
 * password, a rejected new one, and the network — because "ما انحفظ" for all
 * three leaves the operator guessing which of the two fields to fix.
 */
export default function AccountView({ token, me, onTokenRefresh }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setNotice("");

    // Checked here because the server cannot: it never receives the second
    // copy, so a mistyped confirmation would otherwise become a password the
    // operator does not know.
    if (next !== confirm) {
      setError("كلمتا السر الجديدتين مش متطابقتين.");
      return;
    }
    if (next === current) {
      setError("كلمة السر الجديدة لازم تكون غير القديمة.");
      return;
    }

    setBusy(true);
    setError("");
    const res = await adminApi.changePassword(token, current, next);
    setBusy(false);

    if (!res.ok) {
      // A 401 here has two meanings now. It is normally "that is not your
      // current password" — which is why this call opts out of the global
      // session-end hook. But since a password change dates every older token
      // as stale, it can also mean this tab's token was rotated away by a
      // change made somewhere else. Telling those apart matters: showing
      // "wrong password" to someone whose session is actually dead sends them
      // retyping a password that was never the problem.
      //
      // `me()` answers it. It carries the same token and does NOT opt out, so
      // if the session really is gone its own 401 signs them out properly.
      if (res.status === 401) {
        const session = await adminApi.me(token);
        if (!session.ok) return;
        setError("كلمة السر الحالية غلط.");
        return;
      }

      setError(
        res.error === "network" || res.error === "timeout"
          ? "ما قدرنا نوصل للخادم. تأكدوا من الاتصال وجربوا كمان مرة."
          : res.status === 400
            ? "كلمة السر الجديدة مرفوضة — جربوا وحدة أطول."
            : res.status === 429
              ? "محاولات كتير. جربوا بعد شوي."
              : "ما انحفظت كلمة السر."
      );
      return;
    }

    // The token that made this request is now stale. The server minted a
    // replacement; swapping it in is what keeps this device signed in.
    if (res.data?.token) onTokenRefresh?.(res.data.token);

    setCurrent("");
    setNext("");
    setConfirm("");
    setNotice("انحفظت كلمة السر الجديدة.");
  };

  return (
    <div className="flex flex-col gap-8">
      <Notice tone="error">{error}</Notice>
      <Notice tone="success">{notice}</Notice>

      <Panel title="حسابي">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted">الاسم</dt>
            <dd className="control-text mt-1 font-bold text-ink">{me?.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">الإيميل</dt>
            <dd className="control-text mt-1 font-bold text-ink">{me?.email || "—"}</dd>
          </div>
        </dl>
      </Panel>

      <DeviceNotifications token={token} />

      <Panel title="تغيير كلمة السر">
        {/* This paragraph has to stay true to the API, and was wrong twice
            before the server could keep it. It can now: `/auth/password`
            stamps `passwordChangedAt`, `requireAuth` refuses any token issued
            before it, and the route hands back a replacement token that this
            component swaps in — so other devices really are signed out, and
            this one really does stay. If that ever changes on the server, this
            copy changes with it. */}
        <p className="text-sm leading-relaxed text-muted">
          غيّروها فورًا إذا حسّيتوا إنها انكشفت. أول ما تنحفظ، بتنتهي جلسات كل
          الأجهزة التانية فورًا وبيلزمها كلمة السر الجديدة — وبتضل جلستكم شغالة
          هون بس.
        </p>

        <form onSubmit={submit} className="mt-6 flex max-w-md flex-col gap-5">
          {/* The browser needs a username field to associate the saved
              credential with; without it a password manager offers to save an
              entry with no account attached. */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={me?.email || ""}
            readOnly
            hidden
          />
          <AdminField
            id="current-password"
            label="كلمة السر الحالية"
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
          <AdminField
            id="next-password"
            label="كلمة السر الجديدة"
            hint="٨ خانات على الأقل."
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          <AdminField
            id="confirm-password"
            label="أعيدوا كلمة السر الجديدة"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          <div>
            <AdminButton type="submit" disabled={busy}>
              {busy ? "لحظة…" : "حفظ كلمة السر"}
            </AdminButton>
          </div>
        </form>
      </Panel>
    </div>
  );
}
