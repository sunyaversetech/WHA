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

const create_booking_schema = z.object({
  service_id: z.string().min(1),
  employee_id: z.string().nullable().optional(),
  start_time: z.string().datetime(),
  lock_id: z.string().min(1),
  idempotency_key: z.string().uuid().optional(),
  inventory: z.number().min(0).optional(),
});

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

  const db_session = await mongoose.startSession();

  try {
    let new_booking: any;

    await db_session.withTransaction(async () => {
      const start_date = new Date(validated_data.start_time);
      start_date.setUTCMilliseconds(0);

      // 1. Validate & consume the lock
      const lock = await BookingLock.findOne({
        _id: validated_data.lock_id,
        user_id,
        service_id: validated_data.service_id,
        start_time: start_date,
        expires_at: { $gt: new Date() },
      }).session(db_session);

      if (!lock) {
        throw new Error("LOCK_INVALID: Lock not found or expired");
      }

      // 2. Fetch service server-side
      const service = await Service.findById(validated_data.service_id).session(
        db_session,
      );
      if (!service) throw new Error("SERVICE_NOT_FOUND");
      if (!service.is_active) throw new Error("SERVICE_UNAVAILABLE");

      // Resolve requested item quantity (default to 1 for item rentals if omitted)
      const requested_quantity =
        service.business_type === "item_based"
          ? validated_data.inventory || lock.inventory || 1
          : 0;

      let duration = service.base_duration;
      let total_price = service.base_price * (requested_quantity || 1); // scale by item count if needed
      let employee_id = null;

      // 3. BRANCH LOGIC: EMPLOYEE MODEL VS INVENTORY MODEL
      if (service.business_type === "employee_based") {
        employee_id =
          lock.employee_id?.toString() || validated_data.employee_id;
        if (!employee_id) throw new Error("EMPLOYEE_INVALID");

        const employee =
          await Employee.findById(employee_id).session(db_session);
        if (employee) {
          const override = employee.service_overrides?.find(
            (o: any) => o.service_id.toString() === service._id.toString(),
          );
          if (override) {
            if (override.custom_duration) duration = override.custom_duration;
            if (override.custom_price) total_price = override.custom_price;
          }
        }
      }

      const end_date = new Date(start_date.getTime() + duration * 60_000);
      const candidate_buffer = service.buffer_time || 0;
      const candidate_blocked_end = new Date(
        end_date.getTime() + candidate_buffer * 60_000,
      );

      // 4. CONCURRENCY CONTROLS
      if (service.business_type === "employee_based") {
        // Standard Employee overlap logic
        const potential_overlaps = await Booking.find({
          employee_id,
          status: { $nin: ["cancelled", "no_show"] },
          start_time: { $lt: candidate_blocked_end },
          end_time: { $gt: start_date },
        })
          .populate("service_id")
          .session(db_session);

        const overlap = potential_overlaps.find((b) => {
          const buffer = (b.service_id as any)?.buffer_time || 0;
          const blocked_end = new Date(b.end_time.getTime() + buffer * 60_000);
          return (
            start_date < blocked_end && candidate_blocked_end > b.start_time
          );
        });

        if (overlap) throw new Error("SLOT_TAKEN: Employee is fully booked");
      } else if (service.business_type === "item_based") {
        // Advanced Inventory allocation logic
        const max_inventory = Number(service.inventory) || 0;

        // Find all active bookings overlapping our checkout window
        const active_bookings = await Booking.find({
          service_id: service._id,
          status: { $nin: ["cancelled", "no_show"] },
          start_time: { $lt: candidate_blocked_end },
          end_time: { $gt: start_date },
        })
          .populate("service_id")
          .session(db_session);

        // Find all active temporary checkout locks holding stock items right now
        const active_locks = await BookingLock.find({
          _id: { $ne: lock._id }, // Exclude our current lock
          service_id: service._id,
          expires_at: { $gt: new Date() },
          start_time: { $lt: candidate_blocked_end },
          end_time: { $gt: start_date },
        }).session(db_session);

        // Calculate maximum overlapping quantity at peak overlap times
        // We evaluate points of interest (booking limits) inside this window
        let peak_allocated_quantity = 0;
        const check_points = Array.from(
          new Set([
            start_date.getTime(),
            ...active_bookings.map((b) => b.start_time.getTime()),
            ...active_locks.map((l) => l.start_time.getTime()),
          ]),
        );

        for (const time_ms of check_points) {
          const target_time = new Date(time_ms);

          // Sum up bookings covering this timestamp interval
          const booked_at_spot = active_bookings.reduce((sum, b) => {
            const b_buffer = (b.service_id as any)?.buffer_time || 0;
            const b_blocked_end = new Date(
              b.end_time.getTime() + b_buffer * 60_000,
            );
            return target_time >= b.start_time && target_time < b_blocked_end
              ? sum + (b.inventory_quantity || 1)
              : sum;
          }, 0);

          // Sum up unexpired checkout locks holding down stock at this interval
          const locked_at_spot = active_locks.reduce((sum, l) => {
            // Locks mirror service structural buffers directly
            const l_blocked_end = new Date(
              l.end_time.getTime() + candidate_buffer * 60_000,
            );
            return target_time >= l.start_time && target_time < l_blocked_end
              ? sum + (l.inventory_quantity || 1)
              : sum;
          }, 0);

          const total_at_spot = booked_at_spot + locked_at_spot;
          if (total_at_spot > peak_allocated_quantity) {
            peak_allocated_quantity = total_at_spot;
          }
        }

        const remaining_stock = max_inventory - peak_allocated_quantity;
        if (requested_quantity > remaining_stock) {
          throw new Error(
            `OUT_OF_STOCK: Only ${remaining_stock} item(s) left for this slot.`,
          );
        }
      }

      // 5. Build dynamic storage payload safely
      [new_booking] = await Booking.create(
        [
          {
            business_id: service.business_id,
            service_id: validated_data.service_id,
            employee_id: employee_id || null,
            inventory_quantity: requested_quantity || null, // Store how many items were checked out
            user_id,
            start_time: start_date,
            end_time: end_date,
            duration,
            total_price,
            status: "confirmed",
            payment_status: "pending",
            idempotency_key: validated_data.idempotency_key ?? null,
          },
        ],
        { session: db_session },
      );

      // Remove the lock atomically
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
      code?.includes("OUT_OF_STOCK") || code?.includes("SLOT_TAKEN")
        ? 409
        : 400;
    return NextResponse.json({ success: false, code, message }, { status });
  } finally {
    await db_session.endSession();
  }
}

export async function GET() {
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

  try {
    const bookings = await Booking.find({ business_id: user_id })
      .populate("service_id")
      .populate("employee_id")
      .sort({ start_time: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error: any) {
    logger.error({ error, user_id }, "Failed to fetch bookings");
    return NextResponse.json(
      {
        success: false,
        code: "FETCH_FAILED",
        message: error.message || "Unable to fetch bookings",
      },
      { status: 500 },
    );
  }
}
