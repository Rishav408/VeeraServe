import type { ReactNode } from "react";

export default function ScreenHeader({
  title,
  subtitle,
  action
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
