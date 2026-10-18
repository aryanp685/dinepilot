import { Router, Response } from "express";
import {
  updateRestaurantSchema,
  updateRestaurantSettingsSchema,
  updateSubscriptionSchema,
} from "@dinepilot/shared";
import {
  AuthenticatedRequest,
  requireAuth,
  requirePermission,
  requireTenant,
} from "../../middleware/auth";
import { recordAuditLog, validateBody } from "../../middleware/security";
import {
  NotificationModel,
  RestaurantModel,
  SubscriptionModel,
} from "../../models";
import { AppError } from "../../utils/errors";

const router = Router();

router.use(requireAuth, requireTenant);

router.get(
  "/",
  requirePermission("overview:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurant = req.tenant!.restaurant;
      const subscription = await SubscriptionModel.findOne({
        restaurantId: restaurant._id,
      });

      return res.json({
        success: true,
        data: {
          restaurant,
          subscription,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/",
  requirePermission("settings:write"),
  validateBody(updateRestaurantSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const updated = await RestaurantModel.findOneAndUpdate(
        { _id: req.tenant!.restaurantId },
        { $set: req.body },
        { new: true }
      );
      if (!updated) {
        throw new AppError(404, "RESTAURANT_NOT_FOUND", "Restaurant not found");
      }

      await recordAuditLog({
        restaurantId: req.tenant!.restaurantId,
        actorUserId: String(req.user!._id),
        actorEmail: req.user!.email,
        actorRole: req.tenant!.role,
        action: "RESTAURANT_UPDATE",
        entityType: "Restaurant",
        entityId: req.tenant!.restaurantId,
        summary: `Updated restaurant profile for ${updated.name}`,
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
  "/settings",
  requirePermission("settings:read"),
  async (req: AuthenticatedRequest, res: Response) => {
    return res.json({
      success: true,
      data: req.tenant!.restaurant.settings,
    });
  }
);

router.patch(
  "/settings",
  requirePermission("settings:write"),
  validateBody(updateRestaurantSettingsSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurant = await RestaurantModel.findById(
        req.tenant!.restaurantId
      );
      if (!restaurant) {
        throw new AppError(404, "RESTAURANT_NOT_FOUND", "Restaurant not found");
      }

      restaurant.settings = {
        ...restaurant.settings,
        ...req.body,
      };
      await restaurant.save();

      await recordAuditLog({
        restaurantId: req.tenant!.restaurantId,
        actorUserId: String(req.user!._id),
        actorEmail: req.user!.email,
        actorRole: req.tenant!.role,
        action: "RESTAURANT_SETTINGS_UPDATE",
        entityType: "Restaurant",
        entityId: req.tenant!.restaurantId,
        summary: `Updated restaurant tax & operational settings`,
        metadata: req.body,
      });

      return res.json({
        success: true,
        data: restaurant.settings,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/subscription",
  requirePermission("billing:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      let sub = await SubscriptionModel.findOne({
        restaurantId: req.tenant!.restaurantId,
      });
      if (!sub) {
        sub = await SubscriptionModel.create({
          restaurantId: req.tenant!.restaurantId,
          plan: "GROWTH",
          status: "ACTIVE",
          pricePaise: 249900,
          billingCycle: "MONTHLY",
        });
      }
      return res.json({
        success: true,
        data: sub,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/subscription",
  requirePermission("billing:write"),
  validateBody(updateSubscriptionSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const planPricing: Record<
        "STARTER" | "GROWTH" | "SCALE",
        {
          pricePaise: number;
          entitlements: {
            aiCopilot: boolean;
            multiKot: boolean;
            loyaltyEngine: boolean;
            maxTables: number;
          };
        }
      > = {
        STARTER: {
          pricePaise: 99900,
          entitlements: {
            aiCopilot: false,
            multiKot: true,
            loyaltyEngine: false,
            maxTables: 15,
          },
        },
        GROWTH: {
          pricePaise: 249900,
          entitlements: {
            aiCopilot: true,
            multiKot: true,
            loyaltyEngine: true,
            maxTables: 50,
          },
        },
        SCALE: {
          pricePaise: 499900,
          entitlements: {
            aiCopilot: true,
            multiKot: true,
            loyaltyEngine: true,
            maxTables: 200,
          },
        },
      };

      const selected = planPricing[req.body.plan as "STARTER" | "GROWTH" | "SCALE"];
      const sub = await SubscriptionModel.findOneAndUpdate(
        { restaurantId: req.tenant!.restaurantId },
        {
          $set: {
            plan: req.body.plan,
            pricePaise: selected.pricePaise,
            entitlements: selected.entitlements,
            status: "ACTIVE",
          },
        },
        { new: true, upsert: true }
      );

      await recordAuditLog({
        restaurantId: req.tenant!.restaurantId,
        actorUserId: String(req.user!._id),
        actorEmail: req.user!.email,
        actorRole: req.tenant!.role,
        action: "SUBSCRIPTION_PLAN_CHANGE",
        entityType: "Subscription",
        entityId: String(sub._id),
        summary: `Updated subscription plan to ${req.body.plan}`,
      });

      return res.json({
        success: true,
        data: sub,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/notifications",
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const notifications = await NotificationModel.find({
        restaurantId: req.tenant!.restaurantId,
      })
        .sort({ createdAt: -1 })
        .limit(40)
        .lean();

      return res.json({
        success: true,
        data: notifications,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/notifications/:id/read",
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const updated = await NotificationModel.findOneAndUpdate(
        {
          _id: req.params.id,
          restaurantId: req.tenant!.restaurantId,
        },
        { $set: { isRead: true } },
        { new: true }
      );
      return res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const restaurantRouter = router;
