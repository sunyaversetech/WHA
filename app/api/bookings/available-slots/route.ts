import { z, ZodError } from "zod";
import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import Booking from "@/server/models/Booking.model";
import { BookingLock } from "@/server/models/BookingLock.model";
import { Employee } from "@/server/models/Employee.model";
import { EmployeeTimeOff } from "@/server/models/EmployeeTimeOff.model";
import { Service } from "@/server/models/Service.model";
import { logger } from "@/lib/logger";
import { OperatingHours } from "@/server/models/OperatingHour.model";

const DEAD_BOOKING_STATUSES = ["cancelled", "no_show", "refunded"];
const SLOT_STEP_MINUTES = 10; // 10-min intervals for all service types
const DEFAULT_BIZ_START = "09:00";
const DEFAULT_BIZ_END = "17:00";

const query_schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  service_id: z.string().min(1),
  employee_id: z.string().min(1).optional(),
  timezone: z.string().min(1).default("UTC"),
  business_id: z.string().min(1).optional(),
  duration_minutes: z.string().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert a local date+time string pair to a UTC Date.
 * Accepts both "9:00 AM" (12-hour) and "09:00" (24-hour) formats.
 */
function to_utc(date_str: string, time_str: string, timezone: string): Date {
  if (!time_str) throw new Error(`to_utc: empty time_str for ${date_str}`);
  let t = time_str.trim();

  if (t.toLowerCase().includes("am") || t.toLowerCase().includes("pm")) {
    const m = t.match(/^(\d+):(\d+)\s*(am|pm)$/i);
    if (m) {
      let h = parseInt(m[1], 10);
      const min = m[2];
      const mod = m[3].toLowerCase();
      if (h === 12) h = 0;
      if (mod === "pm") h += 12;
      t = `${String(h).padStart(2, "0")}:${min.padStart(2, "0")}`;
    }
  }

  // Build a UTC timestamp by interpreting the time as "local" in the given tz.
  // Approach: build an ISO string without tz, ask Intl to format it IN the given
  // tz (which just echoes back the local time), then parse that as UTC.
  const naive = new Date(`${date_str}T${t}:00Z`); // treat as UTC momentarily
  // Re-express in the target tz to find the wall-clock offset
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(naive);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  const offsetISO = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
  const inTz = new Date(offsetISO + "Z"); // treat as UTC to get ms
  // The difference is the timezone offset
  const offset_ms = inTz.getTime() - naive.getTime();

  // Apply the offset: target "local" time - offset = UTC
  return new Date(naive.getTime() - offset_ms);
}

