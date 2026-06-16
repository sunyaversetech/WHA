// app/api/bookings/lock/route.ts
import { z, ZodError } from "zod";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDb } from "@/lib/db";
import { Service } from "@/server/models/Service.model";
import { Employee } from "@/server/models/Employee.model";
import { EmployeeTimeOff } from "@/server/models/EmployeeTimeOff.model";
import Booking from "@/server/models/Booking.model";
import { BookingLock } from "@/server/models/BookingLock.model";
import { logger } from "@/lib/logger";
import { authOptions } from "../../auth/[...nextauth]/route";

const lock_schema = z.object({
  service_id: z.string().min(1),
  employee_id: z.string().nullable().optional(),
  start_time: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format provided",
  }),
  timezone: z.string().min(1).default("UTC"),
});

function to_utc(date_str: string, time_str: string, timezone: string): Date {
  const local_iso = `${date_str}T${time_str}:00`;
  return new Date(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(local_iso)),
  );
}

function get_local_day_name(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
  })
    .format(date)
    .toLowerCase();
}

function get_local_date_string(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

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
    let assigned_employee_id: string;

    await db_session.withTransaction(async () => {
      // 3. Fetch service server-side
      const service = await Service.findById(validated_data.service_id).session(
        db_session,
      );
      if (!service) throw new Error("SERVICE_NOT_FOUND");
      if (!service.is_active) throw new Error("SERVICE_UNAVAILABLE");

      // 4. Determine candidate employee(s)
      let candidate_ids: string[] = [];
      const requested_employee_id = validated_data.employee_id;

      if (requested_employee_id && requested_employee_id !== "any") {
        // Verify employee is assigned to this service
        const is_assigned = service.assigned_employees
          ?.map((id: any) => id.toString())
          .includes(requested_employee_id);
        if (!is_assigned) throw new Error("EMPLOYEE_INVALID");
        candidate_ids = [requested_employee_id];
      } else {
        // No preference: consider all assigned employees
        candidate_ids =
          service.assigned_employees?.map((id: any) => id.toString()) || [];
      }

      if (candidate_ids.length === 0) {
        throw new Error("EMPLOYEE_INVALID");
      }

      // Fetch candidate employees
      const employees = await Employee.find({
        _id: { $in: candidate_ids },
        is_active: true,
      }).session(db_session);

      if (employees.length === 0) {
        throw new Error("EMPLOYEE_INVALID");
      }

      const requested_start = new Date(validated_data.start_time);
      requested_start.setUTCMilliseconds(0);
      const local_date_str = get_local_date_string(
        requested_start,
        validated_data.timezone,
      );
      const day_name = get_local_day_name(
        requested_start,
        validated_data.timezone,
      );

      // Define day boundaries to query existing bookings, locks, and time off
      const day_start = new Date(`${local_date_str}T00:00:00Z`);
      const day_end = new Date(`${local_date_str}T23:59:59.999Z`);

      // Fetch bookings, locks, and time-off for these candidates on the requested day
      const [existing_bookings, existing_locks, time_offs] = await Promise.all([
        Booking.find({
          employee_id: { $in: candidate_ids },
          status: { $nin: ["cancelled", "no_show", "refunded"] },
          start_time: { $lt: day_end },
          end_time: { $gt: day_start },
        })
          .populate("service_id")
          .session(db_session),

        BookingLock.find({
          employee_id: { $in: candidate_ids },
          expires_at: { $gt: new Date() },
          start_time: { $lt: day_end },
          end_time: { $gt: day_start },
        })
          .populate("service_id")
          .session(db_session),

        EmployeeTimeOff.find({
          employee_id: { $in: candidate_ids },
          start_time: { $lt: day_end },
          end_time: { $gt: day_start },
        }).session(db_session),
      ]);

      // Find first available employee
      let selected_employee: any = null;
      let final_duration = service.base_duration;

      for (const emp of employees) {
        // A. Check working hours
        const sched = emp.availability_schedule?.find(
          (s: any) => s.day_of_week === day_name && s.is_working,
        );
        if (!sched) continue;

        // B. Get custom duration override
        const override = emp.service_overrides?.find(
          (o: any) => o.service_id.toString() === service._id.toString(),
        );
        const duration = override?.custom_duration ?? service.base_duration;
        const requested_end = new Date(
          requested_start.getTime() + duration * 60_000,
        );

        // C. Must fit inside working shift
        const shift_start = to_utc(
          local_date_str,
          sched.shift_start,
          validated_data.timezone,
        );
        const shift_end = to_utc(
          local_date_str,
          sched.shift_end,
          validated_data.timezone,
        );
        if (requested_start < shift_start || requested_end > shift_end)
          continue;

        // D. Check time-off collision
        const has_time_off = time_offs.some(
          (to) =>
            to.employee_id.toString() === emp._id.toString() &&
            requested_start < to.end_time &&
            requested_end > to.start_time,
        );
        if (has_time_off) continue;

        // E. Check booking & lock collision (including buffer time)
        const candidate_buffer = service.buffer_time || 0;
        const candidate_blocked_end = new Date(
          requested_end.getTime() + candidate_buffer * 60_000,
        );

        const has_collision = [...existing_bookings, ...existing_locks].some(
          (r) => {
            if (r.employee_id.toString() !== emp._id.toString()) return false;
            const buffer = (r.service_id as any)?.buffer_time || 0;
            const blocked_end = new Date(
              r.end_time.getTime() + buffer * 60_000,
            );
            return (
              requested_start < blocked_end &&
              candidate_blocked_end > r.start_time
            );
          },
        );

        if (!has_collision) {
          selected_employee = emp;
          final_duration = duration;
          break;
        }
      }

      if (!selected_employee) {
        throw new Error("SLOT_TAKEN");
      }

      assigned_employee_id = selected_employee._id.toString();
      const requested_end = new Date(
        requested_start.getTime() + final_duration * 60_000,
      );

      // 5. Release any stale locks this user already holds on this slot
      await BookingLock.deleteMany(
        {
          user_id,
          service_id: validated_data.service_id,
          expires_at: { $lt: new Date() },
        },
        { session: db_session },
      );

      // 6. Create the lock
      const [new_lock] = await BookingLock.create(
        [
          {
            user_id,
            business_id: service.business_id,
            service_id: validated_data.service_id,
            employee_id: assigned_employee_id,
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
      {
        user_id,
        service_id: validated_data.service_id,
        employee_id: assigned_employee_id!,
      },
      "Slot lock created",
    );

    return NextResponse.json(
      { success: true, lock_id: lock_id!, employee_id: assigned_employee_id! },
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
