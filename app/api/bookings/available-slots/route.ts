// app/api/bookings/available-slots/route.ts
import { z, ZodError } from "zod";
import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import Booking from "@/server/models/Booking.model";
import { BookingLock } from "@/server/models/BookingLock.model";
import { Employee } from "@/server/models/Employee.model";
import { EmployeeTimeOff } from "@/server/models/EmployeeTimeOff.model";
import { Service } from "@/server/models/Service.model";
import { logger } from "@/lib/logger";

const DEAD_BOOKING_STATUSES = ["cancelled", "no_show", "refunded"];
const DEFAULT_SLOT_STEP_MINUTES = 30;

const query_schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  service_id: z.string().min(1),
  employee_id: z.string().min(1).optional(),
  timezone: z.string().min(1).default("UTC"),
});

const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

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

function get_local_day_name(date_str: string, timezone: string): string {
  const d = new Date(`${date_str}T12:00:00Z`);
  const local_day = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
  }).format(d);
  return local_day.toLowerCase();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  let params: z.infer<typeof query_schema>;
  try {
    params = query_schema.parse({
      date: searchParams.get("date"),
      service_id: searchParams.get("service_id"),
      employee_id: searchParams.get("employee_id") ?? undefined,
      timezone: searchParams.get("timezone") ?? "UTC",
    });
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
      { success: false, code: "INVALID_PARAMS" },
      { status: 400 },
    );
  }

  // 2. Reject past dates outright
  const today = new Date().toISOString().split("T")[0];
  if (params.date < today) {
    return NextResponse.json(
      {
        success: false,
        code: "PAST_DATE",
        message: "Cannot query slots for past dates",
      },
      { status: 400 },
    );
  }

  try {
    await connectToDb();

    // 3. Fetch service
    const service = await Service.findById(params.service_id).lean();
    if (!service) {
      return NextResponse.json(
        { success: false, code: "SERVICE_NOT_FOUND" },
        { status: 404 },
      );
    }
    if (!service.is_active) {
      return NextResponse.json(
        { success: false, code: "SERVICE_UNAVAILABLE" },
        { status: 400 },
      );
    }

    const employees_to_check = params.employee_id
      ? await Employee.find({
          _id: params.employee_id,
          is_active: true,
        }).lean()
      : await Employee.find({
          _id: { $in: service.assigned_employees },
          is_active: true,
        }).lean();

    if (employees_to_check.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        available_slots: [],
      });
    }

    // 5. Build UTC day boundaries from the business timezone
    const day_name = get_local_day_name(params.date, params.timezone);
    const start_of_day = new Date(`${params.date}T00:00:00Z`);
    const end_of_day = new Date(`${params.date}T23:59:59.999Z`);

    const employee_ids = employees_to_check.map((e) => e._id);

    // 6. Fetch bookings + active (non-expired) locks + employee time off
    const [existing_bookings, existing_locks, time_offs] = await Promise.all([
      Booking.find({
        employee_id: { $in: employee_ids },
        status: { $nin: DEAD_BOOKING_STATUSES },
        start_time: { $lt: end_of_day },
        end_time: { $gt: start_of_day },
      })
        .populate("service_id")
        .lean(),

      BookingLock.find({
        employee_id: { $in: employee_ids },
        start_time: { $lt: end_of_day },
        end_time: { $gt: start_of_day },
        expires_at: { $gt: new Date() }, // ← only active locks
      })
        .populate("service_id")
        .lean(),

      EmployeeTimeOff.find({
        employee_id: { $in: employee_ids },
        start_time: { $lt: end_of_day },
        end_time: { $gt: start_of_day },
      }).lean(),
    ]);

    const blocked_records = [...existing_bookings, ...existing_locks];

    // 7. Slot step — prefer service config, fall back to constant
    const step_minutes: number =
      service.slot_interval ?? DEFAULT_SLOT_STEP_MINUTES;

    const available_slots: string[] = [];
    const now = new Date();

    // 8. Loop — start from now if today, otherwise from earliest possible shift
    const earliest_shift_start = employees_to_check.reduce((earliest, emp) => {
      const sched = emp.availability_schedule?.find(
        (s: any) => s.day_of_week === day_name && s.is_working,
      );
      if (!sched) return earliest;
      const shift_utc = to_utc(params.date, sched.shift_start, params.timezone);
      return shift_utc < earliest ? shift_utc : earliest;
    }, end_of_day);

    // Start from now (if today) or from first shift start — skip midnight-to-shift dead time
    let runner =
      params.date === today
        ? new Date(Math.max(now.getTime(), earliest_shift_start.getTime()))
        : earliest_shift_start;

    // Snap runner to the next clean step boundary
    const step_ms = step_minutes * 60_000;
    runner = new Date(Math.ceil(runner.getTime() / step_ms) * step_ms);

    while (runner < end_of_day) {
      let available = false;

      for (const employee of employees_to_check) {
        const sched = employee.availability_schedule?.find(
          (s: any) => s.day_of_week === day_name && s.is_working,
        );
        if (!sched) continue;

        const override = employee.service_overrides?.find(
          (o: any) => o.service_id.toString() === params.service_id,
        );
        const duration = override?.custom_duration ?? service.base_duration;

        const shift_start = to_utc(
          params.date,
          sched.shift_start,
          params.timezone,
        );
        const shift_end = to_utc(params.date, sched.shift_end, params.timezone);
        const slot_end = new Date(runner.getTime() + duration * 60_000);

        // Must fit inside shift window
        if (runner < shift_start || slot_end > shift_end) continue;

        // Must not overlap any scheduled time off
        const has_time_off = time_offs.some(
          (to) =>
            to.employee_id.toString() === employee._id.toString() &&
            runner < to.end_time &&
            slot_end > to.start_time,
        );
        if (has_time_off) continue;

        // Must not overlap any booking or active lock (respecting buffer time)
        const candidate_buffer = service.buffer_time || 0;
        const candidate_blocked_end = new Date(
          slot_end.getTime() + candidate_buffer * 60_000,
        );

        const has_collision = blocked_records.some((r) => {
          if (r.employee_id.toString() !== employee._id.toString())
            return false;
          const buffer = (r.service_id as any)?.buffer_time || 0;
          const blocked_end = new Date(r.end_time.getTime() + buffer * 60_000);
          return runner < blocked_end && candidate_blocked_end > r.start_time;
        });

        if (!has_collision) {
          available = true;
          break;
        }
      }

      if (available) {
        available_slots.push(runner.toISOString());
      }

      runner = new Date(runner.getTime() + step_ms);
    }

    logger.info(
      {
        service_id: params.service_id,
        date: params.date,
        count: available_slots.length,
      },
      "Available slots fetched",
    );

    return NextResponse.json({
      success: true,
      count: available_slots.length,
      available_slots,
    });
  } catch (error: unknown) {
    logger.error({ error }, "Available slots fetch failed");
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: "Unable to fetch slots",
      },
      { status: 500 },
    );
  }
}
