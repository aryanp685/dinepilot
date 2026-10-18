import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { hasPermission, Permission, StaffRole } from "@dinepilot/shared";
import { env } from "../config/env";
import {
  IMembership,
  IRestaurant,
  IUser,
  MembershipModel,
  RestaurantModel,
  UserModel,
} from "../models";
import { AppError } from "../utils/errors";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  tenant?: {
    restaurantId: string;
    restaurant: IRestaurant;
    role: StaffRole;
    membership: IMembership;
  };
}

export function signSessionToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: `${env.SESSION_TTL_HOURS}h`,
  });
}

export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const cookieToken = req.cookies?.dp_session;
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : undefined;
    const token = cookieToken || bearerToken;

    if (!token) {
      throw new AppError(401, "UNAUTHENTICATED", "Authentication required");
    }

    let decoded: { sub: string };
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    } catch {
      throw new AppError(401, "INVALID_SESSION", "Invalid or expired session");
    }

    const user = await UserModel.findById(decoded.sub);
    if (!user || !user.isActive) {
      throw new AppError(
        401,
        "ACCOUNT_INACTIVE",
        "User account not found or deactivated"
      );
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireTenant(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHENTICATED", "Authentication required");
    }

    const requestedRestaurantId =
      (req.headers["x-restaurant-id"] as string | undefined) ||
      (req.query.restaurantId as string | undefined);

    const memberships = await MembershipModel.find({
      userId: req.user._id,
      isActive: true,
    });

    if (memberships.length === 0) {
      throw new AppError(
        403,
        "NO_RESTAURANT_MEMBERSHIP",
        "User has no active restaurant memberships"
      );
    }

    let activeMembership = memberships[0];

    if (requestedRestaurantId) {
      const matched = memberships.find(
        (m: IMembership) => String(m.restaurantId) === String(requestedRestaurantId)
      );
      if (!matched) {
        throw new AppError(
          403,
          "CROSS_TENANT_ACCESS_DENIED",
          "You do not have permission to access this restaurant workspace"
        );
      }
      activeMembership = matched;
    }

    const restaurant = await RestaurantModel.findById(
      activeMembership.restaurantId
    );
    if (!restaurant || !restaurant.isActive) {
      throw new AppError(
        403,
        "RESTAURANT_INACTIVE",
        "Restaurant workspace is inactive or suspended"
      );
    }

    req.tenant = {
      restaurantId: String(restaurant._id),
      restaurant,
      role: activeMembership.role,
      membership: activeMembership,
    };

    next();
  } catch (err) {
    next(err);
  }
}

export function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.tenant) {
        throw new AppError(
          403,
          "TENANT_CONTEXT_MISSING",
          "Restaurant context is required"
        );
      }
      if (!hasPermission(req.tenant.role, permission)) {
        throw new AppError(
          403,
          "INSUFFICIENT_ROLE_PERMISSIONS",
          `Role '${req.tenant.role}' does not have '${permission}' permission`
        );
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requirePlatformAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    if (!req.user || req.user.isPlatformAdmin !== true) {
      throw new AppError(
        403,
        "PLATFORM_ADMIN_REQUIRED",
        "Access restricted exclusively to authorized platform administrators"
      );
    }
    next();
  } catch (err) {
    next(err);
  }
}
