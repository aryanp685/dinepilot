import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { MembershipModel, OrderModel } from "../models";
import { logger } from "../utils/logger";

let ioInstance: SocketServer | null = null;

function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((acc, part) => {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey) {
      acc[rawKey] = decodeURIComponent(rest.join("="));
    }
    return acc;
  }, {} as Record<string, string>);
}

export function initSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
    path: "/socket.io",
  });

  io.on("connection", async (socket) => {
    const cookies = parseCookieHeader(socket.handshake.headers.cookie);
    const token =
      socket.handshake.auth?.token ||
      cookies.dp_session ||
      (socket.handshake.headers.authorization?.startsWith("Bearer ")
        ? socket.handshake.headers.authorization.slice(7)
        : undefined);

    let authenticatedUserId: string | null = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string };
        authenticatedUserId = decoded.sub;
      } catch {
      }
    }

    socket.on(
      "join:restaurant",
      async (
        payload: { restaurantId: string; surface?: "dashboard" | "kitchen" },
        ack?: (res: { ok: boolean; error?: string }) => void
      ) => {
        try {
          if (!authenticatedUserId || !payload?.restaurantId) {
            ack?.({ ok: false, error: "UNAUTHORIZED" });
            return;
          }
          const membership = await MembershipModel.findOne({
            userId: authenticatedUserId,
            restaurantId: payload.restaurantId,
            isActive: true,
          }).lean();

          if (!membership) {
            ack?.({ ok: false, error: "FORBIDDEN_TENANT" });
            return;
          }

          await socket.join(`restaurant:${payload.restaurantId}`);
          if (payload.surface === "kitchen") {
            await socket.join(`kitchen:${payload.restaurantId}`);
          }
          ack?.({ ok: true });
        } catch (err) {
          logger.error("Socket join:restaurant failed", {
            error: String(err),
          });
          ack?.({ ok: false, error: "JOIN_ERROR" });
        }
      }
    );

    socket.on(
      "join:order",
      async (
        payload: { publicOrderToken: string },
        ack?: (res: { ok: boolean; error?: string }) => void
      ) => {
        try {
          if (!payload?.publicOrderToken) {
            ack?.({ ok: false, error: "INVALID_TOKEN" });
            return;
          }
          const order = await OrderModel.findOne({
            publicOrderToken: payload.publicOrderToken,
          })
            .select("_id publicOrderToken")
            .lean();
          if (!order) {
            ack?.({ ok: false, error: "ORDER_NOT_FOUND" });
            return;
          }
          await socket.join(`order:${payload.publicOrderToken}`);
          ack?.({ ok: true });
        } catch {
          ack?.({ ok: false, error: "JOIN_ERROR" });
        }
      }
    );
  });

  ioInstance = io;
  return io;
}

export function emitOrderEvent(params: {
  restaurantId: string;
  publicOrderToken: string;
  event: "order:created" | "order:updated" | "order:kot_added";
  order: unknown;
}) {
  if (!ioInstance) return;
  ioInstance
    .to(`restaurant:${params.restaurantId}`)
    .to(`kitchen:${params.restaurantId}`)
    .emit(params.event, params.order);
  ioInstance
    .to(`order:${params.publicOrderToken}`)
    .emit(params.event, params.order);
}

export function emitRestaurantNotification(
  restaurantId: string,
  notification: unknown
) {
  if (!ioInstance) return;
  ioInstance
    .to(`restaurant:${restaurantId}`)
    .emit("notification:new", notification);
}
