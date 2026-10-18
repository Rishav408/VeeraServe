import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import FoodCard from "../components/FoodCard";
import { useAppData } from "../context/AppDataContext";
import { useUI } from "../context/UIContext";
import { categoryTabs } from "../data/mockData";

const categoryLabels = {
  all: "All",
  "world-plates": "World Plates",
  "rice-noodles": "Rice & Noodles",
  breads: "Indian Breads",
  mains: "Mains",
  "appetizers-veg": "Veg Appetizers",
  "appetizers-nonveg": "Non-Veg Appetizers",
  beverages: "Beverages"
};

export default function MenuScreen() {
  const { activeCategory, setCategory } = useUI();
  const { menuItems } = useAppData();
  const [search, setSearch] = useState("");

  const searchFiltered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return menuItems;
    return menuItems.filter((item) => `${item.name} ${item.description}`.toLowerCase().includes(query));
  }, [menuItems, search]);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return searchFiltered;
    return searchFiltered.filter((item) => item.category === activeCategory);
  }, [activeCategory, searchFiltered]);

  const grouped = useMemo(() => {
    if (activeCategory !== "all") return [{ key: activeCategory, items: filtered }];
    return categoryTabs
      .filter((tab) => tab !== "all")
      .map((tab) => ({ key: tab, items: filtered.filter((item) => item.category === tab) }))
      .filter((group) => group.items.length > 0);
  }, [activeCategory, filtered]);

  return (
    <div className="space-y-4">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 rounded-b-[16px] border-b border-primary/10 bg-white/80 px-3 py-3 backdrop-blur-md sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-xl text-ink sm:text-2xl">Our Menu</h1>
          <div className="relative w-full sm:w-[280px]">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search dishes..."
              className="w-full rounded-pill border border-primary/20 bg-cream py-2 pl-9 pr-4 text-sm outline-none transition focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="scrollbar-hide sticky top-[68px] z-10 rounded-b-[12px] bg-white/60 px-3 py-2 backdrop-blur sm:px-4">
        <div className="flex gap-2">
          {categoryTabs.map((tab) => {
            const count = tab === "all" ? menuItems.length : menuItems.filter((item) => item.category === tab).length;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setCategory(tab)}
                className={`category-chip shrink-0 whitespace-nowrap text-xs sm:text-sm ${activeCategory === tab ? "active shadow-glow-orange" : ""}`}
              >
                {categoryLabels[tab]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="flex h-[200px] flex-col items-center justify-center rounded-[20px] card-3d text-center">
          <div className="text-5xl">🍽️</div>
          <h3 className="mt-2 font-display text-[22px] text-ink-soft">Nothing found</h3>
          <button type="button" onClick={() => setSearch("")} className="mt-2 text-sm font-semibold text-primary hover:underline">
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.key} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-xl text-ink">{categoryLabels[group.key]}</h2>
                <span className="rounded-pill bg-gold px-2.5 py-0.5 text-xs font-semibold text-secondary-dark">
                  {group.items.length}
                </span>
              </div>
              <div className="border-t border-primary/15" />

              <motion.div
                variants={{ visible: { transition: { staggerChildren: 0.055 } } }}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5"
              >
                {group.items.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={{
                      hidden: { opacity: 0, y: 24 },
                      visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
                    }}
                  >
                    <FoodCard item={item} />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
