import { Router, Response } from "express";
import { MenuQuadrantType } from "@dinepilot/shared";
import {
  AuthenticatedRequest,
  requireAuth,
  requirePermission,
  requireTenant,
} from "../../middleware/auth";
import {
  CustomerModel,
  InventoryMovementModel,
  MenuCategoryModel,
  MenuItemModel,
  OrderModel,
  ReportJobModel,
} from "../../models";
import { computeEnrichedRecipesForRestaurant } from "../recipes/recipe.routes";

const router = Router();

router.use(requireAuth, requireTenant);

export async function computeMenuProfitabilityMatrix(params: {
  restaurantId: string;
  days?: number;
  categoryId?: string;
  orderType?: string;
  menuItemId?: string;
}) {
  const days = Math.min(365, Math.max(1, Number(params.days || 30)));
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const orderFilter: Record<string, unknown> = {
    restaurantId: params.restaurantId,
    createdAt: { $gte: startDate },
  };
  if (params.orderType && params.orderType !== "ALL") {
    orderFilter.orderType = params.orderType;
  }

  const [menuItems, categories, enrichedRecipes, orders] = await Promise.all([
    MenuItemModel.find({
      restaurantId: params.restaurantId,
      ...(params.categoryId && params.categoryId !== "ALL"
        ? { categoryId: params.categoryId }
        : {}),
      ...(params.menuItemId && params.menuItemId !== "ALL"
        ? { _id: params.menuItemId }
        : {}),
    }).lean(),
    MenuCategoryModel.find({ restaurantId: params.restaurantId }).lean(),
    computeEnrichedRecipesForRestaurant(params.restaurantId),
    OrderModel.find(orderFilter).lean(),
  ]);

  const categoryMap = new Map(categories.map((c) => [String(c._id), c.name]));
  const recipeMap = new Map(enrichedRecipes.map((r) => [r.menuItemId, r]));

  const statsMap = new Map<
    string,
    {
      unitsSold: number;
      grossSalesPaise: number;
      allocatedDiscountPaise: number;
      cancelledUnits: number;
      cancelledValuePaise: number;
    }
  >();

  let totalUnitsAllItems = 0;

  for (const order of orders) {
    const isCancelledOrRefunded =
      order.status === "CANCELLED" || order.paymentStatus === "REFUNDED";

    const orderSubtotal = Math.max(1, order.subtotalPaise || 1);

    for (const line of order.items) {
      const id = String(line.menuItemId);
      const cur = statsMap.get(id) || {
        unitsSold: 0,
        grossSalesPaise: 0,
        allocatedDiscountPaise: 0,
        cancelledUnits: 0,
        cancelledValuePaise: 0,
      };

      if (isCancelledOrRefunded) {
        cur.cancelledUnits += line.quantity;
        cur.cancelledValuePaise += line.lineSubtotalPaise;
      } else {
        cur.unitsSold += line.quantity;
        cur.grossSalesPaise += line.lineSubtotalPaise;
        const lineDiscountShare = Math.round(
          ((order.discountPaise || 0) * line.lineSubtotalPaise) / orderSubtotal
        );
        cur.allocatedDiscountPaise += lineDiscountShare;
        totalUnitsAllItems += line.quantity;
      }

      statsMap.set(id, cur);
    }
  }

  const rawRows = menuItems.map((item) => {
    const itemId = String(item._id);
    const stat = statsMap.get(itemId) || {
      unitsSold: 0,
      grossSalesPaise: 0,
      allocatedDiscountPaise: 0,
      cancelledUnits: 0,
      cancelledValuePaise: 0,
    };
    const recipe = recipeMap.get(itemId);
    const hasRecipe = Boolean(recipe);

    const unitIngredientCostPaise = recipe
      ? recipe.ingredientCostPerServingPaise
      : null;
    const unitPackagingCostPaise = item.packagingCostPaise || 0;

    const netSalesPaise = Math.max(
      0,
      stat.grossSalesPaise - stat.allocatedDiscountPaise
    );
    const totalIngredientCostPaise =
      unitIngredientCostPaise !== null
        ? unitIngredientCostPaise * stat.unitsSold
        : null;
    const totalPackagingCostPaise = unitPackagingCostPaise * stat.unitsSold;

    const estimatedGrossProfitPaise =
      totalIngredientCostPaise !== null
        ? netSalesPaise - totalIngredientCostPaise - totalPackagingCostPaise
        : null;

    const grossMarginPercent =
      estimatedGrossProfitPaise !== null && netSalesPaise > 0
        ? Number(((estimatedGrossProfitPaise / netSalesPaise) * 100).toFixed(2))
        : recipe
        ? recipe.grossMarginPercentage
        : null;

    const foodCostPercent = recipe ? recipe.foodCostPercentage : null;

    const popularitySharePercent =
      totalUnitsAllItems > 0
        ? Number(((stat.unitsSold / totalUnitsAllItems) * 100).toFixed(2))
        : 0;

    return {
      menuItemId: itemId,
      name: item.name,
      categoryId: String(item.categoryId),
      categoryName: categoryMap.get(String(item.categoryId)) || "Uncategorized",
      dietaryType: item.dietaryType,
      sellingPricePaise: item.pricePaise,
      hasRecipe,
      unitIngredientCostPaise,
      unitPackagingCostPaise,
      unitsSold: stat.unitsSold,
      cancelledUnits: stat.cancelledUnits,
      cancelledValuePaise: stat.cancelledValuePaise,
      grossSalesPaise: stat.grossSalesPaise,
      discountsPaise: stat.allocatedDiscountPaise,
      netSalesPaise,
      totalIngredientCostPaise,
      estimatedGrossProfitPaise,
      grossMarginPercent,
      foodCostPercent,
      popularitySharePercent,
    };
  });

  const avgUnitsSold =
    rawRows.length > 0
      ? rawRows.reduce((s, r) => s + r.unitsSold, 0) / rawRows.length
      : 0;

  const rowsWithMargin = rawRows.filter((r) => r.grossMarginPercent !== null);
  const avgGrossMarginPercent =
    rowsWithMargin.length > 0
      ? rowsWithMargin.reduce((s, r) => s + (r.grossMarginPercent || 0), 0) /
        rowsWithMargin.length
      : 60;

  const classifiedItems = rawRows.map((row) => {
    const isHighVolume = row.unitsSold >= avgUnitsSold && row.unitsSold > 0;
    const isHighMargin =
      (row.grossMarginPercent ?? 0) >= avgGrossMarginPercent;

    let quadrant: MenuQuadrantType = "LOW_VOLUME_LOW_MARGIN";
    let recommendation = "";

    if (!row.hasRecipe) {
      quadrant = isHighVolume
        ? "HIGH_VOLUME_LOW_MARGIN"
        : "LOW_VOLUME_LOW_MARGIN";
      recommendation = `Recipe cost is missing for '${row.name}'. Add its ingredient recipe in /app/recipes to measure exact gross margin (${row.unitsSold} units sold in period).`;
    } else if (isHighVolume && isHighMargin) {
      quadrant = "HIGH_VOLUME_HIGH_MARGIN";
      recommendation = `Star performer (${row.unitsSold} sold, ${row.grossMarginPercent}% gross margin). Feature prominently in QR menu hero and maintain strict recipe standardization.`;
    } else if (isHighVolume && !isHighMargin) {
      quadrant = "HIGH_VOLUME_LOW_MARGIN";
      recommendation = `High demand (${row.unitsSold} sold) but below-average gross margin (${row.grossMarginPercent}%). Consider a ₹15–₹25 price adjustment, portion control, or pairing with high-margin beverages.`;
    } else if (!isHighVolume && isHighMargin) {
      quadrant = "LOW_VOLUME_HIGH_MARGIN";
      recommendation = `Strong unit margin (${row.grossMarginPercent}%) but low volume (${row.unitsSold} sold). Highlight as a 'Chef Recommended' badge or include in combo/thali upsells.`;
    } else {
      quadrant = "LOW_VOLUME_LOW_MARGIN";
      recommendation = `Low volume (${row.unitsSold} sold) and weak margin (${row.grossMarginPercent}%). Evaluate re-engineering the recipe or retiring from the menu to reduce prep waste.`;
    }

    return {
      ...row,
      quadrant,
      recommendation,
    };
  });

  return {
    benchmarks: {
      avgUnitsSold: Number(avgUnitsSold.toFixed(1)),
      avgGrossMarginPercent: Number(avgGrossMarginPercent.toFixed(2)),
      periodDays: days,
    },
    items: classifiedItems.sort(
      (a, b) =>
        (b.estimatedGrossProfitPaise ?? 0) - (a.estimatedGrossProfitPaise ?? 0)
    ),
  };
}

