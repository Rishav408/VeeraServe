import type { OrderStatus } from "../../types/domain";
import { Badge } from "./Badge";
import type { BadgeTone } from "./Badge";

const toneByStatus: Record<OrderStatus, BadgeTone> = {
  pending: "neutral",
  preparing: "primary",
  ready: "gold",
  served: "success"
};

export function OrderStatusBadge({ status, className = "" }: { status: OrderStatus; className?: string }) {
  return (
    <Badge tone={toneByStatus[status]} className={`capitalize ${className}`.trim()}>
      {status}
    </Badge>
  );
}
