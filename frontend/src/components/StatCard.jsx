import { BadgeIndianRupee, ClipboardList, Flame, MessageSquare } from "lucide-react";

const accentStyles = {
  gold: "from-gold/25 to-gold/10 text-gold-dark",
  green: "from-success/20 to-success/10 text-success",
  brand: "from-primary/20 to-primary/10 text-primary"
};

const accentIcons = {
  gold: BadgeIndianRupee,
  green: MessageSquare,
  brand: ClipboardList
};

export default function StatCard({ label, value, accent = "brand", icon }) {
  const Icon = icon || accentIcons[accent] || Flame;

  return (
    <article className={`card-3d relative overflow-hidden rounded-[16px] bg-gradient-to-br ${accentStyles[accent] || accentStyles.brand} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-label text-[11px] uppercase tracking-wider text-ink-muted">{label}</p>
          <p className="mt-2 font-display text-4xl font-bold text-primary">{value}</p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon size={18} />
        </span>
      </div>
      <span className="absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-primary/10" />
    </article>
  );
}
