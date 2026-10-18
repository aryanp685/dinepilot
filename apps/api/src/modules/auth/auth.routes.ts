import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  ROLE_PERMISSION_MATRIX,
} from "@dinepilot/shared";
import {
  AuthenticatedRequest,
  requireAuth,
  signSessionToken,
} from "../../middleware/auth";
import { recordAuditLog, validateBody } from "../../middleware/security";
import {
  MembershipModel,
  RestaurantModel,
  RestaurantTableModel,
  SubscriptionModel,
  UserModel,
} from "../../models";
import { AppError } from "../../utils/errors";
import { env } from "../../config/env";

const router = Router();

function slugifyRestaurantName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base || "restaurant"}-${suffix}`;
}

function setSessionCookie(res: Response, token: string) {
  res.cookie("dp_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
    path: "/",
  });
}

router.post(
  "/register",
  validateBody(registerSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const {
        ownerName,
        email,
        password,
        phone,
        restaurantName,
        city,
        state,
        gstin,
        fssaiNumber,
      } = req.body;

      const existing = await UserModel.findOne({ email });
      if (existing) {
        throw new AppError(
          409,
          "EMAIL_ALREADY_EXISTS",
          "An account with this email already exists"
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await UserModel.create({
        email,
        name: ownerName,
        phone,
        passwordHash,
        isPlatformAdmin: false,
        isActive: true,
        lastLoginAt: new Date(),
      });

      const slug = slugifyRestaurantName(restaurantName);
      const restaurant = await RestaurantModel.create({
        name: restaurantName,
        slug,
        city: city || "Nagpur",
        state: state || "Maharashtra",
        country: "IN",
        phone: phone || "+91 712 254 8890",
        email,
        gstin: gstin || "",
        fssaiNumber: fssaiNumber || "",
        isDemo: false,
        isActive: true,
      });

      const membership = await MembershipModel.create({
        userId: user._id,
        restaurantId: restaurant._id,
        role: "OWNER",
        isActive: true,
      });

      const subscription = await SubscriptionModel.create({
        restaurantId: restaurant._id,
        plan: "GROWTH",
        status: "ACTIVE",
        pricePaise: 249900,
        billingCycle: "MONTHLY",
      });

      await RestaurantTableModel.create([
        {
          restaurantId: restaurant._id,
          label: "T-01",
          zone: "Main Dining",
          capacity: 4,
          publicToken: `tbl_${crypto.randomBytes(12).toString("hex")}`,
          sessionPin: "1024",
          isActive: true,
        },
        {
          restaurantId: restaurant._id,
          label: "T-02",
          zone: "Main Dining",
          capacity: 6,
          publicToken: `tbl_${crypto.randomBytes(12).toString("hex")}`,
          sessionPin: "2048",
          isActive: true,
        },
      ]);

      const token = signSessionToken(String(user._id));
      setSessionCookie(res, token);

      await recordAuditLog({
        restaurantId: String(restaurant._id),
        actorUserId: String(user._id),
        actorEmail: user.email,
        actorRole: "OWNER",
        action: "AUTH_REGISTER",
        entityType: "Restaurant",
        entityId: String(restaurant._id),
        summary: `Owner ${user.email} registered restaurant '${restaurant.name}'`,
      });

      return res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: String(user._id),
            email: user.email,
            name: user.name,
            phone: user.phone,
            isPlatformAdmin: user.isPlatformAdmin,
          },
          restaurant: {
            id: String(restaurant._id),
            name: restaurant.name,
            slug: restaurant.slug,
            city: restaurant.city,
            state: restaurant.state,
            currency: restaurant.currency,
            timezone: restaurant.timezone,
            qrThemePreset: restaurant.qrThemePreset,
            isDemo: restaurant.isDemo,
            settings: restaurant.settings,
          },
          role: membership.role,
          permissions: ROLE_PERMISSION_MATRIX[membership.role],
          subscription,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/login",
  validateBody(loginSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { email, password } = req.body;
      const user = await UserModel.findOne({ email });
      if (!user || !user.isActive) {
        throw new AppError(
          401,
          "INVALID_CREDENTIALS",
          "Invalid email or password"
        );
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        throw new AppError(
          401,
          "INVALID_CREDENTIALS",
          "Invalid email or password"
        );
      }

      user.lastLoginAt = new Date();
      await user.save();

      const memberships = await MembershipModel.find({
        userId: user._id,
        isActive: true,
      });

      let activeRestaurant = null;
      let activeRole = null;
      let subscription = null;

      if (memberships.length > 0) {
        activeRole = memberships[0].role;
        activeRestaurant = await RestaurantModel.findById(
          memberships[0].restaurantId
        );
        if (activeRestaurant) {
          subscription = await SubscriptionModel.findOne({
            restaurantId: activeRestaurant._id,
          });
        }
      }

      const token = signSessionToken(String(user._id));
      setSessionCookie(res, token);

      await recordAuditLog({
        restaurantId: activeRestaurant ? String(activeRestaurant._id) : null,
        actorUserId: String(user._id),
        actorEmail: user.email,
        actorRole: activeRole || (user.isPlatformAdmin ? "PLATFORM_ADMIN" : "USER"),
        action: "AUTH_LOGIN",
        entityType: "User",
        entityId: String(user._id),
        summary: `User ${user.email} logged in`,
      });

      return res.json({
        success: true,
        data: {
          token,
          user: {
            id: String(user._id),
            email: user.email,
            name: user.name,
            phone: user.phone,
            isPlatformAdmin: user.isPlatformAdmin,
          },
          restaurant: activeRestaurant
            ? {
                id: String(activeRestaurant._id),
                name: activeRestaurant.name,
                slug: activeRestaurant.slug,
                city: activeRestaurant.city,
                state: activeRestaurant.state,
                currency: activeRestaurant.currency,
                timezone: activeRestaurant.timezone,
                qrThemePreset: activeRestaurant.qrThemePreset,
                isDemo: activeRestaurant.isDemo,
                settings: activeRestaurant.settings,
              }
            : null,
          role: activeRole,
          permissions: activeRole ? ROLE_PERMISSION_MATRIX[activeRole] : [],
          subscription,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post("/logout", (_req: AuthenticatedRequest, res: Response) => {
  res.clearCookie("dp_session", { path: "/" });
  return res.json({
    success: true,
    data: { loggedOut: true },
  });
});

router.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { email } = req.body;
      const user = await UserModel.findOne({ email });
      let resetTokenPreview: string | undefined;

      if (user && user.isActive) {
        const rawToken = crypto.randomBytes(24).toString("hex");
        user.passwordResetTokenHash = crypto
          .createHash("sha256")
          .update(rawToken)
          .digest("hex");
        user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await user.save();
        if (env.NODE_ENV !== "production") {
          resetTokenPreview = rawToken;
        }
      }

      return res.json({
        success: true,
        data: {
          message:
            "If an account exists for that email, a password reset link has been generated.",
          ...(resetTokenPreview ? { resetTokenPreview } : {}),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { token, newPassword } = req.body;
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await UserModel.findOne({
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { $gt: new Date() },
      });

      if (!user) {
        throw new AppError(
          400,
          "INVALID_RESET_TOKEN",
          "Password reset token is invalid or expired"
        );
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save();

      return res.json({
        success: true,
        data: { message: "Password has been reset successfully" },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/me",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const user = req.user!;
      const memberships = await MembershipModel.find({
        userId: user._id,
        isActive: true,
      });

      const requestedRestaurantId = req.headers["x-restaurant-id"] as
        | string
        | undefined;
      let activeMembership = memberships[0] || null;
      if (requestedRestaurantId && memberships.length > 0) {
        const matched = memberships.find(
          (m) => String(m.restaurantId) === String(requestedRestaurantId)
        );
        if (matched) activeMembership = matched;
      }

      const restaurantIds = memberships.map((m) => m.restaurantId);
      const restaurants = await RestaurantModel.find({
        _id: { $in: restaurantIds },
        isActive: true,
      });

      const activeRestaurant = activeMembership
        ? restaurants.find(
            (r) => String(r._id) === String(activeMembership.restaurantId)
          ) || null
        : null;

      const subscription = activeRestaurant
        ? await SubscriptionModel.findOne({
            restaurantId: activeRestaurant._id,
          })
        : null;

      return res.json({
        success: true,
        data: {
          user: {
            id: String(user._id),
            email: user.email,
            name: user.name,
            phone: user.phone,
            isPlatformAdmin: user.isPlatformAdmin,
          },
          restaurant: activeRestaurant
            ? {
                id: String(activeRestaurant._id),
                name: activeRestaurant.name,
                slug: activeRestaurant.slug,
                city: activeRestaurant.city,
                state: activeRestaurant.state,
                address: activeRestaurant.address,
                phone: activeRestaurant.phone,
                email: activeRestaurant.email,
                gstin: activeRestaurant.gstin,
                fssaiNumber: activeRestaurant.fssaiNumber,
                upiVpa: activeRestaurant.upiVpa,
                currency: activeRestaurant.currency,
                timezone: activeRestaurant.timezone,
                qrThemePreset: activeRestaurant.qrThemePreset,
                isDemo: activeRestaurant.isDemo,
                settings: activeRestaurant.settings,
              }
            : null,
          workspaces: restaurants.map((r) => {
            const mem = memberships.find(
              (m) => String(m.restaurantId) === String(r._id)
            );
            return {
              id: String(r._id),
              name: r.name,
              slug: r.slug,
              city: r.city,
              isDemo: r.isDemo,
              role: mem?.role || "WAITER",
            };
          }),
          role: activeMembership?.role || null,
          permissions: activeMembership
            ? ROLE_PERMISSION_MATRIX[activeMembership.role]
            : [],
          subscription,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export const authRouter = router;
