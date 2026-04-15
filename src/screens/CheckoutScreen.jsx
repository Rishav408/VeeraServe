import { motion } from "framer-motion";
import { CheckCircle, CreditCard, IndianRupee, Smartphone } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAppData } from "../context/AppDataContext";
import { useUI } from "../context/UIContext";

export default function CheckoutScreen() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { placeOrder } = useAppData();
  const { showToast } = useUI();
  const [tableNumber, setTableNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [instructions, setInstructions] = useState("");

  const gst = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + gst;

  const place = () => {
    if (!items.length) {
      showToast("Cart is empty.");
      return;
    }

    const order = placeOrder({
      items: items.map((entry) => ({ itemId: entry.item.id, quantity: entry.quantity })),
      total: grandTotal
    });

    clearCart();
    showToast(`Order ${order.id} placed. Status: pending.`);
    navigate(`/track/${order.id}`);
  };

  const paymentOptions = [
    { key: "cash", label: "Cash on Delivery", sublabel: "Pay when food arrives", icon: IndianRupee, emoji: "💵" },
    { key: "upi", label: "UPI", sublabel: "PhonePe, GPay, Paytm", icon: Smartphone, emoji: "📱" },
    { key: "card", label: "Card", sublabel: "Debit / Credit", icon: CreditCard, emoji: "💳" }
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-[28px] text-ink">Almost there! 🎉</h1>

      <div className="grid gap-5 lg:grid-cols-[1fr,380px]">
        <div className="space-y-4">
          <section className="card-3d rounded-[16px] p-5">
            <h3 className="font-label text-base font-semibold text-ink">Where are you seated?</h3>
            <div className="mt-4 flex items-center gap-3">
              <input
                type="number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Table #"
                className="h-[60px] w-full rounded-[12px] border-2 border-primary/30 bg-cream px-4 text-center text-3xl font-bold text-primary outline-none transition focus:border-primary"
              />
              <button
                type="button"
                className="shrink-0 rounded-pill border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
              >
                Scan QR
              </button>
            </div>
          </section>

          <section className="card-3d rounded-[16px] p-5">
            <h3 className="font-label text-base font-semibold text-ink">How to pay?</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {paymentOptions.map((option) => {
                const isSelected = paymentMethod === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setPaymentMethod(option.key)}
                    className={`card-3d cursor-pointer rounded-[12px] p-4 text-left transition ${
                      isSelected
                        ? "border-2 border-primary bg-primary/5 shadow-glow-orange"
                        : "border border-transparent hover:border-primary/20"
                    }`}
                  >
                    <div className="mb-2 text-2xl">{option.emoji}</div>
                    <p className="text-sm font-semibold text-ink">{option.label}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{option.sublabel}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card-3d rounded-[16px] p-5">
            <h3 className="font-label text-base font-semibold text-ink">Special instructions? <span className="font-normal text-ink-muted">(optional)</span></h3>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Extra napkins, less spicy, etc."
              className="mt-3 h-20 w-full rounded-[12px] border border-primary/20 bg-cream p-3 text-sm outline-none transition focus:border-primary"
            />
          </section>

          <motion.button
            type="button"
            onClick={place}
            whileTap={{ scale: 0.98 }}
            className="btn-primary flex h-14 w-full items-center justify-center gap-2 text-base font-semibold shadow-glow-orange"
          >
            <CheckCircle size={20} /> Confirm Order →
          </motion.button>
        </div>

        <aside className="card-3d rounded-[16px] p-5 lg:sticky lg:top-24">
          <h3 className="font-display text-lg text-ink">Order Summary</h3>
          <div className="mt-3 space-y-2">
            {items.map((entry) => (
              <div key={entry.item.id} className="flex items-center justify-between text-sm">
                <div className="flex-1">
                  <span className="font-semibold text-ink-soft">{entry.item.name}</span>
                  <span className="ml-2 text-xs text-ink-muted">× {entry.quantity}</span>
                </div>
                <span className="font-semibold text-ink">₹{entry.item.price * entry.quantity}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-primary/15 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Subtotal</span>
              <span className="font-semibold text-ink">₹{subtotal}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">GST (5%)</span>
              <span className="font-semibold text-ink">₹{gst}</span>
            </div>
            <div className="flex items-center justify-between border-t border-primary/15 pt-3">
              <span className="font-display text-lg text-ink-soft">Total</span>
              <span className="font-display text-2xl font-bold text-primary">₹{grandTotal}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
