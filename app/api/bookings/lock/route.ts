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
  items: z
    .array(
      z.object({
        service_id: z.string().min(1),
        quantity: z.number().int().positive().default(1),
        multiplier: z.number().int().positive().default(1),
      }),
    )
    .optional(),
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

export async function POST(request: Request) {
  // 1. Authentication Check
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

  // 2. Validate Input Parameters
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
    let assigned_employee_id: string | null = null;

    await db_session.withTransaction(async () => {
      // 3. Fetch Service Server-Side
      const service: any = await Service.findById(
        validated_data.service_id,
      ).session(db_session);
      if (!service) throw new Error("SERVICE_NOT_FOUND");
      if (!service.is_active) throw new Error("SERVICE_UNAVAILABLE");

      // Extract details sent from client UI configurations
      const matching_item = validated_data.items?.find(
        (i) => i.service_id === validated_data.service_id,
      );
      const requested_multiplier = matching_item?.multiplier || 1;
      const requested_quantity = matching_item?.quantity || 1;

      // Compute full continuous duration bounds
      const final_duration = service.base_duration * requested_multiplier;
      const requested_start = new Date(validated_data.start_time);
      requested_start.setUTCMilliseconds(0);
      const requested_end = new Date(
        requested_start.getTime() + final_duration * 60_000,
      );

      const local_date_str = get_local_date_string(
        requested_start,
        validated_data.timezone,
      );
      const day_name = get_local_day_name(
        requested_start,
        validated_data.timezone,
      );

      const day_start = new Date(`${local_date_str}T00:00:00Z`);
      const day_end = new Date(`${local_date_str}T23:59:59.999Z`);

      // ─── FORK A: RESOURCE BASED LOGIC ───
      if (
        service.service_type === "resource_based" ||
        !service.assigned_employees ||
        service.assigned_employees.length === 0
      ) {
        const max_inventory = Number(service.max_concurrent_bookings) || 0;
        if (max_inventory <= 0) throw new Error("SLOT_TAKEN");

        // CRITICAL FIX: Clear all expired locks out globally first so inventory capacity metrics are precise
        await BookingLock.deleteMany(
          { service_id: service._id, expires_at: { $lte: new Date() } },
          { session: db_session },
        );

        // Fetch conflicting records overlapping anywhere inside our window
        const [overlapping_bookings, overlapping_locks] = await Promise.all([
          Booking.find({
            service_id: service._id,
            status: { $nin: ["cancelled", "no_show", "refunded"] },
            start_time: { $lt: requested_end },
            end_time: { $gt: requested_start },
          }).session(db_session),

          BookingLock.find({
            service_id: service._id,
            expires_at: { $gt: new Date() },
            start_time: { $lt: requested_end },
            end_time: { $gt: requested_start },
          }).session(db_session),
        ]);

        // CRITICAL FIX: Construct absolute timeline peaks checking both start and end timestamps
        const check_points = Array.from(
          new Set([
            requested_start.getTime(),
            ...overlapping_bookings.map((b) => b.start_time.getTime()),
            ...overlapping_bookings.map((b) => b.end_time.getTime()),
            ...overlapping_locks.map((l) => l.start_time.getTime()),
            ...overlapping_locks.map((l) => l.end_time.getTime()),
          ]),
        ).sort((a, b) => a - b);

        const candidate_buffer = service.buffer_time || 0;
        const candidate_blocked_end = new Date(
          requested_end.getTime() + candidate_buffer * 60_000,
        );

        // Test every critical window intersection point
        for (const time_ms of check_points) {
          const target_time = new Date(time_ms);

          // We check resource limits if the timestamp lands inside our booking interval
          if (
            target_time >= requested_start &&
            target_time < candidate_blocked_end
          ) {
            const booked_at_spot = overlapping_bookings.reduce((sum, b) => {
              const b_buffer = b.buffer_time || 0;
              const b_blocked_end = new Date(
                b.end_time.getTime() + b_buffer * 60_000,
              );

              if (target_time >= b.start_time && target_time < b_blocked_end) {
                // Dynamic fallback checking quantity schema variables safely
                return sum + (b.quantity || b.inventory_quantity || 1);
              }
              return sum;
            }, 0);

            const locked_at_spot = overlapping_locks.reduce((sum, l) => {
              // Ignore this user's own current live lock for the same service if they are trying to refresh/re-lock it
              if (
                l.user_id === user_id &&
                l.start_time.getTime() === requested_start.getTime()
              ) {
                return sum;
              }

              const l_buffer = l.buffer_time || 0;
              const l_blocked_end = new Date(
                l.end_time.getTime() + l_buffer * 60_000,
              );

              if (target_time >= l.start_time && target_time < l_blocked_end) {
                return sum + (l.inventory_quantity || l.quantity || 1);
              }
              return sum;
            }, 0);

            // If combined current load exceeds maximum allowed inventory ceiling, abort!
            if (
              max_inventory - (booked_at_spot + locked_at_spot) <
              requested_quantity
            ) {
              throw new Error("SLOT_TAKEN");
            }
          }
        }

        await BookingLock.deleteMany(
          { user_id, service_id: validated_data.service_id },
          { session: db_session },
        );

        const [new_lock] = await BookingLock.create(
          [
            {
              user_id,
              business_id: service.business_id,
              service_id: validated_data.service_id,
              employee_id: null,
              inventory_quantity: requested_quantity,
              start_time: requested_start,
              end_time: requested_end,
              expires_at: new Date(Date.now() + 5 * 60_000),
            },
          ],
          { session: db_session },
        );

        lock_id = new_lock._id.toString();
      } else if (service.allow_multiple_bookings) {
        // ─── FORK C: GROUP / MULTI-BOOKING SESSION ───
        // Multiple customers can hold the same service_id + start_time slot,
        // capped at max_bookings_per_slot, regardless of employee availability.
        const requested_employee_id = validated_data.employee_id;
        const assigned_ids =
          service.assigned_employees?.map((id: any) => id.toString()) || [];

        if (assigned_ids.length === 0) throw new Error("EMPLOYEE_INVALID");

        if (requested_employee_id && requested_employee_id !== "any") {
          if (!assigned_ids.includes(requested_employee_id))
            throw new Error("EMPLOYEE_INVALID");
        }
        const representative_employee_id =
          requested_employee_id && requested_employee_id !== "any"
            ? requested_employee_id
            : assigned_ids[0];

        const max_capacity = Number(service.max_bookings_per_slot) || 1;

        await BookingLock.deleteMany(
          { service_id: service._id, expires_at: { $lte: new Date() } },
          { session: db_session },
        );

        const [existing_bookings, existing_locks] = await Promise.all([
          Booking.find({
            service_id: service._id,
            status: { $nin: ["cancelled", "no_show", "refunded"] },
            start_time: requested_start,
          }).session(db_session),
          BookingLock.find({
            service_id: service._id,
            expires_at: { $gt: new Date() },
            start_time: requested_start,
          }).session(db_session),
        ]);

        const own_prior_locks = existing_locks.filter(
          (l) => l.user_id === user_id,
        ).length;
        const occupied =
          existing_bookings.length + existing_locks.length - own_prior_locks;

        if (occupied >= max_capacity) throw new Error("SLOT_TAKEN");

        await BookingLock.deleteMany(
          { user_id, service_id: validated_data.service_id },
          { session: db_session },
        );

        const [new_lock] = await BookingLock.create(
          [
            {
              user_id,
              business_id: service.business_id,
              service_id: validated_data.service_id,
              employee_id: null,
              start_time: requested_start,
              end_time: requested_end,
              expires_at: new Date(Date.now() + 5 * 60_000),
            },
          ],
          { session: db_session },
        );

        lock_id = new_lock._id.toString();
        assigned_employee_id = representative_employee_id;
      } else {
        let candidate_ids: string[] = [];
        const requested_employee_id = validated_data.employee_id;

        if (requested_employee_id && requested_employee_id !== "any") {
          const is_assigned = service.assigned_employees
            ?.map((id: any) => id.toString())
            .includes(requested_employee_id);
          if (!is_assigned) throw new Error("EMPLOYEE_INVALID");
          candidate_ids = [requested_employee_id];
        } else {
          candidate_ids =
            service.assigned_employees?.map((id: any) => id.toString()) || [];
        }

        if (candidate_ids.length === 0) throw new Error("EMPLOYEE_INVALID");

        const employees = await Employee.find({
          _id: { $in: candidate_ids },
          is_active: true,
        }).session(db_session);

        if (employees.length === 0) throw new Error("EMPLOYEE_INVALID");

        const [existing_bookings, existing_locks, time_offs] =
          await Promise.all([
            Booking.find({
              employee_id: { $in: candidate_ids },
              status: { $nin: ["cancelled", "no_show", "refunded"] },
              start_time: { $lt: day_end },
              end_time: { $gt: day_start },
            }).session(db_session),

            BookingLock.find({
              employee_id: { $in: candidate_ids },
              expires_at: { $gt: new Date() },
              start_time: { $lt: day_end },
              end_time: { $gt: day_start },
            }).session(db_session),

            EmployeeTimeOff.find({
              employee_id: { $in: candidate_ids },
              start_time: { $lt: day_end },
              end_time: { $gt: day_start },
            }).session(db_session),
          ]);

        let selected_employee: any = null;

        for (const emp of employees) {
          const sched = emp.availability_schedule?.find(
            (s: any) => s.day_of_week === day_name && s.is_working,
          );
          if (!sched) continue;

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

          const has_time_off = time_offs.some(
            (to) =>
              to.employee_id.toString() === emp._id.toString() &&
              requested_start < to.end_time &&
              requested_end > to.start_time,
          );
          if (has_time_off) continue;

          const candidate_buffer = service.buffer_time || 0;
          const candidate_blocked_end = new Date(
            requested_end.getTime() + candidate_buffer * 60_000,
          );

          const has_collision = [...existing_bookings, ...existing_locks].some(
            (r) => {
              if (
                !r.employee_id ||
                r.employee_id.toString() !== emp._id.toString()
              )
                return false;
              const buffer = r.buffer_time || 0;
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
            break;
          }
        }

        if (!selected_employee) throw new Error("SLOT_TAKEN");

        assigned_employee_id = selected_employee._id.toString();

        await BookingLock.deleteMany(
          { user_id, service_id: validated_data.service_id },
          { session: db_session },
        );

        const [new_lock] = await BookingLock.create(
          [
            {
              user_id,
              business_id: service.business_id,
              service_id: validated_data.service_id,
              employee_id: assigned_employee_id,
              start_time: requested_start,
              end_time: requested_end,
              expires_at: new Date(Date.now() + 5 * 60_000),
            },
          ],
          { session: db_session },
        );

        lock_id = new_lock._id.toString();
      }
    });

    return NextResponse.json(
      { success: true, lock_id: lock_id!, employee_id: assigned_employee_id },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    logger.error({ error, user_id }, "Lock transaction pipeline failed");

    const [status, client_message] =
      message === "SLOT_TAKEN"
        ? [409, "Requested quantity/time units are no longer available"]
        : message === "SERVICE_NOT_FOUND"
          ? [404, "Service not found"]
          : message === "SERVICE_UNAVAILABLE"
            ? [400, "Service is currently not active"]
            : [500, "Unable to secure holding space, please re-request slots"];

    return NextResponse.json(
      { success: false, code: message, message: client_message },
      { status },
    );
  } finally {
    await db_session.endSession();
  }
}
