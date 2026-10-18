import { env } from "../config/env";

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

function writeLog(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>
) {
  if (env.NODE_ENV === "test" && level === "INFO") return;
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    service: "dinepilot-api",
    message,
    ...(meta ? { meta } : {}),
  };
  const line = JSON.stringify(payload);
  if (level === "ERROR") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) =>
    writeLog("INFO", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) =>
    writeLog("WARN", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) =>
    writeLog("ERROR", msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) =>
    writeLog("DEBUG", msg, meta),
};
