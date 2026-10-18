import { Router, Response } from "express";
import {
  AuthenticatedRequest,
  requireAuth,
  requirePlatformAdmin,
} from "../../middleware/auth";
import { recordAuditLog } from "../../middleware/security";
import {
  AuditLogModel,
  OrderModel,
  RestaurantModel,
  SubscriptionModel,
  UserModel,
} from "../../models";
import { AppError } from "../../utils/errors";

const router = Router();

router.use(requireAuth, requirePlatformAdmin);

router.get(
  "/overview",
  async (_req: AuthenticatedRequest, res: Response, next) => {
    try {
      const [
        totalRestaurants,
        totalUsers,
        totalOrders,
        subscriptions,
        recentAuditLogs,
      ] = await Promise.all([
        RestaurantModel.countDocuments(),
        UserModel.countDocuments(),
        OrderModel.countDocuments(),
        SubscriptionModel.find().lean(),
        AuditLogModel.find().sort({ createdAt: -1 }).limit(15).lean(),
      ]);

      const mrrPaise = subscriptions
        .filter((s) => s.status === "ACTIVE")
        .reduce((sum, s) => sum + (s.pricePaise || 0), 0);

      return res.json({
        success: true,
        data: {
          totalRestaurants,
          totalUsers,
          totalOrders,
          activeSubscriptions: subscriptions.filter(
            (s) => s.status === "ACTIVE"
          ).length,
          mrrPaise,
          recentAuditLogs,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/restaurants",
  async (_req: AuthenticatedRequest, res: Response, next) => {
    try {
      const [restaurants, subscriptions] = await Promise.all([
        RestaurantModel.find().sort({ createdAt: -1 }).lean(),
        SubscriptionModel.find().lean(),
      ]);

      const subMap = new Map(
        subscriptions.map((s) => [String(s.restaurantId), s])
      );

      return res.json({
        success: true,
        data: restaurants.map((r) => ({
          ...r,
          subscription: subMap.get(String(r._id)) || null,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/restaurants/:id/status",
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const updated = await RestaurantModel.findByIdAndUpdate(
        req.params.id,
        { $set: { isActive: Boolean(req.body.isActive) } },
        { new: true }
      );
      if (!updated) {
        throw new AppError(404, "RESTAURANT_NOT_FOUND", "Restaurant not found");
      }

      await recordAuditLog({
        restaurantId: String(updated._id),
        actorUserId: String(req.user!._id),
        actorEmail: req.user!.email,
        actorRole: "PLATFORM_ADMIN",
        action: "PLATFORM_RESTAURANT_STATUS",
        entityType: "Restaurant",
        entityId: String(updated._id),
        summary: `Platform admin set restaurant '${updated.name}' active=${updated.isActive}`,
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

router.get(
  "/users",
  async (_req: AuthenticatedRequest, res: Response, next) => {
    try {
      const users = await UserModel.find()
        .select("-passwordHash -passwordResetTokenHash")
        .sort({ createdAt: -1 })
        .lean();

      return res.json({
        success: true,
        data: users,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/users/:id/status",
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const updated = await UserModel.findByIdAndUpdate(
        req.params.id,
        { $set: { isActive: Boolean(req.body.isActive) } },
        { new: true }
      ).select("-passwordHash");

      if (!updated) {
        throw new AppError(404, "USER_NOT_FOUND", "User not found");
      }

      return res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/subscriptions",
  async (_req: AuthenticatedRequest, res: Response, next) => {
    try {
      const [subscriptions, restaurants] = await Promise.all([
        SubscriptionModel.find().sort({ createdAt: -1 }).lean(),
        RestaurantModel.find().select("_id name slug city").lean(),
      ]);

      const restMap = new Map(restaurants.map((r) => [String(r._id), r]));

      return res.json({
        success: true,
        data: subscriptions.map((s) => ({
          ...s,
          restaurant: restMap.get(String(s.restaurantId)) || null,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/audit-logs",
  async (_req: AuthenticatedRequest, res: Response, next) => {
    try {
      const logs = await AuditLogModel.find()
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      return res.json({
        success: true,
        data: logs,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const platformRouter = router;
