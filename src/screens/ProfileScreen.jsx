import { motion } from "framer-motion";
import { Clock, Heart, Settings, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";

export default function ProfileScreen() {
  const { currentUser, logout, orders } = useAppData();
  const [activeTab, setActiveTab] = useState("profile");

  const userOrders = orders.filter((o) => o.customerName === currentUser.name);

  const tabs = [
    { key: "profile", label: "Profile", icon: Settings },
    { key: "orders", label: "Order History", icon: Clock },
    { key: "preferences", label: "Preferences", icon: Heart }
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-[20px] bg-dhaba-hero p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white text-3xl font-bold text-primary">
            {currentUser.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl">{currentUser.name}</h1>
            <span className="mt-1 inline-block rounded-pill bg-white/20 px-3 py-0.5 text-xs font-medium capitalize text-white/80 backdrop-blur-sm">
              {currentUser.role}
            </span>
          </div>
        </div>
      </div>

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`category-chip inline-flex items-center gap-2 whitespace-nowrap ${
              activeTab === key ? "active" : ""
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-3d rounded-[16px] p-5">
          <h3 className="font-label text-base font-semibold text-ink">Profile Details</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between border-b border-primary/10 pb-3">
              <span className="text-sm text-ink-muted">Name</span>
              <span className="text-sm font-semibold text-ink">{currentUser.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-muted">Role</span>
              <span className="rounded-pill bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">
                {currentUser.role}
              </span>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/login" className="btn-primary inline-flex items-center gap-2 text-sm">
              Switch User
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-btn border border-primary/20 bg-white px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-primary/5"
            >
              Logout
            </button>
          </div>
        </motion.div>
      )}

      {activeTab === "orders" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {userOrders.length === 0 ? (
            <div className="card-3d rounded-[16px] p-6 text-center text-sm text-ink-muted">
              No orders yet. <Link to="/menu" className="font-semibold text-primary">Browse menu</Link>
            </div>
          ) : (
            userOrders.map((order) => (
              <article key={order.id} className="card-3d rounded-[16px] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-lg font-bold text-primary">{order.id}</p>
                    <p className="text-xs text-ink-muted">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-pill bg-gold/20 px-3 py-1 text-xs font-semibold capitalize text-[#E65100]">
                      {order.status}
                    </span>
                    <p className="mt-1 text-sm font-bold text-ink">₹{order.total}</p>
                  </div>
                </div>
                <Link to={`/track/${order.id}`} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
                  Track Order →
                </Link>
              </article>
            ))
          )}
        </motion.div>
      )}

      {activeTab === "preferences" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-3d rounded-[16px] p-5">
          <h3 className="font-label text-base font-semibold text-ink">Your Preferences</h3>
          <div className="mt-4 space-y-5">
            <div>
              <span className="text-sm font-semibold text-ink-soft">Spice Level</span>
              <div className="mt-2 flex gap-2">
                {["Mild 🌶️", "Medium 🌶️🌶️", "Spicy 🌶️🌶️🌶️", "Fire 🌶️🌶️🌶️🌶️"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className="category-chip flex-1 whitespace-normal px-2 py-2 text-xs"
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-sm font-semibold text-ink-soft">Dietary</span>
              <div className="mt-2 flex gap-2">
                {["🥗 Veg Only", "🍗 Non-Veg", "🚫 No Onion", "🧀 Extra Cheese"].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="category-chip whitespace-nowrap"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
