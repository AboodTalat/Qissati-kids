import OrderPage from "@/components/admin/OrderPage";
import { normalizeOrderFilters, ordersListPath } from "@/lib/admin-routes";

export const dynamic = "force-dynamic";

export default async function AdminOrderPage({ params, searchParams }) {
  const [{ id }, filters] = await Promise.all([
    params,
    searchParams.then(normalizeOrderFilters),
  ]);
  return <OrderPage orderId={id} backHref={ordersListPath(filters)} />;
}
