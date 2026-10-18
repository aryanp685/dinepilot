import mongoose, { Document, Model, Schema, Types } from "mongoose";
import {
  DIETARY_TYPES,
  DietaryType,
  INVENTORY_MOVEMENT_TYPES,
  InventoryMovementType,
  LOYALTY_TIERS,
  LOYALTY_TRANSACTION_TYPES,
  LoyaltyTier,
  LoyaltyTransactionType,
  MEASUREMENT_UNITS,
  MeasurementUnit,
  ORDER_SOURCES,
  ORDER_STATUSES,
  ORDER_TYPES,
  OrderSource,
  OrderStatus,
  OrderType,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PaymentMethod,
  PaymentStatus,
  QR_THEME_PRESETS,
  QrThemePreset,
  RESERVATION_STATUSES,
  ReservationStatus,
  SPICE_LEVELS,
  SpiceLevel,
  STAFF_ROLES,
  StaffRole,
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
  TAX_MODES,
  TaxMode,
} from "@dinepilot/shared";

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  name: string;
  phone?: string;
  passwordHash: string;
  isPlatformAdmin: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    isPlatformAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    passwordResetTokenHash: { type: String },
    passwordResetExpiresAt: { type: Date },
  },
  { timestamps: true, collection: "users" }
);

export interface IRestaurantSettings {
  taxMode: TaxMode;
  cgstRateBps: number;
  sgstRateBps: number;
  serviceChargeRateBps: number;
  defaultPackagingPaise: number;
  enableRoundOff: boolean;
  allowDeliveryOrders: boolean;
  allowRunningTableKots: boolean;
  requirePinForQrOrders: boolean;
  operatingHoursOpen: string;
  operatingHoursClose: string;
  reservationSlotMinutes: number;
  loyaltyPointsPerHundredRupees: number;
}

export interface IRestaurant extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  city: string;
  state: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  timezone: string;
  gstin: string;
  fssaiNumber: string;
  upiVpa: string;
  qrThemePreset: QrThemePreset;
  isDemo: boolean;
  isActive: boolean;
  orderSequence: number;
  settings: IRestaurantSettings;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantSchema = new Schema<IRestaurant>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    city: { type: String, default: "Nagpur" },
    state: { type: String, default: "Maharashtra" },
    country: { type: String, default: "IN" },
    address: { type: String, default: "West High Court Road, Dharampeth, Nagpur 440010" },
    phone: { type: String, default: "+91 712 254 8890" },
    email: { type: String, default: "ops@dinepilot.in" },
    currency: { type: String, default: "INR" },
    timezone: { type: String, default: "Asia/Kolkata" },
    gstin: { type: String, default: "27AABCS1429B1Z5" },
    fssaiNumber: { type: String, default: "11524055000421" },
    upiVpa: { type: String, default: "saojikitchen@okicici" },
    qrThemePreset: { type: String, enum: QR_THEME_PRESETS, default: "botanical" },
    isDemo: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    orderSequence: { type: Number, default: 1000 },
    settings: {
      taxMode: { type: String, enum: TAX_MODES, default: "TAX_EXCLUSIVE" },
      cgstRateBps: { type: Number, default: 250 },
      sgstRateBps: { type: Number, default: 250 },
      serviceChargeRateBps: { type: Number, default: 0 },
      defaultPackagingPaise: { type: Number, default: 2000 },
      enableRoundOff: { type: Boolean, default: true },
      allowDeliveryOrders: { type: Boolean, default: true },
      allowRunningTableKots: { type: Boolean, default: true },
      requirePinForQrOrders: { type: Boolean, default: false },
      operatingHoursOpen: { type: String, default: "11:00" },
      operatingHoursClose: { type: String, default: "23:30" },
      reservationSlotMinutes: { type: Number, default: 90 },
      loyaltyPointsPerHundredRupees: { type: Number, default: 10 },
    },
  },
  { timestamps: true, collection: "restaurants" }
);

export interface IMembership extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  restaurantId: Types.ObjectId;
  role: StaffRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const membershipSchema = new Schema<IMembership>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    role: { type: String, enum: STAFF_ROLES, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "memberships" }
);
membershipSchema.index({ userId: 1, restaurantId: 1 }, { unique: true });
membershipSchema.index({ restaurantId: 1, role: 1 });

