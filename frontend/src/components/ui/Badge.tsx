import type { ReactNode } from "react";

export type BadgeTone = "gold" | "success" | "danger" | "primary" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  gold: "bg-gold/20 text-gold-dark",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  primary: "bg-primary/10 text-primary",
  neutral: "bg-cream text-ink-muted"
};

export function Badge({
  tone = "neutral",
  className = "",
  children
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${toneClasses[tone]} ${className}`.trim()}>
      {children}
    </span>
  );
}
