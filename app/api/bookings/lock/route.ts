// app/api/bookings/lock/route.ts
import { z, ZodError } from "zod";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDb } from "@/lib/db";
import { Service } from "@/server/models/Service.model";
import Booking from "@/server/models/Booking.model";
import { BookingLock } from "@/server/models/BookingLock.model";
import { logger } from "@/lib/logger";
import { authOptions } from "../../auth/[...nextauth]/route";

// ─── Schema ────────────────────────────────────────────────────────────────

const lock_schema = z.object({
  service_id: z.string().min(1),
  employee_id: z.string().min(1),
  start_time: z.string().datetime(),
});

// ─── POST /api/bookings/lock ────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. Authentication
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

  // 2. Validate input
  let validated_data: z.infer<typeof lock_schema>;
  try {
    const body = await request.json();
    validated_data = lock_schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: error.issues
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join("; "),
        },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { success: false, code: "INVALID_BODY", message: "Invalid request body" },
      { status: 400 },
    );
  }

  const db_session = await mongoose.startSession();

  try {
    let lock_id: string;

    await db_session.withTransaction(async () => {
      // 3. Fetch service server-side — derive end_time and get business_id
      const service = await Service.findById(validated_data.service_id).session(
        db_session,
      );
      if (!service) throw new Error("SERVICE_NOT_FOUND");
      if (!service.is_active) throw new Error("SERVICE_UNAVAILABLE");

      // 4. Verify employee belongs to this service/business
      const employee_valid = service.employee_ids?.includes(
        validated_data.employee_id,
      );
      if (!employee_valid) throw new Error("EMPLOYEE_INVALID");

      const requested_start = new Date(validated_data.start_time);
      const requested_end = new Date(
        requested_start.getTime() + service.base_duration * 60_000,
      );

      // 5. Overlap check — exclude expired locks
      const overlap_filter = {
        employee_id: validated_data.employee_id,
        start_time: { $lt: requested_end },
        end_time: { $gt: requested_start },
      };

      const [existing_booking, existing_lock] = await Promise.all([
        Booking.findOne({
          ...overlap_filter,
          status: { $nin: ["cancelled", "no_show"] }, // ignore dead bookings
        }).session(db_session),

        BookingLock.findOne({
          ...overlap_filter,
          expires_at: { $gt: new Date() }, // ignore expired locks
        }).session(db_session),
      ]);

      if (existing_booking || existing_lock) {
        throw new Error("SLOT_TAKEN");
      }

      // 6. Release any stale locks this user already holds on this slot
      //    (e.g. they hit "back" and retried)
      await BookingLock.deleteMany(
        {
          user_id,
          service_id: validated_data.service_id,
          expires_at: { $lt: new Date() },
        },
        { session: db_session },
      );

      // 7. Create the lock with user_id attached
      const [new_lock] = await BookingLock.create(
        [
          {
            user_id, // ← ownership
            business_id: service.business_id, // ← from service, not client
            service_id: validated_data.service_id,
            employee_id: validated_data.employee_id,
            start_time: requested_start,
            end_time: requested_end,
            expires_at: new Date(Date.now() + 5 * 60_000), // 5 min TTL
          },
        ],
        { session: db_session },
      );

      lock_id = new_lock._id.toString();
    });

    logger.info(
      { user_id, service_id: validated_data.service_id },
      "Slot lock created",
    );

    return NextResponse.json(
      { success: true, lock_id: lock_id! },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "UNKNOWN";

    logger.error({ error, user_id }, "Lock creation failed");

    const [status, client_message] =
      message === "SLOT_TAKEN"
        ? [409, "This slot is no longer available"]
        : message === "SERVICE_NOT_FOUND"
          ? [404, "Service not found"]
          : message === "SERVICE_UNAVAILABLE"
            ? [400, "Service is not active"]
            : message === "EMPLOYEE_INVALID"
              ? [400, "Employee is not valid for this service"]
              : [500, "Unable to hold this slot, please try again"];

    return NextResponse.json(
      { success: false, code: message, message: client_message },
      { status },
    );
  } finally {
    await db_session.endSession();
  }
}
