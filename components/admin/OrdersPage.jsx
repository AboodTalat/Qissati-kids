"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Notice } from "./AdminUi";
import OrdersView from "./OrdersView";
import { useAdminSession } from "./AdminApp";
import { STATUS_LABEL, money } from "@/lib/admin";
import { adminApi } from "@/lib/api";

export default function OrdersPage({ filters }) {
  const { token } = useAdminSession();
  const router = useRouter();

  const openOrder = (id) => {
    router.push(`/admin/orders/${encodeURIComponent(id)}${window.location.search}`);
  };

  return (
    <div className="flex flex-col gap-10">
      <Overview token={token} />
      <OrdersView token={token} onOpen={openOrder} initialFilters={filters} />
    </div>
  );
}

/** Server aggregation for the four queue figures. */
function Overview({ token }) {
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
    return () => { cancelled = true; };
  }, [token]);

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
      <dl className="grid grid-cols-2 gap-x-8 gap-y-6 border-b-2 border-ink/10 pb-8 sm:grid-cols-4">
        {figures.map((f) => (
          <div key={f.label}>
            <dt className="text-sm text-muted">{f.label}</dt>
            <dd className="mt-1 text-3xl font-extrabold tabular-nums text-ink">{f.value}</dd>
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
