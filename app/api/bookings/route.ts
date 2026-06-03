// app/api/bookings/route.ts
import { z, ZodError } from "zod";
import mongoose from "mongoose";
import { connectToDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth"; // or your auth solution
import { Service } from "@/server/models/Service.model";
import { Employee } from "@/server/models/Employee.model";
import Booking from "@/server/models/Booking.model";
import { BookingLock } from "@/server/models/BookingLock.model";
import { authOptions } from "../auth/[...nextauth]/route";
import logger from "@/lib/logger";

// ─── Schema ────────────────────────────────────────────────────────────────

const create_booking_schema = z.object({
  service_id: z.string().min(1),
  employee_id: z.string().nullable().optional(),
  start_time: z.string().datetime(),
  lock_id: z.string().min(1),
  idempotency_key: z.string().uuid().optional(), // client-generated UUID
});

// ─── Helper ────────────────────────────────────────────────────────────────

function toClientError(error: unknown): { message: string; code: string } {
  if (error instanceof ZodError) {
    return {
      code: "VALIDATION_ERROR",
      message: error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; "),
    };
  }
  if (error instanceof Error) {
    return { code: "BOOKING_FAILED", message: error.message };
  }
  return { code: "UNKNOWN_ERROR", message: "An unexpected error occurred" };
}

// ─── POST /api/bookings ─────────────────────────────────────────────────────

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      {
        success: false,
        code: "UNAUTHORIZED",
        message: "You must be logged in",
      },
      { status: 401 },
    );
  }
  const user_id = session.user.id;

  await connectToDb();

  let validated_data: z.infer<typeof create_booking_schema>;
  try {
    const body = await request.json();
    validated_data = create_booking_schema.parse(body);
  } catch (error) {
    return NextResponse.json(
      { success: false, ...toClientError(error) },
      { status: 422 },
    );
  }

  if (validated_data.idempotency_key) {
    const existing = await Booking.findOne({
      idempotency_key: validated_data.idempotency_key,
      user_id,
    });
    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Booking confirmed",
        data: existing,
      });
    }
  }

  // Use a MongoDB session for atomicity
  const db_session = await mongoose.startSession();

  try {
    let new_booking: any;

    await db_session.withTransaction(async () => {
      // 4. Validate & consume the lock — the lock MUST belong to this user
      //    and cover exactly this slot
      const lock = await BookingLock.findOne({
        _id: validated_data.lock_id,
        user_id, // ← ownership check
        service_id: validated_data.service_id,
        start_time: new Date(validated_data.start_time),
        expires_at: { $gt: new Date() }, // ← expiry check
      }).session(db_session);

      if (!lock) {
        throw new Error(
          "LOCK_INVALID: Lock not found, expired, or does not match the requested slot",
        );
      }

      // Resolve the actual employee assigned during lock creation
      const employee_id = lock.employee_id?.toString() || validated_data.employee_id;
      if (!employee_id) {
        throw new Error("EMPLOYEE_INVALID: No employee assigned to this lock");
      }

      // 5. Fetch service server-side
      const service = await Service.findById(validated_data.service_id).session(
        db_session,
      );
      if (!service)
        throw new Error("SERVICE_NOT_FOUND: Service does not exist");
      if (!service.is_active)
        throw new Error("SERVICE_UNAVAILABLE: Service is not currently active");

      // 6. Look up employee overrides for duration and pricing
      let duration = service.base_duration;
      let total_price = service.base_price;

      const employee = await Employee.findById(employee_id).session(db_session);
      if (employee) {
        const override = employee.service_overrides?.find(
          (o: any) => o.service_id.toString() === service._id.toString(),
        );
        if (override) {
          if (override.custom_duration) duration = override.custom_duration;
          if (override.custom_price !== undefined && override.custom_price !== null) {
            total_price = override.custom_price;
          }
        }
      }

      const start_date = new Date(validated_data.start_time);
      const end_date = new Date(
        start_date.getTime() + duration * 60_000,
      );

      // Define time window to check overlaps around the booking time (e.g. 12 hours)
      const buffer_check_start = new Date(start_date.getTime() - 12 * 3600 * 1000);
      const buffer_check_end = new Date(end_date.getTime() + 12 * 3600 * 1000);

      // Fetch all bookings for this employee around the scheduled window
      const potential_overlaps = await Booking.find({
        employee_id,
        status: { $nin: ["cancelled", "no_show"] },
        start_time: { $lt: buffer_check_end },
        end_time: { $gt: buffer_check_start },
      }).populate("service_id").session(db_session);

      const candidate_buffer = service.buffer_time || 0;
      const candidate_blocked_end = new Date(end_date.getTime() + candidate_buffer * 60_000);

      const overlap = potential_overlaps.find((b) => {
        const buffer = (b.service_id as any)?.buffer_time || 0;
        const blocked_end = new Date(b.end_time.getTime() + buffer * 60_000);
        return start_date < blocked_end && candidate_blocked_end > b.start_time;
      });

      if (overlap) {
        throw new Error("SLOT_TAKEN: This time slot is no longer available");
      }

      // 7. Create booking — price derived server-side
      [new_booking] = await Booking.create(
        [
          {
            business_id: service.business_id, // pull from service, not client
            service_id: validated_data.service_id,
            employee_id,
            user_id,
            start_time: start_date,
            end_time: end_date,
            duration,
            total_price, // ← server-side override price
            status: "confirmed",
            payment_status: "pending",
            idempotency_key: validated_data.idempotency_key ?? null,
          },
        ],
        { session: db_session },
      );

      // 8. Delete the lock atomically in the same transaction
      await BookingLock.findByIdAndDelete(validated_data.lock_id, {
        session: db_session,
      });
    });

    logger.info({ booking_id: new_booking._id, user_id }, "Booking created");

    return NextResponse.json(
      { success: true, message: "Booking confirmed", data: new_booking },
      { status: 201 },
    );
  } catch (error: unknown) {
    logger.error({ error, user_id }, "Booking creation failed");

    const { code, message } = toClientError(error);

    const status =
      code === "UNAUTHORIZED"
        ? 401
        : code === "VALIDATION_ERROR"
          ? 422
          : code?.includes("LOCK_INVALID") || code?.includes("SLOT_TAKEN")
            ? 409
            : 400;

    return NextResponse.json({ success: false, code, message }, { status });
  } finally {
    await db_session.endSession();
  }
}
