import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BadgeIndianRupee, ClipboardList, Flame, UtensilsCrossed } from "lucide-react";
import { useAppData } from "../context/AppDataContext";

export default function AdminDashboardScreen() {
  const { orders, menuItems, currentUser } = useAppData();

  const revenue = useMemo(() => Math.floor(Math.random() * 5000) + 5000, []);
  const chartData = useMemo(
    () =>
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
        day,
        value: Math.floor(Math.random() * 20) + 10
      })),
    []
  );

  const maxChartValue = Math.max(...chartData.map((d) => d.value));

  if (currentUser.role !== "admin") {
    return (
      <div className="card-3d rounded-[16px] p-6 text-sm text-ink-muted">
        Admin mode is mocked. Switch role to admin from the login screen.
      </div>
    );
  }

  const kpis = [
    { label: "Revenue (Fake)", value: `₹${revenue}`, icon: BadgeIndianRupee, accent: "gold" },
    { label: "Total Orders", value: orders.length, icon: ClipboardList, accent: "brand" },
    {
      label: "Live Orders",
      value: orders.filter((order) => order.status !== "served").length,
      icon: Flame,
      accent: "green"
    },
    { label: "Menu Items", value: menuItems.length, icon: UtensilsCrossed, accent: "brand" }
  ];

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-ink-muted">All stats are generated from local state / mock values.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/menu" className="btn-primary px-4 py-2 text-xs">
            Manage Menu
          </Link>
          <Link to="/admin/orders" className="rounded-btn border border-primary/20 bg-white px-4 py-2 text-xs font-semibold text-ink-soft transition hover:bg-primary/5">
            Manage Orders
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, accent }) => (
          <article
            key={label}
            className={`card-3d relative overflow-hidden rounded-[16px] bg-gradient-to-br ${accentStyles[accent]} p-5`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-label text-[11px] uppercase tracking-wider text-ink-muted">{label}</p>
                <p className="mt-2 font-display text-[36px] font-bold text-primary">{value}</p>
              </div>
              <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ${accentIcons[accent]}`}>
                <Icon size={22} />
              </span>
            </div>
            <span className="absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-primary/10" />
          </article>
        ))}
      </div>

      <div className="card-3d rounded-[16px] p-5">
        <h3 className="mb-6 font-display text-xl text-ink">Weekly Mock Traffic</h3>
        <div className="flex items-end justify-between gap-3">
          {chartData.map((point) => {
            const heightPercent = (point.value / maxChartValue) * 100;
            return (
              <div key={point.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold text-ink-soft">{point.value}</span>
                <div
                  className="w-full rounded-t-[6px] bg-gradient-to-t from-primary to-gold transition-all duration-500"
                  style={{ height: `${heightPercent}%`, minHeight: "20px" }}
                />
                <p className="text-xs text-ink-muted">{point.day}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-display text-xl text-ink">Recent Orders</h3>
        {orders.slice(0, 5).map((order) => (
          <article key={order.id} className="card-3d rounded-[14px] p-4 transition hover:shadow-card-hover">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-display text-lg font-bold text-primary">{order.id}</p>
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
              <Link to={`/track/${order.id}`} className="text-xs font-semibold text-primary hover:underline">
                Advance Status →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
