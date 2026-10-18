export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4000),
  WEB_PORT: Number(process.env.WEB_PORT || 3000),
  PUBLIC_APP_URL: process.env.PUBLIC_APP_URL || "http://localhost:3000",
  MONGODB_URI: process.env.MONGODB_URI || "",
  USE_EMBEDDED_MONGO: process.env.USE_EMBEDDED_MONGO !== "false",
  AUTO_SEED_DEMO: process.env.AUTO_SEED_DEMO !== "false",
  JWT_SECRET:
    process.env.JWT_SECRET ||
    "dinepilot-dev-secret-key-do-not-use-in-prod-982374928374",
  SESSION_TTL_HOURS: Number(process.env.SESSION_TTL_HOURS || 168),
  DEFAULT_CURRENCY: process.env.DEFAULT_CURRENCY || "INR",
  DEFAULT_TIMEZONE: process.env.DEFAULT_TIMEZONE || "Asia/Kolkata",
  AI_PROVIDER: process.env.AI_PROVIDER || "rule-based",
  AI_API_KEY: process.env.AI_API_KEY || "",
  AI_MODEL: process.env.AI_MODEL || "gpt-4o-mini",
  AI_TIMEOUT_MS: Number(process.env.AI_TIMEOUT_MS || 10000),
  PAYMENT_WEBHOOK_SECRET:
    process.env.PAYMENT_WEBHOOK_SECRET ||
    "dinepilot-webhook-hmac-secret-dev-key",
};
