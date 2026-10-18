import { Router, Response } from "express";
import {
  areUnitsCompatible,
  convertUnitQuantity,
  createIngredientSchema,
  createInventoryMovementSchema,
  updateIngredientSchema,
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
  InventoryMovementModel,
  SupplierModel,
} from "../../models";
import { withResourceLock } from "../../utils/concurrency";
import { AppError } from "../../utils/errors";

const router = Router();

router.use(requireAuth, requireTenant);

router.get(
  "/suppliers",
  requirePermission("inventory:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const suppliers = await SupplierModel.find({
        restaurantId: req.tenant!.restaurantId,
      })
        .sort({ name: 1 })
        .lean();
      return res.json({
        success: true,
        data: suppliers,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/suppliers",
  requirePermission("inventory:write"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const supplier = await SupplierModel.create({
        ...req.body,
        restaurantId: req.tenant!.restaurantId,
      });
      return res.status(201).json({
        success: true,
        data: supplier,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/ingredients",
  requirePermission("inventory:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const [ingredients, suppliers] = await Promise.all([
        IngredientModel.find({ restaurantId }).sort({ name: 1 }).lean(),
        SupplierModel.find({ restaurantId }).lean(),
      ]);

      const supplierMap = new Map(
        suppliers.map((s) => [String(s._id), s.name])
      );
      const now = Date.now();

      const enriched = ingredients.map((ing) => {
        const isLowStock = ing.currentStock <= ing.reorderThreshold;
        const daysToExpiry = ing.expirationDate
          ? Math.ceil(
              (new Date(ing.expirationDate).getTime() - now) /
                (1000 * 60 * 60 * 24)
            )
          : null;
        const isExpiringSoon = daysToExpiry !== null && daysToExpiry <= 5;
        const effectiveCostPerUnitPaise = Math.round(
          ing.costPerUnitPaise /
            (Math.max(1, ing.usableYieldPercent || 100) / 100)
        );

        return {
          ...ing,
          supplierName: ing.supplierId
            ? supplierMap.get(String(ing.supplierId)) || "Direct Market"
            : "Direct Market",
          isLowStock,
          daysToExpiry,
          isExpiringSoon,
          effectiveCostPerUnitPaise,
          stockValuePaise: Math.round(ing.currentStock * ing.costPerUnitPaise),
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
  "/ingredients",
  requirePermission("inventory:write"),
  validateBody(createIngredientSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const initialStock = Number(req.body.currentStock || 0);

      const ingredient = await IngredientModel.create({
        ...req.body,
        restaurantId,
        expirationDate: req.body.expirationDate
          ? new Date(req.body.expirationDate)
          : null,
        lastUpdatedAt: new Date(),
      });

      if (initialStock > 0) {
        await InventoryMovementModel.create({
          restaurantId,
          ingredientId: ingredient._id,
          ingredientNameSnapshot: ingredient.name,
          type: "PURCHASE_RECEIVED",
          quantityDelta: initialStock,
          unit: ingredient.unit,
          previousStock: 0,
          newStock: initialStock,
          unitCostPaiseSnapshot: ingredient.costPerUnitPaise,
          totalCostPaise: Math.round(
            initialStock * ingredient.costPerUnitPaise
          ),
          reason: "Initial opening stock",
          performedByUserId: req.user!._id,
          performedByName: req.user!.name,
        });
      }

      await recordAuditLog({
        restaurantId,
        actorUserId: String(req.user!._id),
        actorEmail: req.user!.email,
        actorRole: req.tenant!.role,
        action: "INGREDIENT_CREATE",
        entityType: "Ingredient",
        entityId: String(ingredient._id),
        summary: `Created ingredient '${ingredient.name}' (${ingredient.unit})`,
      });

      return res.status(201).json({
        success: true,
        data: ingredient,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/ingredients/:id",
  requirePermission("inventory:write"),
  validateBody(updateIngredientSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const existing = await IngredientModel.findOne({
        _id: req.params.id,
        restaurantId,
      });
      if (!existing) {
        throw new AppError(404, "INGREDIENT_NOT_FOUND", "Ingredient not found");
      }

      if (
        req.body.unit &&
        req.body.unit !== existing.unit &&
        !areUnitsCompatible(existing.unit, req.body.unit)
      ) {
        throw new AppError(
          400,
          "INVALID_UNIT_CONVERSION",
          `Cannot change ingredient unit from ${existing.unit} to incompatible unit ${req.body.unit}`
        );
      }

      const { currentStock: _ignoredDirectStock, ...safeUpdates } = req.body;

      const updated = await IngredientModel.findOneAndUpdate(
        { _id: req.params.id, restaurantId },
        {
          $set: {
            ...safeUpdates,
            ...(req.body.expirationDate !== undefined
              ? {
                  expirationDate: req.body.expirationDate
                    ? new Date(req.body.expirationDate)
                    : null,
                }
              : {}),
            lastUpdatedAt: new Date(),
          },
        },
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

router.get(
  "/movements",
  requirePermission("inventory:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const { ingredientId, type, limit = "50" } = req.query;
      const filter: Record<string, unknown> = { restaurantId };
      if (ingredientId && typeof ingredientId === "string") {
        filter.ingredientId = ingredientId;
      }
      if (type && typeof type === "string" && type !== "ALL") {
        filter.type = type;
      }

      const movements = await InventoryMovementModel.find(filter)
        .sort({ createdAt: -1 })
        .limit(Math.min(100, Number(limit) || 50))
        .lean();

      return res.json({
        success: true,
        data: movements,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/movements",
  requirePermission("inventory:write"),
  validateBody(createInventoryMovementSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const {
        ingredientId,
        type,
        quantity,
        unit,
        unitCostPaise,
        reason,
        idempotencyKey,
      } = req.body;

      const result = await withResourceLock(
        `inventory:${ingredientId}`,
        async () => {
          if (idempotencyKey) {
            const existingMove = await InventoryMovementModel.findOne({
              restaurantId,
              idempotencyKey,
            });
            if (existingMove) {
              const ing = await IngredientModel.findById(ingredientId);
              return { movement: existingMove, ingredient: ing };
            }
          }

          const ingredient = await IngredientModel.findOne({
            _id: ingredientId,
            restaurantId,
          });
          if (!ingredient) {
            throw new AppError(
              404,
              "INGREDIENT_NOT_FOUND",
              "Ingredient not found in this restaurant"
            );
          }

          const targetUnit = unit || ingredient.unit;
          let qtyInStockUnit: number;
          try {
            qtyInStockUnit = convertUnitQuantity(
              quantity,
              targetUnit,
              ingredient.unit
            );
          } catch (e) {
            throw new AppError(
              400,
              "INVALID_UNIT_CONVERSION",
              e instanceof Error ? e.message : "Incompatible unit conversion"
            );
          }

          const isAddition =
            type === "PURCHASE_RECEIVED" || type === "RETURN_REVERSAL";
          const signedDelta = isAddition ? qtyInStockUnit : -qtyInStockUnit;

          const previousStock = ingredient.currentStock;
          const newStock = Number((previousStock + signedDelta).toFixed(4));
          if (newStock < 0) {
            throw new AppError(
              400,
              "INSUFFICIENT_STOCK",
              `Cannot deduct ${qtyInStockUnit} ${ingredient.unit} of ${ingredient.name} (Available: ${previousStock} ${ingredient.unit})`
            );
          }

          if (type === "PURCHASE_RECEIVED" && unitCostPaise !== undefined) {
            ingredient.costPerUnitPaise = unitCostPaise;
          }
          ingredient.currentStock = newStock;
          ingredient.lastUpdatedAt = new Date();
          await ingredient.save();

          const effectiveUnitCost =
            unitCostPaise ?? ingredient.costPerUnitPaise;
          const totalCostPaise = Math.round(
            Math.abs(signedDelta) * effectiveUnitCost
          );

          const movement = await InventoryMovementModel.create({
            restaurantId,
            ingredientId: ingredient._id,
            ingredientNameSnapshot: ingredient.name,
            type,
            quantityDelta: signedDelta,
            unit: ingredient.unit,
            previousStock,
            newStock,
            unitCostPaiseSnapshot: effectiveUnitCost,
            totalCostPaise,
            idempotencyKey,
            reason,
            performedByUserId: req.user!._id,
            performedByName: req.user!.name,
          });

          return { movement, ingredient };
        }
      );

      await recordAuditLog({
        restaurantId,
        actorUserId: String(req.user!._id),
        actorEmail: req.user!.email,
        actorRole: req.tenant!.role,
        action: "INVENTORY_MOVEMENT_RECORD",
        entityType: "InventoryMovement",
        entityId: String(result.movement._id),
        summary: `${type}: ${result.movement.quantityDelta} ${result.movement.unit} of ${result.movement.ingredientNameSnapshot}`,
      });

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/alerts",
  requirePermission("inventory:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const ingredients = await IngredientModel.find({ restaurantId }).lean();
      const now = Date.now();

      const lowStockAlerts = ingredients
        .filter((i) => i.currentStock <= i.reorderThreshold)
        .map((i) => {
          const suggestedOrderQty = Math.max(
            i.reorderThreshold * 2 - i.currentStock,
            i.reorderThreshold
          );
          return {
            ingredientId: String(i._id),
            name: i.name,
            unit: i.unit,
            currentStock: i.currentStock,
            reorderThreshold: i.reorderThreshold,
            suggestedOrderQty: Number(suggestedOrderQty.toFixed(2)),
            estimatedReplenishmentCostPaise: Math.round(
              suggestedOrderQty * i.costPerUnitPaise
            ),
            explanation: `Current on-hand stock (${i.currentStock} ${i.unit}) is at or below reorder threshold (${i.reorderThreshold} ${i.unit}). Recommended order restores a 2x safety buffer.`,
          };
        });

      const expiringAlerts = ingredients
        .filter((i) => {
          if (!i.expirationDate) return false;
          const days =
            (new Date(i.expirationDate).getTime() - now) /
            (1000 * 60 * 60 * 24);
          return days <= 7;
        })
        .map((i) => {
          const daysRemaining = Math.ceil(
            (new Date(i.expirationDate!).getTime() - now) /
              (1000 * 60 * 60 * 24)
          );
          return {
            ingredientId: String(i._id),
            name: i.name,
            unit: i.unit,
            currentStock: i.currentStock,
            expirationDate: i.expirationDate,
            daysRemaining,
            atRiskValuePaise: Math.round(i.currentStock * i.costPerUnitPaise),
            explanation:
              daysRemaining <= 0
                ? `${i.name} has expired. Inspect immediately and log spoilage if unusable.`
                : `${i.name} expires in ${daysRemaining} day(s). Prioritize in daily prep or chef specials to avoid spoilage.`,
          };
        });

      return res.json({
        success: true,
        data: {
          lowStockAlerts,
          expiringAlerts,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/waste-report",
  requirePermission("inventory:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const wasteMovements = await InventoryMovementModel.find({
        restaurantId,
        type: { $in: ["WASTE", "SPOILAGE"] },
      })
        .sort({ createdAt: -1 })
        .lean();

      const totalWasteCostPaise = wasteMovements.reduce(
        (sum, m) => sum + (m.totalCostPaise || 0),
        0
      );

      const byIngredientMap = new Map<
        string,
        {
          ingredientId: string;
          name: string;
          unit: string;
          totalQuantityWasted: number;
          totalWasteCostPaise: number;
          occurrences: number;
          reasons: string[];
        }
      >();

      const byDayMap = new Map<string, number>();

      for (const m of wasteMovements) {
        const key = String(m.ingredientId);
        const cur = byIngredientMap.get(key) || {
          ingredientId: key,
          name: m.ingredientNameSnapshot,
          unit: m.unit,
          totalQuantityWasted: 0,
          totalWasteCostPaise: 0,
          occurrences: 0,
          reasons: [],
        };
        cur.totalQuantityWasted = Number(
          (cur.totalQuantityWasted + Math.abs(m.quantityDelta)).toFixed(3)
        );
        cur.totalWasteCostPaise += m.totalCostPaise;
        cur.occurrences += 1;
        if (m.reason && cur.reasons.length < 3 && !cur.reasons.includes(m.reason)) {
          cur.reasons.push(m.reason);
        }
        byIngredientMap.set(key, cur);

        const dayKey = new Date(m.createdAt).toISOString().slice(0, 10);
        byDayMap.set(dayKey, (byDayMap.get(dayKey) || 0) + m.totalCostPaise);
      }

      const topWastedIngredients = Array.from(byIngredientMap.values())
        .sort((a, b) => b.totalWasteCostPaise - a.totalWasteCostPaise)
        .map((item) => ({
          ...item,
          recommendation: `Logged ${item.occurrences} waste/spoilage event(s) (${item.totalQuantityWasted} ${item.unit}). Primary driver: ${
            item.reasons[0] || "Prep trim / spoilage"
          }. Adjust par-prep batch size by 15% during off-peak shifts.`,
        }));

      const wasteTrends = Array.from(byDayMap.entries())
        .map(([date, wasteCostPaise]) => ({ date, wasteCostPaise }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return res.json({
        success: true,
        data: {
          totalWasteCostPaise,
          totalWasteEvents: wasteMovements.length,
          topWastedIngredients,
          wasteTrends,
          recentEvents: wasteMovements.slice(0, 20),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export const inventoryRouter = router;
