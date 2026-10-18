import { Router, Response } from "express";
import {
  aiInsightQuerySchema,
  aiInsightStructuredResponseSchema,
  formatINR,
} from "@dinepilot/shared";
import {
  AuthenticatedRequest,
  requireAuth,
  requirePermission,
  requireTenant,
} from "../../middleware/auth";
import { validateBody } from "../../middleware/security";
import {
  AiInsightLogModel,
  CustomerModel,
  IngredientModel,
  InventoryMovementModel,
  OrderModel,
} from "../../models";
import { computeMenuProfitabilityMatrix } from "../analytics/analytics.routes";

const router = Router();

router.use(requireAuth, requireTenant);

router.post(
  "/insights",
  requirePermission("ai_insights:read"),
  validateBody(aiInsightQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const days = req.body.dateRangeDays || 30;
      const question = (req.body.question || "").trim();

      const now = Date.now();
      const periodStart = new Date(now - days * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

      const [
        profitability,
        ingredients,
        movements,
        recentOrders,
        prevWeekOrders,
        customers,
      ] = await Promise.all([
        computeMenuProfitabilityMatrix({ restaurantId, days }),
        IngredientModel.find({ restaurantId }).lean(),
        InventoryMovementModel.find({
          restaurantId,
          createdAt: { $gte: periodStart },
        }).lean(),
        OrderModel.find({
          restaurantId,
          createdAt: { $gte: sevenDaysAgo },
        }).lean(),
        OrderModel.find({
          restaurantId,
          createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
        }).lean(),
        CustomerModel.find({ restaurantId }).lean(),
      ]);

      const topProfitDishes = [...profitability.items]
        .filter((i) => (i.estimatedGrossProfitPaise ?? 0) > 0)
        .sort(
          (a, b) =>
            (b.estimatedGrossProfitPaise ?? 0) -
            (a.estimatedGrossProfitPaise ?? 0)
        )
        .slice(0, 5);

      const marginBleeders = profitability.items.filter(
        (i) => i.quadrant === "HIGH_VOLUME_LOW_MARGIN"
      );

      const cancelledDishes = [...profitability.items]
        .filter((i) => i.cancelledUnits > 0)
        .sort((a, b) => b.cancelledUnits - a.cancelledUnits);

      const thisWeekSalesPaise = recentOrders
        .filter((o) => o.status !== "CANCELLED")
        .reduce((s, o) => s + Math.max(0, o.subtotalPaise - o.discountPaise), 0);
      const lastWeekSalesPaise = prevWeekOrders
        .filter((o) => o.status !== "CANCELLED")
        .reduce((s, o) => s + Math.max(0, o.subtotalPaise - o.discountPaise), 0);
      const weekDeltaPercent =
        lastWeekSalesPaise > 0
          ? Number(
              (
                ((thisWeekSalesPaise - lastWeekSalesPaise) /
                  lastWeekSalesPaise) *
                100
              ).toFixed(1)
            )
          : 0;

      const consumptionByIng = new Map<string, number>();
      const wasteByIng = new Map<
        string,
        { costPaise: number; qty: number; name: string; unit: string }
      >();

      for (const m of movements) {
        const ingKey = String(m.ingredientId);
        if (m.type === "RECIPE_CONSUMPTION") {
          consumptionByIng.set(
            ingKey,
            (consumptionByIng.get(ingKey) || 0) + Math.abs(m.quantityDelta)
          );
        }
        if (m.type === "WASTE" || m.type === "SPOILAGE") {
          const cur = wasteByIng.get(ingKey) || {
            costPaise: 0,
            qty: 0,
            name: m.ingredientNameSnapshot,
            unit: m.unit,
          };
          cur.costPaise += m.totalCostPaise;
          cur.qty += Math.abs(m.quantityDelta);
          wasteByIng.set(ingKey, cur);
        }
      }

      const replenishmentForecasts = ingredients
        .map((ing) => {
          const totalConsumed = consumptionByIng.get(String(ing._id)) || 0;
          const estimatedDailyBurn = Number(
            Math.max(0.1, totalConsumed / Math.max(1, days)).toFixed(2)
          );
          const estimatedDaysRemaining = Number(
            (ing.currentStock / estimatedDailyBurn).toFixed(1)
          );
          const targetSevenDayStock = Math.max(
            ing.reorderThreshold * 1.5,
            estimatedDailyBurn * 7
          );
          const suggestedOrderQty = Number(
            Math.max(0, targetSevenDayStock - ing.currentStock).toFixed(2)
          );

          return {
            ingredientId: String(ing._id),
            ingredientName: ing.name,
            unit: ing.unit,
            currentStock: ing.currentStock,
            reorderThreshold: ing.reorderThreshold,
            estimatedDailyBurn,
            estimatedDaysRemaining,
            suggestedOrderQty,
            estimatedPurchaseCostPaise: Math.round(
              suggestedOrderQty * ing.costPerUnitPaise
            ),
          };
        })
        .filter(
          (f) =>
            f.currentStock <= f.reorderThreshold ||
            f.estimatedDaysRemaining <= 7
        )
        .sort((a, b) => a.estimatedDaysRemaining - b.estimatedDaysRemaining);

      const allFeedbacks = customers.flatMap((c) => c.feedbacks || []);
      const avgRating =
        allFeedbacks.length > 0
          ? Number(
              (
                allFeedbacks.reduce((s, f) => s + f.rating, 0) /
                allFeedbacks.length
              ).toFixed(2)
            )
          : null;

      const measuredHighlights: Array<{
        id: string;
        category:
          | "PROFITABILITY"
          | "INVENTORY_REPLENISHMENT"
          | "WASTE_CONTROL"
          | "SALES_MOMENTUM"
          | "OPERATIONAL_RISK";
        severity: "HIGH" | "MEDIUM" | "INFO";
        title: string;
        measuredFact: string;
        recommendation: string;
        supportingMetricLabel: string;
        supportingMetricValue: string;
        isForecast: boolean;
      }> = [];

      if (marginBleeders.length > 0) {
        const topBleeder = marginBleeders[0];
        measuredHighlights.push({
          id: "hl-margin-bleeder",
          category: "PROFITABILITY",
          severity: "HIGH",
          title: `High-Volume Dish With Margin Compression: ${topBleeder.name}`,
          measuredFact: `${topBleeder.name} sold ${topBleeder.unitsSold} units (${formatINR(
            topBleeder.netSalesPaise
          )} net sales) at a ${
            topBleeder.grossMarginPercent ?? 0
          }% gross margin vs. menu benchmark of ${
            profitability.benchmarks.avgGrossMarginPercent
          }%.`,
          recommendation: `Audit portion ladle weight or test a +₹20 price revision on ${topBleeder.name} to recover ~4–6% gross margin without hurting demand.`,
          supportingMetricLabel: "Current Gross Margin",
          supportingMetricValue: `${topBleeder.grossMarginPercent ?? 0}%`,
          isForecast: false,
        });
      }

      if (topProfitDishes.length > 0) {
        const star = topProfitDishes[0];
        measuredHighlights.push({
          id: "hl-top-profit",
          category: "PROFITABILITY",
          severity: "INFO",
          title: `Top Profit Engine: ${star.name}`,
          measuredFact: `${star.name} generated ${formatINR(
            star.estimatedGrossProfitPaise || 0
          )} in estimated gross profit across ${star.unitsSold} servings (${
            star.grossMarginPercent
          }% margin).`,
          recommendation: `Pin ${star.name} in the 'Chef Signatures' hero banner on your QR menu to boost conversion.`,
          supportingMetricLabel: "Gross Profit Contribution",
          supportingMetricValue: formatINR(star.estimatedGrossProfitPaise || 0),
          isForecast: false,
        });
      }

      if (replenishmentForecasts.length > 0) {
        const urgent = replenishmentForecasts[0];
        measuredHighlights.push({
          id: "hl-replenish",
          category: "INVENTORY_REPLENISHMENT",
          severity: urgent.currentStock <= urgent.reorderThreshold ? "HIGH" : "MEDIUM",
          title: `Replenishment Required: ${urgent.ingredientName}`,
          measuredFact: `Measured stock is ${urgent.currentStock} ${urgent.unit} (Reorder threshold: ${urgent.reorderThreshold} ${urgent.unit}, daily burn: ${urgent.estimatedDailyBurn} ${urgent.unit}/day).`,
          recommendation: `Forecast: Stock will deplete in ~${urgent.estimatedDaysRemaining} days. Place a purchase order for ${urgent.suggestedOrderQty} ${urgent.unit} (${formatINR(
            urgent.estimatedPurchaseCostPaise
          )}).`,
          supportingMetricLabel: "Forecast Runway",
          supportingMetricValue: `${urgent.estimatedDaysRemaining} days`,
          isForecast: true,
        });
      }

      const topWaste = Array.from(wasteByIng.values()).sort(
        (a, b) => b.costPaise - a.costPaise
      )[0];
      if (topWaste) {
        measuredHighlights.push({
          id: "hl-waste-driver",
          category: "WASTE_CONTROL",
          severity: "MEDIUM",
          title: `Recurring Kitchen Waste Pattern: ${topWaste.name}`,
          measuredFact: `${topWaste.qty.toFixed(2)} ${topWaste.unit} of ${
            topWaste.name
          } was logged as waste/spoilage, costing ${formatINR(
            topWaste.costPaise
          )} in this period.`,
          recommendation: `Stagger pre-service batch prep into two smaller shifts (11:30 AM and 6:30 PM) and enforce FIFO bin labeling.`,
          supportingMetricLabel: "Measured Waste Cost",
          supportingMetricValue: formatINR(topWaste.costPaise),
          isForecast: false,
        });
      }

      measuredHighlights.push({
        id: "hl-weekly-sales",
        category: "SALES_MOMENTUM",
        severity: weekDeltaPercent < 0 ? "MEDIUM" : "INFO",
        title: "7-Day Sales Momentum & Guest Satisfaction",
        measuredFact: `Last 7 days net sales totaled ${formatINR(
          thisWeekSalesPaise
        )} (${
          weekDeltaPercent >= 0 ? `+${weekDeltaPercent}%` : `${weekDeltaPercent}%`
        } vs. prior 7 days). Guest feedback average: ${
          avgRating ? `${avgRating}/5.0` : "No ratings yet"
        }.`,
        recommendation:
          weekDeltaPercent < 0
            ? "Launch a double-points weekday lunch reward for Bronze & Silver loyalty members to lift mid-week table occupancy."
            : "Maintain kitchen prep staffing for Friday–Sunday peak dinner slots (19:30–22:00 IST).",
        supportingMetricLabel: "7-Day Net Sales",
        supportingMetricValue: formatINR(thisWeekSalesPaise),
        isForecast: false,
      });

      let directAnswer: string | undefined;
      if (question) {
        const q = question.toLowerCase();
        if (q.includes("highest gross profit") || q.includes("five dishes") || q.includes("top profit")) {
          const list = topProfitDishes
            .map(
              (d, idx) =>
                `${idx + 1}. ${d.name} (${formatINR(
                  d.estimatedGrossProfitPaise || 0
                )} gross profit, ${d.unitsSold} sold, ${d.grossMarginPercent}% margin)`
            )
            .join("; ");
          directAnswer = list
            ? `Measured Top Gross Profit Dishes (${days}d): ${list}.`
            : "No completed dish sales with configured recipes were recorded in this window.";
        } else if (q.includes("replenish") || q.includes("inventory") || q.includes("stock")) {
          const list = replenishmentForecasts
            .slice(0, 5)
            .map(
              (f) =>
                `${f.ingredientName} (${f.currentStock} ${f.unit} on hand, ~${f.estimatedDaysRemaining}d left → order ${f.suggestedOrderQty} ${f.unit})`
            )
            .join("; ");
          directAnswer = list
            ? `Ingredients needing replenishment this week: ${list}.`
            : "All tracked ingredients are currently above their 7-day replenishment safety threshold.";
        } else if (q.includes("weak margin") || q.includes("low margin") || q.includes("high sales")) {
          const list = marginBleeders
            .map(
              (d) =>
                `${d.name} (${d.unitsSold} sold at ${d.grossMarginPercent}% gross margin, ${d.foodCostPercent}% food cost)`
            )
            .join("; ");
          directAnswer = list
            ? `High-volume, low-margin ('Plowhorse') items below the ${profitability.benchmarks.avgGrossMarginPercent}% benchmark: ${list}.`
            : "No high-volume menu items are currently operating below the restaurant's average gross margin benchmark.";
        } else if (q.includes("previous week") || q.includes("compare") || q.includes("sales")) {
          directAnswer = `Measured 7-day net sales are ${formatINR(
            thisWeekSalesPaise
          )} compared with ${formatINR(
            lastWeekSalesPaise
          )} in the prior 7-day window (${
            weekDeltaPercent >= 0 ? `+${weekDeltaPercent}%` : `${weekDeltaPercent}%`
          } change).`;
        } else if (q.includes("cancel") || q.includes("return")) {
          const list = cancelledDishes
            .slice(0, 5)
            .map(
              (d) =>
                `${d.name} (${d.cancelledUnits} unit(s) cancelled, ${formatINR(
                  d.cancelledValuePaise
                )})`
            )
            .join("; ");
          directAnswer = list
            ? `Dishes with recorded cancellations in the last ${days} days: ${list}.`
            : `Zero dish cancellations were recorded in the last ${days} days.`;
        } else {
          directAnswer = `Operational Priority Summary (${days}d): 1) Replenish ${
            replenishmentForecasts.length
          } low-runway ingredient(s); 2) Optimize margin on ${
            marginBleeders.length
          } high-volume Plowhorse dish(es); 3) Control kitchen spoilage (${
            topWaste
              ? `led by ${topWaste.name} at ${formatINR(topWaste.costPaise)}`
              : "currently minimal"
          }).`;
        }
      }

      const rawOutput = {
        providerMode: "RULE_BASED_DETERMINISTIC" as const,
        generatedAt: new Date().toISOString(),
        executiveSummary: `Analyzed ${recentOrders.length} recent orders, ${profitability.items.length} menu items, and ${ingredients.length} tracked ingredients over a ${days}-day window. Identified ${replenishmentForecasts.length} replenishment alert(s) and ${marginBleeders.length} margin-optimization opportunity(ies).`,
        ...(directAnswer ? { directAnswer } : {}),
        measuredHighlights,
        replenishmentForecasts,
      };

      const validatedOutput =
        aiInsightStructuredResponseSchema.parse(rawOutput);

      await AiInsightLogModel.create({
        restaurantId,
        question: question || undefined,
        providerMode: validatedOutput.providerMode,
        responsePayload: validatedOutput,
        createdByUserId: req.user!._id,
      });

      return res.json({
        success: true,
        data: validatedOutput,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/insights/history",
  requirePermission("ai_insights:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const history = await AiInsightLogModel.find({
        restaurantId: req.tenant!.restaurantId,
      })
        .sort({ createdAt: -1 })
        .limit(15)
        .lean();

      return res.json({
        success: true,
        data: history,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const aiRouter = router;
