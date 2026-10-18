import { Router, Response } from "express";
import crypto from "crypto";
import {
  ACTIVE_ORDER_STATUSES,
  createTableSchema,
} from "@dinepilot/shared";
import {
  AuthenticatedRequest,
  requireAuth,
  requirePermission,
  requireTenant,
} from "../../middleware/auth";
import { recordAuditLog, validateBody } from "../../middleware/security";
import { OrderModel, RestaurantTableModel } from "../../models";
import { AppError } from "../../utils/errors";

const router = Router();

router.use(requireAuth, requireTenant);

router.get(
  "/",
  requirePermission("tables:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const slug = req.tenant!.restaurant.slug;

      const [tables, activeOrders] = await Promise.all([
        RestaurantTableModel.find({ restaurantId }).sort({ label: 1 }).lean(),
        OrderModel.find({
          restaurantId,
          status: { $in: ACTIVE_ORDER_STATUSES },
          tableId: { $ne: null },
        }).lean(),
      ]);

      const activeOrderByTable = new Map(
        activeOrders.map((o) => [String(o.tableId), o])
      );

      const enriched = tables.map((table) => {
        const activeOrder = activeOrderByTable.get(String(table._id)) || null;
        return {
          ...table,
          isOccupied: Boolean(activeOrder),
          activeOrderSummary: activeOrder
            ? {
                id: String(activeOrder._id),
                orderNumber: activeOrder.orderNumber,
                status: activeOrder.status,
                totalPaise: activeOrder.totalPaise,
                kotCount: activeOrder.kotBatches?.length || 1,
                createdAt: activeOrder.createdAt,
              }
            : null,
          qrPath: `/menu/${slug}?table=${table.publicToken}`,
        };
      });

      return res.json({
        success: true,
        data: enriched,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  requirePermission("tables:write"),
  validateBody(createTableSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const existing = await RestaurantTableModel.findOne({
        restaurantId,
        label: req.body.label,
      });
      if (existing) {
        throw new AppError(
          409,
          "TABLE_LABEL_EXISTS",
          `Table '${req.body.label}' already exists`
        );
      }

      const table = await RestaurantTableModel.create({
        restaurantId,
        label: req.body.label,
        zone: req.body.zone || "Main Dining",
        capacity: req.body.capacity || 4,
        publicToken: `tbl_${crypto.randomBytes(12).toString("hex")}`,
        sessionPin: String(Math.floor(1000 + Math.random() * 9000)),
        isActive: req.body.isActive ?? true,
      });

      await recordAuditLog({
        restaurantId,
        actorUserId: String(req.user!._id),
        actorEmail: req.user!.email,
        actorRole: req.tenant!.role,
        action: "TABLE_CREATE",
        entityType: "RestaurantTable",
        entityId: String(table._id),
        summary: `Created table ${table.label} (${table.capacity} seats)`,
      });

      return res.status(201).json({
        success: true,
        data: table,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:id",
  requirePermission("tables:write"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const updates: Record<string, unknown> = {};
      if (req.body.label !== undefined) updates.label = req.body.label;
      if (req.body.zone !== undefined) updates.zone = req.body.zone;
      if (req.body.capacity !== undefined)
        updates.capacity = Number(req.body.capacity);
      if (req.body.isActive !== undefined)
        updates.isActive = Boolean(req.body.isActive);
      if (req.body.rotateToken === true) {
        updates.publicToken = `tbl_${crypto.randomBytes(12).toString("hex")}`;
        updates.sessionPin = String(Math.floor(1000 + Math.random() * 9000));
      }

      const table = await RestaurantTableModel.findOneAndUpdate(
        { _id: req.params.id, restaurantId },
        { $set: updates },
        { new: true }
      );
      if (!table) {
        throw new AppError(404, "TABLE_NOT_FOUND", "Table not found");
      }

      return res.json({
        success: true,
        data: table,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const tablesRouter = router;
