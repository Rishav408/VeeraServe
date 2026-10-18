import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-[12px] border border-primary/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-primary ${className}`.trim()}
      {...props}
    />
  );
}
