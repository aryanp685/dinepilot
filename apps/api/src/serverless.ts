import { createApp } from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { ensureDemoDataSeeded } from "./scripts/seedData";
import { logger } from "./utils/logger";

declare global {
  var __dinepilotApp: ReturnType<typeof createApp> | undefined;
  var __dinepilotInitPromise: Promise<void> | undefined;
}

export async function handleServerlessApiRequest(
  req: any,
  res: any
): Promise<void> {
  try {
    if (!globalThis.__dinepilotApp) {
      globalThis.__dinepilotApp = createApp();
    }

    if (!globalThis.__dinepilotInitPromise) {
      globalThis.__dinepilotInitPromise = (async () => {
        await connectDatabase();
        if (env.AUTO_SEED_DEMO) {
          await ensureDemoDataSeeded();
        }
      })().catch((err) => {
        globalThis.__dinepilotInitPromise = undefined;
        throw err;
      });
    }

    await globalThis.__dinepilotInitPromise;

    await new Promise<void>((resolve, reject) => {
      res.on("finish", resolve);
      res.on("close", resolve);
      res.on("error", reject);
      globalThis.__dinepilotApp!(req, res);
    });
  } catch (err: any) {
    logger.error("Serverless API handler error", {
      message: err?.message,
      stack: err?.stack,
    });
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          success: false,
          error: {
            code: "SERVERLESS_RUNTIME_ERROR",
            message:
              err?.message || "Unexpected error initializing serverless API",
          },
        })
      );
    }
  }
}
