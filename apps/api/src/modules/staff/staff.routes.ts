import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  createStaffMemberSchema,
  ROLE_PERMISSION_MATRIX,
  STAFF_ROLES,
} from "@dinepilot/shared";
import {
  AuthenticatedRequest,
  requireAuth,
  requirePermission,
  requireTenant,
} from "../../middleware/auth";
import { recordAuditLog, validateBody } from "../../middleware/security";
import {
  MembershipModel,
  StaffInvitationModel,
  UserModel,
} from "../../models";
import { AppError } from "../../utils/errors";

const router = Router();

router.use(requireAuth, requireTenant);

router.get(
  "/",
  requirePermission("staff:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const [memberships, invitations] = await Promise.all([
        MembershipModel.find({ restaurantId }).lean(),
        StaffInvitationModel.find({ restaurantId }).sort({ createdAt: -1 }).lean(),
      ]);

      const userIds = memberships.map((m) => m.userId);
      const users = await UserModel.find({ _id: { $in: userIds } })
        .select("_id email name phone isActive lastLoginAt")
        .lean();
      const userMap = new Map(users.map((u) => [String(u._id), u]));

      const staffMembers = memberships.map((m) => {
        const u = userMap.get(String(m.userId));
        return {
          membershipId: String(m._id),
          userId: String(m.userId),
          name: u?.name || "Staff Member",
          email: u?.email || "",
          phone: u?.phone || "",
          role: m.role,
          isActive: m.isActive && Boolean(u?.isActive),
          lastLoginAt: u?.lastLoginAt,
          permissions: ROLE_PERMISSION_MATRIX[m.role],
        };
      });

      return res.json({
        success: true,
        data: {
          staffMembers,
          invitations,
          rolePermissionMatrix: ROLE_PERMISSION_MATRIX,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  requirePermission("staff:write"),
  validateBody(createStaffMemberSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const { name, email, phone, role, password } = req.body;

      if (role === "OWNER" && req.tenant!.role !== "OWNER") {
        throw new AppError(
          403,
          "ONLY_OWNER_CAN_ASSIGN_OWNER",
          "Only an Owner can assign the Owner role"
        );
      }

      let user = await UserModel.findOne({ email });
      if (!user) {
        const passwordHash = await bcrypt.hash(
          password || "StaffPass@123",
          10
        );
        user = await UserModel.create({
          email,
          name,
          phone,
          passwordHash,
          isPlatformAdmin: false,
          isActive: true,
        });
      }

      const membership = await MembershipModel.findOneAndUpdate(
        { userId: user._id, restaurantId },
        { $set: { role, isActive: true } },
        { new: true, upsert: true }
      );

      await StaffInvitationModel.create({
        restaurantId,
        email,
        name,
        role,
        token: `inv_${crypto.randomBytes(12).toString("hex")}`,
        status: "ACCEPTED",
        invitedByUserId: req.user!._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      await recordAuditLog({
        restaurantId,
        actorUserId: String(req.user!._id),
        actorEmail: req.user!.email,
        actorRole: req.tenant!.role,
        action: "STAFF_MEMBER_ADD",
        entityType: "Membership",
        entityId: String(membership._id),
        summary: `Added staff member ${email} with role ${role}`,
      });

      return res.status(201).json({
        success: true,
        data: {
          membershipId: String(membership._id),
          userId: String(user._id),
          name: user.name,
          email: user.email,
          role: membership.role,
          isActive: membership.isActive,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:membershipId",
  requirePermission("staff:write"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const membership = await MembershipModel.findOne({
        _id: req.params.membershipId,
        restaurantId,
      });
      if (!membership) {
        throw new AppError(404, "STAFF_NOT_FOUND", "Staff membership not found");
      }

      if (
        req.body.role &&
        STAFF_ROLES.includes(req.body.role) &&
        !(req.body.role === "OWNER" && req.tenant!.role !== "OWNER")
      ) {
        membership.role = req.body.role;
      }

      if (req.body.isActive !== undefined) {
        membership.isActive = Boolean(req.body.isActive);
      }

      await membership.save();

      await recordAuditLog({
        restaurantId,
        actorUserId: String(req.user!._id),
        actorEmail: req.user!.email,
        actorRole: req.tenant!.role,
        action: "STAFF_MEMBER_UPDATE",
        entityType: "Membership",
        entityId: String(membership._id),
        summary: `Updated staff membership ${membership._id} (role=${membership.role}, active=${membership.isActive})`,
      });

      return res.json({
        success: true,
        data: membership,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const staffRouter = router;
