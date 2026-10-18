import { OrderStatus } from "../constants";

export const VALID_ORDER_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  NEW: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionOrderStatus(
  fromStatus: OrderStatus,
  toStatus: OrderStatus
): boolean {
  const allowed = VALID_ORDER_TRANSITIONS[fromStatus];
  if (!allowed) return false;
  return allowed.includes(toStatus);
}

export function getNextAllowedOrderStatuses(
  currentStatus: OrderStatus
): readonly OrderStatus[] {
  return VALID_ORDER_TRANSITIONS[currentStatus] || [];
}
