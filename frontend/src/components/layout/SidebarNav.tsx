import { motion } from "framer-motion";
import {
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  ShoppingBag,
  Tag,
  UserCircle2,
  UtensilsCrossed
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useCart } from "../../context/CartContext";

const links = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/cart", label: "Cart", icon: ShoppingBag },
  { to: "/chat", label: "AI Chat", icon: MessageSquare },
  { to: "/profile", label: "Profile", icon: UserCircle2 },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/offers", label: "Offers", icon: Tag }
];

export default function SidebarNav() {
  const { items } = useCart();
  const cartCount = items.reduce((sum, entry) => sum + entry.quantity, 0);

  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] flex-col rounded-[24px] bg-gradient-to-b from-[#3E2723] via-[#5D4037] to-[#4E342E] p-4 text-white shadow-sidebar lg:flex">
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-white/10 p-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-white shadow-glow-orange">
          VD
        </div>
        <div>
          <h1 className="font-display text-[20px] leading-tight text-white">Veera Dhabha</h1>
          <p className="font-label text-xs text-white/70">AI Ordering</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative flex h-12 items-center gap-3 rounded-xl pl-4 pr-3 text-sm transition duration-200 ${
                  isActive
                    ? "border-l-[3px] border-gold bg-gradient-to-r from-primary to-primary/80 text-white shadow-[0_4px_20px_rgba(255,107,0,0.4)]"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              <span className="font-medium">{link.label}</span>
              {link.to === "/cart" && cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 0.3, type: "spring" }}
                  className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-white"
                >
                  {cartCount}
                </motion.span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="rounded-xl bg-white/10 p-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-gold" />
          <p className="text-[13px] text-white/80">Ask Veera Bot</p>
        </div>
      </div>
    </aside>
  );
}
