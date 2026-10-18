import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler, sanitizeNoSqlInput } from "./middleware/security";
import { authRouter } from "./modules/auth/auth.routes";
import { restaurantRouter } from "./modules/restaurants/restaurant.routes";
import { menuRouter } from "./modules/menu/menu.routes";
import { publicRouter } from "./modules/orders/public.routes";
import { ordersRouter } from "./modules/orders/order.routes";
import { inventoryRouter } from "./modules/inventory/inventory.routes";
import { recipesRouter } from "./modules/recipes/recipe.routes";
import { analyticsRouter } from "./modules/analytics/analytics.routes";
import { aiRouter } from "./modules/ai/ai.routes";
import { tablesRouter } from "./modules/tables/tables.routes";
import { reservationsRouter } from "./modules/reservations/reservations.routes";
import { loyaltyRouter } from "./modules/loyalty/loyalty.routes";
import { staffRouter } from "./modules/staff/staff.routes";
import { paymentsRouter } from "./modules/payments/payments.routes";
import { platformRouter } from "./modules/platform/platform.routes";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    })
  );

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(sanitizeNoSqlInput);

  if (env.NODE_ENV !== "test") {
    const apiLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 240,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests, please try again shortly.",
        },
      },
    });
    app.use("/api/v1", apiLimiter);
  }

  app.get("/api/v1/health", (_req, res) => {
    res.json({
      success: true,
      data: {
        status: "healthy",
        service: "dinepilot-api",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        timezone: env.DEFAULT_TIMEZONE,
        currency: env.DEFAULT_CURRENCY,
      },
    });
  });

  app.get("/api/v1/openapi.json", (_req, res) => {
    res.json({
      openapi: "3.1.0",
      info: {
        title: "DinePilot Restaurant Operations & Profitability API",
        version: "1.0.0",
        description:
          "Multi-tenant restaurant operations, QR ordering, recipe costing, waste analytics, and AI business copilot REST API.",
      },
      servers: [{ url: "/api/v1" }],
      paths: {
        "/health": { get: { summary: "Service health check" } },
        "/auth/register": { post: { summary: "Register owner & restaurant" } },
        "/auth/login": { post: { summary: "Authenticate user session" } },
        "/auth/logout": { post: { summary: "Clear session cookie" } },
        "/auth/me": { get: { summary: "Current user & active tenant context" } },
        "/restaurant": {
          get: { summary: "Get active restaurant" },
          patch: { summary: "Update restaurant profile" },
        },
        "/restaurant/settings": {
          get: { summary: "Get GST & operational settings" },
          patch: { summary: "Update GST & operational settings" },
        },
        "/menu": {
          get: { summary: "List categories, modifiers & items" },
          post: { summary: "Create menu item" },
        },
        "/public/restaurants/{slug}/menu": {
          get: { summary: "Public guest QR menu" },
        },
        "/public/restaurants/{slug}/tables/{publicToken}": {
          get: { summary: "Verify QR table token & running order" },
        },
        "/public/restaurants/{slug}/orders": {
          post: { summary: "Submit guest QR order or append KOT" },
        },
        "/public/orders/{publicOrderToken}": {
          get: { summary: "Public order tracking & UPI instructions" },
        },
        "/orders": {
          get: { summary: "List restaurant orders" },
          post: { summary: "Create staff POS order" },
        },
        "/orders/{id}/status": {
          patch: { summary: "Transition order state machine" },
        },
        "/inventory/ingredients": {
          get: { summary: "List ingredients" },
          post: { summary: "Create ingredient" },
        },
        "/inventory/movements": {
          get: { summary: "List inventory movement ledger" },
          post: { summary: "Record auditable stock movement" },
        },
        "/inventory/alerts": {
          get: { summary: "Low stock & expiring ingredient alerts" },
        },
        "/inventory/waste-report": {
          get: { summary: "Waste analytics & spoilage cost report" },
        },
        "/recipes": {
          get: { summary: "List recipes with yield-adjusted costing" },
          post: { summary: "Upsert menu item recipe" },
        },
        "/analytics/menu-profitability": {
          get: { summary: "Menu Engineering Matrix (Stars, Plowhorses, Puzzles, Dogs)" },
        },
        "/analytics/overview": {
          get: { summary: "Executive financial & operational metrics" },
        },
        "/ai/insights": {
          post: { summary: "AI Business Copilot insights & Q&A" },
        },
        "/tables": {
          get: { summary: "List tables & live occupancy" },
          post: { summary: "Create table with QR token" },
        },
        "/reservations": {
          get: { summary: "List reservations" },
          post: { summary: "Book conflict-checked table reservation" },
        },
        "/loyalty/customers": {
          get: { summary: "List customer profiles & loyalty balances" },
        },
        "/loyalty/redeem": {
          post: { summary: "Redeem loyalty reward" },
        },
        "/payments/verify": {
          post: { summary: "Verify payment or process refund" },
        },
        "/platform/overview": {
          get: { summary: "Platform administrator overview" },
        },
      },
    });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/restaurant", restaurantRouter);
  app.use("/api/v1/menu", menuRouter);
  app.use("/api/v1/public", publicRouter);
  app.use("/api/v1/orders", ordersRouter);
  app.use("/api/v1/inventory", inventoryRouter);
  app.use("/api/v1/recipes", recipesRouter);
  app.use("/api/v1/analytics", analyticsRouter);
  app.use("/api/v1/ai", aiRouter);
  app.use("/api/v1/tables", tablesRouter);
  app.use("/api/v1/reservations", reservationsRouter);
  app.use("/api/v1/loyalty", loyaltyRouter);
  app.use("/api/v1/staff", staffRouter);
  app.use("/api/v1/payments", paymentsRouter);
  app.use("/api/v1/platform", platformRouter);

  app.use(errorHandler);

  return app;
}
