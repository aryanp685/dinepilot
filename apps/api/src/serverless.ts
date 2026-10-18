import { createApp } from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { ensureDemoDataSeeded } from "./scripts/seedData";

declare global {
  var __dinepilotApp: ReturnType<typeof createApp> | undefined;
  var __dinepilotInitPromise: Promise<void> | undefined;
}

export async function handleServerlessApiRequest(
  req: any,
  res: any
): Promise<void> {
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

  return new Promise<void>((resolve, reject) => {
    res.on("finish", resolve);
    res.on("close", resolve);
    res.on("error", reject);
    globalThis.__dinepilotApp!(req, res);
  });
}
