import {
  IngredientModel,
  NotificationModel,
  OrderModel,
  RestaurantModel,
} from "../models";
import { formatINR } from "@dinepilot/shared";
import { logger } from "../utils/logger";

export async function runInventoryAndSummaryJob(restaurantId?: string) {
  try {
    const filter = restaurantId
      ? { _id: restaurantId, isActive: true }
      : { isActive: true };
    const restaurants = await RestaurantModel.find(filter).lean();
    const todayKey = new Date().toISOString().slice(0, 10);

    for (const rest of restaurants) {
      const restId = String(rest._id);
      const ingredients = await IngredientModel.find({
        restaurantId: restId,
      }).lean();

      for (const ing of ingredients) {
        if (ing.currentStock <= ing.reorderThreshold) {
          const dedupTitle = `[${todayKey}] Reorder Alert: ${ing.name}`;
          const existing = await NotificationModel.findOne({
            restaurantId: restId,
            type: "LOW_INVENTORY",
            title: dedupTitle,
          });
          if (!existing) {
            await NotificationModel.create({
              restaurantId: restId,
              type: "LOW_INVENTORY",
              title: dedupTitle,
              message: `${ing.name} stock is ${ing.currentStock} ${ing.unit} (Threshold: ${ing.reorderThreshold} ${ing.unit}).`,
              metadata: { ingredientId: String(ing._id), date: todayKey },
            });
          }
        }
      }

      const summaryTitle = `[${todayKey}] Daily Operations Pulse`;
      const existingSummary = await NotificationModel.findOne({
        restaurantId: restId,
        type: "DAILY_SUMMARY",
        title: summaryTitle,
      });

      if (!existingSummary) {
        const dayStart = new Date(`${todayKey}T00:00:00.000Z`);
        const ordersToday = await OrderModel.find({
          restaurantId: restId,
          status: { $ne: "CANCELLED" },
          createdAt: { $gte: dayStart },
        }).lean();

        const salesTodayPaise = ordersToday.reduce(
          (s, o) => s + Math.max(0, o.subtotalPaise - (o.discountPaise || 0)),
          0
        );

        await NotificationModel.create({
          restaurantId: restId,
          type: "DAILY_SUMMARY",
          title: summaryTitle,
          message: `${ordersToday.length} active/completed order(s) logged today • Net sales: ${formatINR(
            salesTodayPaise
          )}`,
          metadata: { date: todayKey, ordersCount: ordersToday.length },
        });
      }
    }
  } catch (err) {
    logger.warn("Background job execution warning", { error: String(err) });
  }
}
