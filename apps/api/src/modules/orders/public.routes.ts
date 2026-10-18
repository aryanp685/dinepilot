import { Router, Request, Response, NextFunction } from "express";
import {
  ACTIVE_ORDER_STATUSES,
  createOrderSchema,
  paiseToRupees,
} from "@dinepilot/shared";
import { validateBody } from "../../middleware/security";
import {
  CustomerModel,
  MenuCategoryModel,
  MenuItemModel,
  ModifierGroupModel,
  OrderModel,
  OrderStatusEventModel,
  PaymentEventModel,
  PaymentModel,
  RestaurantModel,
  RestaurantTableModel,
} from "../../models";
import { emitOrderEvent } from "../../sockets";
import { AppError } from "../../utils/errors";
import { createOrAppendOrder } from "./order.service";

const router = Router();

async function handleGetPublicMenu(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const restaurant = await RestaurantModel.findOne({
      slug: req.params.slug.toLowerCase(),
      isActive: true,
    }).lean();

    if (!restaurant) {
      throw new AppError(404, "RESTAURANT_NOT_FOUND", "Restaurant not found");
    }

    const restaurantId = restaurant._id;
    const [categories, modifierGroups, items] = await Promise.all([
      MenuCategoryModel.find({ restaurantId, isActive: true })
        .sort({ sortOrder: 1 })
        .lean(),
      ModifierGroupModel.find({ restaurantId }).lean(),
      MenuItemModel.find({ restaurantId })
        .sort({ isPopular: -1, name: 1 })
        .lean(),
    ]);

    let tableInfo = null;
    const tableParam = String(req.query.table || "").trim();
    if (tableParam) {
      const tableDoc = await RestaurantTableModel.findOne({
        restaurantId,
        publicToken: tableParam,
        isActive: true,
      }).lean();
      if (tableDoc) {
        tableInfo = {
          label: tableDoc.label,
          zone: tableDoc.zone,
          capacity: tableDoc.capacity,
          publicToken: tableDoc.publicToken,
        };
      }
    }

    return res.json({
      success: true,
      data: {
        restaurant: {
          name: restaurant.name,
          slug: restaurant.slug,
          city: restaurant.city,
          state: restaurant.state,
          address: restaurant.address,
          currency: restaurant.currency,
          gstin: restaurant.gstin,
          fssaiNumber: restaurant.fssaiNumber,
          upiVpa: restaurant.upiVpa,
          qrThemePreset: restaurant.qrThemePreset,
          isDemo: restaurant.isDemo,
          settings: {
            taxMode: restaurant.settings.taxMode,
            cgstRateBps: restaurant.settings.cgstRateBps,
            sgstRateBps: restaurant.settings.sgstRateBps,
            serviceChargeRateBps: restaurant.settings.serviceChargeRateBps,
            defaultPackagingPaise: restaurant.settings.defaultPackagingPaise,
            defaultPackagingFeePaise: restaurant.settings.defaultPackagingPaise,
            enableRoundOff: restaurant.settings.enableRoundOff,
            allowDeliveryOrders: restaurant.settings.allowDeliveryOrders,
            allowRunningTableKots: restaurant.settings.allowRunningTableKots,
            requirePinForQrOrders: restaurant.settings.requirePinForQrOrders,
          },
        },
        table: tableInfo,
        categories: categories.map((c) => ({
          _id: String(c._id),
          id: String(c._id),
          name: c.name,
          description: c.description,
          sortOrder: c.sortOrder,
        })),
        modifierGroups: modifierGroups.map((g) => ({
          _id: String(g._id),
          id: String(g._id),
          name: g.name,
          selectionType: g.selectionType,
          isRequired: g.isRequired,
          minSelect: g.minSelect,
          maxSelect: g.maxSelect,
          options: g.options,
        })),
        items: items.map((i) => ({
          _id: String(i._id),
          id: String(i._id),
          categoryId: String(i.categoryId),
          name: i.name,
          description: i.description,
          pricePaise: i.pricePaise,
          basePricePaise: i.pricePaise,
          packagingCostPaise: i.packagingCostPaise,
          packagingFeePaise: i.packagingCostPaise,
          imageUrl: i.imageUrl,
          dietaryType: i.dietaryType,
          dietaryTag: i.dietaryType,
          spiceLevel: i.spiceLevel,
          prepTimeMinutes: i.prepTimeMinutes,
          isAvailable: i.isAvailable,
          isPopular: i.isPopular,
          isBestseller: i.isPopular,
          modifierGroupIds: i.modifierGroupIds,
          tags: i.tags,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

router.get("/restaurants/:slug/menu", handleGetPublicMenu);
router.get("/menu/:slug", handleGetPublicMenu);

router.get(
  "/restaurants/:slug/tables/:publicToken",
  async (req: Request, res: Response, next) => {
    try {
      const restaurant = await RestaurantModel.findOne({
        slug: req.params.slug.toLowerCase(),
        isActive: true,
      }).lean();

      if (!restaurant) {
        throw new AppError(404, "RESTAURANT_NOT_FOUND", "Restaurant not found");
      }

      const table = await RestaurantTableModel.findOne({
        restaurantId: restaurant._id,
        publicToken: req.params.publicToken,
        isActive: true,
      }).lean();

      if (!table) {
        throw new AppError(
          404,
          "INVALID_TABLE_TOKEN",
          "Table QR token is invalid or does not belong to this restaurant"
        );
      }

      let activeRunningOrder = null;
      if (table.activeOrderId) {
        const order = await OrderModel.findOne({
          _id: table.activeOrderId,
          restaurantId: restaurant._id,
          status: { $in: ACTIVE_ORDER_STATUSES },
        })
          .select(
            "_id orderNumber publicOrderToken status totalPaise kotBatches items"
          )
          .lean();

        if (order) {
          activeRunningOrder = {
            id: String(order._id),
            orderNumber: order.orderNumber,
            publicOrderToken: order.publicOrderToken,
            status: order.status,
            totalPaise: order.totalPaise,
            kotCount: order.kotBatches?.length || 1,
            itemCount: order.items.reduce((s, l) => s + l.quantity, 0),
          };
        }
      }

      return res.json({
        success: true,
        data: {
          table: {
            label: table.label,
            zone: table.zone,
            capacity: table.capacity,
            publicToken: table.publicToken,
          },
          activeRunningOrder,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

async function handleCreatePublicOrder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const slug = (
      req.params.slug ||
      req.body.restaurantSlug ||
      "saoji-spice-nagpur"
    ).toLowerCase();

    const restaurant = await RestaurantModel.findOne({
      slug,
      isActive: true,
    });

    if (!restaurant) {
      throw new AppError(404, "RESTAURANT_NOT_FOUND", "Restaurant not found");
    }

    let appendToRunningOrderId = req.body.appendToRunningOrderId;
    if (!appendToRunningOrderId && req.body.appendToOrderToken) {
      const existingOrd = await OrderModel.findOne({
        restaurantId: restaurant._id,
        publicOrderToken: req.body.appendToOrderToken,
      }).select("_id");
      if (existingOrd) {
        appendToRunningOrderId = String(existingOrd._id);
      }
    }

    const order = await createOrAppendOrder({
      restaurant,
      source: "QR_GUEST",
      orderType: req.body.orderType || "DINE_IN",
      tablePublicToken:
        req.body.tablePublicToken || req.body.tableQrToken || undefined,
      sessionPin: req.body.sessionPin,
      appendToRunningOrderId,
      customerName: req.body.customerName || "Guest Diner",
      customerPhone: req.body.customerPhone,
      marketingConsent: req.body.marketingConsent,
      customerNotes:
        req.body.customerNotes || req.body.specialInstructions || undefined,
      idempotencyKey: req.body.idempotencyKey,
      items: (req.body.items || []).map((item: any) => ({
        menuItemId: item.menuItemId,
        quantity: Number(item.quantity) || 1,
        modifiers: Array.isArray(item.modifiers) ? item.modifiers : [],
        notes: item.notes,
      })),
    });

    return res.status(201).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        publicOrderToken: order.publicOrderToken,
        orderType: order.orderType,
        tableLabel: order.tableLabelSnapshot,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotalPaise: order.subtotalPaise,
        discountPaise: order.discountPaise,
        packagingTotalPaise: order.packagingTotalPaise,
        serviceChargePaise: order.serviceChargePaise,
        cgstPaise: order.cgstPaise,
        sgstPaise: order.sgstPaise,
        roundOffPaise: order.roundOffPaise,
        totalPaise: order.totalPaise,
        totalAmountPaise: order.totalPaise,
        kotCount: order.kotBatches?.length || 1,
        kotBatches: order.kotBatches,
        items: order.items,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

router.post(
  "/restaurants/:slug/orders",
  validateBody(createOrderSchema),
  handleCreatePublicOrder
);
router.post("/orders", handleCreatePublicOrder);

router.get(
  "/orders/:publicOrderToken",
  async (req: Request, res: Response, next) => {
    try {
      const order = await OrderModel.findOne({
        publicOrderToken: req.params.publicOrderToken,
      }).lean();

      if (!order) {
        throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
      }

      const [restaurant, statusEvents] = await Promise.all([
        RestaurantModel.findById(order.restaurantId).lean(),
        OrderStatusEventModel.find({ orderId: order._id })
          .sort({ createdAt: 1 })
          .select("fromStatus toStatus note createdAt")
          .lean(),
      ]);

      const amountRupees = paiseToRupees(order.totalPaise).toFixed(2);
      const upiVpa = restaurant?.upiVpa || "saojikitchen@okicici";
      const restaurantName = encodeURIComponent(
        restaurant?.name || "DinePilot Restaurant"
      );
      const upiDeepLink = `upi://pay?pa=${encodeURIComponent(
        upiVpa
      )}&pn=${restaurantName}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent(
        `Order ${order.orderNumber}`
      )}`;

      const mappedItems = order.items.map((item) => ({
        name: item.nameSnapshot,
        nameSnapshot: item.nameSnapshot,
        dietarySnapshot: item.dietarySnapshot,
        quantity: item.quantity,
        unitBasePricePaise: item.unitBasePricePaise,
        unitEffectivePricePaise: item.unitEffectivePricePaise,
        lineSubtotalPaise: item.lineSubtotalPaise,
        lineTotalPaise: item.lineSubtotalPaise,
        modifiers: item.modifiers,
        kotNumber: item.kotNumber,
        kotBatch: item.kotNumber,
        notes: item.notes,
      }));

      const restaurantInfo = restaurant
        ? {
            name: restaurant.name,
            slug: restaurant.slug,
            city: restaurant.city,
            gstin: restaurant.gstin,
            fssaiNumber: restaurant.fssaiNumber,
            upiVpa: restaurant.upiVpa,
            qrThemePreset: restaurant.qrThemePreset,
          }
        : null;

      const orderSummary = {
        orderNumber: order.orderNumber,
        publicOrderToken: order.publicOrderToken,
        orderType: order.orderType,
        tableLabel: order.tableLabelSnapshot,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        paymentReference: order.paymentReference,
        kotCount: order.kotBatches?.length || 1,
        kotBatches: order.kotBatches,
        items: mappedItems,
        subtotalPaise: order.subtotalPaise,
        discountPaise: order.discountPaise,
        packagingTotalPaise: order.packagingTotalPaise,
        packagingFeePaise: order.packagingTotalPaise,
        serviceChargePaise: order.serviceChargePaise,
        taxModeSnapshot: order.taxModeSnapshot,
        cgstPaise: order.cgstPaise,
        sgstPaise: order.sgstPaise,
        roundOffPaise: order.roundOffPaise,
        totalPaise: order.totalPaise,
        totalAmountPaise: order.totalPaise,
        customerNotes: order.customerNotes,
        createdAt: order.createdAt,
      };

      return res.json({
        success: true,
        data: {
          ...orderSummary,
          order: orderSummary,
          restaurant: restaurantInfo,
          upiDeepLink,
          upiInstructions: {
            vpa: upiVpa,
            amountPaise: order.totalPaise,
            deepLink: upiDeepLink,
          },
          statusEvents,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/orders/:publicOrderToken/payment-claim",
  async (req: Request, res: Response, next) => {
    try {
      const order = await OrderModel.findOne({
        publicOrderToken: req.params.publicOrderToken,
      });

      if (!order) {
        throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
      }

      if (order.paymentStatus === "PAID") {
        return res.json({
          success: true,
          data: {
            paymentStatus: order.paymentStatus,
            message: "Payment is already verified as PAID",
          },
        });
      }

      const utrReference = String(req.body?.upiReference || "").trim();
      order.paymentStatus = "PENDING_VERIFICATION";
      order.paymentMethod = "UPI";
      if (utrReference) {
        order.paymentReference = utrReference;
      }
      await order.save();

      const payment = await PaymentModel.create({
        restaurantId: order.restaurantId,
        orderId: order._id,
        amountPaise: order.totalPaise,
        currency: "INR",
        method: "UPI",
        status: "PENDING_VERIFICATION",
        reference: utrReference || "Guest UPI Claim",
      });

      await PaymentEventModel.create({
        restaurantId: order.restaurantId,
        paymentId: payment._id,
        orderId: order._id,
        eventType: "GUEST_UPI_CLAIM_SUBMITTED",
        amountPaise: order.totalPaise,
        metadata: { upiReference: utrReference },
      });

      emitOrderEvent({
        restaurantId: String(order.restaurantId),
        publicOrderToken: order.publicOrderToken,
        event: "order:updated",
        order,
      });

      return res.json({
        success: true,
        data: {
          paymentStatus: order.paymentStatus,
          message:
            "Payment reference submitted. Cashier or Soundbox verification will confirm your receipt shortly.",
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/orders/:publicOrderToken/feedback",
  async (req: Request, res: Response, next) => {
    try {
      const order = await OrderModel.findOne({
        publicOrderToken: req.params.publicOrderToken,
      });
      if (!order) {
        throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
      }

      const rating = Math.min(5, Math.max(1, Number(req.body?.rating) || 5));
      const comment = String(req.body?.comment || "").slice(0, 400);

      if (order.customerId) {
        await CustomerModel.findOneAndUpdate(
          { _id: order.customerId, restaurantId: order.restaurantId },
          {
            $push: {
              feedbacks: {
                orderId: order._id,
                rating,
                comment,
                createdAt: new Date(),
              },
            },
          }
        );
      }

      return res.json({
        success: true,
        data: {
          submitted: true,
          rating,
          comment,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export const publicRouter = router;
