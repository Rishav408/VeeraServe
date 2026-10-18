import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Flame, Sparkles, Star, Utensils } from "lucide-react";
import FoodCard from "../components/FoodCard";
import { useAppData } from "../context/AppDataContext";
import { useUI } from "../context/UIContext";

export default function HomeScreen() {
  const { orders, menuItems, currentUser } = useAppData();
  const { setCategory } = useUI();
  const navigate = useNavigate();
  const MotionSection = motion.section;

  const specials = menuItems.slice(0, 4);
  const heroImages = menuItems.slice(0, 3);

  const kpis = [
    { label: "Menu Items", value: menuItems.length, icon: Utensils },
    { label: "Orders", value: orders.length, icon: Flame },
    { label: "Avg Rating", value: "4.8", icon: Star }
  ];

  const quickFilters = [
    { label: "🔥 Spicy", category: "mains" },
    { label: "🥗 Veg", category: "appetizers-veg" },
    { label: "⚡ Quick (< 10 min)", category: "breads" },
    { label: "⭐ Top Rated", category: "all" },
    { label: "🍚 Rice", category: "rice-noodles" }
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Welcome, {currentUser.name}</h1>
        <p className="text-sm text-ink-muted">Homepage is your menu-first ordering surface.</p>
      </header>

      <MotionSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[24px] bg-dhaba-hero px-6 py-6 text-white"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <span className="inline-flex items-center gap-2 rounded-pill bg-white/15 px-3 py-1 text-[12px] font-medium backdrop-blur-sm">
              <Sparkles size={12} /> AI-Powered Ordering
            </span>
            <h2 className="mt-3 font-display text-2xl leading-tight sm:text-3xl lg:text-[38px]">Namaskar</h2>
            <p className="font-display text-lg leading-tight text-white/85 sm:text-xl">What are you craving?</p>
            <p className="mt-2 text-sm text-white/70">Authentic Veera Dhabha flavours</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 rounded-btn bg-white px-5 py-3 text-sm font-semibold text-primary shadow-btn-primary"
              >
                Order Now <ArrowRight size={14} />
              </Link>
              <Link
                to="/menu"
                className="inline-flex items-center rounded-btn border border-white/50 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                View Menu
              </Link>
            </div>
          </div>

          <div className="relative mx-auto h-[120px] w-[160px] shrink-0 md:mx-0">
            {heroImages.map((item, idx) => (
              <img
                key={item.id}
                src={item.image}
                alt={item.name}
                className="absolute h-[64px] w-[64px] animate-float rounded-full border-2 border-white object-cover shadow-card md:h-[72px] md:w-[72px]"
                style={{
                  animationDelay: `${idx * 0.4}s`,
                  left: idx === 0 ? "0px" : idx === 1 ? "56px" : "20px",
                  top: idx === 0 ? "4px" : idx === 1 ? "0px" : "44px"
                }}
              />
            ))}
            <div className="absolute bottom-1 right-1 rounded-pill bg-white/20 px-2 py-0.5 text-[10px] backdrop-blur-sm">
              Fresh 🫓
            </div>
          </div>
        </div>
      </MotionSection>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map(({ label, value, icon: Icon }) => (
          <article key={label} className="card-3d relative overflow-hidden rounded-[16px] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-[32px] font-bold text-primary">{value}</p>
                <p className="font-label text-[13px] uppercase tracking-wider text-ink-muted">{label}</p>
              </div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon size={18} />
              </div>
            </div>
            <span className="absolute -bottom-6 -right-5 h-16 w-16 rounded-full bg-primary/5" />
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl text-ink">Today's Picks</h3>
          <Link to="/menu" className="text-sm font-semibold text-primary hover:underline">
            See all →
          </Link>
        </div>
        <div className="scrollbar-hide flex snap-x gap-4 overflow-x-auto pb-2">
          {specials.map((item) => (
            <div key={item.id} className="w-[260px] shrink-0 snap-start">
              <FoodCard item={item} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="text-base font-semibold text-ink-soft">What are you in the mood for?</h4>
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          {quickFilters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              className="category-chip shrink-0 whitespace-nowrap"
              onClick={() => {
                setCategory(filter.category);
                navigate("/menu");
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
