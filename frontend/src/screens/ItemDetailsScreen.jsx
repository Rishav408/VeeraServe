import { motion } from "framer-motion";
import { ArrowLeft, Clock3, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FoodCard from "../components/FoodCard";
import { useAppData } from "../context/AppDataContext";
import { useCart } from "../context/CartContext";
import { useUI } from "../context/UIContext";

const customisations = ["Extra spicy", "No onion", "No garlic", "Extra cheese"];
const categoryLabels = {
  starters: "Starters",
  mains: "Main Course",
  rice: "Rice",
  breads: "Breads",
  beverages: "Beverages",
  desserts: "Desserts"
};

export default function ItemDetailsScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { menuItems } = useAppData();
  const { addToCart } = useCart();
  const { showToast } = useUI();
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState([]);

  const item = useMemo(() => menuItems.find((menuItem) => menuItem.id === id), [menuItems, id]);

  const related = useMemo(() => {
    if (!item) return [];
    return menuItems.filter((entry) => entry.category === item.category && entry.id !== item.id).slice(0, 3);
  }, [item, menuItems]);

  if (!item) {
    return (
      <div className="card-3d rounded-[20px] p-6 text-sm text-ink-muted">
        Dish not found.
      </div>
    );
  }

  const toggleCustom = (label) => {
    setSelected((current) =>
      current.includes(label) ? current.filter((entry) => entry !== label) : [...current, label]
    );
  };

  const handleAdd = () => {
    for (let index = 0; index < quantity; index += 1) {
      addToCart(item);
    }
    showToast(`${item.name} added to cart (${quantity})`);
  };

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 rounded-pill border border-primary/15 bg-white/80 px-4 py-2 text-sm font-semibold text-ink-soft backdrop-blur"
      >
        <ArrowLeft size={15} /> Back to Menu
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative h-[300px] overflow-hidden rounded-[20px]"
      >
        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <h1 className="absolute bottom-5 left-5 font-display text-[32px] font-bold text-white">{item.name}</h1>
        <span className="absolute right-4 top-4 rounded-pill bg-primary px-3 py-1 text-[13px] font-semibold text-white">
          {categoryLabels[item.category] || item.category}
        </span>
      </motion.div>

      <section className="grid gap-5 lg:grid-cols-[1fr,420px]">
        <div className="space-y-4">
          <div>
            <p className="font-display text-[38px] font-bold leading-none text-primary">₹{item.price}</p>
            <p className="text-[13px] text-ink-muted">per serving</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={18} className="fill-gold text-gold" />
            ))}
            <span className="font-semibold text-ink-soft">{item.rating}</span>
            <span className="text-ink-muted">(24 reviews)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-pill bg-cream px-3 py-1 text-sm">
              {item.spiceLevel > 0 ? "🌶️".repeat(item.spiceLevel) : "Mild"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-pill border border-primary/15 bg-white/70 px-3 py-1 text-sm text-ink-muted">
              <Clock3 size={14} /> {item.prepTime}
            </span>
            {(item.tags || []).map((tag) => (
              <span
                key={tag}
                className="rounded-pill bg-gradient-to-r from-gold to-gold-light px-3 py-1 text-xs font-semibold text-secondary-dark"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="text-[15px] leading-relaxed text-ink-soft">{item.description}</p>

          {related.length > 0 && (
            <section className="space-y-3 pt-2">
              <h3 className="font-display text-2xl text-ink">Pairs well with...</h3>
              <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
                {related.map((entry) => (
                  <div key={entry.id} className="min-w-[250px]">
                    <FoodCard item={entry} compact />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="card-3d rounded-[16px] p-5 lg:sticky lg:top-24">
          <h3 className="font-label text-base font-semibold text-ink">Customise Your Order</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {customisations.map((option) => {
              const active = selected.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleCustom(option)}
                  className={`rounded-chip border p-2 text-left text-[13px] transition ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-primary/20 bg-white/80 text-ink-soft hover:border-primary/40"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-cream text-xl text-ink"
            >
              −
            </button>
            <span className="w-12 text-center font-display text-2xl text-primary">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-cream text-xl text-ink"
            >
              +
            </button>
          </div>

          <button type="button" onClick={handleAdd} className="btn-primary mt-6 w-full shadow-glow-orange">
            Add to Cart — ₹{item.price * quantity}
          </button>
        </aside>
      </section>
    </div>
  );
}
