import { CheckCircle } from "lucide-react";

const STAGES = ["pending", "preparing", "ready", "served"];

export default function OrderTimeline({ status, compact = false }) {
  const activeIndex = STAGES.indexOf(status);

  return (
    <div className={`relative ${compact ? "px-1" : "px-2"}`}>
      <div className="absolute left-3 right-3 top-3 h-[2px] rounded-full bg-cream" />
      <div
        className="absolute left-3 top-3 h-[2px] rounded-full bg-success transition-all duration-700"
        style={{ width: `${(Math.max(activeIndex, 0) / (STAGES.length - 1)) * 100}%` }}
      />

      <div className="relative z-10 grid grid-cols-4 gap-1">
        {STAGES.map((stage, index) => {
          const completed = index < activeIndex || status === "served";
          const active = index === activeIndex;

          return (
            <div key={stage} className="flex flex-col items-center gap-2 text-center">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                  completed
                    ? "border-success bg-success text-white"
                    : active
                      ? "animate-pulse-glow border-primary bg-primary text-white"
                      : "border-primary/20 bg-cream text-primary/40"
                }`}
              >
                {completed ? <CheckCircle size={13} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              </div>
              <p className={`${compact ? "text-[10px]" : "text-xs"} font-semibold capitalize text-ink-soft`}>
                {stage}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