export interface ISubscription extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  plan: SubscriptionPlan;
  status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELLED";
  pricePaise: number;
  billingCycle: "MONTHLY" | "ANNUAL";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  entitlements: {
    aiCopilot: boolean;
    multiKot: boolean;
    loyaltyEngine: boolean;
    maxTables: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, unique: true },
    plan: { type: String, enum: SUBSCRIPTION_PLANS, default: "GROWTH" },
    status: { type: String, enum: ["ACTIVE", "TRIALING", "PAST_DUE", "CANCELLED"], default: "ACTIVE" },
    pricePaise: { type: Number, default: 249900 },
    billingCycle: { type: String, enum: ["MONTHLY", "ANNUAL"], default: "MONTHLY" },
    currentPeriodStart: { type: Date, default: () => new Date() },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    entitlements: {
      aiCopilot: { type: Boolean, default: true },
      multiKot: { type: Boolean, default: true },
      loyaltyEngine: { type: Boolean, default: true },
      maxTables: { type: Number, default: 50 },
    },
  },
  { timestamps: true, collection: "subscriptions" }
);

export interface IMenuCategory extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const menuCategorySchema = new Schema<IMenuCategory>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "menuCategories" }
);
menuCategorySchema.index({ restaurantId: 1, sortOrder: 1 });

export interface IModifierOption {
  id: string;
  name: string;
  priceDeltaPaise: number;
  recipeMultiplier: number;
  isAvailable: boolean;
}

export interface IModifierGroup extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  name: string;
  selectionType: "SINGLE" | "MULTIPLE";
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: IModifierOption[];
  createdAt: Date;
  updatedAt: Date;
}

const modifierGroupSchema = new Schema<IModifierGroup>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name: { type: String, required: true, trim: true },
    selectionType: { type: String, enum: ["SINGLE", "MULTIPLE"], default: "SINGLE" },
    isRequired: { type: Boolean, default: false },
    minSelect: { type: Number, default: 0 },
    maxSelect: { type: Number, default: 5 },
    options: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        priceDeltaPaise: { type: Number, default: 0 },
        recipeMultiplier: { type: Number, default: 1 },
        isAvailable: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true, collection: "modifierGroups" }
);
modifierGroupSchema.index({ restaurantId: 1 });

export interface IMenuItem extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  categoryId: Types.ObjectId;
  name: string;
  description: string;
  pricePaise: number;
  packagingCostPaise: number;
  imageUrl: string;
  dietaryType: DietaryType;
  spiceLevel: SpiceLevel;
  prepTimeMinutes: number;
  isAvailable: boolean;
  isPopular: boolean;
  modifierGroupIds: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "MenuCategory", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    pricePaise: { type: Number, required: true },
    packagingCostPaise: { type: Number, default: 0 },
    imageUrl: { type: String, default: "" },
    dietaryType: { type: String, enum: DIETARY_TYPES, default: "VEG" },
    spiceLevel: { type: String, enum: SPICE_LEVELS, default: "MEDIUM" },
    prepTimeMinutes: { type: Number, default: 15 },
    isAvailable: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    modifierGroupIds: [{ type: String }],
    tags: [{ type: String }],
  },
  { timestamps: true, collection: "menuItems" }
);
menuItemSchema.index({ restaurantId: 1, categoryId: 1, isAvailable: 1 });

export interface IRestaurantTable extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  label: string;
  zone: string;
  capacity: number;
  publicToken: string;
  sessionPin: string;
  isActive: boolean;
  activeOrderId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantTableSchema = new Schema<IRestaurantTable>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    label: { type: String, required: true, trim: true },
    zone: { type: String, default: "Main Dining" },
    capacity: { type: Number, default: 4 },
    publicToken: { type: String, required: true, unique: true },
    sessionPin: { type: String, default: "4410" },
    isActive: { type: Boolean, default: true },
    activeOrderId: { type: Schema.Types.ObjectId, ref: "Order", default: null },
  },
  { timestamps: true, collection: "restaurantTables" }
);
restaurantTableSchema.index({ restaurantId: 1, label: 1 }, { unique: true });

export interface IOrderLineModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDeltaPaise: number;
  recipeMultiplier: number;
}

