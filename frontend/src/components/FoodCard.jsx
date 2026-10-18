import { motion } from "framer-motion";
import { Clock3, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function FoodCard({ item, compact = false }) {
  const { addToCart, items } = useCart();
  const inCart = items.some((entry) => entry.item.id === item.id);

  const onAdd = () => {
    if (item.isAvailable) {
      addToCart(item);
    }
  };

  if (compact) {
    return (
      <article className="card-3d flex items-center gap-3 rounded-[16px] p-3">
        <img src={item.image} alt={item.name} className="h-[72px] w-[72px] rounded-xl border border-primary/15 object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink-soft">{item.name}</p>
          <p className="text-sm font-bold text-primary">₹{item.price}</p>
          <button type="button" onClick={onAdd} className="mt-1 text-xs font-semibold text-primary hover:underline">
            Add +
          </button>
        </div>
      </article>
    );
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="card-3d group relative cursor-pointer overflow-hidden rounded-[20px]"
    >
      <div className="relative h-[200px] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-pill bg-black/40 px-2 py-0.5 text-[11px] text-white backdrop-blur-sm">
          <span className={item.isVeg ? "veg-dot" : "nonveg-dot"} />
          {item.isVeg ? "Veg" : "Non-Veg"}
        </div>

        {item.tags?.[0] && (
          <div className="absolute right-3 top-3 rounded-pill bg-badge-gold px-2 py-0.5 text-[11px] font-semibold text-[#3E2723] shadow-glow-gold animate-pulse">
            {item.tags[0]}
          </div>
        )}

        <h3
          className="absolute bottom-3 left-3 font-display text-[18px] font-bold text-white"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
        >
          {item.name}
        </h3>

        {!item.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-bold text-white">
            Sold Out
          </div>
        )}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <p className="font-display text-[22px] font-bold text-primary">₹{item.price}</p>
          <div className="inline-flex items-center gap-1 text-[13px] text-gold-dark">
            <Star size={12} className="fill-gold text-gold" />
            <span className="font-semibold">{item.rating}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-[12px]">
          <span className="truncate">{item.spiceLevel > 0 ? "🌶️".repeat(item.spiceLevel) : "Mild"}</span>
          <span className="inline-flex items-center gap-1 rounded-chip bg-cream px-2 py-1 text-ink-muted">
            <Clock3 size={12} />
            {item.prepTime}
          </span>
        </div>

        <p
          className="text-[13px] text-ink-muted"
          style={{
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical"
          }}
        >
          {item.description}
        </p>

        <div className="mt-3 flex items-center justify-between gap-3">
          <Link to={`/menu/${item.id}`} className="text-[13px] font-semibold text-primary hover:underline">
            Details →
          </Link>

          {!item.isAvailable ? (
            <button type="button" disabled className="rounded-btn bg-stone-300 px-4 py-2 text-[13px] font-semibold text-stone-600">
              Sold Out
            </button>
          ) : inCart ? (
            <button
              type="button"
              onClick={onAdd}
              className="rounded-btn bg-success px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-105"
            >
              In Cart ✓
            </button>
          ) : (
            <motion.button
              type="button"
              onClick={onAdd}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 16 }}
              className="btn-primary px-4 py-2 text-[13px]"
            >
              Add +
            </motion.button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
