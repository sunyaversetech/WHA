// app/api/bookings/route.ts
import { z, ZodError } from "zod";
import mongoose from "mongoose";
import { connectToDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth"; // or your auth solution
import { Service } from "@/server/models/Service.model";
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
    // Never leak internal messages to the client — log them instead
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
        ...(validated_data.employee_id && {
          employee_id: validated_data.employee_id,
        }),
        expires_at: { $gt: new Date() }, // ← expiry check
      }).session(db_session);

      if (!lock) {
        throw new Error(
          "LOCK_INVALID: Lock not found, expired, or does not match the requested slot",
        );
      }

      // 5. Fetch service server-side — never trust client price
      const service = await Service.findById(validated_data.service_id).session(
        db_session,
      );
      if (!service)
        throw new Error("SERVICE_NOT_FOUND: Service does not exist");
      if (!service.is_active)
        throw new Error("SERVICE_UNAVAILABLE: Service is not currently active");

      const start_date = new Date(validated_data.start_time);
      const end_date = new Date(
        start_date.getTime() + service.base_duration * 60_000,
      );

      // 6. Final overlap check within the transaction (handles race conditions)
      const overlap = await Booking.findOne({
        employee_id: validated_data.employee_id,
        status: { $nin: ["cancelled", "no_show"] },
        $or: [{ start_time: { $lt: end_date }, end_time: { $gt: start_date } }],
      }).session(db_session);

      if (overlap) {
        throw new Error("SLOT_TAKEN: This time slot is no longer available");
      }

      // 7. Create booking — price derived server-side
      [new_booking] = await Booking.create(
        [
          {
            business_id: service.business_id, // pull from service, not client
            service_id: validated_data.service_id,
            employee_id: validated_data.employee_id ?? null,
            user_id,
            start_time: start_date,
            end_time: end_date,
            duration: service.base_duration,
            total_price: service.base_price, // ← server-side price
            status: "confirmed",
            payment_status: "pending", // ← set to pending; confirm after payment
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

    // 9. Trigger payment flow AFTER the transaction commits (outside the txn)
    // await initiatePayment(new_booking._id, new_booking.total_price);

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
