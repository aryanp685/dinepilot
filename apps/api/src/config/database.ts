import mongoose from "mongoose";
import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";
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

function ensureBuiltinModulePolyfill() {
  const proc = process as any;
  if (typeof proc.getBuiltinModule !== "function") {
    const req = createRequire(__filename || path.join(process.cwd(), "index.js"));
    proc.getBuiltinModule = (id: string) => req(id);
  }
}

function resolveWritableDataDir(useMemory: boolean): string {
  if (useMemory) {
    ephemeralDir = fs.mkdtempSync(path.join(os.tmpdir(), "dinepilot-test-db-"));
    const volterHomeDir = path.join(ephemeralDir, "volter-home");
    fs.mkdirSync(volterHomeDir, { recursive: true });
    process.env.VOLTER_HOME = volterHomeDir;
    process.env.XDG_CONFIG_HOME = volterHomeDir;
    return ephemeralDir;
  }

  const isServerless = Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT
  );

  if (!isServerless) {
    try {
      const localDir = path.resolve(process.cwd(), "../../.data/mongodb");
      fs.mkdirSync(localDir, { recursive: true });
      const localVolterHome = path.resolve(
        process.cwd(),
        "../../.data/volter-home"
      );
      fs.mkdirSync(localVolterHome, { recursive: true });
      if (!process.env.VOLTER_HOME) {
        process.env.VOLTER_HOME = localVolterHome;
      }
      return localDir;
    } catch {
      const fallback = path.join(os.tmpdir(), "dinepilot-serverless");
      fs.mkdirSync(fallback, { recursive: true });
    }
  }

  const tmpBase = path.join(os.tmpdir(), "dinepilot-serverless");
  const dbDir = path.join(tmpBase, "mongodb");
  const volterHomeDir = path.join(tmpBase, "volter-home");
  fs.mkdirSync(dbDir, { recursive: true });
  fs.mkdirSync(volterHomeDir, { recursive: true });
  process.env.VOLTER_HOME = volterHomeDir;
  process.env.XDG_CONFIG_HOME = volterHomeDir;
  process.env.PROJECT_ROOT = tmpBase;
  return dbDir;
}

export async function connectDatabase(options?: {
  inMemoryOnly?: boolean;
}): Promise<string> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return env.MONGODB_URI || twinServer?.url || "";
  }

  let uri = env.MONGODB_URI;

  if (!uri) {
    ensureBuiltinModulePolyfill();
    const useMemory = options?.inMemoryOnly ?? env.NODE_ENV === "test";
    const rootDir = resolveWritableDataDir(useMemory);

    const loader =
      (globalThis as any).__loadTwinMongo ||
      (new Function("m", "return import(m)") as (
        moduleName: string
      ) => Promise<any>);
    const { createMongodbTwinServer } = await loader("@volter/twin-mongodb");

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
      ephemeralDir = null;
    }
    ephemeralDir = null;
  }
  isConnected = false;
}
