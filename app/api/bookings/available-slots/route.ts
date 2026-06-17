import { z, ZodError } from "zod";
import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import Booking from "@/server/models/Booking.model";
import { BookingLock } from "@/server/models/BookingLock.model";
import { Employee } from "@/server/models/Employee.model";
import { EmployeeTimeOff } from "@/server/models/EmployeeTimeOff.model";
import { Service } from "@/server/models/Service.model";
import { logger } from "@/lib/logger";
import User from "@/server/models/Auth.model";
import { OperatingHours } from "@/server/models/OperatingHour.model";

const DEAD_BOOKING_STATUSES = ["cancelled", "no_show", "refunded"];
const DEFAULT_SLOT_STEP_MINUTES = 30;

const DEFAULT_BUSINESS_START = "08:00";
const DEFAULT_BUSINESS_END = "18:00";

const query_schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  service_id: z.string().min(1),
  employee_id: z.string().min(1).optional(),
  timezone: z.string().min(1).default("UTC"),
  business_id: z.string().min(1).optional(),
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
      business_id: searchParams.get("business_id") ?? undefined,
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

    const day_name = get_local_day_name(params.date, params.timezone);
    const start_of_day = new Date(`${params.date}T00:00:00Z`);
    const end_of_day = new Date(`${params.date}T23:59:59.999Z`);
    const step_minutes: number =
      service.slot_interval ?? DEFAULT_SLOT_STEP_MINUTES;
    const step_ms = step_minutes * 60_000;
    const now = new Date();
    const available_slots: string[] = [];

    // ─── 1. ITEM BASED REVENUE PIPELINE ───
    if (service.business_type === "item_based") {
      const max_inventory = Number(service.inventory) || 0;
      if (max_inventory <= 0) {
        return NextResponse.json({
          success: true,
          count: 0,
          available_slots: [],
        });
      }

      const [bookings, locks] = await Promise.all([
        Booking.find({
          service_id: service._id,
          status: { $nin: DEAD_BOOKING_STATUSES },
          start_time: { $lt: end_of_day },
          end_time: { $gt: start_of_day },
        })
          .populate("service_id")
          .lean(),

        BookingLock.find({
          service_id: service._id,
          start_time: { $lt: end_of_day },
          end_time: { $gt: start_of_day },
          expires_at: { $gt: now },
        })
          .populate("service_id")
          .lean(),
      ]);

      const open_time = to_utc(
        params.date,
        DEFAULT_BUSINESS_START,
        params.timezone,
      );
      const close_time = to_utc(
        params.date,
        DEFAULT_BUSINESS_END,
        params.timezone,
      );
      const duration = service.base_duration;

      let runner =
        params.date === today
          ? new Date(Math.max(now.getTime(), open_time.getTime()))
          : open_time;

      runner = new Date(Math.ceil(runner.getTime() / step_ms) * step_ms);

      while (runner < close_time) {
        const slot_end = new Date(runner.getTime() + duration * 60_000);
        const candidate_buffer = service.buffer_time || 0;
        const candidate_blocked_end = new Date(
          slot_end.getTime() + candidate_buffer * 60_000,
        );

        if (slot_end > close_time) break;

        let peak_allocated = 0;
        const check_points = Array.from(
          new Set([
            runner.getTime(),
            ...bookings.map((b) => b.start_time.getTime()),
            ...locks.map((l) => l.start_time.getTime()),
          ]),
        );

        for (const time_ms of check_points) {
          const target_time = new Date(time_ms);

          if (target_time >= runner && target_time < candidate_blocked_end) {
            const booked_at_spot = bookings.reduce((sum, b) => {
              const b_buffer = (b.service_id as any)?.buffer_time || 0;
              const b_blocked_end = new Date(
                b.end_time.getTime() + b_buffer * 60_000,
              );
              return target_time >= b.start_time && target_time < b_blocked_end
                ? sum + (b.inventory_quantity || 1)
                : sum;
            }, 0);

            const locked_at_spot = locks.reduce((sum, l) => {
              const l_buffer = (l.service_id as any)?.buffer_time || 0;
              const l_blocked_end = new Date(
                l.end_time.getTime() + l_buffer * 60_000,
              );
              return target_time >= l.start_time && target_time < l_blocked_end
                ? sum + (l.inventory_quantity || 1)
                : sum;
            }, 0);

            const total_at_spot = booked_at_spot + locked_at_spot;
            if (total_at_spot > peak_allocated) {
              peak_allocated = total_at_spot;
            }
          }
        }

        if (max_inventory - peak_allocated > 0) {
          available_slots.push(runner.toISOString());
        }

        runner = new Date(runner.getTime() + step_ms);
      }

      return NextResponse.json({
        success: true,
        count: available_slots.length,
        available_slots,
      });
    }

    // ─── 2. PROFESSIONAL BASED / SERVICE PARAMETERS ───
    const employees_to_check = params.employee_id
      ? await Employee.find({ _id: params.employee_id, is_active: true }).lean()
      : await Employee.find({
          _id: { $in: service.assigned_employees },
          is_active: true,
        }).lean();

    // FALLBACK: Execute timeline computation using Business Operating Hours if no staff are assigned/available
    if (employees_to_check.length === 0) {
      if (!params.business_id) {
        return NextResponse.json({
          success: true,
          count: 0,
          available_slots: [],
        });
      }

      const business_hours = await OperatingHours.findOne({
        business_id: params.business_id,
      }).lean();

      if (!business_hours) {
        return NextResponse.json({
          success: true,
          count: 0,
          available_slots: [],
        });
      }

      // Maps to schema structure: "schedule", "day", "isOpen"
      const day_schedule = (business_hours.schedule as any[])?.find(
        (h) => h.day.toLowerCase() === day_name.toLowerCase() && h.isOpen,
      );

      if (!day_schedule) {
        return NextResponse.json({
          success: true,
          count: 0,
          available_slots: [],
        });
      }

      // Maps to schema properties: "openTime" and "closeTime"
      const open_time = to_utc(
        params.date,
        day_schedule.openTime,
        params.timezone,
      );
      const close_time = to_utc(
        params.date,
        day_schedule.closeTime,
        params.timezone,
      );
      const duration = service.base_duration;

      let runner =
        params.date === today
          ? new Date(Math.max(now.getTime(), open_time.getTime()))
          : open_time;

      runner = new Date(Math.ceil(runner.getTime() / step_ms) * step_ms);

      while (runner < close_time) {
        const slot_end = new Date(runner.getTime() + duration * 60_000);
        if (slot_end > close_time) break;

        available_slots.push(runner.toISOString());
        runner = new Date(runner.getTime() + step_ms);
      }

      return NextResponse.json({
        success: true,
        count: available_slots.length,
        available_slots,
      });
    }

    const employee_ids = employees_to_check.map((e) => e._id);

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
        expires_at: { $gt: now },
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

    const earliest_shift_start = employees_to_check.reduce((earliest, emp) => {
      const sched = emp.availability_schedule?.find(
        (s: any) => s.day_of_week === day_name && s.is_working,
      );
      if (!sched) return earliest;
      const shift_utc = to_utc(params.date, sched.shift_start, params.timezone);
      return shift_utc < earliest ? shift_utc : earliest;
    }, end_of_day);

    let runner =
      params.date === today
        ? new Date(Math.max(now.getTime(), earliest_shift_start.getTime()))
        : earliest_shift_start;

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

        if (runner < shift_start || slot_end > shift_end) continue;

        const has_time_off = time_offs.some(
          (to) =>
            to.employee_id.toString() === employee._id.toString() &&
            runner < to.end_time &&
            slot_end > to.start_time,
        );
        if (has_time_off) continue;

        const candidate_buffer = service.buffer_time || 0;
        const candidate_blocked_end = new Date(
          slot_end.getTime() + candidate_buffer * 60_000,
        );

        const has_collision = blocked_records.some((r) => {
          if (
            !r.employee_id ||
            r.employee_id.toString() !== employee._id.toString()
          )
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
