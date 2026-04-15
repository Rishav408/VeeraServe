import { Link } from "react-router-dom";
import OrderTimeline from "../components/OrderTimeline";
import { useAppData } from "../context/AppDataContext";

export default function OrdersScreen() {
  const { orders } = useAppData();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-ink">Your Orders</h1>
        <p className="mt-1 text-sm text-ink-muted">Live status simulation from pending to served.</p>
      </div>

      {orders.length === 0 ? (
        <div className="card-3d rounded-[16px] p-6 text-center text-sm text-ink-muted">
          No orders yet. <Link to="/menu" className="font-semibold text-primary">Browse menu</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <article key={order.id} className="card-3d rounded-[16px] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-xl font-bold text-primary">{order.id}</p>
                <p className="rounded-pill bg-cream px-3 py-1 text-xs font-semibold capitalize text-ink-soft">{order.status}</p>
                <p className="text-sm font-semibold text-ink-muted">₹{order.total}</p>
              </div>
              <OrderTimeline status={order.status} compact />
              <Link to={`/track/${order.id}`} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
                Open Tracker →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
