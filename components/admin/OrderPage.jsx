"use client";

import { lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAdminSession } from "./AdminApp";

// The prompt builder, book editor and exporters load only on an order route.
const OrderPanel = lazy(() => import("./OrderPanel"));

export default function OrderPage({ orderId, backHref }) {
  const { token, me } = useAdminSession();
  const router = useRouter();

  return (
    <Suspense fallback={<p className="py-16 text-center text-sm text-muted">عم نحمّل…</p>}>
      <OrderPanel
        token={token}
        orderId={orderId}
        role={me?.role}
        onBack={() => router.push(backHref)}
      />
    </Suspense>
  );
}
