import { Minus, Plus, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function MiniCart() {
  const { items, subtotal, updateQuantity, removeFromCart } = useCart();

  return (
    <section className="card-3d rounded-[20px] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg text-ink">Your Order</h3>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShoppingBag size={16} />
        </span>
      </div>

      <div className="max-h-[360px] overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-cream/70 p-5 text-center">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-cream">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="14" stroke="#CC5500" strokeWidth="2" />
                <circle cx="20" cy="20" r="4" fill="#FFB300" />
                <path d="M10 25H30" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-ink-soft">Nothing here yet</p>
            <Link to="/menu" className="mt-1 inline-block text-sm font-semibold text-primary hover:underline">
              Browse Menu ?
            </Link>
          </div>
        ) : (
          items.map((entry) => (
            <div key={entry.item.id} className="card-3d mb-2 rounded-[12px] p-3">
              <div className="flex items-start gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {entry.item.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-soft">{entry.item.name}</p>
                  <p className="text-[15px] font-bold text-primary">₹{entry.item.price * entry.quantity}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(entry.item.id)}
                  className="text-danger transition hover:scale-110"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="mt-2 flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => updateQuantity(entry.item.id, entry.quantity - 1)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/20 bg-cream text-ink"
                >
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{entry.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(entry.item.id, entry.quantity + 1)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/20 bg-cream text-ink"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 border-t border-primary/15 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-ink-muted">Subtotal</span>
          <span className="font-display text-[22px] font-bold text-primary">₹{subtotal}</span>
        </div>
        <Link
          to="/checkout"
          className="btn-primary mt-3 flex w-full items-center justify-center gap-2 text-sm shadow-glow-orange"
        >
          <ShoppingCart size={16} /> Checkout →
        </Link>
      </div>
    </section>
  );
}
