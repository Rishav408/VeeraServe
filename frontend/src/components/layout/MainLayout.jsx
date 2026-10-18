import { CheckCircle, ClipboardList, Home, MessageSquare, ShoppingBag, Tag, UserCircle2, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";
import { NavLink, Outlet } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useUI } from "../../context/UIContext";
import RightRail from "./RightRail";
import SidebarNav from "./SidebarNav";

const mobileLinks = [
  { to: "/", label: "Home", icon: Home },
  { to: "/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/cart", label: "Cart", icon: ShoppingBag },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/offers", label: "Offers", icon: Tag },
  { to: "/profile", label: "Profile", icon: UserCircle2 }
];

export default function MainLayout() {
  const { toast } = useUI();
  const { items } = useCart();
  const cartCount = items.reduce((sum, entry) => sum + entry.quantity, 0);

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 gap-4 p-3 pb-24 sm:p-4 sm:pb-24 lg:grid-cols-[260px,1fr] lg:pb-4 xl:grid-cols-[260px,1fr,300px]">
      <SidebarNav />

      <main className="glass-card min-w-0 overflow-hidden rounded-[28px] p-4 shadow-card sm:p-6">
        <div className="scrollbar-hide sticky top-0 z-20 -mx-4 mb-4 overflow-x-auto border-b border-primary/10 bg-white/80 px-4 pb-3 pt-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden">
          <div className="flex min-w-max gap-2">
            {mobileLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `category-chip whitespace-nowrap ${isActive ? "active" : ""}`}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="page-enter">
          <Outlet />
        </div>
      </main>

      <RightRail />

      <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-1 rounded-2xl border border-primary/20 bg-white/90 p-2 shadow-card backdrop-blur-md lg:hidden">
        {mobileLinks.slice(0, 5).map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition ${
                  isActive ? "bg-category-active text-white" : "text-ink-muted hover:bg-primary/10"
                }`
              }
            >
              <Icon size={16} />
              {link.label}
              {link.to === "/cart" && cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 0.3, type: "spring" }}
                  className="absolute right-2 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-white"
                >
                  {cartCount}
                </motion.span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="toast-enter fixed bottom-20 left-4 z-50 inline-flex items-center gap-2 rounded-2xl bg-dhaba-hero px-6 py-4 text-sm font-semibold text-white shadow-glow-orange lg:bottom-6"
        >
          <CheckCircle size={18} />
          {toast}
        </motion.div>
      )}
    </div>
  );
}
