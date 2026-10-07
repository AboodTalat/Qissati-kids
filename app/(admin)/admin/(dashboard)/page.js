import OrdersPage from "@/components/admin/OrdersPage";
import { normalizeOrderFilters } from "@/lib/admin-routes";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({ searchParams }) {
  const filters = normalizeOrderFilters(await searchParams);
  return <OrdersPage filters={filters} />;
}
