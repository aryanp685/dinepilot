import { Router, Response } from "express";
import {
  createRewardSchema,
  redeemRewardSchema,
} from "@dinepilot/shared";
import {
  AuthenticatedRequest,
  requireAuth,
  requirePermission,
  requireTenant,
} from "../../middleware/auth";
import { recordAuditLog, validateBody } from "../../middleware/security";
import {
  CustomerModel,
  LoyaltyAccountModel,
  LoyaltyRewardModel,
  LoyaltyTransactionModel,
} from "../../models";
import { withResourceLock } from "../../utils/concurrency";
import { AppError } from "../../utils/errors";

const router = Router();

router.use(requireAuth, requireTenant);

router.get(
  "/customers",
  requirePermission("customers:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const [customers, accounts] = await Promise.all([
        CustomerModel.find({ restaurantId }).sort({ totalSpentPaise: -1 }).lean(),
        LoyaltyAccountModel.find({ restaurantId }).lean(),
      ]);

      const accountMap = new Map(
        accounts.map((a) => [String(a.customerId), a])
      );

      const enriched = customers.map((c) => {
        const acc = accountMap.get(String(c._id));
        return {
          ...c,
          pointsBalance: acc?.pointsBalance || 0,
          lifetimePointsEarned: acc?.lifetimePointsEarned || 0,
          lifetimePointsRedeemed: acc?.lifetimePointsRedeemed || 0,
          tier: acc?.tier || "BRONZE",
        };
      });

      return res.json({
        success: true,
        data: enriched,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/customers",
  requirePermission("customers:write"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const name = String(req.body.name || "").trim();
      const phone = String(req.body.phone || "").trim();
      if (!name || phone.length < 8) {
        throw new AppError(
          400,
          "INVALID_CUSTOMER",
          "Customer name and valid phone number are required"
        );
      }

      const customer = await CustomerModel.findOneAndUpdate(
        { restaurantId, phone },
        {
          $set: {
            name,
            email: req.body.email || undefined,
            marketingConsent: Boolean(req.body.marketingConsent),
            consentUpdatedAt: new Date(),
            notes: req.body.notes || "",
          },
          $setOnInsert: {
            visitCount: 1,
            totalSpentPaise: 0,
            lastVisitAt: new Date(),
          },
        },
        { new: true, upsert: true }
      );

      await LoyaltyAccountModel.findOneAndUpdate(
        { restaurantId, customerId: customer._id },
        {
          $setOnInsert: {
            pointsBalance: 0,
            lifetimePointsEarned: 0,
            lifetimePointsRedeemed: 0,
            tier: "BRONZE",
          },
        },
        { new: true, upsert: true }
      );

      return res.status(201).json({
        success: true,
        data: customer,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/customers/:id/consent",
  requirePermission("customers:write"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const updated = await CustomerModel.findOneAndUpdate(
        { _id: req.params.id, restaurantId },
        {
          $set: {
            marketingConsent: Boolean(req.body.marketingConsent),
            consentUpdatedAt: new Date(),
          },
        },
        { new: true }
      );
      if (!updated) {
        throw new AppError(404, "CUSTOMER_NOT_FOUND", "Customer not found");
      }
      return res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/transactions",
  requirePermission("loyalty:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const [transactions, customers] = await Promise.all([
        LoyaltyTransactionModel.find({ restaurantId })
          .sort({ createdAt: -1 })
          .limit(60)
          .lean(),
        CustomerModel.find({ restaurantId }).select("_id name phone").lean(),
      ]);

      const customerMap = new Map(
        customers.map((c) => [String(c._id), { name: c.name, phone: c.phone }])
      );

      return res.json({
        success: true,
        data: transactions.map((tx) => ({
          ...tx,
          customerName:
            customerMap.get(String(tx.customerId))?.name || "Customer",
          customerPhone: customerMap.get(String(tx.customerId))?.phone || "",
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/rewards",
  requirePermission("loyalty:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const rewards = await LoyaltyRewardModel.find({
        restaurantId: req.tenant!.restaurantId,
      })
        .sort({ pointsCost: 1 })
        .lean();

      return res.json({
        success: true,
        data: rewards,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/rewards",
  requirePermission("loyalty:write"),
  validateBody(createRewardSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const reward = await LoyaltyRewardModel.create({
        ...req.body,
        restaurantId: req.tenant!.restaurantId,
      });
      return res.status(201).json({
        success: true,
        data: reward,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/redeem",
  requirePermission("loyalty:write"),
  validateBody(redeemRewardSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const { customerId, rewardId, idempotencyKey } = req.body;

      const result = await withResourceLock(
        `loyalty:${customerId}`,
        async () => {
          if (idempotencyKey) {
            const existing = await LoyaltyTransactionModel.findOne({
              restaurantId,
              idempotencyKey,
            });
            if (existing) {
              const acc = await LoyaltyAccountModel.findById(
                existing.loyaltyAccountId
              );
              return { transaction: existing, account: acc };
            }
          }

          const [account, reward] = await Promise.all([
            LoyaltyAccountModel.findOne({ restaurantId, customerId }),
            LoyaltyRewardModel.findOne({
              _id: rewardId,
              restaurantId,
              isActive: true,
            }),
          ]);

          if (!account) {
            throw new AppError(
              404,
              "LOYALTY_ACCOUNT_NOT_FOUND",
              "Customer loyalty account not found"
            );
          }
          if (!reward) {
            throw new AppError(
              404,
              "REWARD_NOT_FOUND",
              "Reward not found or inactive"
            );
          }

          if (account.pointsBalance < reward.pointsCost) {
            throw new AppError(
              400,
              "INSUFFICIENT_LOYALTY_POINTS",
              `Customer has ${account.pointsBalance} pts, but '${reward.name}' requires ${reward.pointsCost} pts`
            );
          }

          account.pointsBalance -= reward.pointsCost;
          account.lifetimePointsRedeemed += reward.pointsCost;
          await account.save();

          const transaction = await LoyaltyTransactionModel.create({
            restaurantId,
            customerId: account.customerId,
            loyaltyAccountId: account._id,
            type: "REDEEM",
            pointsDelta: -reward.pointsCost,
            balanceAfter: account.pointsBalance,
            rewardId: reward._id,
            idempotencyKey,
            description: `Redeemed reward '${reward.name}' (-${reward.pointsCost} pts)`,
            createdByUserId: req.user!._id,
          });

          return { transaction, account, reward };
        }
      );

      await recordAuditLog({
        restaurantId,
        actorUserId: String(req.user!._id),
        actorEmail: req.user!.email,
        actorRole: req.tenant!.role,
        action: "LOYALTY_REWARD_REDEEM",
        entityType: "LoyaltyTransaction",
        entityId: String(result.transaction._id),
        summary: result.transaction.description,
      });

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const loyaltyRouter = router;
