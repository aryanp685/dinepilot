import { Router, Request, Response } from "express";
import crypto from "crypto";
import { verifyPaymentSchema } from "@dinepilot/shared";
import { env } from "../../config/env";
import {
  AuthenticatedRequest,
  requireAuth,
  requirePermission,
  requireTenant,
} from "../../middleware/auth";
import { recordAuditLog, validateBody } from "../../middleware/security";
import { OrderModel, PaymentEventModel, PaymentModel } from "../../models";
import { emitOrderEvent } from "../../sockets";
import { withResourceLock } from "../../utils/concurrency";
import { AppError } from "../../utils/errors";

const router = Router();

router.post("/webhook", async (req: Request, res: Response, next) => {
  try {
    const signature = req.headers["x-dinepilot-signature"] as
      | string
      | undefined;
    const rawPayload = JSON.stringify(req.body || {});
    const expectedHmac = crypto
      .createHmac("sha256", env.PAYMENT_WEBHOOK_SECRET)
      .update(rawPayload)
      .digest("hex");

    if (!signature || signature !== expectedHmac) {
      throw new AppError(
        401,
        "INVALID_WEBHOOK_SIGNATURE",
        "Webhook signature verification failed"
      );
    }

    const { orderId, amountPaise, currency, transactionId, eventId } = req.body;
    if (!orderId || !eventId) {
      throw new AppError(400, "INVALID_WEBHOOK_PAYLOAD", "Missing orderId or eventId");
    }

    const result = await withResourceLock(`payment:${orderId}`, async () => {
      const existingPayment = await PaymentModel.findOne({
        idempotencyKey: `webhook:${eventId}`,
      });
      if (existingPayment) {
        return { duplicate: true, payment: existingPayment };
      }

      const order = await OrderModel.findById(orderId);
      if (!order) {
        throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
      }

      if (currency !== "INR" || Number(amountPaise) !== order.totalPaise) {
        throw new AppError(
          400,
          "AMOUNT_MISMATCH",
          `Webhook amount (${amountPaise} ${currency}) does not match order total (${order.totalPaise} INR)`
        );
      }

      order.paymentStatus = "PAID";
      order.paymentMethod = "UPI";
      order.paymentReference = transactionId || eventId;
      await order.save();

      const payment = await PaymentModel.create({
        restaurantId: order.restaurantId,
        orderId: order._id,
        amountPaise: order.totalPaise,
        currency: "INR",
        method: "UPI",
        status: "PAID",
        reference: transactionId || eventId,
        verifiedAt: new Date(),
        idempotencyKey: `webhook:${eventId}`,
      });

      await PaymentEventModel.create({
        restaurantId: order.restaurantId,
        paymentId: payment._id,
        orderId: order._id,
        eventType: "GATEWAY_WEBHOOK_PAID",
        amountPaise: order.totalPaise,
        metadata: { eventId, transactionId },
      });

      emitOrderEvent({
        restaurantId: String(order.restaurantId),
        publicOrderToken: order.publicOrderToken,
        event: "order:updated",
        order,
      });

      return { duplicate: false, payment };
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.use(requireAuth, requireTenant);

router.post(
  "/verify",
  requirePermission("payments:verify"),
  validateBody(verifyPaymentSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const { orderId, method, action, reference, idempotencyKey } = req.body;

      if (
        action === "MARK_REFUNDED" &&
        req.tenant!.role !== "OWNER" &&
        req.tenant!.role !== "MANAGER"
      ) {
        throw new AppError(
          403,
          "REFUND_REQUIRES_MANAGER",
          "Only Owner or Manager can process a refund"
        );
      }

      const result = await withResourceLock(
        `payment:${orderId}`,
        async () => {
          if (idempotencyKey) {
            const existing = await PaymentModel.findOne({
              restaurantId,
              idempotencyKey,
            });
            if (existing) {
              const order = await OrderModel.findById(orderId);
              return { order, payment: existing, idempotentReplay: true };
            }
          }

          const order = await OrderModel.findOne({
            _id: orderId,
            restaurantId,
          });
          if (!order) {
            throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
          }

          const targetStatus =
            action === "MARK_REFUNDED" ? "REFUNDED" : "PAID";

          if (order.paymentStatus === targetStatus && !idempotencyKey) {
            const latestPayment = await PaymentModel.findOne({
              orderId: order._id,
              restaurantId,
            }).sort({ createdAt: -1 });
            return { order, payment: latestPayment, idempotentReplay: true };
          }

          order.paymentStatus = targetStatus;
          order.paymentMethod = method;
          if (reference) {
            order.paymentReference = reference;
          }
          await order.save();

          const payment = await PaymentModel.create({
            restaurantId,
            orderId: order._id,
            amountPaise: order.totalPaise,
            currency: "INR",
            method,
            status: targetStatus,
            reference:
              reference ||
              `${method} verified by ${req.user!.name}`,
            verifiedByUserId: req.user!._id,
            verifiedAt: new Date(),
            idempotencyKey,
          });

          await PaymentEventModel.create({
            restaurantId,
            paymentId: payment._id,
            orderId: order._id,
            eventType:
              action === "MARK_REFUNDED"
                ? "STAFF_REFUND_RECORDED"
                : "STAFF_PAYMENT_VERIFIED",
            amountPaise: order.totalPaise,
            actorUserId: req.user!._id,
            metadata: { method, reference },
          });

          emitOrderEvent({
            restaurantId,
            publicOrderToken: order.publicOrderToken,
            event: "order:updated",
            order,
          });

          return { order, payment, idempotentReplay: false };
        }
      );

      await recordAuditLog({
        restaurantId,
        actorUserId: String(req.user!._id),
        actorEmail: req.user!.email,
        actorRole: req.tenant!.role,
        action:
          action === "MARK_REFUNDED" ? "PAYMENT_REFUND" : "PAYMENT_VERIFY",
        entityType: "Order",
        entityId: orderId,
        summary: `Order payment marked ${
          action === "MARK_REFUNDED" ? "REFUNDED" : "PAID"
        } via ${method}`,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const paymentsRouter = router;
