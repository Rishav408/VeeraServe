import { motion } from "framer-motion";
import { Bell, CheckCircle, ChefHat, Clock } from "lucide-react";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";

const STAGES = [
  { key: "pending", label: "Order Placed", icon: Clock, color: "gold" },
  { key: "preparing", label: "Preparing", icon: ChefHat, color: "primary" },
  { key: "ready", label: "Ready", icon: Bell, color: "success" },
  { key: "served", label: "Served", icon: CheckCircle, color: "success" }
];

const STATUS_PERCENTAGE = { pending: 25, preparing: 50, ready: 75, served: 100 };
const STATUS_SUBTEXT = {
  pending: "Waiting for kitchen confirmation",
  preparing: "Estimated time: ~15 minutes",
  ready: "Your order is ready for pickup!",
  served: "Enjoy your meal! 🎉"
};

export default function TrackOrderScreen() {
  const { id } = useParams();
  const { orders } = useAppData();

  const order = useMemo(() => orders.find((entry) => entry.id === id), [orders, id]);

  if (!order) {
    return (
      <div className="card-3d rounded-[20px] p-6 text-center text-sm text-ink-muted">
        Order not found.
      </div>
    );
  }

  const activeIndex = STAGES.findIndex((stage) => stage.key === order.status);
  const percentage = STATUS_PERCENTAGE[order.status] || 0;
  const currentStage = STAGES[activeIndex] || STAGES[0];
  const StatusIcon = currentStage.icon;

  const colorMap = {
    gold: { bg: "bg-gold/20", text: "text-gold", pulse: "animate-pulse-glow" },
    primary: { bg: "bg-primary/20", text: "text-primary", pulse: "animate-pulse-glow" },
    success: { bg: "bg-success/20", text: "text-success", pulse: "" }
  };

  const colors = colorMap[currentStage.color] || colorMap.primary;

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl text-ink">Order {order.id}</h1>
        <span className="rounded-pill bg-gold/20 px-3 py-1 text-xs font-semibold text-[#E65100] capitalize">
          {order.status}
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-3d rounded-[24px] p-8 text-center"
      >
        <div
          className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${colors.bg} ${colors.text} ${colors.pulse}`}
        >
          <StatusIcon size={36} />
        </div>

        <h2 className="font-display text-2xl font-bold text-ink">{currentStage.label}</h2>
        <p className="mt-2 text-sm text-ink-muted">{STATUS_SUBTEXT[order.status]}</p>

        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-cream">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-gold"
          />
        </div>
      </motion.div>

      <div className="card-3d rounded-[20px] p-5">
        <div className="space-y-0">
          {STAGES.map((stage, index) => {
            const StageIcon = stage.icon;
            const completed = index < activeIndex || order.status === "served";
            const active = index === activeIndex;

            return (
              <div key={stage.key} className="relative flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
                      completed
                        ? "bg-success text-white"
                        : active
                          ? `${colors.bg} ${colors.text} ${colors.pulse}`
                          : "border-2 border-primary/20 bg-cream text-primary/40"
                    }`}
                  >
                    {completed ? <CheckCircle size={18} /> : <StageIcon size={16} />}
                  </div>
                  {index < STAGES.length - 1 && (
                    <div
                      className={`mt-1 h-8 w-0.5 ${
                        completed ? "bg-success" : active ? "bg-primary/40" : "bg-primary/10"
                      }`}
                    />
                  )}
                </div>

                <div className="flex-1 pb-6">
                  <p className="text-sm font-semibold text-ink">{stage.label}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {completed
                      ? "Completed"
                      : active
                        ? "In progress"
                        : "Pending"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {order.status === "served" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-gold/20 to-primary/10 p-6 text-center"
        >
          <div className="relative z-10">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-5xl text-success">
              <CheckCircle size={32} />
            </div>
            <h3 className="font-display text-xl font-bold text-ink">Shukria! 🙏</h3>
            <p className="mt-1 text-sm text-ink-muted">Thank you for dining at Veera Dhabha</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
