import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BadgeIndianRupee, ClipboardList, Flame, Star, TrendingUp, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, EmptyState, OrderStatusBadge, Spinner } from "../components/ui";
import { useDashboardAnalytics } from "../hooks/useAnalytics";
import { useOrders } from "../hooks/useOrders";

const accentStyles = {
  gold: "from-gold/25 to-gold/10",
  green: "from-success/20 to-success/10",
  brand: "from-primary/20 to-primary/10"
};

const accentIcons = {
  gold: "text-gold",
  green: "text-success",
  brand: "text-primary"
};

type Accent = keyof typeof accentStyles;

export default function AdminDashboardScreen() {
  const { data, isPending, isError } = useDashboardAnalytics();
  const ordersQuery = useOrders({ poll: true });

  const recentOrders = (ordersQuery.data ?? []).slice(0, 5);
  const week = data?.revenue_by_day ?? [];
  const maxOrders = Math.max(1, ...week.map((day) => day.orders));
  const peakHours = (data?.peak_hours ?? []).filter((entry) => entry.orders > 0);
  const maxHour = Math.max(1, ...peakHours.map((entry) => entry.orders));

  const kpis: { label: string; value: ReactNode; icon: LucideIcon; accent: Accent }[] = [
    { label: "Revenue", value: `₹${(data?.total_revenue ?? 0).toLocaleString("en-IN")}`, icon: BadgeIndianRupee, accent: "gold" },
    { label: "Total Orders", value: data?.total_orders ?? 0, icon: ClipboardList, accent: "brand" },
    { label: "Active Orders", value: data?.active_orders ?? 0, icon: Flame, accent: "green" },
    { label: "Menu Items", value: data?.menu_items ?? 0, icon: UtensilsCrossed, accent: "brand" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-ink-muted">Live metrics computed from the database.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/menu" className="btn-primary px-4 py-2 text-xs">
            Manage Menu
          </Link>
          <Link
            to="/admin/orders"
            className="rounded-btn border border-primary/20 bg-white px-4 py-2 text-xs font-semibold text-ink-soft transition hover:bg-primary/5"
          >
            Manage Orders
          </Link>
        </div>
      </div>

      {isPending && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {isError && (
        <EmptyState title="Analytics unavailable" description="Could not load dashboard metrics." />
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map(({ label, value, icon: Icon, accent }) => (
              <Card
                as="article"
                key={label}
                className={`relative overflow-hidden rounded-[16px] bg-gradient-to-br ${accentStyles[accent]} p-5`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-label text-[11px] uppercase tracking-wider text-ink-muted">{label}</p>
                    <p className="mt-2 font-display text-[32px] font-bold text-primary">{value}</p>
                  </div>
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ${accentIcons[accent]}`}>
                    <Icon size={22} />
                  </span>
                </div>
                <span className="absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-primary/10" />
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="rounded-[16px] p-5 lg:col-span-2">
              <div className="mb-6 flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                <h3 className="font-display text-xl text-ink">Orders — Last 7 Days</h3>
              </div>
              <div className="flex items-end justify-between gap-3">
                {week.map((point) => (
                  <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-ink-soft">{point.orders}</span>
                    <div
                      className="w-full rounded-t-[6px] bg-gradient-to-t from-primary to-gold transition-all duration-500"
                      style={{ height: `${(point.orders / maxOrders) * 100}%`, minHeight: "4px" }}
                      title={`₹${point.revenue}`}
                    />
                    <p className="text-xs text-ink-muted">{point.weekday}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-ink-muted">
                Average order value ₹{data.avg_order_value.toLocaleString("en-IN")}
              </p>
            </Card>

            <Card className="rounded-[16px] p-5">
              <div className="mb-4 flex items-center gap-2">
                <Star size={18} className="text-gold" />
                <h3 className="font-display text-xl text-ink">Ratings</h3>
              </div>
              {data.ratings.count === 0 ? (
                <p className="text-sm text-ink-muted">No feedback submitted yet.</p>
              ) : (
                <div className="space-y-3 text-sm">
                  <p className="font-display text-[36px] font-bold text-primary">
                    {data.ratings.overall.toFixed(1)}
                    <span className="ml-1 text-sm text-ink-muted">/ 5 overall</span>
                  </p>
                  <div className="flex justify-between text-ink-soft">
                    <span>Food</span>
                    <span className="font-semibold">{data.ratings.food.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-ink-soft">
                    <span>Service</span>
                    <span className="font-semibold">{data.ratings.service.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-ink-soft">
                    <span>AI waiter</span>
                    <span className="font-semibold">{data.ratings.ai.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-ink-muted">{data.ratings.count} responses</p>
                </div>
              )}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-[16px] p-5">
              <h3 className="mb-4 font-display text-xl text-ink">Top Items</h3>
              {data.top_items.length === 0 ? (
                <p className="text-sm text-ink-muted">No items ordered yet.</p>
              ) : (
                <ul className="space-y-3">
                  {data.top_items.map((item, index) => (
                    <li key={item.menu_item_id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-3 text-ink-soft">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                        {item.name}
                      </span>
                      <span className="font-semibold text-ink">
                        {item.quantity} × · ₹{item.revenue}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="rounded-[16px] p-5">
              <h3 className="mb-4 font-display text-xl text-ink">Peak Hours</h3>
              {peakHours.length === 0 ? (
                <p className="text-sm text-ink-muted">No order activity yet.</p>
              ) : (
                <div className="flex items-end justify-between gap-2">
                  {peakHours.map((entry) => (
                    <div key={entry.hour} className="flex flex-1 flex-col items-center gap-2">
                      <span className="text-[10px] font-semibold text-ink-soft">{entry.orders}</span>
                      <div
                        className="w-full rounded-t-[4px] bg-gradient-to-t from-primary/80 to-primary/40"
                        style={{ height: `${(entry.orders / maxHour) * 80}px` }}
                      />
                      <p className="text-[10px] text-ink-muted">{entry.hour}:00</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl text-ink">Recent Orders</h3>
              <Link to="/admin/orders" className="text-sm font-semibold text-primary hover:underline">
                View all →
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-ink-muted">No orders yet.</p>
            ) : (
              recentOrders.map((order) => (
                <Card as="article" key={order.id} className="rounded-[14px] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-display text-lg font-bold text-primary">#{order.id}</p>
                    {order.table_number !== null && (
                      <p className="text-sm text-ink-soft">Table {order.table_number}</p>
                    )}
                    <OrderStatusBadge status={order.status} />
                    <p className="text-sm font-bold text-ink">₹{order.total}</p>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
