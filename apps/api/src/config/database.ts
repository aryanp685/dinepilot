import mongoose from "mongoose";
import fs from "fs";
import os from "os";
import path from "path";
import { env } from "./env";
import { logger } from "../utils/logger";

interface TwinHandle {
  port: number;
  url: string;
  stop: () => Promise<void>;
}

let twinServer: TwinHandle | null = null;
let ephemeralDir: string | null = null;
let isConnected = false;

export async function connectDatabase(options?: {
  inMemoryOnly?: boolean;
}): Promise<string> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return env.MONGODB_URI || twinServer?.url || "";
  }

  let uri = env.MONGODB_URI;

  if (!uri) {
    const dynamicImport = new Function("m", "return import(m)") as (
      moduleName: string
    ) => Promise<any>;
    const { createMongodbTwinServer } = await dynamicImport(
      "@volter/twin-mongodb"
    );
    const useMemory = options?.inMemoryOnly ?? env.NODE_ENV === "test";
    const isServerless = Boolean(process.env.VERCEL);

    let rootDir: string;
    if (useMemory) {
      ephemeralDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "dinepilot-test-db-")
      );
      rootDir = ephemeralDir;
    } else if (isServerless) {
      rootDir = path.join(os.tmpdir(), "dinepilot-vercel-db");
      fs.mkdirSync(rootDir, { recursive: true });
    } else {
      rootDir = path.resolve(process.cwd(), "../../.data/mongodb");
      fs.mkdirSync(rootDir, { recursive: true });
    }

    twinServer = (await createMongodbTwinServer({
      root: rootDir,
    })) as TwinHandle;
    uri = `${twinServer.url}/dinepilot`;
    logger.info("Started embedded MongoDB wire-protocol server", {
      uri,
      persistent: !useMemory,
    });
  }

  await mongoose.connect(uri);
  isConnected = true;
  logger.info("Connected to MongoDB database", { uri });
  return uri;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (twinServer) {
    await twinServer.stop();
    twinServer = null;
  }
  if (ephemeralDir) {
    try {
      fs.rmSync(ephemeralDir, { recursive: true, force: true });
    } catch {
    }
    ephemeralDir = null;
  }
  isConnected = false;
}
