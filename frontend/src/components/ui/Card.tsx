import { createElement } from "react";
import type { ElementType, HTMLAttributes } from "react";

export function Card({
  as = "div",
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { as?: ElementType }) {
  return createElement(as, { className: `card-3d ${className}`.trim(), ...props }, children);
}
