import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import FoodCard from "../components/FoodCard";
import { EmptyState, Spinner } from "../components/ui";
import { useUI } from "../context/UIContext";
import { useCategories, useMenuItems } from "../hooks/useMenu";

export default function MenuScreen() {
  const { activeCategory, setCategory } = useUI();
  const [search, setSearch] = useState("");

  const { data: categories = [] } = useCategories();
  const { data: allItems = [] } = useMenuItems();
  const filters = useMemo(
    () => ({
      category: activeCategory === "all" ? undefined : activeCategory,
      search: search.trim() || undefined
    }),
    [activeCategory, search]
  );
  const { data: items = [], isPending } = useMenuItems(filters);

  const tabs = useMemo(() => ["all", ...categories.map((category) => category.id)], [categories]);

  const labelFor = (id: string) =>
    id === "all" ? "All" : categories.find((category) => category.id === id)?.label ?? id;

  const grouped = useMemo(() => {
    if (activeCategory !== "all") {
      return [{ key: activeCategory, items }];
    }
    return tabs
      .filter((tab) => tab !== "all")
      .map((tab) => ({ key: tab, items: items.filter((item) => item.category === tab) }))
      .filter((group) => group.items.length > 0);
  }, [activeCategory, items, tabs]);

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
          {tabs.map((tab) => {
            const count = tab === "all" ? allItems.length : allItems.filter((item) => item.category === tab).length;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setCategory(tab)}
                className={`category-chip shrink-0 whitespace-nowrap text-xs sm:text-sm ${activeCategory === tab ? "active shadow-glow-orange" : ""}`}
              >
                {labelFor(tab)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {isPending ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="🍽️"
          title="Nothing found"
          action={
            <button type="button" onClick={() => setSearch("")} className="text-sm font-semibold text-primary hover:underline">
              Clear search
            </button>
          }
        />
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.key} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-xl text-ink">{labelFor(group.key)}</h2>
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
