import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useAppData } from "../context/AppDataContext";

export default function AdminMenuScreen() {
  const { menuItems, toggleAvailability, addMenuItem } = useAppData();
  const [name, setName] = useState("");
  const [price, setPrice] = useState(120);
  const [category, setCategory] = useState("mains");
  const [description, setDescription] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    addMenuItem({ name, price: Number(price), category, spiceLevel: 2, isVeg: true, description: description || "New mock dish." });
    setName("");
    setPrice(120);
    setDescription("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Menu Management</h1>
        <p className="mt-1 text-sm text-ink-muted">Shared store updates instantly across all screens.</p>
      </div>

      <form onSubmit={submit} className="card-3d rounded-[16px] p-5">
        <h3 className="font-label text-base font-semibold text-ink">Add New Item</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold text-ink-soft">Dish Name</span>
            <input
              placeholder="e.g., Paneer Butter Masala"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1.5 w-full rounded-[12px] border border-primary/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink-soft">Price (₹)</span>
            <input
              type="number"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="mt-1.5 w-full rounded-[12px] border border-primary/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink-soft">Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-1.5 w-full rounded-[12px] border border-primary/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-primary"
            >
              <option value="starters">Starters</option>
              <option value="mains">Mains</option>
              <option value="rice">Rice</option>
              <option value="breads">Breads</option>
              <option value="desserts">Desserts</option>
              <option value="beverages">Beverages</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold text-ink-soft">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Brief dish description..."
              className="mt-1.5 h-20 w-full rounded-[12px] border border-primary/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-primary"
            />
          </label>
        </div>
        <button type="submit" className="btn-primary mt-4 flex items-center gap-2 text-sm">
          <Plus size={16} /> Add Item
        </button>
      </form>

      <div className="space-y-2">
        <h3 className="font-display text-xl text-ink">All Menu Items ({menuItems.length})</h3>
        {menuItems.map((item) => (
          <motion.article
            key={item.id}
            layout
            className="card-3d flex flex-wrap items-center justify-between gap-3 rounded-[14px] p-4"
          >
            <div className="flex items-center gap-3">
              <img src={item.image} alt={item.name} className="h-12 w-12 rounded-xl object-cover" />
              <div>
                <p className="text-sm font-semibold text-ink-soft">{item.name}</p>
                <p className="text-xs text-ink-muted capitalize">{item.category}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <p className="text-sm font-bold text-primary">₹{item.price}</p>
              <button
                type="button"
                onClick={() => toggleAvailability(item.id)}
                className={`relative inline-flex h-7 w-12 cursor-pointer rounded-full transition ${
                  item.isAvailable ? "bg-primary" : "bg-cream-deeper"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                    item.isAvailable ? "left-5.5" : "left-0.5"
                  }`}
                />
              </button>
              <span className={`rounded-pill px-2.5 py-0.5 text-[11px] font-semibold ${
                item.isAvailable ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
              }`}>
                {item.isAvailable ? "Available" : "Unavailable"}
              </span>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
