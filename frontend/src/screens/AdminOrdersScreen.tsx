import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import OrderTimeline from "../components/OrderTimeline";
import { Badge, Button, Card, EmptyState, OrderStatusBadge, Spinner } from "../components/ui";
import { useAdminMenuItems } from "../hooks/useAdminMenu";
import { useOrders, useUpdateOrderStatus } from "../hooks/useOrders";
import type { OrderDto, OrderStatusDto } from "../types/api";

const FILTERS: { label: string; value: OrderStatusDto | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Preparing", value: "preparing" },
  { label: "Ready", value: "ready" },
  { label: "Served", value: "served" }
];

const NEXT_STATUS: Record<OrderStatusDto, OrderStatusDto | null> = {
  pending: "preparing",
  preparing: "ready",
  ready: "served",
  served: null
};

function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} h ago`;
}

export default function AdminOrdersScreen() {
  const [filter, setFilter] = useState<OrderStatusDto | "all">("all");
  const status = filter === "all" ? undefined : filter;
  const ordersQuery = useOrders({ poll: true, status });
  const menuQuery = useAdminMenuItems();
  const updateStatus = useUpdateOrderStatus();

  const itemNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of menuQuery.data ?? []) {
      map.set(item.id, item.name);
    }
    return map;
  }, [menuQuery.data]);

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);

  const advance = (order: OrderDto) => {
    const next = NEXT_STATUS[order.status];
    if (next) {
      updateStatus.mutate({ id: order.id, status: next });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Order Management</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Live orders from the database. Advance status forward through the kitchen pipeline.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`rounded-pill px-3.5 py-1.5 text-sm font-semibold transition ${
              filter === option.value
                ? "bg-primary text-white"
                : "bg-cream text-ink-soft hover:bg-primary/10"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {ordersQuery.isPending && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {ordersQuery.isSuccess && orders.length === 0 && (
        <EmptyState title="No orders here" description="Orders placed by diners or the AI waiter appear here." />
      )}

      <div className="space-y-3">
        {orders.map((order) => {
          const next = NEXT_STATUS[order.status];
          return (
            <Card as="article" key={order.id} className="rounded-[16px] p-5">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <p className="font-display text-xl font-bold text-primary">#{order.id}</p>
                {order.table_number !== null && (
                  <Badge tone="neutral">Table {order.table_number}</Badge>
                )}
                <OrderStatusBadge status={order.status} />
                <span className="text-xs text-ink-muted">{timeAgo(order.created_at)}</span>
                <p className="ml-auto text-sm font-bold text-ink">₹{order.total}</p>
              </div>

              <ul className="mb-4 space-y-1 text-sm text-ink-soft">
                {order.items.map((line) => (
                  <li key={`${order.id}-${line.menu_item_id}`}>
                    {line.quantity} × {itemNames.get(line.menu_item_id) ?? line.menu_item_id}
                    <span className="text-ink-muted"> · ₹{line.unit_price}</span>
                  </li>
                ))}
              </ul>

              {order.instructions && (
                <p className="mb-4 text-xs italic text-ink-muted">Note: {order.instructions}</p>
              )}

              <OrderTimeline status={order.status} />

              {next && (
                <div className="mt-4 flex justify-end">
                  <Button
                    className="flex items-center gap-2 text-sm capitalize"
                    disabled={updateStatus.isPending}
                    onClick={() => advance(order)}
                  >
                    Mark {next} <ArrowRight size={14} />
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {updateStatus.isError && (
        <p className="text-sm font-semibold text-danger">
          {(updateStatus.error as Error).message}
        </p>
      )}
    </div>
  );
}
