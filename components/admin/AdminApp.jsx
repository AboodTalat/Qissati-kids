"use client";

import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { Logo } from "../Logo";
import LoginView from "./LoginView";
import OrdersView from "./OrdersView";
/**
 * Deferred, because it is the heavy half of the dashboard and the smaller half
 * is what an operator actually opens on: the order list. `OrderPanel` pulls in
 * the prompt builder, the book editor, the canvas renderer, the OOXML writer
 * and the ZIP writer — none of which mean anything until an order is open, and
 * all of which an operator sitting at the sign-in screen was downloading.
 */
const OrderPanel = lazy(() => import("./OrderPanel"));
import SettingsView from "./SettingsView";
import UsersView from "./UsersView";
import AccountView from "./AccountView";
import { AdminButton, Notice } from "./AdminUi";
import { STATUS_LABEL, money } from "@/lib/admin";
import { adminApi, setUnauthorizedHandler } from "@/lib/api";
import { registerQissatiWorker } from "@/lib/push";

const TOKEN_KEY = "qissati.admin.token";

/**
 * The dashboard.
 *
 * **Views are state, not routes.** One operator working a queue moves between
 * "the list" and "this order" constantly, and every one of those transitions
 * would otherwise be a route change that re-checks the session and repaints
 * from empty. Routing would buy deep links to an order — real, but worth less
 * here than a list that keeps its filter and its scroll position when you come
 * back from an order you just moved to "delivered".
 *
 * **The session is a bearer token in localStorage**, which the API mints and
 * revokes by loading the account on every request (so deactivating someone
 * ends their session immediately, despite the 7-day TTL). localStorage is
 * readable by any script on this origin, which is the accepted trade for a
 * cross-site API — Safari blocks the third-party cookie that would be the
 * alternative. What keeps that trade honest is that this page renders no
 * user-supplied HTML and loads no third-party script.
 */
export default function AdminApp() {
  const [token, setToken] = useState(null);
  const [me, setMe] = useState(null);
  // "loading" until the stored token has been checked — rendering the sign-in
  // form first would flash it at every operator on every reload.
  const [phase, setPhase] = useState("loading");
  const [view, setView] = useState("orders");
  const [openOrder, setOpenOrder] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
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
    setView("orders");
    setOpenOrder(null);
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

  const refresh = useCallback(() => setReloadKey((n) => n + 1), []);

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
  const tabs = [
    { key: "orders", label: "الطلبات" },
    ...(isAdmin
      ? [
          { key: "settings", label: "الأسعار" },
          { key: "users", label: "الحسابات" },
        ]
      : []),
    // Every role, deliberately: changing your own password is not an
    // administrative act, and hiding it behind `isAdmin` would leave staff
    // with no way to rotate a password they think has leaked.
    { key: "account", label: "حسابي" },
  ];

  return (
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

      {/* The tabs carry the gold bookmark the site hangs over its active nav
          link — same motif, same meaning, so the dashboard reads as part of
          the same product rather than a bolted-on admin panel. */}
      <nav className="flex gap-6 border-b-2 border-ink/10">
        {tabs.map((tab) => {
          const active = view === tab.key && !openOrder;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setOpenOrder(null);
                setView(tab.key);
              }}
              aria-current={active ? "page" : undefined}
              className={`relative -mb-0.5 py-4 text-[0.95rem] font-bold transition-colors ${
                active ? "text-brand-deep" : "text-muted hover:text-ink"
              }`}
            >
              {tab.label}
              {active ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-gold"
                />
              ) : null}
            </button>
          );
        })}
      </nav>

      <main className="pt-8">
        {openOrder ? (
          <Suspense
            fallback={<p className="py-16 text-center text-sm text-muted">عم نحمّل…</p>}
          >
            <OrderPanel
              token={token}
              orderId={openOrder}
              role={me?.role}
              onBack={() => setOpenOrder(null)}
              onChanged={refresh}
            />
          </Suspense>
        ) : view === "orders" ? (
          <div className="flex flex-col gap-10">
            <Overview token={token} reloadKey={reloadKey} />
            <OrdersView token={token} onOpen={setOpenOrder} reloadKey={reloadKey} />
          </div>
        ) : view === "settings" ? (
          <SettingsView token={token} />
        ) : view === "users" ? (
          <UsersView token={token} me={me} />
        ) : (
          <AccountView token={token} me={me} onTokenRefresh={refreshToken} />
        )}
      </main>
    </div>
  );
}

/**
 * The header numbers.
 *
 * One aggregation on the server, four figures here. `revenue` counts delivered
 * orders only, and says out loud when some of them were placed while a price
 * was still undecided — a total that silently treated those as zero would read
 * as a smaller business rather than an incomplete one.
 */
function Overview({ token, reloadKey }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    adminApi.stats(token).then((res) => {
      if (cancelled) return;
      if (!res.ok || !res.data?.stats) {
        setError("ما قدرنا نجيب الملخص.");
        return;
      }
      setStats(res.data.stats);
    });
    return () => {
      cancelled = true;
    };
  }, [token, reloadKey]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!stats) return null;

  const figures = [
    { label: "كل الطلبات", value: stats.total },
    { label: "آخر ٧ أيام", value: stats.last7Days },
    { label: STATUS_LABEL.new, value: stats.byStatus.new },
    { label: STATUS_LABEL.delivered, value: stats.byStatus.delivered },
  ];

  return (
    <section>
      {/* Hairline-separated figures, not tinted stat cards — the same reason
          the site's TrustBar dropped its card. */}
      <dl className="grid grid-cols-2 gap-x-8 gap-y-6 border-b-2 border-ink/10 pb-8 sm:grid-cols-4">
        {figures.map((f) => (
          <div key={f.label}>
            <dt className="text-sm text-muted">{f.label}</dt>
            <dd className="mt-1 text-3xl font-extrabold tabular-nums text-ink">
              {f.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-muted">
        مجموع الطلبات المسلّمة: {money(stats.revenue)}
        {stats.revenueUnpricedOrders > 0
          ? ` — ${stats.revenueUnpricedOrders} طلب مسلّم بلا سعر محدد، مش محسوبين.`
          : ""}
      </p>
    </section>
  );
}