export interface IOrderLineItem {
  menuItemId: Types.ObjectId;
  nameSnapshot: string;
  dietarySnapshot: DietaryType;
  quantity: number;
  unitBasePricePaise: number;
  modifiers: IOrderLineModifier[];
  unitEffectivePricePaise: number;
  lineSubtotalPaise: number;
  packagingCostPaise: number;
  recipeMultiplier: number;
  kotNumber: number;
  notes: string;
}

export interface IKotBatch {
  kotNumber: number;
  createdAt: Date;
  source: OrderSource;
  notes: string;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  orderNumber: string;
  publicOrderToken: string;
  idempotencyKey?: string;
  orderType: OrderType;
  source: OrderSource;
  tableId?: Types.ObjectId | null;
  tableLabelSnapshot?: string;
  customerId?: Types.ObjectId | null;
  customerName?: string;
  customerPhone?: string;
  kotBatches: IKotBatch[];
  items: IOrderLineItem[];
  subtotalPaise: number;
  discountPaise: number;
  packagingTotalPaise: number;
  serviceChargePaise: number;
  taxModeSnapshot: TaxMode;
  cgstPaise: number;
  sgstPaise: number;
  roundOffPaise: number;
  totalPaise: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  inventoryConsumed: boolean;
  inventoryReversed: boolean;
  loyaltyProcessed: boolean;
  customerNotes: string;
  cancelReason?: string;
  acceptedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    orderNumber: { type: String, required: true },
    publicOrderToken: { type: String, required: true, unique: true },
    idempotencyKey: { type: String },
    orderType: { type: String, enum: ORDER_TYPES, default: "DINE_IN" },
    source: { type: String, enum: ORDER_SOURCES, default: "QR_GUEST" },
    tableId: { type: Schema.Types.ObjectId, ref: "RestaurantTable", default: null },
    tableLabelSnapshot: { type: String },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
    customerName: { type: String },
    customerPhone: { type: String },
    kotBatches: [
      {
        kotNumber: { type: Number, required: true },
        createdAt: { type: Date, default: () => new Date() },
        source: { type: String, enum: ORDER_SOURCES, default: "QR_GUEST" },
        notes: { type: String, default: "" },
      },
    ],
    items: [
      {
        menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
        nameSnapshot: { type: String, required: true },
        dietarySnapshot: { type: String, enum: DIETARY_TYPES, default: "VEG" },
        quantity: { type: Number, required: true },
        unitBasePricePaise: { type: Number, required: true },
        modifiers: [
          {
            groupId: { type: String },
            groupName: { type: String },
            optionId: { type: String },
            optionName: { type: String },
            priceDeltaPaise: { type: Number, default: 0 },
            recipeMultiplier: { type: Number, default: 1 },
          },
        ],
        unitEffectivePricePaise: { type: Number, required: true },
        lineSubtotalPaise: { type: Number, required: true },
        packagingCostPaise: { type: Number, default: 0 },
        recipeMultiplier: { type: Number, default: 1 },
        kotNumber: { type: Number, default: 1 },
        notes: { type: String, default: "" },
      },
    ],
    subtotalPaise: { type: Number, required: true },
    discountPaise: { type: Number, default: 0 },
    packagingTotalPaise: { type: Number, default: 0 },
    serviceChargePaise: { type: Number, default: 0 },
    taxModeSnapshot: { type: String, enum: TAX_MODES, default: "TAX_EXCLUSIVE" },
    cgstPaise: { type: Number, default: 0 },
    sgstPaise: { type: Number, default: 0 },
    roundOffPaise: { type: Number, default: 0 },
    totalPaise: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: "NEW" },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "UNPAID" },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: "UNSPECIFIED" },
    paymentReference: { type: String },
    inventoryConsumed: { type: Boolean, default: false },
    inventoryReversed: { type: Boolean, default: false },
    loyaltyProcessed: { type: Boolean, default: false },
    customerNotes: { type: String, default: "" },
    cancelReason: { type: String },
    acceptedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true, collection: "orders" }
);
orderSchema.index({ restaurantId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, orderNumber: 1 }, { unique: true });

export interface IOrderStatusEvent extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  orderId: Types.ObjectId;
  fromStatus: OrderStatus | "CREATED";
  toStatus: OrderStatus;
  actorUserId?: Types.ObjectId | null;
  actorRole: string;
  actorName: string;
  note: string;
  createdAt: Date;
}

