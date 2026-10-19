import { Link } from "react-router-dom";
import OrderTimeline from "../components/OrderTimeline";
import { Card, EmptyState, OrderStatusBadge, Spinner } from "../components/ui";
import { useOrders } from "../hooks/useOrders";

export default function OrdersScreen() {
  const { data: orders = [], isPending } = useOrders({ poll: true });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-ink">Your Orders</h1>
        <p className="mt-1 text-sm text-ink-muted">Live status straight from the kitchen.</p>
      </div>

      {isPending ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet."
          action={
            <Link to="/menu" className="font-semibold text-primary">
              Browse menu
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card as="article" key={order.id} className="rounded-[16px] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-xl font-bold text-primary">Order #{order.id}</p>
                <OrderStatusBadge status={order.status} />
                <p className="text-sm font-semibold text-ink-muted">₹{order.total}</p>
              </div>
              <OrderTimeline status={order.status} compact />
              <Link to={`/track/${order.id}`} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
                Open Tracker →
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