/** Returns lowercase full day name, e.g. "thursday" */
function get_local_day_name(date_str: string, timezone: string): string {
  const d = new Date(`${date_str}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
  })
    .format(d)
    .toLowerCase();
}

/** Returns SHORT day name, e.g. "Thu" */
function get_local_day_short(date_str: string, timezone: string): string {
  const d = new Date(`${date_str}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(d);
}

/**
 * Normalize a stored day_of_week value to a lowercase full name
 * so it can be compared against get_local_day_name().
 * Handles: "Monday", "monday", "Mon", "mon"
 */
const DAY_SHORT_TO_FULL: Record<string, string> = {
  sun: "sunday",
  mon: "monday",
  tue: "tuesday",
  wed: "wednesday",
  thu: "thursday",
  fri: "friday",
  sat: "saturday",
};
function normalize_day(d: string): string {
  if (!d) return "";
  const lower = d.toLowerCase().trim();
  if (lower.length === 3 && DAY_SHORT_TO_FULL[lower])
    return DAY_SHORT_TO_FULL[lower];
  return lower; // already full name in lowercase
}

const empty_response = () =>
  NextResponse.json({ success: true, count: 0, available_slots: [] });

// ─── Business hours lookup ────────────────────────────────────────────────────

async function get_business_window(
  business_id: string,
  day_name: string,
): Promise<{ is_open: boolean; start_str: string; end_str: string }> {
  const bh: any = await OperatingHours.findOne({ business_id }).lean();
  if (!bh)
    return {
      is_open: true,
      start_str: DEFAULT_BIZ_START,
      end_str: DEFAULT_BIZ_END,
    };
  if (bh.is24_7) return { is_open: true, start_str: "00:00", end_str: "23:59" };
  const day_sched = (bh.schedule as any[])?.find(
    (h: any) => h.day.toLowerCase() === day_name,
  );
  if (!day_sched || !day_sched.isOpen)
    return {
      is_open: false,
      start_str: DEFAULT_BIZ_START,
      end_str: DEFAULT_BIZ_END,
    };
  return {
    is_open: true,
    start_str: day_sched.openTime,
    end_str: day_sched.closeTime,
  };
}

// ─── GET Handler ─────────────────────────────────────────────────────────────

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
      duration_minutes: searchParams.get("duration_minutes") ?? undefined,
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

    const service: any = await Service.findById(params.service_id).lean();
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
    const day_short = get_local_day_short(params.date, params.timezone);
    const start_of_day = new Date(`${params.date}T00:00:00Z`);
    const end_of_day = new Date(`${params.date}T23:59:59.999Z`);
    const now = new Date();

    const step_minutes: number = SLOT_STEP_MINUTES; // 10-min intervals for all service types
    const step_ms = step_minutes * 60_000;
    const selected_duration: number = params.duration_minutes
      ? parseInt(params.duration_minutes, 10)
      : service.base_duration;

    const target_business_id = params.business_id || service.business_id;
    const available_slots: string[] = [];

    // ══════════════════════════════════════════════════════════════════════════
    // PIPELINE 1 — RESOURCE BASED
    // "specific" → service.availability_schedule  |  "always" → business hours
    // ══════════════════════════════════════════════════════════════════════════
    if (service.service_type === "resource_based") {
      const max_inventory = Number(service.max_concurrent_bookings) || 0;
      if (max_inventory <= 0) return empty_response();

      let open_str: string;
      let close_str: string;

      if (service.availability_type === "specific") {
        const day_sched_res = (service.availability_schedule as any[])?.find(
          (s: any) => {
            const n = normalize_day(s.day_of_week);
            return n === day_name || n === normalize_day(day_short);
          },
        );
        if (!day_sched_res || !day_sched_res.is_available)
          return empty_response();
        open_str = day_sched_res.start_time as string;
        close_str = day_sched_res.end_time as string;
      } else {
        // "always" → use business operating hours
        const biz = await get_business_window(target_business_id, day_name);
        if (!biz.is_open) return empty_response();
        open_str = biz.start_str;
        close_str = biz.end_str;
      }

      const open_time = to_utc(params.date, open_str, params.timezone);
      const close_time = to_utc(params.date, close_str, params.timezone);

      const [bookings, locks] = await Promise.all([
        Booking.find({
          service_id: service._id,
          status: { $nin: DEAD_BOOKING_STATUSES },
          start_time: { $lt: end_of_day },
          end_time: { $gt: start_of_day },
        })
          .populate("service_id", "buffer_time")
          .lean(),
        BookingLock.find({
          service_id: service._id,
          start_time: { $lt: end_of_day },
          end_time: { $gt: start_of_day },
          expires_at: { $gt: now },
        })
          .populate("service_id", "buffer_time")
          .lean(),
      ]);

      let runner =
        params.date === today
          ? new Date(Math.max(now.getTime(), open_time.getTime()))
          : open_time;
      // Snap to step boundary relative to open_time (not epoch) so slots stay
      // aligned to the opening hour regardless of timezone offset.
      const res_snap = (runner.getTime() - open_time.getTime()) % step_ms;
      if (res_snap > 0)
        runner = new Date(runner.getTime() + (step_ms - res_snap));

      while (runner < close_time) {
        const slot_end = new Date(
          runner.getTime() + selected_duration * 60_000,
        );
        const buffer = service.buffer_time || 0;
        const blocked_end = new Date(slot_end.getTime() + buffer * 60_000);

        if (slot_end > close_time) break;

        // Count concurrent usage at every relevant time point within this window
        const check_ms = new Set<number>([runner.getTime()]);
        bookings.forEach((b) => {
          const t = (b.start_time as Date).getTime();
          if (t >= runner.getTime() && t < blocked_end.getTime())
            check_ms.add(t);
        });
        locks.forEach((l) => {
          const t = (l.start_time as Date).getTime();
          if (t >= runner.getTime() && t < blocked_end.getTime())
            check_ms.add(t);
        });

        let peak = 0;
        for (const ms of check_ms) {
          const pt = new Date(ms);
          const booked = bookings.reduce((sum, b) => {
            const b_buf = (b.service_id as any)?.buffer_time || 0;
            const b_end = new Date(
              (b.end_time as Date).getTime() + b_buf * 60_000,
            );
            return pt >= (b.start_time as Date) && pt < b_end
              ? sum + (b.inventory_quantity || 1)
              : sum;
          }, 0);
          const locked = locks.reduce((sum, l) => {
            const l_buf = (l.service_id as any)?.buffer_time || 0;
            const l_end = new Date(
              (l.end_time as Date).getTime() + l_buf * 60_000,
            );
            return pt >= (l.start_time as Date) && pt < l_end
              ? sum + (l.inventory_quantity || 1)
              : sum;
          }, 0);
          const total = booked + locked;
          if (total > peak) peak = total;
        }

        if (max_inventory - peak > 0)
          available_slots.push(runner.toISOString());
        runner = new Date(runner.getTime() + step_ms);
      }

      return NextResponse.json({
        success: true,
        count: available_slots.length,
        available_slots,
      });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PIPELINE 2 — GROUP SESSION
    // "specific" → group_schedule fixed slots  |  "always" → business hours + 10-min grid
    // ══════════════════════════════════════════════════════════════════════════
    if (service.service_type === "group_session") {
      const [group_bookings, group_locks] = await Promise.all([
        Booking.find({
          service_id: service._id,
          status: { $nin: DEAD_BOOKING_STATUSES },
          start_time: { $lt: end_of_day },
          end_time: { $gt: start_of_day },
        }).lean(),
        BookingLock.find({
          service_id: service._id,
          start_time: { $lt: end_of_day },
          end_time: { $gt: start_of_day },
          expires_at: { $gt: now },
        }).lean(),
      ]);

      if (service.availability_type === "specific") {
        // Fixed discrete slots from group_schedule
        const day_sched_grp = (service.group_schedule as any[])?.find(
          (d: any) => {
            const n = normalize_day(d.day_of_week);
            return n === day_name || n === normalize_day(day_short);
          },
        );
        if (
          !day_sched_grp ||
          !day_sched_grp.is_active ||
          !day_sched_grp.slots?.length
        )
          return empty_response();

        for (const slot of day_sched_grp.slots as any[]) {
          const slot_start = to_utc(
            params.date,
            slot.start_time,
            params.timezone,
          );
          if (params.date === today && slot_start <= now) continue;
          const capacity = Number(slot.capacity) || 1;
          const taken =
            group_bookings.filter(
              (b) =>
                Math.abs(
                  (b.start_time as Date).getTime() - slot_start.getTime(),
                ) < 60_000,
            ).length +
            group_locks.filter(
              (l) =>
                Math.abs(
                  (l.start_time as Date).getTime() - slot_start.getTime(),
                ) < 60_000,
            ).length;
          if (taken < capacity) available_slots.push(slot_start.toISOString());
        }
      } else {
        // "always" → generate 10-min grid within business operating hours
        const biz = await get_business_window(target_business_id, day_name);
        if (!biz.is_open) return empty_response();

        const open_time = to_utc(params.date, biz.start_str, params.timezone);
        const close_time = to_utc(params.date, biz.end_str, params.timezone);
        const max_capacity = Number(service.max_bookings_per_slot) || 1;

        let runner =
          params.date === today
            ? new Date(Math.max(now.getTime(), open_time.getTime()))
            : open_time;
        const grp_snap = (runner.getTime() - open_time.getTime()) % step_ms;
        if (grp_snap > 0)
          runner = new Date(runner.getTime() + (step_ms - grp_snap));

        while (runner < close_time) {
          const slot_end = new Date(
            runner.getTime() + selected_duration * 60_000,
          );
          if (slot_end > close_time) break;
          const occupied =
            group_bookings.filter(
              (b) =>
                Math.abs((b.start_time as Date).getTime() - runner.getTime()) <
                1000,
            ).length +
            group_locks.filter(
              (l) =>
                Math.abs((l.start_time as Date).getTime() - runner.getTime()) <
                1000,
            ).length;
          if (occupied < max_capacity)
            available_slots.push(runner.toISOString());
          runner = new Date(runner.getTime() + step_ms);
        }
      }

      return NextResponse.json({
        success: true,
        count: available_slots.length,
        available_slots,
      });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PIPELINE 3 — EMPLOYEE BASED
    // Uses employees' availability_schedule for the time window
    // ══════════════════════════════════════════════════════════════════════════
    const employees_to_check = params.employee_id
      ? await Employee.find({ _id: params.employee_id, is_active: true }).lean()
      : await Employee.find({
          _id: { $in: service.assigned_employees },
          is_active: true,
        }).lean();

    if (employees_to_check.length === 0) {
      return empty_response();
    }

    const employee_ids = employees_to_check.map((e) => e._id);

    // Clean up expired locks
    await BookingLock.deleteMany({ expires_at: { $lte: new Date() } });

    const [existing_bookings, existing_locks, time_offs] = await Promise.all([
      Booking.find({
        employee_id: { $in: employee_ids },
        status: { $nin: DEAD_BOOKING_STATUSES },
        start_time: { $lt: end_of_day },
        end_time: { $gt: start_of_day },
      })
        .populate("service_id", "buffer_time")
        .lean(),
      BookingLock.find({
        employee_id: { $in: employee_ids },
        start_time: { $lt: end_of_day },
        end_time: { $gt: start_of_day },
        expires_at: { $gt: now },
      })
        .populate("service_id", "buffer_time")
        .lean(),
      EmployeeTimeOff.find({
        employee_id: { $in: employee_ids },
        start_time: { $lt: end_of_day },
        end_time: { $gt: start_of_day },
      }).lean(),
    ]);

    const blocked_records = [...existing_bookings, ...existing_locks];

    // Find the earliest shift start across all eligible employees for this day.
    // availability_schedule[].shifts is an array of { start, end } windows.
    let earliest_shift_start = end_of_day;
    for (const emp of employees_to_check) {
      const day_sched = (emp as any).availability_schedule?.find((s: any) => {
        return normalize_day(s.day_of_week) === day_name && s.is_working;
      });
      if (!day_sched?.shifts?.length) continue;
      for (const shift of day_sched.shifts) {
        if (!shift.start) continue;
        const t = to_utc(params.date, shift.start, params.timezone);
        if (t < earliest_shift_start) earliest_shift_start = t;
      }
    }

    // If no employee has scheduled hours today, return empty.
    if (earliest_shift_start >= end_of_day) {
      return NextResponse.json({
        success: true,
        count: 0,
        available_slots: [],
      });
    }

    let runner =
      params.date === today
        ? new Date(Math.max(now.getTime(), earliest_shift_start.getTime()))
        : earliest_shift_start;
    // Snap to step boundary relative to the earliest shift start.
    const emp_snap =
      (runner.getTime() - earliest_shift_start.getTime()) % step_ms;
    if (emp_snap > 0)
      runner = new Date(runner.getTime() + (step_ms - emp_snap));

    while (runner < end_of_day) {
      let available = false;

      for (const employee of employees_to_check) {
        const day_sched = (employee as any).availability_schedule?.find(
          (s: any) => normalize_day(s.day_of_week) === day_name && s.is_working,
        );
        if (!day_sched?.shifts?.length) continue;

        const override = (employee as any).service_overrides?.find(
          (o: any) => o.service_id?.toString() === params.service_id,
        );
        const duration =
          selected_duration ??
          override?.custom_duration ??
          service.base_duration;

        const slot_end = new Date(runner.getTime() + duration * 60_000);

        const fits_shift = day_sched.shifts.some((shift: any) => {
          if (!shift.start || !shift.end) return false;
          const shift_start = to_utc(params.date, shift.start, params.timezone);
          const shift_end = to_utc(params.date, shift.end, params.timezone);
          return runner >= shift_start && slot_end <= shift_end;
        });

        if (!fits_shift) continue;

        const has_time_off = time_offs.some(
          (to: any) =>
            to.employee_id.toString() === (employee as any)._id.toString() &&
            runner < (to.end_time as Date) &&
            slot_end > (to.start_time as Date),
        );
        if (has_time_off) continue;

        const candidate_buffer = service.buffer_time || 0;
        const candidate_blocked_end = new Date(
          slot_end.getTime() + candidate_buffer * 60_000,
        );

        const has_collision = blocked_records.some((r) => {
          if (
            !r.employee_id ||
            r.employee_id.toString() !== (employee as any)._id.toString()
          )
            return false;
          const buf = (r.service_id as any)?.buffer_time || 0;
          const r_end = new Date((r.end_time as Date).getTime() + buf * 60_000);
          return (
            runner < r_end && candidate_blocked_end > (r.start_time as Date)
          );
        });

        if (!has_collision) {
          available = true;
          break;
        }
      }

      if (available) available_slots.push(runner.toISOString());
      runner = new Date(runner.getTime() + step_ms);
    }

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