const orderStatusEventSchema = new Schema<IOrderStatusEvent>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    fromStatus: { type: String, required: true },
    toStatus: { type: String, enum: ORDER_STATUSES, required: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    actorRole: { type: String, default: "GUEST" },
    actorName: { type: String, default: "Guest" },
    note: { type: String, default: "" },
  },
  { timestamps: true, collection: "orderStatusEvents" }
);
orderStatusEventSchema.index({ orderId: 1, createdAt: 1 });

export interface IPayment extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  orderId: Types.ObjectId;
  amountPaise: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  reference?: string;
  verifiedByUserId?: Types.ObjectId | null;
  verifiedAt?: Date;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    amountPaise: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    method: { type: String, enum: PAYMENT_METHODS, default: "UPI" },
    status: { type: String, enum: PAYMENT_STATUSES, default: "UNPAID" },
    reference: { type: String },
    verifiedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    verifiedAt: { type: Date },
    idempotencyKey: { type: String },
  },
  { timestamps: true, collection: "payments" }
);
paymentSchema.index({ restaurantId: 1, orderId: 1 });

export interface IPaymentEvent extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  paymentId: Types.ObjectId;
  orderId: Types.ObjectId;
  eventType: string;
  amountPaise: number;
  actorUserId?: Types.ObjectId | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const paymentEventSchema = new Schema<IPaymentEvent>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    eventType: { type: String, required: true },
    amountPaise: { type: Number, required: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: "paymentEvents" }
);

export interface ISupplier extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  name: string;
  contactName: string;
  phone: string;
  email?: string;
  gstin?: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name: { type: String, required: true, trim: true },
    contactName: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String },
    gstin: { type: String },
    category: { type: String, default: "General" },
  },
  { timestamps: true, collection: "suppliers" }
);

export interface IIngredient extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  name: string;
  sku?: string;
  category: string;
  unit: MeasurementUnit;
  currentStock: number;
  reorderThreshold: number;
  costPerUnitPaise: number;
  usableYieldPercent: number;
  supplierId?: Types.ObjectId | null;
  storageNotes: string;
  expirationDate?: Date | null;
  lastUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ingredientSchema = new Schema<IIngredient>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, default: "" },
    category: { type: String, default: "Produce" },
    unit: { type: String, enum: MEASUREMENT_UNITS, required: true },
    currentStock: { type: Number, default: 0 },
    reorderThreshold: { type: Number, default: 10 },
    costPerUnitPaise: { type: Number, required: true },
    usableYieldPercent: { type: Number, default: 100, min: 1, max: 100 },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", default: null },
    storageNotes: { type: String, default: "" },
    expirationDate: { type: Date, default: null },
    lastUpdatedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true, collection: "ingredients" }
);
ingredientSchema.index({ restaurantId: 1, name: 1 });
ingredientSchema.index({ restaurantId: 1, expirationDate: 1 });

export interface IRecipeComponent {
  ingredientId: Types.ObjectId;
  quantity: number;
  unit: MeasurementUnit;
  notes?: string;
}

export interface IRecipe extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  menuItemId: Types.ObjectId;
  yieldServings: number;
  prepInstructions: string;
  components: IRecipeComponent[];
  createdAt: Date;
  updatedAt: Date;
}

const recipeSchema = new Schema<IRecipe>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
    yieldServings: { type: Number, default: 1, min: 1 },
    prepInstructions: { type: String, default: "" },
    components: [
      {
        ingredientId: { type: Schema.Types.ObjectId, ref: "Ingredient", required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, enum: MEASUREMENT_UNITS, required: true },
        notes: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true, collection: "recipes" }
);
recipeSchema.index({ restaurantId: 1, menuItemId: 1 }, { unique: true });

export interface IInventoryMovement extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  ingredientId: Types.ObjectId;
  ingredientNameSnapshot: string;
  type: InventoryMovementType;
  quantityDelta: number;
  unit: MeasurementUnit;
  previousStock: number;
  newStock: number;
  unitCostPaiseSnapshot: number;
  totalCostPaise: number;
  referenceOrderId?: Types.ObjectId | null;
  idempotencyKey?: string;
  reason: string;
  performedByUserId?: Types.ObjectId | null;
  performedByName: string;
  createdAt: Date;
}

