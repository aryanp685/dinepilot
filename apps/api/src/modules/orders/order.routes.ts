import { Router, Response } from "express";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "@dinepilot/shared";
import {
  AuthenticatedRequest,
  requireAuth,
  requirePermission,
  requireTenant,
} from "../../middleware/auth";
import { recordAuditLog, validateBody } from "../../middleware/security";
import {
  OrderModel,
  OrderStatusEventModel,
  PaymentModel,
} from "../../models";
import { AppError } from "../../utils/errors";
import {
  createOrAppendOrder,
  transitionOrderStatus,
} from "./order.service";

const router = Router();

router.use(requireAuth, requireTenant);

router.get(
  "/",
  requirePermission("orders:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const { status, orderType, search, limit = "50", page = "1" } = req.query;

      const filter: Record<string, unknown> = { restaurantId };
      if (status && typeof status === "string" && status !== "ALL") {
        if (status === "ACTIVE") {
          filter.status = { $in: ["NEW", "ACCEPTED", "PREPARING", "READY"] };
        } else {
          filter.status = status;
        }
      }
      if (orderType && typeof orderType === "string" && orderType !== "ALL") {
        filter.orderType = orderType;
      }
      if (search && typeof search === "string" && search.trim()) {
        filter.orderNumber = { $regex: search.trim(), $options: "i" };
      }

      const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
      const safePage = Math.max(1, Number(page) || 1);

      const [orders, total] = await Promise.all([
        OrderModel.find(filter)
          .sort({ createdAt: -1 })
          .skip((safePage - 1) * safeLimit)
          .limit(safeLimit)
          .lean(),
        OrderModel.countDocuments(filter),
      ]);

      return res.json({
        success: true,
        data: orders,
        meta: {
          page: safePage,
          limit: safeLimit,
          total,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  requirePermission("orders:create"),
  validateBody(createOrderSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const order = await createOrAppendOrder({
        restaurant: req.tenant!.restaurant,
        source: "STAFF_POS",
        orderType: req.body.orderType,
        tableId: req.body.tableId,
        tablePublicToken: req.body.tablePublicToken,
        appendToRunningOrderId: req.body.appendToRunningOrderId,
        customerName: req.body.customerName,
        customerPhone: req.body.customerPhone,
        marketingConsent: req.body.marketingConsent,
        customerNotes: req.body.customerNotes,
        discountPaise: req.body.discountPaise,
        idempotencyKey: req.body.idempotencyKey,
        actorUserId: String(req.user!._id),
        actorRole: req.tenant!.role,
        actorName: req.user!.name,
        items: req.body.items,
      });

      await recordAuditLog({
        restaurantId: req.tenant!.restaurantId,
        actorUserId: String(req.user!._id),
        actorEmail: req.user!.email,
        actorRole: req.tenant!.role,
        action: "ORDER_STAFF_CREATE",
        entityType: "Order",
        entityId: String(order._id),
        summary: `Staff created/updated Order ${order.orderNumber} (${order.totalPaise} paise)`,
      });

      return res.status(201).json({
        success: true,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id",
  requirePermission("orders:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const order = await OrderModel.findOne({
        _id: req.params.id,
        restaurantId,
      }).lean();

      if (!order) {
        throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
      }

      const [statusEvents, payments] = await Promise.all([
        OrderStatusEventModel.find({
          orderId: order._id,
          restaurantId,
        })
          .sort({ createdAt: 1 })
          .lean(),
        PaymentModel.find({
          orderId: order._id,
          restaurantId,
        })
          .sort({ createdAt: -1 })
          .lean(),
      ]);

      return res.json({
        success: true,
        data: {
          ...order,
          statusEvents,
          payments,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:id/status",
  requirePermission("orders:update_status"),
  validateBody(updateOrderStatusSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const updated = await transitionOrderStatus({
        restaurant: req.tenant!.restaurant,
        orderId: req.params.id,
        toStatus: req.body.status,
        note: req.body.note,
        cancelReason: req.body.cancelReason,
        reverseInventoryOnCancel: req.body.reverseInventoryOnCancel,
        actorUserId: String(req.user!._id),
        actorRole: req.tenant!.role,
        actorName: req.user!.name,
      });

      await recordAuditLog({
        restaurantId: req.tenant!.restaurantId,
        actorUserId: String(req.user!._id),
        actorEmail: req.user!.email,
        actorRole: req.tenant!.role,
        action: "ORDER_STATUS_TRANSITION",
        entityType: "Order",
        entityId: String(updated._id),
        summary: `Order ${updated.orderNumber} transitioned to ${updated.status}`,
      });

      return res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const ordersRouter = router;
