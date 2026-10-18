import crypto from "crypto";
import {
  ACTIVE_ORDER_STATUSES,
  calculateGstAndTotals,
  canTransitionOrderStatus,
  convertUnitQuantity,
  LoyaltyTier,
  OrderSource,
  OrderStatus,
  OrderType,
} from "@dinepilot/shared";
import {
  CustomerModel,
  IngredientModel,
  InventoryMovementModel,
  IOrder,
  IOrderLineItem,
  IRestaurant,
  LoyaltyAccountModel,
  LoyaltyTransactionModel,
  MenuItemModel,
  ModifierGroupModel,
  NotificationModel,
  OrderModel,
  OrderStatusEventModel,
  RecipeModel,
  RestaurantModel,
  RestaurantTableModel,
} from "../../models";
import {
  emitOrderEvent,
  emitRestaurantNotification,
} from "../../sockets";
import { withResourceLock } from "../../utils/concurrency";
import { AppError } from "../../utils/errors";

function determineLoyaltyTier(lifetimePoints: number): LoyaltyTier {
  if (lifetimePoints >= 2500) return "PLATINUM";
  if (lifetimePoints >= 1000) return "GOLD";
  if (lifetimePoints >= 400) return "SILVER";
  return "BRONZE";
}

export async function buildValidatedOrderLineItems(params: {
  restaurantId: string;
  kotNumber: number;
  rawItems: Array<{
    menuItemId: string;
    quantity: number;
    selectedModifiers?: Array<{ groupId: string; optionId: string }>;
    notes?: string;
  }>;
}): Promise<IOrderLineItem[]> {
  const { restaurantId, kotNumber, rawItems } = params;
  if (!rawItems || rawItems.length === 0) {
    throw new AppError(400, "EMPTY_ORDER", "Order must contain at least 1 item");
  }

  const menuItemIds = rawItems.map((i) => i.menuItemId);
  const dbItems = await MenuItemModel.find({
    _id: { $in: menuItemIds },
    restaurantId,
  });

  const dbItemMap = new Map(dbItems.map((m) => [String(m._id), m]));
  const modGroups = await ModifierGroupModel.find({ restaurantId });
  const modGroupMap = new Map(modGroups.map((g) => [String(g._id), g]));

  const validatedLines: IOrderLineItem[] = [];

  for (const reqItem of rawItems) {
    if (!Number.isInteger(reqItem.quantity) || reqItem.quantity < 1) {
      throw new AppError(
        400,
        "INVALID_QUANTITY",
        "Item quantity must be a positive integer"
      );
    }

    const menuItem = dbItemMap.get(String(reqItem.menuItemId));
    if (!menuItem) {
      throw new AppError(
        400,
        "INVALID_MENU_ITEM",
        "One or more items do not belong to this restaurant"
      );
    }

    if (!menuItem.isAvailable) {
      throw new AppError(
        400,
        "ITEM_UNAVAILABLE",
        `Menu item '${menuItem.name}' is currently unavailable`
      );
    }

    let modifierPriceDeltaPaise = 0;
    let combinedRecipeMultiplier = 1;
    const resolvedModifiers = [];

    for (const sel of reqItem.selectedModifiers || []) {
      const group = modGroupMap.get(String(sel.groupId));
      if (
        !group ||
        !menuItem.modifierGroupIds.map(String).includes(String(group._id))
      ) {
        throw new AppError(
          400,
          "INVALID_MODIFIER_GROUP",
          `Invalid modifier group for item '${menuItem.name}'`
        );
      }
      const option = group.options.find(
        (o: { id: string; isAvailable: boolean }) =>
          o.id === sel.optionId && o.isAvailable
      );
      if (!option) {
        throw new AppError(
          400,
          "INVALID_MODIFIER_OPTION",
          `Invalid or unavailable modifier option for '${menuItem.name}'`
        );
      }

      modifierPriceDeltaPaise += option.priceDeltaPaise;
      combinedRecipeMultiplier *= option.recipeMultiplier || 1;
      resolvedModifiers.push({
        groupId: String(group._id),
        groupName: group.name,
        optionId: option.id,
        optionName: option.name,
        priceDeltaPaise: option.priceDeltaPaise,
        recipeMultiplier: option.recipeMultiplier || 1,
      });
    }

    const unitEffectivePricePaise = Math.max(
      0,
      menuItem.pricePaise + modifierPriceDeltaPaise
    );
    const lineSubtotalPaise = unitEffectivePricePaise * reqItem.quantity;
    const packagingCostPaise =
      (menuItem.packagingCostPaise || 0) * reqItem.quantity;

    validatedLines.push({
      menuItemId: menuItem._id,
      nameSnapshot: menuItem.name,
      dietarySnapshot: menuItem.dietaryType,
      quantity: reqItem.quantity,
      unitBasePricePaise: menuItem.pricePaise,
      modifiers: resolvedModifiers,
      unitEffectivePricePaise,
      lineSubtotalPaise,
      packagingCostPaise,
      recipeMultiplier: Number(combinedRecipeMultiplier.toFixed(2)),
      kotNumber,
      notes: reqItem.notes || "",
    });
  }

  return validatedLines;
}

