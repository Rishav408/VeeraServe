import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "outline" | "ghost" | "danger";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  outline:
    "rounded-btn border border-primary/20 bg-white px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-primary/5",
  ghost: "rounded-btn px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10",
  danger: "rounded-btn bg-danger px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
};

export function buttonClasses(variant: ButtonVariant = "primary", className = ""): string {
  return `${variantClasses[variant]} ${className}`.trim();
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button type={type} className={buttonClasses(variant, className)} {...props}>
      {children}
    </button>
  );
}
