import { z } from "zod";
import {
  DIETARY_TYPES,
  INVENTORY_MOVEMENT_TYPES,
  MEASUREMENT_UNITS,
  ORDER_STATUSES,
  ORDER_TYPES,
  PAYMENT_METHODS,
  QR_THEME_PRESETS,
  RESERVATION_STATUSES,
  SPICE_LEVELS,
  STAFF_ROLES,
  SUBSCRIPTION_PLANS,
  TAX_MODES,
} from "../constants";

export const registerSchema = z.object({
  ownerName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Valid email is required").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  phone: z.string().min(8).max(20).optional(),
  restaurantName: z
    .string()
    .min(2, "Restaurant name must be at least 2 characters")
    .max(120),
  city: z.string().min(2).max(80).default("Nagpur"),
  state: z.string().min(2).max(80).default("Maharashtra"),
  gstin: z.string().max(20).optional(),
  fssaiNumber: z.string().max(24).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Valid email is required").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email is required").toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateRestaurantSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  city: z.string().min(2).max(80).optional(),
  state: z.string().min(2).max(80).optional(),
  address: z.string().max(300).optional(),
  phone: z.string().max(25).optional(),
  email: z.string().email().optional(),
  gstin: z.string().max(20).optional(),
  fssaiNumber: z.string().max(24).optional(),
  upiVpa: z.string().max(100).optional(),
  qrThemePreset: z.enum(QR_THEME_PRESETS).optional(),
});

export const updateRestaurantSettingsSchema = z.object({
  taxMode: z.enum(TAX_MODES).optional(),
  cgstRateBps: z.number().int().min(0).max(2500).optional(),
  sgstRateBps: z.number().int().min(0).max(2500).optional(),
  serviceChargeRateBps: z.number().int().min(0).max(2000).optional(),
  defaultPackagingPaise: z.number().int().min(0).max(50000).optional(),
  enableRoundOff: z.boolean().optional(),
  allowDeliveryOrders: z.boolean().optional(),
  allowRunningTableKots: z.boolean().optional(),
  requirePinForQrOrders: z.boolean().optional(),
  operatingHoursOpen: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  operatingHoursClose: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  reservationSlotMinutes: z.number().int().min(30).max(240).optional(),
  loyaltyPointsPerHundredRupees: z.number().int().min(0).max(100).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(250).optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const createModifierGroupSchema = z.object({
  name: z.string().min(2).max(80),
  selectionType: z.enum(["SINGLE", "MULTIPLE"]).default("SINGLE"),
  isRequired: z.boolean().default(false),
  minSelect: z.number().int().min(0).default(0),
  maxSelect: z.number().int().min(1).default(5),
  options: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(80),
        priceDeltaPaise: z.number().int().min(-50000).max(500000),
        recipeMultiplier: z.number().min(0.1).max(5).default(1),
        isAvailable: z.boolean().default(true),
      })
    )
    .min(1),
});

export const createMenuItemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(2).max(120),
  description: z.string().max(400).optional().default(""),
  pricePaise: z.number().int().min(0, "Price cannot be negative"),
  packagingCostPaise: z.number().int().min(0).default(0),
  imageUrl: z.string().max(500).optional().default(""),
  dietaryType: z.enum(DIETARY_TYPES).default("VEG"),
  spiceLevel: z.enum(SPICE_LEVELS).default("MEDIUM"),
  prepTimeMinutes: z.number().int().min(1).max(180).default(15),
  isAvailable: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  modifierGroupIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const orderItemInputSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
  selectedModifiers: z
    .array(
      z.object({
        groupId: z.string().min(1),
        optionId: z.string().min(1),
      })
    )
    .default([]),
  notes: z.string().max(250).optional().default(""),
});

