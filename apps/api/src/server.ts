import http from "http";
import { createApp } from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { runInventoryAndSummaryJob } from "./jobs/backgroundJobs";
import { ensureDemoDataSeeded } from "./scripts/seedData";
import { initSocketServer } from "./sockets";
import { logger } from "./utils/logger";

async function bootstrap() {
  await connectDatabase();

  if (env.AUTO_SEED_DEMO) {
    await ensureDemoDataSeeded();
  }

  await runInventoryAndSummaryJob();
  setInterval(() => {
    runInventoryAndSummaryJob().catch(() => undefined);
  }, 5 * 60 * 1000);

  const app = createApp();
  const server = http.createServer(app);
  initSocketServer(server);

  server.listen(env.PORT, "0.0.0.0", () => {
    logger.info(`DinePilot API & Socket.IO server listening on 0.0.0.0:${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  logger.error("Failed to bootstrap DinePilot API server", {
    error: String(err),
  });
  process.exit(1);
});
