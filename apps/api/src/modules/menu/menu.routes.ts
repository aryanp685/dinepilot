import { Router, Response } from "express";
import {
  createCategorySchema,
  createMenuItemSchema,
  createModifierGroupSchema,
  updateMenuItemSchema,
} from "@dinepilot/shared";
import {
  AuthenticatedRequest,
  requireAuth,
  requirePermission,
  requireTenant,
} from "../../middleware/auth";
import { recordAuditLog, validateBody } from "../../middleware/security";
import {
  MenuCategoryModel,
  MenuItemModel,
  ModifierGroupModel,
  RecipeModel,
} from "../../models";
import { AppError } from "../../utils/errors";

const router = Router();

router.use(requireAuth, requireTenant);

router.get(
  "/",
  requirePermission("menu:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const [categories, modifierGroups, items, recipes] = await Promise.all([
        MenuCategoryModel.find({ restaurantId }).sort({ sortOrder: 1 }).lean(),
        ModifierGroupModel.find({ restaurantId }).lean(),
        MenuItemModel.find({ restaurantId }).sort({ createdAt: -1 }).lean(),
        RecipeModel.find({ restaurantId }).select("menuItemId").lean(),
      ]);

      const recipeItemSet = new Set(
        recipes.map((r) => String(r.menuItemId))
      );

      return res.json({
        success: true,
        data: {
          categories,
          modifierGroups,
          items: items.map((item) => ({
            ...item,
            hasRecipe: recipeItemSet.has(String(item._id)),
          })),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/categories",
  requirePermission("menu:write"),
  validateBody(createCategorySchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const category = await MenuCategoryModel.create({
        ...req.body,
        restaurantId: req.tenant!.restaurantId,
      });

      await recordAuditLog({
        restaurantId: req.tenant!.restaurantId,
        actorUserId: String(req.user!._id),
        actorEmail: req.user!.email,
        actorRole: req.tenant!.role,
        action: "MENU_CATEGORY_CREATE",
        entityType: "MenuCategory",
        entityId: String(category._id),
        summary: `Created menu category '${category.name}'`,
      });

      return res.status(201).json({
        success: true,
        data: category,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/categories/:id",
  requirePermission("menu:write"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const category = await MenuCategoryModel.findOneAndUpdate(
        {
          _id: req.params.id,
          restaurantId: req.tenant!.restaurantId,
        },
        { $set: req.body },
        { new: true }
      );
      if (!category) {
        throw new AppError(404, "CATEGORY_NOT_FOUND", "Menu category not found");
      }
      return res.json({
        success: true,
        data: category,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/modifiers",
  requirePermission("menu:write"),
  validateBody(createModifierGroupSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const modGroup = await ModifierGroupModel.create({
        ...req.body,
        restaurantId: req.tenant!.restaurantId,
      });
      return res.status(201).json({
        success: true,
        data: modGroup,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  requirePermission("menu:write"),
  validateBody(createMenuItemSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const category = await MenuCategoryModel.findOne({
        _id: req.body.categoryId,
        restaurantId,
      });
      if (!category) {
        throw new AppError(
          400,
          "INVALID_CATEGORY",
          "Category does not exist in this restaurant"
        );
      }

      const item = await MenuItemModel.create({
        ...req.body,
        restaurantId,
      });

      await recordAuditLog({
        restaurantId,
        actorUserId: String(req.user!._id),
        actorEmail: req.user!.email,
        actorRole: req.tenant!.role,
        action: "MENU_ITEM_CREATE",
        entityType: "MenuItem",
        entityId: String(item._id),
        summary: `Added menu item '${item.name}' at ${item.pricePaise} paise`,
      });

      return res.status(201).json({
        success: true,
        data: item,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:id",
  requirePermission("menu:write"),
  validateBody(updateMenuItemSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const item = await MenuItemModel.findOneAndUpdate(
        {
          _id: req.params.id,
          restaurantId,
        },
        { $set: req.body },
        { new: true }
      );
      if (!item) {
        throw new AppError(404, "MENU_ITEM_NOT_FOUND", "Menu item not found");
      }

      await recordAuditLog({
        restaurantId,
        actorUserId: String(req.user!._id),
        actorEmail: req.user!.email,
        actorRole: req.tenant!.role,
        action: "MENU_ITEM_UPDATE",
        entityType: "MenuItem",
        entityId: String(item._id),
        summary: `Updated menu item '${item.name}'`,
      });

      return res.json({
        success: true,
        data: item,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:id",
  requirePermission("menu:write"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const deleted = await MenuItemModel.findOneAndDelete({
        _id: req.params.id,
        restaurantId,
      });
      if (!deleted) {
        throw new AppError(404, "MENU_ITEM_NOT_FOUND", "Menu item not found");
      }

      await recordAuditLog({
        restaurantId,
        actorUserId: String(req.user!._id),
        actorEmail: req.user!.email,
        actorRole: req.tenant!.role,
        action: "MENU_ITEM_DELETE",
        entityType: "MenuItem",
        entityId: String(deleted._id),
        summary: `Deleted menu item '${deleted.name}'`,
      });

      return res.json({
        success: true,
        data: { deletedId: String(deleted._id) },
      });
    } catch (err) {
      next(err);
    }
  }
);

export const menuRouter = router;
