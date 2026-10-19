import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useHealth } from "../../hooks/useHealth";
import { useMenuItems } from "../../hooks/useMenu";
import { useOrders } from "../../hooks/useOrders";
import { Spinner } from "../ui";
import MiniCart from "../MiniCart";

export default function RightRail() {
  const { user } = useAuth();
  const { data: orders = [] } = useOrders({ poll: true, enabled: Boolean(user) });
  const { data: menuItems = [] } = useMenuItems();
  const { addToCart } = useCart();
  const health = useHealth();

  const activeOrders = useMemo(
    () => orders.filter((order) => ["pending", "preparing", "ready"].includes(order.status)).length,
    [orders]
  );

  const servedOrders = useMemo(
    () => orders.filter((order) => order.status === "served").length,
    [orders]
  );

  const specialItem = menuItems[0];

  return (
    <aside className="hidden space-y-3 xl:block">
      <MiniCart />

      <div className="flex items-center gap-2 rounded-pill bg-cream px-3 py-2 text-[13px] font-semibold text-ink-soft">
        {health.isPending ? (
          <Spinner size={14} />
        ) : (
          <span className={`h-2.5 w-2.5 rounded-full ${health.isSuccess ? "bg-success" : "bg-danger"}`} />
        )}
        AI backend: {health.isPending ? "checking…" : health.isSuccess ? "online" : "offline"}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 rounded-pill bg-cream px-3 py-2 text-[13px] font-semibold text-ink-soft">
          Active orders: {activeOrders}
        </div>
        <div className="flex-1 rounded-pill bg-cream px-3 py-2 text-[13px] font-semibold text-ink-soft">
          Served: {servedOrders}
        </div>
      </div>

      {specialItem && (
        <article className="card-3d rounded-[16px] bg-gradient-to-br from-gold/20 to-primary/10 p-4">
          <h3 className="font-display text-base text-ink">Today's Special</h3>
          <div className="mt-3 flex items-center gap-3">
            <img src={specialItem.image ?? undefined} alt={specialItem.name} className="h-14 w-14 rounded-xl object-cover" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-soft">{specialItem.name}</p>
              <p className="text-sm font-bold text-primary">₹{specialItem.price}</p>
            </div>
            <button type="button" onClick={() => addToCart(specialItem)} className="btn-primary px-3 py-1.5 text-xs">
              Add
            </button>
          </div>
        </article>
      )}
    </aside>
  );
}
