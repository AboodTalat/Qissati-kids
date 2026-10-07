import { STATUSES } from "./admin";

export function normalizeOrderFilters(params = {}) {
  const status = typeof params.status === "string" && STATUSES.includes(params.status)
    ? params.status : "";
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const value = Number(params.page);
  const page = Number.isSafeInteger(value) && value > 0 ? value : 1;
  return { status, q, page };
}

export function ordersListPath({ status = "", q = "", page = 1 } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/admin${query ? `?${query}` : ""}`;
}
