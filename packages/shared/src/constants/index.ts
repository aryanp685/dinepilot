export const STAFF_ROLES = [
  "OWNER",
  "MANAGER",
  "CASHIER",
  "KITCHEN",
  "WAITER",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const ORDER_STATUSES = [
  "NEW",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ACTIVE_ORDER_STATUSES: readonly OrderStatus[] = [
  "NEW",
  "ACCEPTED",
  "PREPARING",
  "READY",
] as const;

export const ORDER_TYPES = ["DINE_IN", "TAKEAWAY", "DELIVERY"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_SOURCES = ["QR_GUEST", "STAFF_POS"] as const;
export type OrderSource = (typeof ORDER_SOURCES)[number];

export const PAYMENT_STATUSES = [
  "UNPAID",
  "PENDING_VERIFICATION",
  "PAID",
  "REFUNDED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["UPI", "CASH", "CARD", "UNSPECIFIED"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const TAX_MODES = [
  "TAX_EXCLUSIVE",
  "TAX_INCLUSIVE",
  "COMPOSITION_OR_EXEMPT",
] as const;
export type TaxMode = (typeof TAX_MODES)[number];

export const DIETARY_TYPES = [
  "VEG",
  "NON_VEG",
  "EGG",
  "JAIN",
  "VEGAN",
] as const;
export type DietaryType = (typeof DIETARY_TYPES)[number];

export const SPICE_LEVELS = [
  "MILD",
  "MEDIUM",
  "HOT",
  "SAOJI_FIERY",
] as const;
export type SpiceLevel = (typeof SPICE_LEVELS)[number];

export const MEASUREMENT_UNITS = ["g", "kg", "ml", "l", "pcs"] as const;
export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];

export const INVENTORY_MOVEMENT_TYPES = [
  "PURCHASE_RECEIVED",
  "MANUAL_ADJUSTMENT",
  "SPOILAGE",
  "WASTE",
  "RECIPE_CONSUMPTION",
  "STOCK_CORRECTION",
  "RETURN_REVERSAL",
] as const;
export type InventoryMovementType = (typeof INVENTORY_MOVEMENT_TYPES)[number];

export const QR_THEME_PRESETS = [
  "botanical",
  "midnight",
  "terracotta",
  "nordic",
] as const;
export type QrThemePreset = (typeof QR_THEME_PRESETS)[number];

export const LOYALTY_TIERS = ["BRONZE", "SILVER", "GOLD", "PLATINUM"] as const;
export type LoyaltyTier = (typeof LOYALTY_TIERS)[number];

export const LOYALTY_TRANSACTION_TYPES = [
  "EARN",
  "REDEEM",
  "REVERSAL",
  "BONUS",
] as const;
export type LoyaltyTransactionType = (typeof LOYALTY_TRANSACTION_TYPES)[number];

export const RESERVATION_STATUSES = [
  "CONFIRMED",
  "SEATED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const SUBSCRIPTION_PLANS = ["STARTER", "GROWTH", "SCALE"] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export const MENU_QUADRANT_TYPES = [
  "HIGH_VOLUME_HIGH_MARGIN",
  "HIGH_VOLUME_LOW_MARGIN",
  "LOW_VOLUME_HIGH_MARGIN",
  "LOW_VOLUME_LOW_MARGIN",
] as const;
export type MenuQuadrantType = (typeof MENU_QUADRANT_TYPES)[number];
