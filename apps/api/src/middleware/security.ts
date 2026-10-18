import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";
import { AuditLogModel } from "../models";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

function sanitizeObject(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj && typeof obj === "object" && !(obj instanceof Date)) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      if (key.startsWith("$") || key.includes(".")) {
        continue;
      }
      cleaned[key] = sanitizeObject(val);
    }
    return cleaned;
  }
  return obj;
}

export function sanitizeNoSqlInput(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query) as Request["query"];
  }
  next();
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }));
      return next(
        new AppError(
          400,
          "VALIDATION_ERROR",
          details[0]?.message || "Invalid request payload",
          details
        )
      );
    }
    req.body = parsed.data;
    next();
  };
}

export async function recordAuditLog(params: {
  restaurantId?: string | null;
  actorUserId?: string | null;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await AuditLogModel.create({
      restaurantId: params.restaurantId || null,
      actorUserId: params.actorUserId || null,
      actorEmail: params.actorEmail || "system",
      actorRole: params.actorRole || "SYSTEM",
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      summary: params.summary,
      ipAddress: params.ipAddress,
      metadata: params.metadata,
    });
  } catch (err) {
    logger.warn("Failed to record audit log", { error: String(err) });
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: err.errors[0]?.message || "Validation failed",
        details: err.errors,
      },
    });
  }

  logger.error("Unhandled API error", {
    error: err instanceof Error ? err.message : String(err),
  });

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected server error occurred",
    },
  });
}
