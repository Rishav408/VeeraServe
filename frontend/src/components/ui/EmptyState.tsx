import type { ReactNode } from "react";
import { Card } from "./Card";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = ""
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`rounded-[20px] p-8 text-center ${className}`.trim()}>
      {icon && <div className="mb-4 flex justify-center text-5xl">{icon}</div>}
      <h3 className="font-display text-[22px] text-ink-soft">{title}</h3>
      {description && <p className="mt-2 text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </Card>
  );
}
