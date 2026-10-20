import { motion } from "framer-motion";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useMenuItems } from "../hooks/useMenu";
import { Badge, Button, EmptyState, buttonClasses } from "../components/ui";

export default function CartScreen() {
  const { items, subtotal, updateQuantity, removeFromCart } = useCart();
  const { data: menuItems = [] } = useMenuItems();
  const gst = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + gst;

  const cartItemIds = items.map((entry) => entry.item.id);
  const completeSuggestions = menuItems
    .filter((item) => !cartItemIds.includes(item.id) && (item.category === "breads" || item.category === "beverages"))
    .slice(0, 3);

  if (items.length === 0) {
    return (
      <div className="py-16">
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          description="Looks like you haven't added anything yet."
          action={
            <Link to="/menu" className={buttonClasses("primary", "inline-flex items-center gap-2 text-sm")}>
              Explore the Menu <ShoppingCart size={16} />
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl text-ink">Your Cart 🛒</h1>
        <span className="inline-flex items-center justify-center rounded-full bg-primary px-2.5 py-0.5 text-sm font-semibold text-white">
          {items.length}
        </span>
      </div>

      <div className="space-y-3">
        {items.map((entry) => (
          <motion.article
            key={entry.item.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-3d relative flex items-center gap-4 rounded-[16px] p-4"
          >
            <button
              type="button"
              onClick={() => removeFromCart(entry.item.id)}
              aria-label={`Remove ${entry.item.name} from cart`}
              className="absolute right-3 top-3 text-ink-muted transition hover:text-danger"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>

            <img
              src={entry.item.image ?? undefined}
              alt={entry.item.name}
              className="h-[60px] w-[60px] shrink-0 rounded-full border-2 border-cream object-cover"
            />

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-ink-soft">{entry.item.name}</h3>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {(entry.item.tags || []).map((tag) => (
                  <Badge key={tag} tone="gold" className="text-[11px]">
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="mt-1 text-xs text-ink-muted">₹{entry.item.price} each</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => updateQuantity(entry.item.id, entry.quantity - 1)}
                aria-label={`Decrease quantity of ${entry.item.name}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-cream text-ink transition hover:border-primary"
              >
                <Minus size={14} aria-hidden="true" />
              </button>
              <span className="w-8 text-center font-display text-lg font-semibold text-primary">
                <span className="sr-only">Quantity </span>
                {entry.quantity}
              </span>
              <button
                type="button"
                onClick={() => updateQuantity(entry.item.id, entry.quantity + 1)}
                aria-label={`Increase quantity of ${entry.item.name}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-cream text-ink transition hover:border-primary"
              >
                <Plus size={14} aria-hidden="true" />
              </button>
            </div>

            <p className="shrink-0 font-display text-xl font-bold text-primary">
              ₹{entry.item.price * entry.quantity}
            </p>
          </motion.article>
        ))}
      </div>

      {completeSuggestions.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-display text-lg text-ink">🍞 Complete your meal</h3>
          <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
            {completeSuggestions.map((item) => (
              <div key={item.id} className="min-w-[220px]">
                <Link to={`/menu/${item.id}`} className="card-3d block rounded-[16px] p-4 transition hover:shadow-card-hover">
                  <div className="flex items-center gap-3">
                    <img src={item.image ?? undefined} alt={item.name} className="h-[72px] w-[72px] rounded-xl object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-soft">{item.name}</p>
                      <p className="text-sm font-bold text-primary">₹{item.price}</p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="card-3d rounded-[16px] p-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-muted">Subtotal</span>
            <span className="text-sm font-semibold text-ink">₹{subtotal}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-muted">GST (5%)</span>
            <span className="text-sm font-semibold text-ink">₹{gst}</span>
          </div>
          <div className="border-t border-primary/15 pt-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg text-ink-soft">Grand Total</span>
              <span className="font-display text-2xl font-bold text-primary">₹{grandTotal}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[12px] bg-cream p-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Promo code"
              className="flex-1 rounded-pill border border-primary/20 bg-white px-4 py-2 text-sm outline-none focus:border-primary"
            />
            <Button variant="ghost">Apply</Button>
          </div>
        </div>

        <Link to="/checkout" className="btn-primary mt-4 flex h-14 w-full items-center justify-center gap-2 text-base font-semibold shadow-glow-orange">
          Proceed to Checkout <ShoppingCart size={18} />
        </Link>
      </div>
    </div>
  );
}
