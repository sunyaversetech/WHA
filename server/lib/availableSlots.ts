import Booking from "@/server/models/Booking.model";
import { BookingLock } from "@/server/models/BookingLock.model";
import { Employee } from "@/server/models/Employee.model";
import { EmployeeTimeOff } from "@/server/models/EmployeeTimeOff.model";
import { OperatingHours } from "@/server/models/OperatingHour.model";

// Shared by the single-service and batch available-slots routes — this is
// the one place the actual slot-computation logic lives, so the two never
// drift out of sync on this delicate date/booking-conflict arithmetic.

export const DEAD_BOOKING_STATUSES = ["cancelled", "no_show", "refunded"];
export const SLOT_STEP_MINUTES = 10; // 10-min intervals for all service types
const DEFAULT_BIZ_START = "09:00";
const DEFAULT_BIZ_END = "17:00";

/**
 * Convert a local date+time string pair to a UTC Date.
 * Accepts both "9:00 AM" (12-hour) and "09:00" (24-hour) formats.
 */
export function to_utc(date_str: string, time_str: string, timezone: string): Date {
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
export function get_local_day_name(date_str: string, timezone: string): string {
  const d = new Date(`${date_str}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
  })
    .format(d)
    .toLowerCase();
}

/** Returns SHORT day name, e.g. "Thu" */
export function get_local_day_short(date_str: string, timezone: string): string {
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
export function normalize_day(d: string): string {
  if (!d) return "";
  const lower = d.toLowerCase().trim();
  if (lower.length === 3 && DAY_SHORT_TO_FULL[lower])
    return DAY_SHORT_TO_FULL[lower];
  return lower; // already full name in lowercase
}

export async function get_business_window(
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

export type SlotResult = {
  available_slots: string[];
  slot_remaining?: Record<string, number>;
};

const EMPTY_RESULT: SlotResult = { available_slots: [] };

export type ComputeSlotsOptions = {
  date: string;
  timezone: string;
  employee_id?: string;
  business_id?: string;
  duration_minutes?: number;
};

/**
 * Computes available slots for a single service on a single date. `service`
 * must already be the loaded (lean) Service document — callers that need
 * this for many services at once should batch-fetch those up front rather
 * than calling this once per service with a fresh findById each time.
 */
export async function computeAvailableSlotsForService(
  service: any,
  opts: ComputeSlotsOptions,
): Promise<SlotResult> {
  if (!service.is_active) return EMPTY_RESULT;

  const day_name = get_local_day_name(opts.date, opts.timezone);
  const day_short = get_local_day_short(opts.date, opts.timezone);
  const now_for_today = new Date();
  const local_today = new Intl.DateTimeFormat("en-CA", {
    timeZone: opts.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now_for_today);

  // Use local midnight boundaries so conflict checks cover the full local day,
  // not just the UTC calendar day (which drifts by the timezone offset).
  const start_of_day = to_utc(opts.date, "00:00", opts.timezone);
  const end_of_day = new Date(start_of_day.getTime() + 24 * 60 * 60 * 1000);
  const now = new Date();

  const step_minutes: number = SLOT_STEP_MINUTES;
  const step_ms = step_minutes * 60_000;
  const selected_duration: number = opts.duration_minutes ?? service.base_duration;

  const target_business_id = opts.business_id || service.business_id;
  const available_slots: string[] = [];

  // ════════════════════════════════════════════════════════════════════════
  // PIPELINE 1 — RESOURCE BASED
  // "specific" → service.availability_schedule  |  "always" → business hours
  // ════════════════════════════════════════════════════════════════════════
  if (service.service_type === "resource_based") {
    const max_inventory = Number(service.max_concurrent_bookings) || 0;
    if (max_inventory <= 0) return EMPTY_RESULT;

    let open_str: string;
    let close_str: string;

    if (service.availability_type === "specific") {
      const day_sched_res = (service.availability_schedule as any[])?.find(
        (s: any) => {
          const n = normalize_day(s.day_of_week);
          return n === day_name || n === normalize_day(day_short);
        },
      );
      if (!day_sched_res || !day_sched_res.is_available) return EMPTY_RESULT;
      open_str = day_sched_res.start_time as string;
      close_str = day_sched_res.end_time as string;
    } else {
      const biz = await get_business_window(target_business_id, day_name);
      if (!biz.is_open) return EMPTY_RESULT;
      open_str = biz.start_str;
      close_str = biz.end_str;
    }

    const open_time = to_utc(opts.date, open_str, opts.timezone);
    const close_time = to_utc(opts.date, close_str, opts.timezone);

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

    const slot_remaining: Record<string, number> = {};

    let runner =
      opts.date === local_today
        ? new Date(Math.max(now.getTime(), open_time.getTime()))
        : open_time;
    const res_snap = (runner.getTime() - open_time.getTime()) % step_ms;
    if (res_snap > 0) runner = new Date(runner.getTime() + (step_ms - res_snap));

    while (runner < close_time) {
      const slot_end = new Date(runner.getTime() + selected_duration * 60_000);
      const buffer = service.buffer_time || 0;
      const blocked_end = new Date(slot_end.getTime() + buffer * 60_000);

      if (slot_end > close_time) break;

      const check_ms = new Set<number>([runner.getTime()]);
      bookings.forEach((b) => {
        const t = (b.start_time as Date).getTime();
        if (t >= runner.getTime() && t < blocked_end.getTime()) check_ms.add(t);
      });
      locks.forEach((l) => {
        const t = (l.start_time as Date).getTime();
        if (t >= runner.getTime() && t < blocked_end.getTime()) check_ms.add(t);
      });

      let peak = 0;
      for (const ms of check_ms) {
        const pt = new Date(ms);
        const booked = bookings.reduce((sum, b) => {
          const b_buf = (b.service_id as any)?.buffer_time || 0;
          const b_end = new Date((b.end_time as Date).getTime() + b_buf * 60_000);
          return pt >= (b.start_time as Date) && pt < b_end
            ? sum + (b.inventory_quantity || 1)
            : sum;
        }, 0);
        const locked = locks.reduce((sum, l) => {
          const l_buf = (l.service_id as any)?.buffer_time || 0;
          const l_end = new Date((l.end_time as Date).getTime() + l_buf * 60_000);
          return pt >= (l.start_time as Date) && pt < l_end
            ? sum + (l.inventory_quantity || 1)
            : sum;
        }, 0);
        const total = booked + locked;
        if (total > peak) peak = total;
      }

      const remaining = max_inventory - peak;
      if (remaining > 0) {
        const slot_key = runner.toISOString();
        available_slots.push(slot_key);
        slot_remaining[slot_key] = remaining;
      }
      runner = new Date(runner.getTime() + step_ms);
    }

    return { available_slots, slot_remaining };
  }

  // ════════════════════════════════════════════════════════════════════════
  // PIPELINE 2 — GROUP SESSION
  // "specific" → group_schedule fixed slots  |  "always" → business hours + grid
  // ════════════════════════════════════════════════════════════════════════
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
      const day_sched_grp = (service.group_schedule as any[])?.find((d: any) => {
        const n = normalize_day(d.day_of_week);
        return n === day_name || n === normalize_day(day_short);
      });
      if (!day_sched_grp || !day_sched_grp.is_active || !day_sched_grp.slots?.length)
        return EMPTY_RESULT;

      for (const slot of day_sched_grp.slots as any[]) {
        const slot_start = to_utc(opts.date, slot.start_time, opts.timezone);
        if (opts.date === local_today && slot_start <= now) continue;
        const capacity = Number(slot.capacity) || 1;
        const taken =
          group_bookings.filter(
            (b) =>
              Math.abs((b.start_time as Date).getTime() - slot_start.getTime()) <
              60_000,
          ).length +
          group_locks.filter(
            (l) =>
              Math.abs((l.start_time as Date).getTime() - slot_start.getTime()) <
              60_000,
          ).length;
        if (taken < capacity) available_slots.push(slot_start.toISOString());
      }
    } else {
      const biz = await get_business_window(target_business_id, day_name);
      if (!biz.is_open) return EMPTY_RESULT;

      const open_time = to_utc(opts.date, biz.start_str, opts.timezone);
      const close_time = to_utc(opts.date, biz.end_str, opts.timezone);
      const max_capacity = Number(service.max_bookings_per_slot) || 1;

      let runner =
        opts.date === local_today
          ? new Date(Math.max(now.getTime(), open_time.getTime()))
          : open_time;
      const grp_snap = (runner.getTime() - open_time.getTime()) % step_ms;
      if (grp_snap > 0) runner = new Date(runner.getTime() + (step_ms - grp_snap));

      while (runner < close_time) {
        const slot_end = new Date(runner.getTime() + selected_duration * 60_000);
        if (slot_end > close_time) break;
        const occupied =
          group_bookings.filter(
            (b) =>
              Math.abs((b.start_time as Date).getTime() - runner.getTime()) < 1000,
          ).length +
          group_locks.filter(
            (l) =>
              Math.abs((l.start_time as Date).getTime() - runner.getTime()) < 1000,
          ).length;
        if (occupied < max_capacity) available_slots.push(runner.toISOString());
        runner = new Date(runner.getTime() + step_ms);
      }
    }

    return { available_slots };
  }

  // ════════════════════════════════════════════════════════════════════════
  // PIPELINE 3 — EMPLOYEE BASED
  // Uses employees' availability_schedule for the time window
  // ════════════════════════════════════════════════════════════════════════
  const employees_to_check = opts.employee_id
    ? await Employee.find({ _id: opts.employee_id, is_active: true }).lean()
    : await Employee.find({
        _id: { $in: service.assigned_employees },
        is_active: true,
      }).lean();

  if (employees_to_check.length === 0) return EMPTY_RESULT;

  const employee_ids = employees_to_check.map((e) => e._id);

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

  let earliest_shift_start = end_of_day;
  for (const emp of employees_to_check) {
    const day_sched = (emp as any).availability_schedule?.find((s: any) => {
      return normalize_day(s.day_of_week) === day_name && s.is_working;
    });
    if (!day_sched?.shifts?.length) continue;
    for (const shift of day_sched.shifts) {
      if (!shift.start) continue;
      const t = to_utc(opts.date, shift.start, opts.timezone);
      if (t < earliest_shift_start) earliest_shift_start = t;
    }
  }

  if (earliest_shift_start >= end_of_day) return EMPTY_RESULT;

  let runner =
    opts.date === local_today
      ? new Date(Math.max(now.getTime(), earliest_shift_start.getTime()))
      : earliest_shift_start;
  const emp_snap = (runner.getTime() - earliest_shift_start.getTime()) % step_ms;
  if (emp_snap > 0) runner = new Date(runner.getTime() + (step_ms - emp_snap));

  while (runner < end_of_day) {
    let available = false;

    for (const employee of employees_to_check) {
      const day_sched = (employee as any).availability_schedule?.find(
        (s: any) => normalize_day(s.day_of_week) === day_name && s.is_working,
      );
      if (!day_sched?.shifts?.length) continue;

      const override = (employee as any).service_overrides?.find(
        (o: any) => o.service_id?.toString() === service._id?.toString(),
      );
      const duration =
        selected_duration ?? override?.custom_duration ?? service.base_duration;

      const slot_end = new Date(runner.getTime() + duration * 60_000);

      const fits_shift = day_sched.shifts.some((shift: any) => {
        if (!shift.start || !shift.end) return false;
        const shift_start = to_utc(opts.date, shift.start, opts.timezone);
        const shift_end = to_utc(opts.date, shift.end, opts.timezone);
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
        if (!r.employee_id || r.employee_id.toString() !== (employee as any)._id.toString())
          return false;
        const buf = (r.service_id as any)?.buffer_time || 0;
        const r_end = new Date((r.end_time as Date).getTime() + buf * 60_000);
        return runner < r_end && candidate_blocked_end > (r.start_time as Date);
      });

      if (!has_collision) {
        available = true;
        break;
      }
    }

    if (available) available_slots.push(runner.toISOString());
    runner = new Date(runner.getTime() + step_ms);
  }

  return { available_slots };
}