const inventoryMovementSchema = new Schema<IInventoryMovement>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    ingredientId: { type: Schema.Types.ObjectId, ref: "Ingredient", required: true },
    ingredientNameSnapshot: { type: String, required: true },
    type: { type: String, enum: INVENTORY_MOVEMENT_TYPES, required: true },
    quantityDelta: { type: Number, required: true },
    unit: { type: String, enum: MEASUREMENT_UNITS, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    unitCostPaiseSnapshot: { type: Number, required: true },
    totalCostPaise: { type: Number, required: true },
    referenceOrderId: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    idempotencyKey: { type: String },
    reason: { type: String, required: true },
    performedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    performedByName: { type: String, default: "System" },
  },
  { timestamps: true, collection: "inventoryMovements" }
);
inventoryMovementSchema.index({ restaurantId: 1, ingredientId: 1, createdAt: -1 });
inventoryMovementSchema.index({ restaurantId: 1, type: 1, createdAt: -1 });

export interface ICustomer extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  marketingConsent: boolean;
  consentUpdatedAt?: Date;
  dietaryPreferences: string[];
  visitCount: number;
  totalSpentPaise: number;
  lastVisitAt?: Date;
  notes: string;
  feedbacks: Array<{
    orderId?: Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    marketingConsent: { type: Boolean, default: false },
    consentUpdatedAt: { type: Date },
    dietaryPreferences: [{ type: String }],
    visitCount: { type: Number, default: 0 },
    totalSpentPaise: { type: Number, default: 0 },
    lastVisitAt: { type: Date },
    notes: { type: String, default: "" },
    feedbacks: [
      {
        orderId: { type: Schema.Types.ObjectId, ref: "Order" },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        createdAt: { type: Date, default: () => new Date() },
      },
    ],
  },
  { timestamps: true, collection: "customers" }
);
customerSchema.index({ restaurantId: 1, phone: 1 }, { unique: true });

export interface ILoyaltyAccount extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  customerId: Types.ObjectId;
  pointsBalance: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
  tier: LoyaltyTier;
  createdAt: Date;
  updatedAt: Date;
}

const loyaltyAccountSchema = new Schema<ILoyaltyAccount>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    pointsBalance: { type: Number, default: 0 },
    lifetimePointsEarned: { type: Number, default: 0 },
    lifetimePointsRedeemed: { type: Number, default: 0 },
    tier: { type: String, enum: LOYALTY_TIERS, default: "BRONZE" },
  },
  { timestamps: true, collection: "loyaltyAccounts" }
);
loyaltyAccountSchema.index({ restaurantId: 1, customerId: 1 }, { unique: true });

export interface ILoyaltyTransaction extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  customerId: Types.ObjectId;
  loyaltyAccountId: Types.ObjectId;
  type: LoyaltyTransactionType;
  pointsDelta: number;
  balanceAfter: number;
  orderId?: Types.ObjectId | null;
  rewardId?: Types.ObjectId | null;
  idempotencyKey?: string;
  description: string;
  createdByUserId?: Types.ObjectId | null;
  createdAt: Date;
}

const loyaltyTransactionSchema = new Schema<ILoyaltyTransaction>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    loyaltyAccountId: { type: Schema.Types.ObjectId, ref: "LoyaltyAccount", required: true },
    type: { type: String, enum: LOYALTY_TRANSACTION_TYPES, required: true },
    pointsDelta: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    rewardId: { type: Schema.Types.ObjectId, ref: "LoyaltyReward", default: null },
    idempotencyKey: { type: String },
    description: { type: String, required: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, collection: "loyaltyTransactions" }
);
loyaltyTransactionSchema.index({ restaurantId: 1, customerId: 1, createdAt: -1 });

export interface ILoyaltyReward extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  name: string;
  description: string;
  pointsCost: number;
  discountValuePaise: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const loyaltyRewardSchema = new Schema<ILoyaltyReward>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    pointsCost: { type: Number, required: true },
    discountValuePaise: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "loyaltyRewards" }
);

