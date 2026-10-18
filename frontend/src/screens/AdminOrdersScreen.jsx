import OrderTimeline from "../components/OrderTimeline";
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
          <div className="card-3d rounded-[16px] p-6 text-center text-sm text-ink-muted">
            No orders yet.
          </div>
        ) : (
          orders.map((order) => (
            <article key={order.id} className="card-3d rounded-[16px] p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="font-display text-xl font-bold text-primary">{order.id}</p>
                <p className="text-sm text-ink-soft">{order.customerName}</p>
                <span
                  className={`rounded-pill px-3 py-1 text-xs font-semibold capitalize ${
                    order.status === "served"
                      ? "bg-success/10 text-success"
                      : order.status === "preparing"
                        ? "bg-primary/10 text-primary"
                        : order.status === "ready"
                          ? "bg-gold/10 text-gold-dark"
                          : "bg-cream text-ink-muted"
                  }`}
                >
                  {order.status}
                </span>
                <p className="text-sm font-bold text-ink">₹{order.total}</p>
              </div>
              <OrderTimeline status={order.status} />
            </article>
          ))
        )}
      </div>
    </div>
  );
}
