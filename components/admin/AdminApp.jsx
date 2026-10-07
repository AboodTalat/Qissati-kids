"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "../Logo";
import LoginView from "./LoginView";
import { AdminButton } from "./AdminUi";
import { adminApi, setUnauthorizedHandler } from "@/lib/api";
import { registerQissatiWorker } from "@/lib/push";

const TOKEN_KEY = "qissati.admin.token";
const AdminSession = createContext(null);

export function useAdminSession() {
  const session = useContext(AdminSession);
  if (!session) throw new Error("Admin pages must be inside AdminApp");
  return session;
}

/**
 * The dashboard.
 *
 * The route layout owns the session so navigating between admin pages does not
 * re-check it or briefly flash the sign-in form. Each page owns its own data.
 *
 * **The session is a bearer token in localStorage**, which the API mints and
 * revokes by loading the account on every request (so deactivating someone
 * ends their session immediately, despite the 7-day TTL). localStorage is
 * readable by any script on this origin, which is the accepted trade for a
 * cross-site API — Safari blocks the third-party cookie that would be the
 * alternative. What keeps that trade honest is that this page renders no
 * user-supplied HTML and loads no third-party script.
 */
export default function AdminApp({ children }) {
  const [token, setToken] = useState(null);
  const [me, setMe] = useState(null);
  // "loading" until the stored token has been checked — rendering the sign-in
  // form first would flash it at every operator on every reload.
  const [phase, setPhase] = useState("loading");
  const segment = useSelectedLayoutSegment();
  // Why the sign-in form is showing. A session that ended on its own has to
  // say so — otherwise being dropped back to a login screen mid-queue reads
  // as the dashboard having lost the work.
  const [expired, setExpired] = useState(false);

  // Register from every dashboard view so the manifest is installable before
  // an operator visits "حسابي". This worker has no fetch/cache handler; its
  // only job is receiving an explicitly enabled push notification.
  useEffect(() => {
    registerQissatiWorker().catch(() => {
      // Unsupported browsers still get the complete web dashboard. The
      // account panel explains the notification limitation when opened.
    });
  }, []);

  // Restore the session. A stored token is not a session — it may be expired,
  // or belong to an account that has since been deactivated — so it is only
  // trusted after the server has answered for it.
  useEffect(() => {
    let cancelled = false;
    const stored = window.localStorage.getItem(TOKEN_KEY);
    // Both branches settle asynchronously on purpose: a synchronous setState
    // in an effect body is a React Compiler violation, so "there is no stored
    // token" resolves through a promise rather than falling straight through.
    const check = stored ? adminApi.me(stored) : Promise.resolve(null);
    check.then((res) => {
      if (cancelled) return;
      // `res.data` is null when a gateway answers with something that is not
      // JSON, so an ok response is not by itself a user.
      if (!res?.ok || !res.data?.user) {
        if (stored) window.localStorage.removeItem(TOKEN_KEY);
        setPhase("out");
        return;
      }
      setToken(stored);
      setMe(res.data.user);
      setPhase("in");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback((newToken, user) => {
    window.localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setMe(user);
    setPhase("in");
    setExpired(false);
  }, []);

  const endSession = useCallback((wasExpired) => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setMe(null);
    setPhase("out");
    setExpired(wasExpired);
  }, []);

  // Takes no argument on purpose: it is passed straight to `onClick`, which
  // would otherwise hand it a click event as `wasExpired`.
  const signOut = useCallback(() => endSession(false), [endSession]);
  const expireSession = useCallback(() => endSession(true), [endSession]);

  // Any authenticated request that comes back 401 ends the session here,
  // wherever in the dashboard it was made from.
  useEffect(() => {
    setUnauthorizedHandler(expireSession);
    return () => setUnauthorizedHandler(null);
  }, [expireSession]);

  // Changing your password invalidates every token issued before it — this one
  // included — so `POST /auth/password` mints a replacement and hands it back.
  // Swapping it in here is what keeps the operator signed in on the device they
  // are standing on while every other device is signed out. Without it the very
  // next request would 401 and the global hook would sign them out of their own
  // password change.
  const refreshToken = useCallback((newToken) => {
    window.localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  }, []);

  if (phase === "loading") {
    return <p className="py-32 text-center text-sm text-muted">لحظة…</p>;
  }
  if (phase === "out") return <LoginView onSignedIn={signIn} expired={expired} />;

  const isAdmin = me?.role === "admin";
  const links = [
    { href: "/admin", segment: null, label: "الطلبات" },
    ...(isAdmin ? [
      { href: "/admin/settings", segment: "settings", label: "الأسعار" },
      { href: "/admin/users", segment: "users", label: "الحسابات" },
    ] : []),
    { href: "/admin/account", segment: "account", label: "حسابي" },
  ];

  return (
    <AdminSession.Provider value={{ token, me, refreshToken }}>
      <div className="mx-auto min-h-dvh w-full max-w-6xl px-5 pb-24 pt-8 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-ink/10 pb-5">
        <div className="flex items-center gap-4">
          <Logo markClass="h-9" wordmark="قصتي" />
          <span className="text-sm font-bold text-muted">لوحة التحكم</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted">{me?.name}</span>
          <AdminButton variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            خروج
          </AdminButton>
        </div>
      </header>

      <nav aria-label="أقسام لوحة التحكم" className="flex gap-6 overflow-x-auto border-b-2 border-ink/10">
        {links.map((link) => {
          const active = segment === link.segment || (segment === "orders" && link.segment === null);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`relative -mb-0.5 shrink-0 py-4 text-[0.95rem] font-bold transition-colors ${
                active ? "text-brand-deep" : "text-muted hover:text-ink"
              }`}
            >
              {link.label}
              {active ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-gold"
                />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <main className="pt-8">{children}</main>
      </div>
    </AdminSession.Provider>
  );
}
