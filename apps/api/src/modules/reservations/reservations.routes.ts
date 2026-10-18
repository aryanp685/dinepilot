import { Router, Response } from "express";
import crypto from "crypto";
import {
  createReservationSchema,
  updateReservationSchema,
} from "@dinepilot/shared";
import {
  AuthenticatedRequest,
  requireAuth,
  requirePermission,
  requireTenant,
} from "../../middleware/auth";
import { recordAuditLog, validateBody } from "../../middleware/security";
import { ReservationModel, RestaurantTableModel } from "../../models";
import { withResourceLock } from "../../utils/concurrency";
import { AppError } from "../../utils/errors";

const router = Router();

router.use(requireAuth, requireTenant);

function timeToMinutes(hhmm: string): number {
  const [hh, mm] = hhmm.split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

router.get(
  "/",
  requirePermission("reservations:read"),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const { date, status } = req.query;
      const filter: Record<string, unknown> = { restaurantId };
      if (date && typeof date === "string") {
        filter.date = date;
      }
      if (status && typeof status === "string" && status !== "ALL") {
        filter.status = status;
      }

      const reservations = await ReservationModel.find(filter)
        .sort({ date: 1, timeSlot: 1 })
        .lean();

      return res.json({
        success: true,
        data: reservations,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  requirePermission("reservations:write"),
  validateBody(createReservationSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const settings = req.tenant!.restaurant.settings;
      const {
        customerName,
        customerPhone,
        customerEmail,
        date,
        timeSlot,
        durationMinutes,
        partySize,
        tableId,
        specialRequests,
      } = req.body;

      const slotMinutes = timeToMinutes(timeSlot);
      const openMinutes = timeToMinutes(settings.operatingHoursOpen || "11:00");
      const closeMinutes = timeToMinutes(
        settings.operatingHoursClose || "23:30"
      );

      if (slotMinutes < openMinutes || slotMinutes > closeMinutes - 30) {
        throw new AppError(
          400,
          "OUTSIDE_OPERATING_HOURS",
          `Reservation time ${timeSlot} is outside restaurant operating hours (${settings.operatingHoursOpen}–${settings.operatingHoursClose})`
        );
      }

      const reservation = await withResourceLock(
        `reservation:${restaurantId}:${date}`,
        async () => {
          let assignedTable = null;

          if (tableId) {
            assignedTable = await RestaurantTableModel.findOne({
              _id: tableId,
              restaurantId,
              isActive: true,
            });
            if (!assignedTable) {
              throw new AppError(
                400,
                "INVALID_TABLE",
                "Selected table does not exist or is inactive"
              );
            }
            if (assignedTable.capacity < partySize) {
              throw new AppError(
                400,
                "TABLE_CAPACITY_EXCEEDED",
                `Table ${assignedTable.label} seats ${assignedTable.capacity}, which is smaller than party size ${partySize}`
              );
            }
          }

          const existingOnDate = await ReservationModel.find({
            restaurantId,
            date,
            status: { $in: ["CONFIRMED", "SEATED"] },
          });

          const reqStart = slotMinutes;
          const reqEnd = slotMinutes + (durationMinutes || 90);

          if (assignedTable) {
            const conflict = existingOnDate.find((r) => {
              if (String(r.tableId) !== String(assignedTable!._id)) return false;
              const rStart = timeToMinutes(r.timeSlot);
              const rEnd = rStart + (r.durationMinutes || 90);
              return reqStart < rEnd && reqEnd > rStart;
            });

            if (conflict) {
              throw new AppError(
                409,
                "RESERVATION_CONFLICT",
                `Table ${assignedTable.label} is already reserved at ${conflict.timeSlot} (${conflict.reservationCode})`
              );
            }
          } else {
            const candidateTables = await RestaurantTableModel.find({
              restaurantId,
              isActive: true,
              capacity: { $gte: partySize },
            }).sort({ capacity: 1 });

            for (const cand of candidateTables) {
              const hasConflict = existingOnDate.some((r) => {
                if (String(r.tableId) !== String(cand._id)) return false;
                const rStart = timeToMinutes(r.timeSlot);
                const rEnd = rStart + (r.durationMinutes || 90);
                return reqStart < rEnd && reqEnd > rStart;
              });
              if (!hasConflict) {
                assignedTable = cand;
                break;
              }
            }

            if (!assignedTable) {
              throw new AppError(
                409,
                "NO_AVAILABLE_TABLE_FOR_SLOT",
                `No table with capacity >= ${partySize} is available at ${timeSlot} on ${date}`
              );
            }
          }

          const reservationCode = `RSV-${crypto
            .randomBytes(2)
            .toString("hex")
            .toUpperCase()}`;

          return ReservationModel.create({
            restaurantId,
            reservationCode,
            customerName,
            customerPhone,
            customerEmail: customerEmail || undefined,
            date,
            timeSlot,
            durationMinutes: durationMinutes || 90,
            partySize,
            tableId: assignedTable._id,
            tableLabelSnapshot: assignedTable.label,
            status: "CONFIRMED",
            specialRequests: specialRequests || "",
            createdByUserId: req.user!._id,
          });
        }
      );

      await recordAuditLog({
        restaurantId,
        actorUserId: String(req.user!._id),
        actorEmail: req.user!.email,
        actorRole: req.tenant!.role,
        action: "RESERVATION_CREATE",
        entityType: "Reservation",
        entityId: String(reservation._id),
        summary: `Booked ${reservation.reservationCode} for ${customerName} (${partySize} guests) on ${date} ${timeSlot}`,
      });

      return res.status(201).json({
        success: true,
        data: reservation,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:id",
  requirePermission("reservations:write"),
  validateBody(updateReservationSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const restaurantId = req.tenant!.restaurantId;
      const updated = await ReservationModel.findOneAndUpdate(
        { _id: req.params.id, restaurantId },
        { $set: req.body },
        { new: true }
      );
      if (!updated) {
        throw new AppError(
          404,
          "RESERVATION_NOT_FOUND",
          "Reservation not found"
        );
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

export const reservationsRouter = router;