export async function createOrAppendOrder(params: {
  restaurant: IRestaurant;
  source: OrderSource;
  orderType: OrderType;
  tablePublicToken?: string;
  tableId?: string;
  sessionPin?: string;
  appendToRunningOrderId?: string;
  customerName?: string;
  customerPhone?: string;
  marketingConsent?: boolean;
  customerNotes?: string;
  discountPaise?: number;
  idempotencyKey?: string;
  actorUserId?: string | null;
  actorRole?: string;
  actorName?: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    selectedModifiers?: Array<{ groupId: string; optionId: string }>;
    notes?: string;
  }>;
}): Promise<IOrder> {
  const restaurantId = String(params.restaurant._id);
  const lockKey = params.idempotencyKey
    ? `order-Create:${restaurantId}:${params.idempotencyKey}`
    : `order-Create:${restaurantId}:${Date.now()}:${Math.random()}`;

  return withResourceLock(lockKey, async () => {
    if (params.idempotencyKey) {
      const existing = await OrderModel.findOne({
        restaurantId,
        idempotencyKey: params.idempotencyKey,
      });
      if (existing) {
        return existing;
      }
    }

    if (
      params.orderType === "DELIVERY" &&
      !params.restaurant.settings.allowDeliveryOrders
    ) {
      throw new AppError(
        400,
        "DELIVERY_DISABLED",
        "Delivery orders are currently disabled for this restaurant"
      );
    }

    let resolvedTable = null;
    if (params.tablePublicToken) {
      resolvedTable = await RestaurantTableModel.findOne({
        restaurantId,
        publicToken: params.tablePublicToken,
        isActive: true,
      });
      if (!resolvedTable) {
        throw new AppError(
          400,
          "INVALID_TABLE_TOKEN",
          "Invalid or inactive QR table token for this restaurant"
        );
      }
      if (
        params.source === "QR_GUEST" &&
        params.restaurant.settings.requirePinForQrOrders
      ) {
        if (!params.sessionPin || params.sessionPin !== resolvedTable.sessionPin) {
          throw new AppError(
            403,
            "INVALID_TABLE_PIN",
            "Valid 4-digit table PIN is required to place an order"
          );
        }
      }
    } else if (params.tableId) {
      resolvedTable = await RestaurantTableModel.findOne({
        _id: params.tableId,
        restaurantId,
        isActive: true,
      });
      if (!resolvedTable) {
        throw new AppError(
          400,
          "INVALID_TABLE_ID",
          "Table not found or inactive in this restaurant"
        );
      }
    }

    let customerDoc = null;
    if (params.customerPhone && params.customerPhone.trim().length >= 8) {
      const cleanPhone = params.customerPhone.trim();
      customerDoc = await CustomerModel.findOne({
        restaurantId,
        phone: cleanPhone,
      });
      if (!customerDoc) {
        customerDoc = await CustomerModel.create({
          restaurantId,
          name: params.customerName?.trim() || "Walk-in Guest",
          phone: cleanPhone,
          marketingConsent: Boolean(params.marketingConsent),
          consentUpdatedAt: params.marketingConsent ? new Date() : undefined,
          visitCount: 1,
          lastVisitAt: new Date(),
        });
        await LoyaltyAccountModel.create({
          restaurantId,
          customerId: customerDoc._id,
          pointsBalance: 0,
          lifetimePointsEarned: 0,
          lifetimePointsRedeemed: 0,
          tier: "BRONZE",
        });
      } else if (params.marketingConsent !== undefined) {
        customerDoc.marketingConsent = Boolean(params.marketingConsent);
        customerDoc.consentUpdatedAt = new Date();
        await customerDoc.save();
      }
    }

    if (
      params.appendToRunningOrderId &&
      params.restaurant.settings.allowRunningTableKots
    ) {
      const runningOrder = await OrderModel.findOne({
        _id: params.appendToRunningOrderId,
        restaurantId,
        status: { $in: ACTIVE_ORDER_STATUSES },
      });

      if (runningOrder) {
        const nextKotNumber = (runningOrder.kotBatches?.length || 1) + 1;
        const newLines = await buildValidatedOrderLineItems({
          restaurantId,
          kotNumber: nextKotNumber,
          rawItems: params.items,
        });

        runningOrder.items.push(...newLines);
        runningOrder.kotBatches.push({
          kotNumber: nextKotNumber,
          createdAt: new Date(),
          source: params.source,
          notes: params.customerNotes || "",
        });

        const allItemsSubtotal = runningOrder.items.reduce(
          (sum, l) => sum + l.lineSubtotalPaise,
          0
        );
        const allItemsPackaging = runningOrder.items.reduce(
          (sum, l) => sum + (l.packagingCostPaise || 0),
          0
        );

        const totals = calculateGstAndTotals({
          itemsSubtotalPaise: allItemsSubtotal,
          discountPaise: runningOrder.discountPaise,
          packagingTotalPaise:
            allItemsPackaging ||
            params.restaurant.settings.defaultPackagingPaise,
          orderType: runningOrder.orderType,
          taxConfig: params.restaurant.settings,
        });

        runningOrder.subtotalPaise = totals.subtotalPaise;
        runningOrder.packagingTotalPaise = totals.packagingTotalPaise;
        runningOrder.serviceChargePaise = totals.serviceChargePaise;
        runningOrder.cgstPaise = totals.cgstPaise;
        runningOrder.sgstPaise = totals.sgstPaise;
        runningOrder.roundOffPaise = totals.roundOffPaise;
        runningOrder.totalPaise = totals.totalPaise;

        if (runningOrder.inventoryConsumed) {
          await consumeInventoryForLines({
            restaurantId,
            orderId: String(runningOrder._id),
            orderNumber: runningOrder.orderNumber,
            kotNumber: nextKotNumber,
            lines: newLines,
            actorUserId: params.actorUserId || null,
            actorName: params.actorName || "Staff",
          });
        }

        await runningOrder.save();

        emitOrderEvent({
          restaurantId,
          publicOrderToken: runningOrder.publicOrderToken,
          event: "order:kot_added",
          order: runningOrder,
        });

        return runningOrder;
      }
    }

    const validatedLines = await buildValidatedOrderLineItems({
      restaurantId,
      kotNumber: 1,
      rawItems: params.items,
    });

    const itemsSubtotalPaise = validatedLines.reduce(
      (sum, line) => sum + line.lineSubtotalPaise,
      0
    );
    const itemsPackagingPaise = validatedLines.reduce(
      (sum, line) => sum + (line.packagingCostPaise || 0),
      0
    );

    const safeDiscountPaise =
      params.source === "STAFF_POS" ? Math.max(0, params.discountPaise || 0) : 0;

    const totals = calculateGstAndTotals({
      itemsSubtotalPaise,
      discountPaise: safeDiscountPaise,
      packagingTotalPaise:
        itemsPackagingPaise || params.restaurant.settings.defaultPackagingPaise,
      orderType: params.orderType,
      taxConfig: params.restaurant.settings,
    });

    const updatedRest = await RestaurantModel.findOneAndUpdate(
      { _id: restaurantId },
      { $inc: { orderSequence: 1 } },
      { new: true }
    );
    const seq = updatedRest?.orderSequence || Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `DP-${seq}`;
    const publicOrderToken = `ord_${crypto.randomBytes(16).toString("hex")}`;

    const order = await OrderModel.create({
      restaurantId,
      orderNumber,
      publicOrderToken,
      idempotencyKey: params.idempotencyKey,
      orderType: params.orderType,
      source: params.source,
      tableId: resolvedTable ? resolvedTable._id : null,
      tableLabelSnapshot: resolvedTable ? resolvedTable.label : undefined,
      customerId: customerDoc ? customerDoc._id : null,
      customerName:
        params.customerName || (customerDoc ? customerDoc.name : "Guest"),
      customerPhone: params.customerPhone,
      kotBatches: [
        {
          kotNumber: 1,
          createdAt: new Date(),
          source: params.source,
          notes: params.customerNotes || "",
        },
      ],
      items: validatedLines,
      subtotalPaise: totals.subtotalPaise,
      discountPaise: totals.discountPaise,
      packagingTotalPaise: totals.packagingTotalPaise,
      serviceChargePaise: totals.serviceChargePaise,
      taxModeSnapshot: totals.taxMode,
      cgstPaise: totals.cgstPaise,
      sgstPaise: totals.sgstPaise,
      roundOffPaise: totals.roundOffPaise,
      totalPaise: totals.totalPaise,
      status: "NEW",
      paymentStatus: "UNPAID",
      paymentMethod: "UNSPECIFIED",
      inventoryConsumed: false,
      inventoryReversed: false,
      loyaltyProcessed: false,
      customerNotes: params.customerNotes || "",
    });

    await OrderStatusEventModel.create({
      restaurantId,
      orderId: order._id,
      fromStatus: "CREATED",
      toStatus: "NEW",
      actorUserId: params.actorUserId || null,
      actorRole: params.actorRole || (params.source === "QR_GUEST" ? "GUEST" : "STAFF"),
      actorName: params.actorName || params.customerName || "Guest",
      note: `Order ${orderNumber} placed via ${params.source}`,
    });

    if (resolvedTable) {
      resolvedTable.activeOrderId = order._id;
      await resolvedTable.save();
    }

    const notification = await NotificationModel.create({
      restaurantId,
      type: "NEW_ORDER",
      title: `New Order ${orderNumber}`,
      message: `${validatedLines.length} item(s) • ${
        resolvedTable ? `Table ${resolvedTable.label}` : params.orderType
      }`,
      metadata: { orderId: String(order._id), orderNumber },
    });

    emitOrderEvent({
      restaurantId,
      publicOrderToken: order.publicOrderToken,
      event: "order:created",
      order,
    });
    emitRestaurantNotification(restaurantId, notification);

    return order;
  });
}