export const createOrderSchema = z.object({
  orderType: z.enum(ORDER_TYPES).default("DINE_IN"),
  tablePublicToken: z.string().optional(),
  tableId: z.string().optional(),
  sessionPin: z.string().max(10).optional(),
  appendToRunningOrderId: z.string().optional(),
  customerName: z.string().max(100).optional(),
  customerPhone: z.string().max(20).optional(),
  marketingConsent: z.boolean().optional().default(false),
  customerNotes: z.string().max(400).optional().default(""),
  discountPaise: z.number().int().min(0).optional().default(0),
  idempotencyKey: z.string().min(4).max(120).optional(),
  items: z.array(orderItemInputSchema).min(1, "Order must contain at least 1 item"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().max(250).optional(),
  cancelReason: z.string().max(250).optional(),
  reverseInventoryOnCancel: z.boolean().optional().default(true),
});

export const createIngredientSchema = z.object({
  name: z.string().min(2).max(120),
  sku: z.string().max(40).optional(),
  category: z.string().max(60).default("General"),
  unit: z.enum(MEASUREMENT_UNITS),
  currentStock: z.number().min(0).default(0),
  reorderThreshold: z.number().min(0).default(100),
  costPerUnitPaise: z.number().int().min(0),
  usableYieldPercent: z.number().min(1).max(100).default(100),
  supplierId: z.string().optional(),
  storageNotes: z.string().max(250).optional(),
  expirationDate: z.string().optional(),
});

export const updateIngredientSchema = createIngredientSchema.partial();

export const createInventoryMovementSchema = z.object({
  ingredientId: z.string().min(1),
  type: z.enum(INVENTORY_MOVEMENT_TYPES),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.enum(MEASUREMENT_UNITS).optional(),
  unitCostPaise: z.number().int().min(0).optional(),
  reason: z.string().min(2).max(250),
  idempotencyKey: z.string().max(120).optional(),
});

export const createRecipeSchema = z.object({
  menuItemId: z.string().min(1),
  yieldServings: z.number().min(1).max(100).default(1),
  prepInstructions: z.string().max(1000).optional().default(""),
  components: z
    .array(
      z.object({
        ingredientId: z.string().min(1),
        quantity: z.number().positive("Component quantity must be positive"),
        unit: z.enum(MEASUREMENT_UNITS),
        notes: z.string().max(150).optional(),
      })
    )
    .min(1, "Recipe must contain at least one ingredient component"),
});

export const createTableSchema = z.object({
  label: z.string().min(1).max(30),
  zone: z.string().min(1).max(60).default("Main Dining"),
  capacity: z.number().int().min(1).max(30).default(4),
  isActive: z.boolean().default(true),
});

export const createReservationSchema = z.object({
  customerName: z.string().min(2).max(100),
  customerPhone: z.string().min(8).max(20),
  customerEmail: z.string().email().optional().or(z.literal("")),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/, "Time slot must be HH:mm"),
  durationMinutes: z.number().int().min(30).max(240).default(90),
  partySize: z.number().int().min(1).max(40),
  tableId: z.string().optional(),
  specialRequests: z.string().max(300).optional().default(""),
});

export const updateReservationSchema = z.object({
  status: z.enum(RESERVATION_STATUSES).optional(),
  tableId: z.string().optional(),
  specialRequests: z.string().max(300).optional(),
});

export const createRewardSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(250).optional().default(""),
  pointsCost: z.number().int().min(10),
  discountValuePaise: z.number().int().min(100),
  isActive: z.boolean().default(true),
});

export const redeemRewardSchema = z.object({
  customerId: z.string().min(1),
  rewardId: z.string().min(1),
  idempotencyKey: z.string().optional(),
});

export const createStaffMemberSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  phone: z.string().max(20).optional(),
  role: z.enum(STAFF_ROLES),
  password: z.string().min(8).max(128).optional(),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  method: z.enum(PAYMENT_METHODS).default("UPI"),
  action: z.enum(["MARK_PAID", "MARK_REFUNDED"]),
  reference: z.string().max(120).optional(),
  idempotencyKey: z.string().max(120).optional(),
});

export const aiInsightQuerySchema = z.object({
  question: z.string().max(400).optional(),
  dateRangeDays: z.number().int().min(1).max(90).default(30),
});

export const aiInsightStructuredResponseSchema = z.object({
  providerMode: z.enum(["RULE_BASED_DETERMINISTIC", "LLM_ENHANCED"]),
  generatedAt: z.string(),
  executiveSummary: z.string(),
  directAnswer: z.string().optional(),
  measuredHighlights: z.array(
    z.object({
      id: z.string(),
      category: z.enum([
        "PROFITABILITY",
        "INVENTORY_REPLENISHMENT",
        "WASTE_CONTROL",
        "SALES_MOMENTUM",
        "OPERATIONAL_RISK",
      ]),
      severity: z.enum(["HIGH", "MEDIUM", "INFO"]),
      title: z.string(),
      measuredFact: z.string(),
      recommendation: z.string(),
      supportingMetricLabel: z.string(),
      supportingMetricValue: z.string(),
      isForecast: z.boolean(),
    })
  ),
  replenishmentForecasts: z.array(
    z.object({
      ingredientId: z.string(),
      ingredientName: z.string(),
      unit: z.string(),
      currentStock: z.number(),
      reorderThreshold: z.number(),
      estimatedDailyBurn: z.number(),
      estimatedDaysRemaining: z.number(),
      suggestedOrderQty: z.number(),
      estimatedPurchaseCostPaise: z.number(),
    })
  ),
});

export const updateSubscriptionSchema = z.object({
  plan: z.enum(SUBSCRIPTION_PLANS),
});
