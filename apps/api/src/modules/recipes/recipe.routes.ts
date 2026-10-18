import { Router, Response } from "express";
import {
  areUnitsCompatible,
  calculateComponentCostPaise,
  calculateRecipeMetrics,
  createRecipeSchema,
} from "@dinepilot/shared";
import {
  AuthenticatedRequest,
  requireAuth,
  requirePermission,
  requireTenant,
} from "../../middleware/auth";
import { recordAuditLog, validateBody } from "../../middleware/security";
import {
  IngredientModel,
  MenuItemModel,
  RecipeModel,
} from "../../models";
import { AppError } from "../../utils/errors";

const router = Router();

router.use(requireAuth, requireTenant);

export async function computeEnrichedRecipesForRestaurant(
  restaurantId: string
) {
  const [recipes, menuItems, ingredients] = await Promise.all([
    RecipeModel.find({ restaurantId }).lean(),
    MenuItemModel.find({ restaurantId }).lean(),
    IngredientModel.find({ restaurantId }).lean(),
  ]);

  const itemMap = new Map(menuItems.map((m) => [String(m._id), m]));
  const ingMap = new Map(ingredients.map((i) => [String(i._id), i]));

  return recipes
    .map((recipe) => {
      const menuItem = itemMap.get(String(recipe.menuItemId));
      if (!menuItem) return null;

      let totalBatchIngredientCostPaise = 0;
      const detailedComponents = recipe.components.map((comp) => {
        const ing = ingMap.get(String(comp.ingredientId));
        if (!ing) {
          return {
            ingredientId: String(comp.ingredientId),
            ingredientName: "Missing Ingredient",
            quantity: comp.quantity,
            unit: comp.unit,
            stockUnit: comp.unit,
            usableYieldPercent: 100,
            rawCostPaise: 0,
            yieldAdjustedCostPaise: 0,
            notes: comp.notes || "",
          };
        }

        const costBreakdown = calculateComponentCostPaise({
          quantity: comp.quantity,
          recipeUnit: comp.unit,
          ingredientStockUnit: ing.unit,
          ingredientCostPerStockUnitPaise: ing.costPerUnitPaise,
          usableYieldPercent: ing.usableYieldPercent,
        });

        totalBatchIngredientCostPaise += costBreakdown.yieldAdjustedCostPaise;

        return {
          ingredientId: String(ing._id),
          ingredientName: ing.name,
          quantity: comp.quantity,
          unit: comp.unit,
          stockUnit: ing.unit,
          usableYieldPercent: ing.usableYieldPercent,
          rawCostPaise: costBreakdown.rawCostPaise,
          yieldAdjustedCostPaise: costBreakdown.yieldAdjustedCostPaise,
          notes: comp.notes || "",
        };
      });

      const yieldServings = Math.max(1, recipe.yieldServings || 1);
      const ingredientCostPerServingPaise = Math.round(
        totalBatchIngredientCostPaise / yieldServings
      );

      const metrics = calculateRecipeMetrics({
        sellingPricePaise: menuItem.pricePaise,
        ingredientCostPerServingPaise,
        packagingCostPaise: menuItem.packagingCostPaise || 0,
      });

      return {
        id: String(recipe._id),
        menuItemId: String(menuItem._id),
        menuItemName: menuItem.name,
        dietaryType: menuItem.dietaryType,
        yieldServings,
        prepInstructions: recipe.prepInstructions,
        components: detailedComponents,
        ...metrics,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
}

router.get(
  "/",
  requirePermission("recipes:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const enriched = await computeEnrichedRecipesForRestaurant(
        req.tenant!.restaurantId
      );
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
  requirePermission("recipes:write"),
  validateBody(createRecipeSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const { menuItemId, yieldServings, prepInstructions, components } =
        req.body;

      const menuItem = await MenuItemModel.findOne({
        _id: menuItemId,
        restaurantId,
      });
      if (!menuItem) {
        throw new AppError(
          404,
          "MENU_ITEM_NOT_FOUND",
          "Menu item not found in this restaurant"
        );
      }

      const ingIds = components.map(
        (c: { ingredientId: string }) => c.ingredientId
      );
      const dbIngs = await IngredientModel.find({
        _id: { $in: ingIds },
        restaurantId,
      });
      const ingMap = new Map(dbIngs.map((i) => [String(i._id), i]));

      for (const comp of components) {
        const ing = ingMap.get(String(comp.ingredientId));
        if (!ing) {
          throw new AppError(
            400,
            "INVALID_INGREDIENT",
            `Ingredient ${comp.ingredientId} does not belong to this restaurant`
          );
        }
        if (!areUnitsCompatible(comp.unit, ing.unit)) {
          throw new AppError(
            400,
            "INVALID_UNIT_CONVERSION",
            `Cannot use '${comp.unit}' in recipe for '${ing.name}' which is tracked in '${ing.unit}'`
          );
        }
      }

      const recipe = await RecipeModel.findOneAndUpdate(
        { restaurantId, menuItemId },
        {
          $set: {
            yieldServings: yieldServings || 1,
            prepInstructions: prepInstructions || "",
            components,
          },
        },
        { new: true, upsert: true }
      );

      await recordAuditLog({
        restaurantId,
        actorUserId: String(req.user!._id),
        actorEmail: req.user!.email,
        actorRole: req.tenant!.role,
        action: "RECIPE_UPSERT",
        entityType: "Recipe",
        entityId: String(recipe._id),
        summary: `Configured recipe for '${menuItem.name}' (${components.length} ingredients)`,
      });

      const allEnriched = await computeEnrichedRecipesForRestaurant(
        restaurantId
      );
      const currentEnriched = allEnriched.find(
        (r) => r.menuItemId === String(menuItemId)
      );

      return res.status(201).json({
        success: true,
        data: currentEnriched || recipe,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:id",
  requirePermission("recipes:write"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const existing = await RecipeModel.findOne({
        _id: req.params.id,
        restaurantId,
      });
      if (!existing) {
        throw new AppError(404, "RECIPE_NOT_FOUND", "Recipe not found");
      }

      if (req.body.components) {
        const ingIds = req.body.components.map(
          (c: { ingredientId: string }) => c.ingredientId
        );
        const dbIngs = await IngredientModel.find({
          _id: { $in: ingIds },
          restaurantId,
        });
        const ingMap = new Map(dbIngs.map((i) => [String(i._id), i]));

        for (const comp of req.body.components) {
          const ing = ingMap.get(String(comp.ingredientId));
          if (!ing) {
            throw new AppError(
              400,
              "INVALID_INGREDIENT",
              "Invalid ingredient reference"
            );
          }
          if (!areUnitsCompatible(comp.unit, ing.unit)) {
            throw new AppError(
              400,
              "INVALID_UNIT_CONVERSION",
              `Incompatible unit ${comp.unit} for ingredient ${ing.name} (${ing.unit})`
            );
          }
        }
      }

      await RecipeModel.findOneAndUpdate(
        { _id: req.params.id, restaurantId },
        { $set: req.body },
        { new: true }
      );

      const allEnriched = await computeEnrichedRecipesForRestaurant(
        restaurantId
      );
      const updated = allEnriched.find((r) => r.id === req.params.id);

      return res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const recipesRouter = router;
