import OrderTimeline from "../components/OrderTimeline";
import { Card, EmptyState, OrderStatusBadge } from "../components/ui";
import { useAppData } from "../context/AppDataContext";

export default function AdminOrdersScreen() {
  const { orders } = useAppData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Admin Orders</h1>
        <p className="mt-1 text-sm text-ink-muted">Viewing same local order state used by customer screens.</p>
      </div>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <EmptyState title="No orders yet." />
        ) : (
          orders.map((order) => (
            <Card as="article" key={order.id} className="rounded-[16px] p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="font-display text-xl font-bold text-primary">{order.id}</p>
                <p className="text-sm text-ink-soft">{order.customerName}</p>
                <OrderStatusBadge status={order.status} />
                <p className="text-sm font-bold text-ink">₹{order.total}</p>
              </div>
              <OrderTimeline status={order.status} />
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