export interface IReservation extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  reservationCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string;
  timeSlot: string;
  durationMinutes: number;
  partySize: number;
  tableId?: Types.ObjectId | null;
  tableLabelSnapshot?: string;
  status: ReservationStatus;
  specialRequests: string;
  createdByUserId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const reservationSchema = new Schema<IReservation>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    reservationCode: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String },
    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    durationMinutes: { type: Number, default: 90 },
    partySize: { type: Number, required: true },
    tableId: { type: Schema.Types.ObjectId, ref: "RestaurantTable", default: null },
    tableLabelSnapshot: { type: String },
    status: { type: String, enum: RESERVATION_STATUSES, default: "CONFIRMED" },
    specialRequests: { type: String, default: "" },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, collection: "reservations" }
);
reservationSchema.index({ restaurantId: 1, date: 1, timeSlot: 1 });

export interface IStaffInvitation extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  email: string;
  name: string;
  role: StaffRole;
  token: string;
  status: "PENDING" | "ACCEPTED" | "REVOKED";
  invitedByUserId: Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

const staffInvitationSchema = new Schema<IStaffInvitation>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    email: { type: String, required: true, lowercase: true },
    name: { type: String, required: true },
    role: { type: String, enum: STAFF_ROLES, required: true },
    token: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "ACCEPTED", "REVOKED"], default: "PENDING" },
    invitedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "staffInvitations" }
);

export interface INotification extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  type: "NEW_ORDER" | "ORDER_STATUS" | "LOW_INVENTORY" | "EXPIRING_STOCK" | "RESERVATION" | "DAILY_SUMMARY";
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    type: {
      type: String,
      enum: ["NEW_ORDER", "ORDER_STATUS", "LOW_INVENTORY", "EXPIRING_STOCK", "RESERVATION", "DAILY_SUMMARY"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: "notifications" }
);
notificationSchema.index({ restaurantId: 1, createdAt: -1 });

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  restaurantId?: Types.ObjectId | null;
  actorUserId?: Types.ObjectId | null;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", default: null },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    actorEmail: { type: String, default: "system" },
    actorRole: { type: String, default: "SYSTEM" },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String },
    summary: { type: String, required: true },
    ipAddress: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: "auditLogs" }
);
auditLogSchema.index({ restaurantId: 1, createdAt: -1 });

export interface IReportJob extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  reportType: string;
  status: "COMPLETED" | "PENDING" | "FAILED";
  generatedByUserId?: Types.ObjectId | null;
  rowCount: number;
  summaryMetrics?: Record<string, unknown>;
  createdAt: Date;
}

const reportJobSchema = new Schema<IReportJob>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    reportType: { type: String, required: true },
    status: { type: String, enum: ["COMPLETED", "PENDING", "FAILED"], default: "COMPLETED" },
    generatedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    rowCount: { type: Number, default: 0 },
    summaryMetrics: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: "reportJobs" }
);

export interface IAiInsightLog extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  question?: string;
  providerMode: "RULE_BASED_DETERMINISTIC" | "LLM_ENHANCED";
  responsePayload: Record<string, unknown>;
  createdByUserId?: Types.ObjectId | null;
  createdAt: Date;
}

const aiInsightLogSchema = new Schema<IAiInsightLog>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    question: { type: String },
    providerMode: {
      type: String,
      enum: ["RULE_BASED_DETERMINISTIC", "LLM_ENHANCED"],
      default: "RULE_BASED_DETERMINISTIC",
    },
    responsePayload: { type: Schema.Types.Mixed, required: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, collection: "aiInsightLogs" }
);

export const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", userSchema);
export const RestaurantModel: Model<IRestaurant> =
  (mongoose.models.Restaurant as Model<IRestaurant>) ||
  mongoose.model<IRestaurant>("Restaurant", restaurantSchema);
export const MembershipModel: Model<IMembership> =
  (mongoose.models.Membership as Model<IMembership>) ||
  mongoose.model<IMembership>("Membership", membershipSchema);
export const SubscriptionModel: Model<ISubscription> =
  (mongoose.models.Subscription as Model<ISubscription>) ||
  mongoose.model<ISubscription>("Subscription", subscriptionSchema);
export const MenuCategoryModel: Model<IMenuCategory> =
  (mongoose.models.MenuCategory as Model<IMenuCategory>) ||
  mongoose.model<IMenuCategory>("MenuCategory", menuCategorySchema);
export const ModifierGroupModel: Model<IModifierGroup> =
  (mongoose.models.ModifierGroup as Model<IModifierGroup>) ||
  mongoose.model<IModifierGroup>("ModifierGroup", modifierGroupSchema);