router.get(
  "/menu-profitability",
  requirePermission("analytics:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const data = await computeMenuProfitabilityMatrix({
        restaurantId: req.tenant!.restaurantId,
        days: Number(req.query.days || 30),
        categoryId: req.query.categoryId as string | undefined,
        orderType: req.query.orderType as string | undefined,
        menuItemId: req.query.menuItemId as string | undefined,
      });

      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/overview",
  requirePermission("analytics:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const days = Math.min(365, Math.max(1, Number(req.query.days || 30)));
      const now = Date.now();
      const currentStart = new Date(now - days * 24 * 60 * 60 * 1000);
      const prevStart = new Date(now - days * 2 * 24 * 60 * 60 * 1000);

      const [orders, prevOrders, wasteMovements, customers, profitability] =
        await Promise.all([
          OrderModel.find({
            restaurantId,
            createdAt: { $gte: currentStart },
          }).lean(),
          OrderModel.find({
            restaurantId,
            createdAt: { $gte: prevStart, $lt: currentStart },
          }).lean(),
          InventoryMovementModel.find({
            restaurantId,
            type: { $in: ["WASTE", "SPOILAGE"] },
            createdAt: { $gte: currentStart },
          }).lean(),
          CustomerModel.find({ restaurantId }).lean(),
          computeMenuProfitabilityMatrix({ restaurantId, days }),
        ]);

      const validOrders = orders.filter((o) => o.status !== "CANCELLED");
      const completedOrders = orders.filter((o) => o.status === "COMPLETED");
      const prevValidOrders = prevOrders.filter(
        (o) => o.status !== "CANCELLED"
      );

      const grossSalesPaise = validOrders.reduce(
        (s, o) => s + o.subtotalPaise,
        0
      );
      const totalDiscountsPaise = validOrders.reduce(
        (s, o) => s + (o.discountPaise || 0),
        0
      );
      const netSalesPaise = Math.max(0, grossSalesPaise - totalDiscountsPaise);
      const totalTaxCollectedPaise = validOrders.reduce(
        (s, o) => s + (o.cgstPaise || 0) + (o.sgstPaise || 0),
        0
      );
      const totalBilledRevenuePaise = validOrders.reduce(
        (s, o) => s + o.totalPaise,
        0
      );

      const prevNetSalesPaise = prevValidOrders.reduce(
        (s, o) => s + Math.max(0, o.subtotalPaise - (o.discountPaise || 0)),
        0
      );

      const periodGrowthPercent =
        prevNetSalesPaise > 0
          ? Number(
              (
                ((netSalesPaise - prevNetSalesPaise) / prevNetSalesPaise) *
                100
              ).toFixed(1)
            )
          : null;

      const averageOrderValuePaise =
        validOrders.length > 0
          ? Math.round(netSalesPaise / validOrders.length)
          : 0;

      const totalIngredientCostPaise = profitability.items.reduce(
        (s, i) => s + (i.totalIngredientCostPaise || 0),
        0
      );
      const totalEstimatedGrossProfitPaise = profitability.items.reduce(
        (s, i) => s + (i.estimatedGrossProfitPaise || 0),
        0
      );
      const wasteCostPaise = wasteMovements.reduce(
        (s, m) => s + (m.totalCostPaise || 0),
        0
      );

      const overallFoodCostPercent =
        netSalesPaise > 0
          ? Number(
              ((totalIngredientCostPaise / netSalesPaise) * 100).toFixed(2)
            )
          : 0;

      const repeatCustomersCount = customers.filter(
        (c) => c.visitCount > 1
      ).length;
      const repeatCustomerRatePercent =
        customers.length > 0
          ? Number(
              ((repeatCustomersCount / customers.length) * 100).toFixed(1)
            )
          : 0;

      return res.json({
        success: true,
        data: {
          periodDays: days,
          accountingDefinition:
            "Net Sales = Gross Item Subtotal minus Discounts (excludes CGST/SGST collected). Estimated Gross Profit = Net Sales minus Yield-Adjusted Recipe Ingredient Cost and Packaging Cost.",
          grossSalesPaise,
          totalDiscountsPaise,
          netSalesPaise,
          totalTaxCollectedPaise,
          totalBilledRevenuePaise,
          prevNetSalesPaise,
          periodGrowthPercent,
          totalOrdersCount: validOrders.length,
          completedOrdersCount: completedOrders.length,
          cancelledOrdersCount:
            orders.length - validOrders.length,
          averageOrderValuePaise,
          totalIngredientCostPaise,
          totalEstimatedGrossProfitPaise,
          overallFoodCostPercent,
          wasteCostPaise,
          totalCustomers: customers.length,
          repeatCustomerRatePercent,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/sales",
  requirePermission("analytics:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const days = Math.min(365, Math.max(1, Number(req.query.days || 30)));
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [orders, menuItems, categories] = await Promise.all([
        OrderModel.find({
          restaurantId,
          status: { $ne: "CANCELLED" },
          createdAt: { $gte: startDate },
        }).lean(),
        MenuItemModel.find({ restaurantId }).lean(),
        MenuCategoryModel.find({ restaurantId }).lean(),
      ]);

      const itemCategoryMap = new Map(
        menuItems.map((m) => [String(m._id), String(m.categoryId)])
      );
      const categoryNameMap = new Map(
        categories.map((c) => [String(c._id), c.name])
      );

      const dailyMap = new Map<
        string,
        {
          date: string;
          grossSalesPaise: number;
          netSalesPaise: number;
          ordersCount: number;
        }
      >();
      const hourlyMap = new Map<
        number,
        { hour: number; label: string; salesPaise: number; ordersCount: number }
      >();
      const categorySalesMap = new Map<
        string,
        { categoryName: string; salesPaise: number; unitsSold: number }
      >();

      for (let h = 0; h < 24; h++) {
        hourlyMap.set(h, {
          hour: h,
          label: `${String(h).padStart(2, "0")}:00`,
          salesPaise: 0,
          ordersCount: 0,
        });
      }

      for (const order of orders) {
        const dt = new Date(order.createdAt);
        const dayKey = dt.toISOString().slice(0, 10);
        const netOrder = Math.max(
          0,
          order.subtotalPaise - (order.discountPaise || 0)
        );

        const dayEntry = dailyMap.get(dayKey) || {
          date: dayKey,
          grossSalesPaise: 0,
          netSalesPaise: 0,
          ordersCount: 0,
        };
        dayEntry.grossSalesPaise += order.subtotalPaise;
        dayEntry.netSalesPaise += netOrder;
        dayEntry.ordersCount += 1;
        dailyMap.set(dayKey, dayEntry);

        const istTime = new Date(dt.getTime() + 5.5 * 60 * 60 * 1000);
        const istHour = istTime.getUTCHours();
        const hrEntry = hourlyMap.get(istHour)!;
        hrEntry.salesPaise += netOrder;
        hrEntry.ordersCount += 1;

        for (const line of order.items) {
          const catId = itemCategoryMap.get(String(line.menuItemId)) || "other";
          const catName = categoryNameMap.get(catId) || "Specials";
          const catEntry = categorySalesMap.get(catName) || {
            categoryName: catName,
            salesPaise: 0,
            unitsSold: 0,
          };
          catEntry.salesPaise += line.lineSubtotalPaise;
          catEntry.unitsSold += line.quantity;
          categorySalesMap.set(catName, catEntry);
        }
      }

      return res.json({
        success: true,
        data: {
          salesByDay: Array.from(dailyMap.values()).sort((a, b) =>
            a.date.localeCompare(b.date)
          ),
          salesByHour: Array.from(hourlyMap.values()),
          salesByCategory: Array.from(categorySalesMap.values()).sort(
            (a, b) => b.salesPaise - a.salesPaise
          ),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/products",
  requirePermission("analytics:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const matrix = await computeMenuProfitabilityMatrix({
        restaurantId: req.tenant!.restaurantId,
        days: Number(req.query.days || 30),
      });

      const topSellingByVolume = [...matrix.items]
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, 10);

      const topByGrossProfit = [...matrix.items]
        .sort(
          (a, b) =>
            (b.estimatedGrossProfitPaise ?? 0) -
            (a.estimatedGrossProfitPaise ?? 0)
        )
        .slice(0, 10);

      return res.json({
        success: true,
        data: {
          topSellingByVolume,
          topByGrossProfit,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/food-cost",
  requirePermission("analytics:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const matrix = await computeMenuProfitabilityMatrix({
        restaurantId: req.tenant!.restaurantId,
        days: Number(req.query.days || 30),
      });
      return res.json({
        success: true,
        data: matrix,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/waste",
  requirePermission("analytics:read"),
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
        (s, m) => s + (m.totalCostPaise || 0),
        0
      );

      return res.json({
        success: true,
        data: {
          totalWasteCostPaise,
          movements: wasteMovements,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/export",
  requirePermission("reports:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const type = String(req.query.type || "profitability");
      const matrix = await computeMenuProfitabilityMatrix({
        restaurantId,
        days: Number(req.query.days || 30),
      });

      const headers = [
        "Dish Name",
        "Category",
        "Dietary",
        "Selling Price (INR)",
        "Units Sold",
        "Gross Sales (INR)",
        "Net Sales (INR)",
        "Ingredient Cost (INR)",
        "Estimated Gross Profit (INR)",
        "Food Cost %",
        "Gross Margin %",
        "Menu Quadrant",
      ];

      const rows = matrix.items.map((item) => [
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.categoryName.replace(/"/g, '""')}"`,
        item.dietaryType,
        (item.sellingPricePaise / 100).toFixed(2),
        item.unitsSold,
        (item.grossSalesPaise / 100).toFixed(2),
        (item.netSalesPaise / 100).toFixed(2),
        item.totalIngredientCostPaise !== null
          ? (item.totalIngredientCostPaise / 100).toFixed(2)
          : "Missing Recipe",
        item.estimatedGrossProfitPaise !== null
          ? (item.estimatedGrossProfitPaise / 100).toFixed(2)
          : "Missing Recipe",
        item.foodCostPercent !== null ? `${item.foodCostPercent}%` : "N/A",
        item.grossMarginPercent !== null
          ? `${item.grossMarginPercent}%`
          : "N/A",
        item.quadrant,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((r) => r.join(",")),
      ].join("\n");

      await ReportJobModel.create({
        restaurantId,
        reportType: type,
        status: "COMPLETED",
        generatedByUserId: req.user!._id,
        rowCount: rows.length,
      });

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="dinepilot-${type}-report.csv"`
      );
      return res.send(csvContent);
    } catch (err) {
      next(err);
    }
  }
);

export const analyticsRouter = router;
