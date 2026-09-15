/**
 * The Qissati API client.
 *
 * The backend is the `servers/qissati` sub-app on the shared Hafith Server —
 * a REST API mounted at `/qissati`, with its own database, its own JWT secret
 * and its own UploadThing app (orders carry children's names and photographs,
 * so none of that is shared with the other products on that server).
 *
 * `NEXT_PUBLIC_QISSATI_API` is the base URL, including the `/qissati` mount:
 *
 *     NEXT_PUBLIC_QISSATI_API=http://localhost:5000/qissati
 *
 * It is `NEXT_PUBLIC_` because the parent's browser posts the order and pushes
 * the photos directly, and the dashboard runs entirely client-side. Nothing
 * secret goes through here — the only credential is the signed-in admin's own
 * bearer token, and the parent's upload ticket, which the server just minted
 * for the order it just created.
 *
 * **Every call fails soft.** The order page has to keep working when this API
 * is unreachable — the parent still has WhatsApp — so callers get a typed
 * failure rather than an exception to swallow.
 */

export const API_BASE = (process.env.NEXT_PUBLIC_QISSATI_API || "").replace(/\/+$/, "");

/** False when no backend is configured — the site then behaves as phase 1 did. */
export const apiConfigured = () => Boolean(API_BASE);

const url = (path) => `${API_BASE}${path}`;

/**
 * What to do when the server rejects a token we thought was good.
 *
 * The dashboard's token lasts a week and is only checked at mount, so it can
 * expire — or be revoked, when an account is deactivated — while an operator
 * is part-way through a queue. Without this, every panel from that moment on
 * just says "we couldn't fetch that", which reads as the API being down and
 * gives the operator nothing to act on.
 *
 * It lives here rather than in each view because there is exactly one correct
 * response to a 401 and four places that would otherwise have to remember it.
 * `AdminApp` registers the handler; nothing else knows this exists.
 */
let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

/**
 * One fetch, with the failure modes named.
 *
 * Returns `{ ok, status, data, error }` rather than throwing: at every call
 * site the interesting question is "did it work, and what do I tell the
 * parent", and a try/catch around every call answers that worse.
 */
async function request(path, { method = "GET", body, token, next, cache, timeout = 15000, skipSessionEnd = false } = {}) {
  if (!API_BASE) {
    return { ok: false, status: 0, data: null, error: "not-configured" };
  }

  // A hanging request is worse than a failed one here — the parent is staring
  // at a spinner between filling the form and paying. The exception is a
  // cached server-side read (`next`): an AbortSignal opts a fetch out of
  // Next's data cache, which would turn the landing page's price lookup into
  // a per-request round trip.
  //
  // A `cache: "no-store"` read is deliberately NOT an exception. There is no
  // data cache to opt out of, and it runs on every render of the page it
  // serves — so it is exactly the read that most needs a bound. Without one, a
  // hanging API would hang the order page itself.
  const controller = next ? null : new AbortController();
  const timer = controller ? setTimeout(() => controller.abort(), timeout) : null;

  try {
    const res = await fetch(url(path), {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      ...(controller ? { signal: controller.signal } : {}),
      ...(next ? { next } : {}),
      ...(cache ? { cache } : {}),
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      // A gateway can answer HTML. Treat it as an unreadable response rather
      // than crashing on the parse.
    }

    if (!res.ok) {
      // Only for a request that actually carried a token. A 401 from the login
      // endpoint means "wrong password", not "your session ended" — signing
      // the operator out of a session they have not started yet would clear
      // the form under them.
      //
      // `skipSessionEnd` is for the one authenticated call where a 401 means
      // something else: changing your own password answers 401 when the
      // *current* password is wrong, and ending the session over a typo would
      // throw the operator out of the form they are standing in.
      if (res.status === 401 && token && !skipSessionEnd) onUnauthorized?.();

      return {
        ok: false,
        status: res.status,
        data,
        error: data?.error || `HTTP ${res.status}`,
      };
    }
    return { ok: true, status: res.status, data, error: null };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.name === "AbortError" ? "timeout" : "network",
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// ── The order form ──────────────────────────────────────────────────────────

/**
 * File an order.
 *
 * `values` is the form's own object, unchanged — the field names are the AI
 * prompt templates' placeholder names, and the server stores them under the
 * same keys. **The total is deliberately not sent**: the server computes it
 * from its own price table, so what the parent is quoted is a number we set,
 * not one their browser did.
 *
 * On success the response carries the order reference (what both sides say
 * out loud on WhatsApp) and a short-lived upload ticket scoped to this order.
 */
export function createOrder(values, lang) {
  const { ...answers } = values;
  return request("/public/orders", {
    method: "POST",
    body: { ...answers, locale: lang === "en" ? "en" : "ar" },
    // The parent may be on a phone on mobile data; give the round trip room.
    timeout: 20000,
  });
}

/** The live price table, or a failure the caller falls back from. */
export function fetchPricing(options) {
  return request("/public/pricing", options);
}

// ── The dashboard ───────────────────────────────────────────────────────────

export const adminApi = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),
  me: (token) => request("/auth/me", { token }),
  changePassword: (token, currentPassword, newPassword) =>
    request("/auth/password", {
      method: "POST",
      token,
      body: { currentPassword, newPassword },
      // A 401 here is "that is not your current password" — see `request()`.
      skipSessionEnd: true,
    }),
  pushConfig: (token) => request("/notifications/config", { token }),
  savePushSubscription: (token, subscription) =>
    request("/notifications/subscription", {
      method: "PUT",
      token,
      body: subscription,
    }),
  deletePushSubscription: (token, endpoint) =>
    request("/notifications/subscription", {
      method: "DELETE",
      token,
      body: { endpoint },
    }),

  orders: (token, { status, q, page = 1, limit = 25 } = {}) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    return request(`/orders?${params}`, { token });
  },
  stats: (token) => request("/orders/stats", { token }),
  order: (token, id) => request(`/orders/${id}`, { token }),
  updateOrder: (token, id, patch) =>
    request(`/orders/${id}`, { method: "PATCH", token, body: patch }),
  deleteOrderPhotos: (token, id) =>
    request(`/orders/${id}/photos`, { method: "DELETE", token }),
  deleteOrder: (token, id) => request(`/orders/${id}`, { method: "DELETE", token }),

  settings: (token) => request("/admin/settings", { token }),
  saveSettings: (token, patch) =>
    request("/admin/settings", { method: "PUT", token, body: patch }),

  users: (token) => request("/admin/users", { token }),
  createUser: (token, user) => request("/admin/users", { method: "POST", token, body: user }),
  updateUser: (token, id, patch) =>
    request(`/admin/users/${id}`, { method: "PATCH", token, body: patch }),
  deleteUser: (token, id) => request(`/admin/users/${id}`, { method: "DELETE", token }),
};
