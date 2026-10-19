import { motion } from "framer-motion";
import { Clock, Heart, Settings, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, EmptyState, OrderStatusBadge, buttonClasses } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";
import { useOrders } from "../hooks/useOrders";
import { useUpdatePreferences } from "../hooks/useProfile";
import type { UserDto } from "../types/api";

const FALLBACK_USER: UserDto = { id: 0, name: "Guest", email: "", role: "guest" };

const SPICE_LEVELS = [
  { value: 1, label: "Mild 🌶️" },
  { value: 2, label: "Medium 🌶️🌶️" },
  { value: 3, label: "Spicy 🌶️🌶️🌶️" },
  { value: 4, label: "Fire 🌶️🌶️🌶️🌶️" }
];

const ALLERGY_OPTIONS = ["peanut", "dairy", "gluten", "soy", "nuts"];

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { data: orders = [] } = useOrders();
  const { showToast } = useUI();
  const updatePreferences = useUpdatePreferences();
  const currentUser = user ?? FALLBACK_USER;
  const [activeTab, setActiveTab] = useState("profile");
  const [veg, setVeg] = useState<boolean>(currentUser.preferences?.veg ?? false);
  const [spiceLevel, setSpiceLevel] = useState<number>(currentUser.preferences?.spice_level ?? 0);
  const [allergies, setAllergies] = useState<string[]>(currentUser.preferences?.allergies ?? []);

  const toggleAllergy = (allergy: string) => {
    setAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((entry) => entry !== allergy) : [...prev, allergy]
    );
  };

  const savePreferences = () => {
    updatePreferences.mutate(
      { veg, spice_level: spiceLevel, allergies },
      {
        onSuccess: () => showToast("Preferences saved."),
        onError: () => showToast("Could not save preferences.")
      }
    );
  };

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
            <div className="flex items-center justify-between border-b border-primary/10 pb-3">
              <span className="text-sm text-ink-muted">Email</span>
              <span className="text-sm font-semibold text-ink">{currentUser.email || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-muted">Role</span>
              <Badge tone="primary" className="capitalize">
                {currentUser.role}
              </Badge>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/login" className={buttonClasses("primary", "inline-flex items-center gap-2 text-sm")}>
              Switch User
            </Link>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </motion.div>
      )}

      {activeTab === "orders" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {orders.length === 0 ? (
            <EmptyState
              title="No orders yet."
              action={
                <Link to="/menu" className="font-semibold text-primary">
                  Browse menu
                </Link>
              }
            />
          ) : (
            orders.map((order) => (
              <article key={order.id} className="card-3d rounded-[16px] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-lg font-bold text-primary">Order #{order.id}</p>
                    <p className="text-xs text-ink-muted">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <OrderStatusBadge status={order.status} />
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
              <div className="mt-2 flex flex-wrap gap-2">
                {SPICE_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setSpiceLevel(level.value)}
                    className={`category-chip whitespace-normal px-3 py-2 text-xs ${
                      spiceLevel === level.value ? "active" : ""
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-sm font-semibold text-ink-soft">Dietary</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setVeg((prev) => !prev)}
                  className={`category-chip whitespace-nowrap ${veg ? "active" : ""}`}
                >
                  🥗 Veg Only
                </button>
              </div>
            </div>
            <div>
              <span className="text-sm font-semibold text-ink-soft">Allergies</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALLERGY_OPTIONS.map((allergy) => (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => toggleAllergy(allergy)}
                    className={`category-chip whitespace-nowrap capitalize ${
                      allergies.includes(allergy) ? "active" : ""
                    }`}
                  >
                    {allergy}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button
            variant="primary"
            className="mt-5 inline-flex items-center gap-2 text-sm"
            onClick={savePreferences}
            disabled={updatePreferences.isPending}
          >
            {updatePreferences.isPending ? "Saving…" : "Save Preferences"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
