"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { AdminButton, AdminField, Empty, Notice, Panel } from "./AdminUi";
import { when } from "@/lib/admin";
import { adminApi } from "@/lib/api";

/**
 * Accounts.
 *
 * Two roles, and the split is about the price table rather than about seniority:
 * `staff` can read every order and move it through the pipeline, `admin` can
 * additionally change prices, manage accounts, and delete orders. Fulfilment
 * work needs no admin, so it does not require one.
 *
 * The self-lockout guards live on the server (an admin cannot demote,
 * deactivate or delete their own account), because a guard that only exists in
 * the interface is a guard a stale tab walks straight past. The interface just
 * doesn't offer the buttons.
 */
export default function UsersView({ token, me }) {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "staff" });

  useEffect(() => {
    let cancelled = false;
    adminApi.users(token).then((res) => {
      if (cancelled) return;
      if (!res.ok) {
        setError("ما قدرنا نجيب الحسابات.");
        return;
      }
      setUsers(res.data.users);
    });
    return () => {
      cancelled = true;
    };
  }, [token, reload]);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const res = await adminApi.createUser(token, {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.status === 409 ? "في حساب بنفس الإيميل." : "ما انفتح الحساب.");
      return;
    }
    setForm({ name: "", email: "", password: "", role: "staff" });
    setNotice("انفتح الحساب.");
    setReload((n) => n + 1);
  };

  const toggleActive = async (user) => {
    setBusy(true);
    const res = await adminApi.updateUser(token, user.id, { isActive: !user.isActive });
    setBusy(false);
    if (!res.ok) {
      setError(res.error || "ما انحفظ التعديل.");
      return;
    }
    setReload((n) => n + 1);
  };

  const remove = async (user) => {
    if (!window.confirm(`حذف حساب ${user.email}؟`)) return;
    setBusy(true);
    const res = await adminApi.deleteUser(token, user.id);
    setBusy(false);
    if (!res.ok) {
      setError(res.error || "ما انحذف الحساب.");
      return;
    }
    setReload((n) => n + 1);
  };

  return (
    <div className="flex flex-col gap-8">
      <Notice tone="error">{error}</Notice>
      <Notice tone="success">{notice}</Notice>

      <Panel title="الحسابات">
        {!users ? (
          <p className="py-8 text-center text-sm text-muted">عم نحمّل…</p>
        ) : users.length === 0 ? (
          <Empty>ما في حسابات.</Empty>
        ) : (
          <ul>
            {users.map((u) => {
              const isSelf = u.id === me?.id;
              return (
                <li
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 py-4 last:border-b-0"
                >
                  <div>
                    <p className="font-bold text-ink">
                      {u.name}
                      {isSelf ? <span className="text-muted"> (أنت)</span> : null}
                    </p>
                    <p className="mt-1 text-sm text-muted">{u.email}</p>
                    <p className="mt-1 text-xs text-muted">
                      {u.role === "admin" ? "مدير" : "موظف"} ·{" "}
                      {u.isActive ? "فعّال" : "موقوف"} · آخر دخول {when(u.lastLoginAt)}
                    </p>
                  </div>

                  {/* Nothing here for your own row — the server refuses those
                      edits anyway, so offering them would only produce errors. */}
                  {isSelf ? null : (
                    <div className="flex gap-2">
                      <AdminButton
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => toggleActive(u)}
                      >
                        {u.isActive ? "أوقفوه" : "فعّلوه"}
                      </AdminButton>
                      <AdminButton
                        variant="danger"
                        size="sm"
                        disabled={busy}
                        onClick={() => remove(u)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        حذف
                      </AdminButton>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="حساب جديد">
        <form onSubmit={create} className="grid gap-6 sm:grid-cols-2">
          <AdminField
            id="new-name"
            label="الاسم"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <AdminField
            id="new-email"
            label="الإيميل"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <AdminField
            id="new-password"
            label="كلمة السر"
            hint="٨ حروف على الأقل."
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <label htmlFor="new-role" className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-ink">الصلاحية</span>
            <span className="text-xs leading-relaxed text-muted">
              الموظف بيشوف الطلبات وبيحرّكها. المدير كمان بيعدّل الأسعار والحسابات.
            </span>
            <select
              id="new-role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="control-text mt-auto rounded-xl border-2 border-brand-deep/25 bg-surface px-4 py-2.5 text-ink outline-none transition-colors focus:border-brand-deep"
            >
              <option value="staff">موظف</option>
              <option value="admin">مدير</option>
            </select>
          </label>

          <div className="sm:col-span-2">
            <AdminButton type="submit" disabled={busy}>
              افتحوا الحساب
            </AdminButton>
          </div>
        </form>
      </Panel>
    </div>
  );
}
