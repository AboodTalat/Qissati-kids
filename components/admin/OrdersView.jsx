"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { AdminButton, Empty, Notice, StatusPill } from "./AdminUi";
import { STATUSES, STATUS_LABEL, label, money, pages, when } from "@/lib/admin";
import { adminApi } from "@/lib/api";

/**
 * The order list.
 *
 * **A ruled table, not a grid of cards.** Orders are a queue you scan down —
 * one row per order, aligned columns, hairlines between. Cards would turn
 * "which of these is oldest" into a hunt.
 *
 * The rows are deliberately thin: the server sends a reference, a name, a
 * status and a count, and nothing of the brief itself. The child's traits, the
 * quirk and the photographs load only when someone opens the order — which
 * means the list stays fast as the queue grows *and* the long-form answers
 * about a child aren't sitting in a response that never displays them.
 */
export default function OrdersView({ token, onOpen, reloadKey }) {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  /**
   * The fetch lives in the effect body rather than in a `load()` the effect
   * calls, and it sets no state before its first `await`. React Compiler's
   * lint rejects a synchronous setState inside an effect — and it is right to:
   * the spinner belongs to the interaction that caused the refetch, which is
   * why `busy` is raised in the handlers below instead.
   *
   * `cancelled` is the out-of-order guard. Type into the search box and three
   * requests are in flight; without it the slowest one wins and the table
   * shows results for a query nobody is looking at.
   */
  useEffect(() => {
    let cancelled = false;
    adminApi.orders(token, { status, q: query, page }).then((res) => {
      if (cancelled) return;
      setBusy(false);
      if (!res.ok) {
        setError("ما قدرنا نجيب الطلبات.");
        return;
      }
      setError("");
      setData(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [token, status, query, page, reloadKey]);

  // A filter change has to reset the page, or filtering from page 3 of "all"
  // lands on page 3 of a two-page result and shows an empty list.
  const changeStatus = (value) => {
    setBusy(true);
    setStatus(value);
    setPage(1);
  };

  const runSearch = (e) => {
    e.preventDefault();
    setBusy(true);
    setQuery(search.trim());
    setPage(1);
  };

  const orders = data?.orders ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Status filter: ruled chips, the active one carrying the gold
            bookmark colour the rest of the brand uses to mean "you are here". */}
        <div className="flex flex-wrap gap-2">
          <FilterChip active={status === ""} onClick={() => changeStatus("")}>
            الكل
          </FilterChip>
          {STATUSES.map((s) => (
            <FilterChip key={s} active={status === s} onClick={() => changeStatus(s)}>
              {STATUS_LABEL[s]}
            </FilterChip>
          ))}
        </div>

        <form onSubmit={runSearch} className="flex items-center gap-2">
          <label htmlFor="order-search" className="sr-only">
            بحث في الطلبات
          </label>
          <input
            id="order-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="رقم الطلب أو الاسم"
            className="control-text w-52 rounded-full border-2 border-brand-deep/25 bg-surface px-4 py-2 text-ink outline-none transition-colors focus:border-brand-deep"
          />
          <AdminButton type="submit" variant="outline" size="sm">
            <Search className="h-4 w-4" aria-hidden="true" />
            بحث
          </AdminButton>
        </form>
      </div>

      <Notice tone="error">{error}</Notice>

      {busy && !data ? (
        <Empty>عم نحمّل…</Empty>
      ) : orders.length === 0 ? (
        <Empty>ما في طلبات هون.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-start">
            <thead>
              <tr className="border-b-2 border-ink/15 text-start text-xs font-bold text-muted">
                <Th>الطلب</Th>
                <Th>الطفل</Th>
                <Th>ولي الأمر</Th>
                <Th>المطلوب</Th>
                <Th>المجموع</Th>
                <Th>الصور</Th>
                <Th>الحالة</Th>
                <Th>التاريخ</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => onOpen(o.id)}
                  className="cursor-pointer border-b border-ink/10 transition-colors hover:bg-brand-tint/50"
                >
                  <Td>
                    {/* The row is clickable, but a keyboard user needs a real
                        control — so the reference is the button, and the row
                        click is the convenience on top of it. */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(o.id);
                      }}
                      className="font-bold tabular-nums text-brand-deep underline-offset-4 hover:underline"
                    >
                      {o.reference}
                    </button>
                  </Td>
                  <Td>{o.childName}</Td>
                  <Td className="text-muted">{o.parentName}</Td>
                  <Td className="text-muted">
                    {label("format", o.format)} · {pages(o.pages)}
                  </Td>
                  <Td className="tabular-nums font-semibold">
                    {money(o.total, o.currency)}
                  </Td>
                  <Td className="tabular-nums text-muted">{o.photoCount}</Td>
                  <Td>
                    <StatusPill status={o.status} />
                  </Td>
                  <Td className="text-xs text-muted">{when(o.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.pages > 1 ? (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted">
            صفحة {data.page} من {data.pages} · {data.total} طلب
          </p>
          <div className="flex gap-2">
            {/* Under RTL "previous" points right and "next" points left, so
                each button renders both glyphs and hides the wrong one in CSS
                — the same rule the site's carousel arrows follow. */}
            <AdminButton
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => {
                setBusy(true);
                setPage((p) => Math.max(1, p - 1));
              }}
            >
              <ChevronRight className="h-4 w-4 ltr:hidden" aria-hidden="true" />
              <ChevronLeft className="h-4 w-4 rtl:hidden" aria-hidden="true" />
              السابق
            </AdminButton>
            <AdminButton
              variant="outline"
              size="sm"
              disabled={data.page >= data.pages}
              onClick={() => {
                setBusy(true);
                setPage((p) => p + 1);
              }}
            >
              التالي
              <ChevronLeft className="h-4 w-4 ltr:hidden" aria-hidden="true" />
              <ChevronRight className="h-4 w-4 rtl:hidden" aria-hidden="true" />
            </AdminButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({ active, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors ${
        active
          ? "border-brand-deep bg-brand-deep text-cream"
          : "border-brand-deep/25 text-brand-deep hover:bg-brand-tint"
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

const Th = ({ children }) => (
  <th scope="col" className="px-3 py-3 text-start font-bold">
    {children}
  </th>
);

const Td = ({ children, className = "" }) => (
  <td className={`px-3 py-4 text-start text-sm ${className}`}>{children}</td>
);