async function consumeInventoryForLines(params: {
  restaurantId: string;
  orderId: string;
  orderNumber: string;
  kotNumber: number;
  lines: IOrderLineItem[];
  actorUserId: string | null;
  actorName: string;
}) {
  const menuItemIds = params.lines.map((l) => l.menuItemId);
  const recipes = await RecipeModel.find({
    restaurantId: params.restaurantId,
    menuItemId: { $in: menuItemIds },
  });
  const recipeMap = new Map(recipes.map((r) => [String(r.menuItemId), r]));

  for (let idx = 0; idx < params.lines.length; idx++) {
    const line = params.lines[idx];
    const recipe = recipeMap.get(String(line.menuItemId));
    if (!recipe) continue;

    const servingsFactor =
      (line.quantity * (line.recipeMultiplier || 1)) /
      Math.max(1, recipe.yieldServings || 1);

    for (const comp of recipe.components) {
      const ingredientId = String(comp.ingredientId);
      const movementIdempotencyKey = `consume:${params.orderId}:kot${params.kotNumber}:line${idx}:ing${ingredientId}`;

      await withResourceLock(`inventory:${ingredientId}`, async () => {
        const existingMove = await InventoryMovementModel.findOne({
          restaurantId: params.restaurantId,
          idempotencyKey: movementIdempotencyKey,
        });
        if (existingMove) return;

        const ingredient = await IngredientModel.findOne({
          _id: ingredientId,
          restaurantId: params.restaurantId,
        });
        if (!ingredient) return;

        const qtyInStockUnit = convertUnitQuantity(
          comp.quantity * servingsFactor,
          comp.unit,
          ingredient.unit
        );
        const safeYield = Math.min(
          100,
          Math.max(1, ingredient.usableYieldPercent || 100)
        );
        const grossDeduction = Number(
          (qtyInStockUnit / (safeYield / 100)).toFixed(4)
        );

        const previousStock = ingredient.currentStock;
        const newStock = Number(
          Math.max(0, previousStock - grossDeduction).toFixed(4)
        );

        ingredient.currentStock = newStock;
        ingredient.lastUpdatedAt = new Date();
        await ingredient.save();

        const totalCostPaise = Math.round(
          grossDeduction * ingredient.costPerUnitPaise
        );

        await InventoryMovementModel.create({
          restaurantId: params.restaurantId,
          ingredientId: ingredient._id,
          ingredientNameSnapshot: ingredient.name,
          type: "RECIPE_CONSUMPTION",
          quantityDelta: -grossDeduction,
          unit: ingredient.unit,
          previousStock,
          newStock,
          unitCostPaiseSnapshot: ingredient.costPerUnitPaise,
          totalCostPaise,
          referenceOrderId: params.orderId,
          idempotencyKey: movementIdempotencyKey,
          reason: `Recipe consumption for Order ${params.orderNumber} (${line.nameSnapshot} x${line.quantity})`,
          performedByUserId: params.actorUserId,
          performedByName: params.actorName,
        });

        if (newStock <= ingredient.reorderThreshold) {
          await NotificationModel.create({
            restaurantId: params.restaurantId,
            type: "LOW_INVENTORY",
            title: `Low Stock Alert: ${ingredient.name}`,
            message: `${ingredient.name} is at ${newStock} ${ingredient.unit} (Reorder threshold: ${ingredient.reorderThreshold} ${ingredient.unit})`,
            metadata: { ingredientId: String(ingredient._id) },
          });
        }
      });
    }
  }
}

