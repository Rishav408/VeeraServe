import { useMemo } from "react";
import { useAppData } from "../../context/AppDataContext";
import { useCart } from "../../context/CartContext";
import MiniCart from "../MiniCart";

export default function RightRail() {
  const { orders, feedback, menuItems } = useAppData();
  const { addToCart } = useCart();

  const pendingOrders = useMemo(
    () => orders.filter((order) => ["pending", "preparing", "ready"].includes(order.status)).length,
    [orders]
  );

  const specialItem = menuItems[0];

  return (
    <aside className="hidden space-y-3 xl:block">
      <MiniCart />

      <div className="flex gap-2">
        <div className="flex-1 rounded-pill bg-cream px-3 py-2 text-[13px] font-semibold text-ink-soft">
          Active orders: {pendingOrders}
        </div>
        <div className="flex-1 rounded-pill bg-cream px-3 py-2 text-[13px] font-semibold text-ink-soft">
          Feedback: {feedback.length}
        </div>
      </div>

      {specialItem && (
        <article className="card-3d rounded-[16px] bg-gradient-to-br from-gold/20 to-primary/10 p-4">
          <h3 className="font-display text-base text-ink">Today's Special</h3>
          <div className="mt-3 flex items-center gap-3">
            <img src={specialItem.image} alt={specialItem.name} className="h-14 w-14 rounded-xl object-cover" />
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