export const MenuItemModel: Model<IMenuItem> =
  (mongoose.models.MenuItem as Model<IMenuItem>) ||
  mongoose.model<IMenuItem>("MenuItem", menuItemSchema);
export const RestaurantTableModel: Model<IRestaurantTable> =
  (mongoose.models.RestaurantTable as Model<IRestaurantTable>) ||
  mongoose.model<IRestaurantTable>("RestaurantTable", restaurantTableSchema);
export const OrderModel: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder>) ||
  mongoose.model<IOrder>("Order", orderSchema);
export const OrderStatusEventModel: Model<IOrderStatusEvent> =
  (mongoose.models.OrderStatusEvent as Model<IOrderStatusEvent>) ||
  mongoose.model<IOrderStatusEvent>("OrderStatusEvent", orderStatusEventSchema);
export const PaymentModel: Model<IPayment> =
  (mongoose.models.Payment as Model<IPayment>) ||
  mongoose.model<IPayment>("Payment", paymentSchema);
export const PaymentEventModel: Model<IPaymentEvent> =
  (mongoose.models.PaymentEvent as Model<IPaymentEvent>) ||
  mongoose.model<IPaymentEvent>("PaymentEvent", paymentEventSchema);
export const SupplierModel: Model<ISupplier> =
  (mongoose.models.Supplier as Model<ISupplier>) ||
  mongoose.model<ISupplier>("Supplier", supplierSchema);
export const IngredientModel: Model<IIngredient> =
  (mongoose.models.Ingredient as Model<IIngredient>) ||
  mongoose.model<IIngredient>("Ingredient", ingredientSchema);
export const RecipeModel: Model<IRecipe> =
  (mongoose.models.Recipe as Model<IRecipe>) ||
  mongoose.model<IRecipe>("Recipe", recipeSchema);
export const InventoryMovementModel: Model<IInventoryMovement> =
  (mongoose.models.InventoryMovement as Model<IInventoryMovement>) ||
  mongoose.model<IInventoryMovement>(
    "InventoryMovement",
    inventoryMovementSchema
  );
export const CustomerModel: Model<ICustomer> =
  (mongoose.models.Customer as Model<ICustomer>) ||
  mongoose.model<ICustomer>("Customer", customerSchema);
export const LoyaltyAccountModel: Model<ILoyaltyAccount> =
  (mongoose.models.LoyaltyAccount as Model<ILoyaltyAccount>) ||
  mongoose.model<ILoyaltyAccount>("LoyaltyAccount", loyaltyAccountSchema);
export const LoyaltyTransactionModel: Model<ILoyaltyTransaction> =
  (mongoose.models.LoyaltyTransaction as Model<ILoyaltyTransaction>) ||
  mongoose.model<ILoyaltyTransaction>(
    "LoyaltyTransaction",
    loyaltyTransactionSchema
  );
export const LoyaltyRewardModel: Model<ILoyaltyReward> =
  (mongoose.models.LoyaltyReward as Model<ILoyaltyReward>) ||
  mongoose.model<ILoyaltyReward>("LoyaltyReward", loyaltyRewardSchema);
export const ReservationModel: Model<IReservation> =
  (mongoose.models.Reservation as Model<IReservation>) ||
  mongoose.model<IReservation>("Reservation", reservationSchema);
export const StaffInvitationModel: Model<IStaffInvitation> =
  (mongoose.models.StaffInvitation as Model<IStaffInvitation>) ||
  mongoose.model<IStaffInvitation>("StaffInvitation", staffInvitationSchema);
export const NotificationModel: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) ||
  mongoose.model<INotification>("Notification", notificationSchema);
export const AuditLogModel: Model<IAuditLog> =
  (mongoose.models.AuditLog as Model<IAuditLog>) ||
  mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
export const ReportJobModel: Model<IReportJob> =
  (mongoose.models.ReportJob as Model<IReportJob>) ||
  mongoose.model<IReportJob>("ReportJob", reportJobSchema);
export const AiInsightLogModel: Model<IAiInsightLog> =
  (mongoose.models.AiInsightLog as Model<IAiInsightLog>) ||
  mongoose.model<IAiInsightLog>("AiInsightLog", aiInsightLogSchema);