export async function transitionOrderStatus(params: {
  restaurant: IRestaurant;
  orderId: string;
  toStatus: OrderStatus;
  note?: string;
  cancelReason?: string;
  reverseInventoryOnCancel?: boolean;
  actorUserId: string;
  actorRole: string;
  actorName: string;
}): Promise<IOrder> {
  const restaurantId = String(params.restaurant._id);

  return withResourceLock(`order-status:${params.orderId}`, async () => {
    const order = await OrderModel.findOne({
      _id: params.orderId,
      restaurantId,
    });
    if (!order) {
      throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
    }

    if (order.status === params.toStatus) {
      return order;
    }

    if (!canTransitionOrderStatus(order.status, params.toStatus)) {
      throw new AppError(
        400,
        "INVALID_STATE_TRANSITION",
        `Cannot transition order ${order.orderNumber} from ${order.status} to ${params.toStatus}`
      );
    }

    const fromStatus = order.status;
    order.status = params.toStatus;

    if (params.toStatus === "ACCEPTED") {
      order.acceptedAt = new Date();
      if (!order.inventoryConsumed) {
        await consumeInventoryForLines({
          restaurantId,
          orderId: String(order._id),
          orderNumber: order.orderNumber,
          kotNumber: 1,
          lines: order.items,
          actorUserId: params.actorUserId,
          actorName: params.actorName,
        });
        order.inventoryConsumed = true;
      }
    }

    if (params.toStatus === "COMPLETED") {
      order.completedAt = new Date();
      if (order.tableId) {
        await RestaurantTableModel.findOneAndUpdate(
          { _id: order.tableId, restaurantId, activeOrderId: order._id },
          { $set: { activeOrderId: null } }
        );
      }

      if (order.customerId && !order.loyaltyProcessed) {
        const pointsRate =
          params.restaurant.settings.loyaltyPointsPerHundredRupees ?? 10;
        const earnedPoints = Math.floor(
          (order.totalPaise / 10000) * pointsRate
        );

        const customer = await CustomerModel.findOne({
          _id: order.customerId,
          restaurantId,
        });
        if (customer) {
          customer.totalSpentPaise += order.totalPaise;
          customer.lastVisitAt = new Date();
          await customer.save();

          if (earnedPoints > 0) {
            const loyaltyTxKey = `loyalty-earn:${String(order._id)}`;
            const existingTx = await LoyaltyTransactionModel.findOne({
              restaurantId,
              idempotencyKey: loyaltyTxKey,
            });
            if (!existingTx) {
              let account = await LoyaltyAccountModel.findOne({
                restaurantId,
                customerId: customer._id,
              });
              if (!account) {
                account = await LoyaltyAccountModel.create({
                  restaurantId,
                  customerId: customer._id,
                  pointsBalance: 0,
                  lifetimePointsEarned: 0,
                  lifetimePointsRedeemed: 0,
                  tier: "BRONZE",
                });
              }
              account.pointsBalance += earnedPoints;
              account.lifetimePointsEarned += earnedPoints;
              account.tier = determineLoyaltyTier(account.lifetimePointsEarned);
              await account.save();

              await LoyaltyTransactionModel.create({
                restaurantId,
                customerId: customer._id,
                loyaltyAccountId: account._id,
                type: "EARN",
                pointsDelta: earnedPoints,
                balanceAfter: account.pointsBalance,
                orderId: order._id,
                idempotencyKey: loyaltyTxKey,
                description: `Earned ${earnedPoints} pts from Order ${order.orderNumber}`,
                createdByUserId: params.actorUserId,
              });
            }
          }
        }
        order.loyaltyProcessed = true;
      }
    }

    if (params.toStatus === "CANCELLED") {
      order.cancelledAt = new Date();
      order.cancelReason =
        params.cancelReason || params.note || "Cancelled by staff";

      if (order.tableId) {
        await RestaurantTableModel.findOneAndUpdate(
          { _id: order.tableId, restaurantId, activeOrderId: order._id },
          { $set: { activeOrderId: null } }
        );
      }

      if (
        order.inventoryConsumed &&
        !order.inventoryReversed &&
        params.reverseInventoryOnCancel !== false
      ) {
        const movements = await InventoryMovementModel.find({
          restaurantId,
          referenceOrderId: order._id,
          type: "RECIPE_CONSUMPTION",
        });

        for (const move of movements) {
          const reversalKey = `reversal:${String(move._id)}`;
          await withResourceLock(
            `inventory:${String(move.ingredientId)}`,
            async () => {
              const existingRev = await InventoryMovementModel.findOne({
                restaurantId,
                idempotencyKey: reversalKey,
              });
              if (existingRev) return;

              const ingredient = await IngredientModel.findOne({
                _id: move.ingredientId,
                restaurantId,
              });
              if (!ingredient) return;

              const restoreQty = Math.abs(move.quantityDelta);
              const previousStock = ingredient.currentStock;
              const newStock = Number((previousStock + restoreQty).toFixed(4));
              ingredient.currentStock = newStock;
              ingredient.lastUpdatedAt = new Date();
              await ingredient.save();

              await InventoryMovementModel.create({
                restaurantId,
                ingredientId: ingredient._id,
                ingredientNameSnapshot: ingredient.name,
                type: "RETURN_REVERSAL",
                quantityDelta: restoreQty,
                unit: ingredient.unit,
                previousStock,
                newStock,
                unitCostPaiseSnapshot: move.unitCostPaiseSnapshot,
                totalCostPaise: move.totalCostPaise,
                referenceOrderId: order._id,
                idempotencyKey: reversalKey,
                reason: `Stock reversal for cancelled Order ${order.orderNumber}`,
                performedByUserId: params.actorUserId,
                performedByName: params.actorName,
              });
            }
          );
        }
        order.inventoryReversed = true;
      }
    }

    await order.save();

    await OrderStatusEventModel.create({
      restaurantId,
      orderId: order._id,
      fromStatus,
      toStatus: params.toStatus,
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      actorName: params.actorName,
      note:
        params.note ||
        params.cancelReason ||
        `Status changed from ${fromStatus} to ${params.toStatus}`,
    });

    emitOrderEvent({
      restaurantId,
      publicOrderToken: order.publicOrderToken,
      event: "order:updated",
      order,
    });

    return order;
  });
}
