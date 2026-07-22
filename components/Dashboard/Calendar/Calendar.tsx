"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Minus,
  ChevronDown,
  X,
  Clock,
  Package,
  Users,
  CalendarDays,
  User,
  Loader2,
  Ban,
  CalendarCheck,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetEmployees } from "@/services/employee.service";
import { useGetServices } from "@/services/services.service";
import { useGetCalendarBookings } from "@/services/calendar.service";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_H = 64; // px per hour
const GUTTER_W = 56; // time-label gutter width
const COL_MIN_W = 160; // minimum column width before horizontal scroll

// Sticky offsets — these match the dashboard layout's header heights exactly:
// Dashboard header: h-[56px] on mobile, h-[60px] on md+
// Calendar toolbar: h-[52px]
// Column headers need to stick below both
const TOOLBAR_H = 52;
const DASH_HEADER_H = 56; // matches h-[56px] in DashboardLayout
const DASH_HEADER_H_MD = 60; // matches md:h-[60px] in DashboardLayout
const MOBILE_SECONDARY_H = 44; // secondary row (mode+view+filter) on mobile
const COL_HEADER_TOP = DASH_HEADER_H + TOOLBAR_H; // 108 — desktop
const COL_HEADER_TOP_MD = DASH_HEADER_H_MD + TOOLBAR_H; // 112
const COL_HEADER_TOP_MOBILE = DASH_HEADER_H + TOOLBAR_H + MOBILE_SECONDARY_H; // 152 — mobile

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const RESOURCE_PALETTE = [
  "#051e3a",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#84cc16",
];

type CalendarView = "day" | "week";
type CalendarMode = "employee" | "resource";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(d: Date) {
  return sameDay(d, new Date());
}

function fmtISO(d: Date) {
  // Use LOCAL date parts so the date string matches what the user sees,
  // not the UTC date (which differs by timezone offset).
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtTime(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:${m.toString().padStart(2, "0")} ${ap}`;
}

function fmtHourLabel(h: number) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function resourceColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return RESOURCE_PALETTE[Math.abs(h) % RESOURCE_PALETTE.length];
}

function eventColor(booking: any, mode: CalendarMode) {
  if (mode === "employee")
    return booking.employee_id?.calendar_color || "#4DD0E1";
  const svcId = booking.service_id?._id || booking.service_id || "";
  return resourceColor(svcId);
}

function minutesFromMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function isDark(hex: string) {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b < 128;
  } catch {
    return true;
  }
}

// ─── Availability Helpers ─────────────────────────────────────────────────────

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/** Returns true if the employee's shift covers [timeStr, timeStr+durationMins] on dateStr. */
function empCanTakeSlot(
  employee: any,
  dateStr: string, // "YYYY-MM-DD"
  timeStr: string, // "HH:MM" (local, 24h)
  durationMins: number,
): boolean {
  if (!dateStr || !timeStr) return true; // not enough info yet — don't restrict
  const dayName = DAY_NAMES[new Date(dateStr + "T12:00:00").getDay()];
  const daySched = (employee.availability_schedule ?? []).find(
    (s: any) => (s.day_of_week ?? "").toLowerCase() === dayName,
  );
  if (!daySched?.is_working || !daySched.shifts?.length) return false;

  const [h, m] = timeStr.split(":").map(Number);
  const startMins = h * 60 + m;
  const endMins = startMins + durationMins;

  return daySched.shifts.some((shift: any) => {
    if (!shift.start || !shift.end) return false;
    const [sh, sm] = (shift.start as string).split(":").map(Number);
    const [eh, em] = (shift.end as string).split(":").map(Number);
    return startMins >= sh * 60 + sm && endMins <= eh * 60 + em;
  });
}

/** Returns true if the employee provides the service (service_overrides check). */
function empCanDoService(employee: any, serviceId: string): boolean {
  if (!employee.service_overrides?.length) return true; // no restrictions
  return employee.service_overrides.some((o: any) => {
    const id =
      typeof o.service_id === "string"
        ? o.service_id
        : (o.service_id?._id ?? o.service_id)?.toString();
    return id === serviceId;
  });
}

// ─── Column Avatar ────────────────────────────────────────────────────────────

function ColumnAvatar({
  name,
  photo,
  color,
  subtitle,
}: {
  name: string;
  photo?: string;
  color?: string;
  subtitle?: string;
}) {
  const bg = color || "#1e3a5f";
  const textColor = isDark(bg) ? "#ffffff" : "#000000";
  return (
    <div className="flex flex-col items-center gap-1.5 py-3 px-2 min-w-0">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-white/10"
        style={{ background: photo ? undefined : bg }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-bold" style={{ color: textColor }}>
            {getInitials(name)}
          </span>
        )}
      </div>
      <p className="text-xs font-semibold text-gray-900 leading-tight text-center truncate max-w-[130px]">
        {name}
      </p>
      {subtitle && (
        <p className="text-[10px] text-gray-400 leading-tight text-center truncate max-w-[130px] capitalize">
          {subtitle.replace(/_/g, " ")}
        </p>
      )}
    </div>
  );
}

// ─── Blocked Time Block ───────────────────────────────────────────────────────

function BlockedTimeBlock({
  entry,
  onDelete,
}: {
  entry: any;
  onDelete: (entry: any) => void;
}) {
  const start = new Date(entry.start_time);
  const end = new Date(entry.end_time);
  const top = (minutesFromMidnight(start) / 60) * HOUR_H;
  const mins = (end.getTime() - start.getTime()) / 60_000;
  const height = Math.max((mins / 60) * HOUR_H, 26);

  return (
    <button
      onClick={() => onDelete(entry)}
      style={{
        position: "absolute",
        top,
        left: 2,
        right: 2,
        height,
        zIndex: 6,
      }}
      className="rounded-md px-1.5 text-left overflow-hidden text-gray-600 border border-dashed border-gray-500/60 bg-gray-800/60 hover:bg-gray-700/70 transition-colors group">
      <div className="flex items-center gap-1">
        <Ban size={9} className="shrink-0 text-gray-400" />
        <p className="text-[10px] font-semibold leading-tight truncate">
          {fmtTime(start)} – {fmtTime(end)}
        </p>
      </div>
      {height >= 40 && (
        <p className="text-[10px] text-gray-500 leading-tight mt-0.5 truncate">
          {entry.description || "Blocked"}
        </p>
      )}
      <span className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <X size={10} className="text-red-400" />
      </span>
    </button>
  );
}

// ─── Overlap layout ───────────────────────────────────────────────────────────

function computeOverlapLayout(
  bookings: any[],
): Map<string, { colIndex: number; totalCols: number }> {
  const sorted = [...bookings].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );
  const layout = new Map<string, { colIndex: number; totalCols: number }>();

  // Assign a column index to each booking (greedy, like Google Calendar)
  for (const booking of sorted) {
    const start = new Date(booking.start_time).getTime();
    const end = new Date(booking.end_time).getTime();
    const overlapping = sorted.filter((b) => {
      const bs = new Date(b.start_time).getTime();
      const be = new Date(b.end_time).getTime();
      return bs < end && be > start;
    });
    const usedCols = new Set(
      overlapping
        .filter((b) => b._id !== booking._id && layout.has(b._id))
        .map((b) => layout.get(b._id)!.colIndex),
    );
    let colIndex = 0;
    while (usedCols.has(colIndex)) colIndex++;
    layout.set(booking._id, { colIndex, totalCols: 1 });
  }

  // Second pass: set totalCols = max colIndex+1 across each overlap group
  for (const booking of sorted) {
    const start = new Date(booking.start_time).getTime();
    const end = new Date(booking.end_time).getTime();
    const overlapping = sorted.filter((b) => {
      const bs = new Date(b.start_time).getTime();
      const be = new Date(b.end_time).getTime();
      return bs < end && be > start;
    });
    const totalCols =
      Math.max(...overlapping.map((b) => layout.get(b._id)?.colIndex ?? 0)) + 1;
    for (const b of overlapping) {
      const info = layout.get(b._id);
      if (info) layout.set(b._id, { ...info, totalCols });
    }
  }

  return layout;
}

// ─── Event Block ──────────────────────────────────────────────────────────────

function EventBlock({
  booking,
  mode,
  onClick,
  colIndex = 0,
  totalCols = 1,
}: {
  booking: any;
  mode: CalendarMode;
  onClick: () => void;
  colIndex?: number;
  totalCols?: number;
}) {
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);
  const top = (minutesFromMidnight(start) / 60) * HOUR_H;
  const height = Math.max(((booking.duration || 30) / 60) * HOUR_H, 26);
  const color = eventColor(booking, mode);
  const dark = isDark(color);
  const textCol = dark ? "#ffffff" : "#000000";
  const customerName =
    (booking.user_id as any)?.name || booking.customer_name || "Guest";
  const serviceName = booking.service_id?.name || "Service";
  const qty = booking.inventory_quantity;
  const isShort = height < 44;

  const GAP = 2;
  const pct = 100 / totalCols;
  const leftPct = colIndex * pct;
  const rightPct = (totalCols - colIndex - 1) * pct;

  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        top,
        left: `calc(${leftPct}% + ${GAP}px)`,
        right: `calc(${rightPct}% + ${GAP}px)`,
        height,
        background: color,
        color: textCol,
        zIndex: 5,
      }}
      className="rounded-md px-1.5 text-left overflow-hidden shadow hover:brightness-110 active:scale-[0.98] transition-all">
      {isShort ? (
        <p className="text-[10px] font-semibold leading-tight truncate">
          {fmtTime(start)} · {customerName}
          {qty && qty > 1 ? ` ×${qty}` : ""}
        </p>
      ) : (
        <>
          <p className="text-[10px] font-bold leading-tight truncate">
            {fmtTime(start)} – {fmtTime(end)}
          </p>
          <p className="text-[11px] font-semibold leading-tight truncate mt-0.5">
            {customerName}
            {qty && qty > 1 ? (
              <span className="opacity-70 ml-1">×{qty}</span>
            ) : null}
          </p>
          <p className="text-[10px] leading-tight truncate opacity-80">
            {serviceName}
          </p>
        </>
      )}
    </button>
  );
}

// ─── Booking Detail Panel ─────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { badge: string; label: string }> = {
  pending: {
    badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    label: "Pending",
  },
  confirmed: {
    badge: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    label: "Confirmed",
  },
  rescheduled: {
    badge: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
    label: "Rescheduled",
  },
  completed: {
    badge: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    label: "Completed",
  },
  cancelled: {
    badge: "bg-red-500/20 text-red-300 border border-red-500/30",
    label: "Cancelled",
  },
  no_show: {
    badge: "bg-gray-500/20 text-gray-600 border border-gray-500/30",
    label: "No Show",
  },
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "rescheduled", "cancelled"],
  confirmed: ["rescheduled", "no_show", "cancelled"],
  rescheduled: ["confirmed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
};

function BookingDetailPanel({
  booking: initialBooking,
  mode,
  allEmployees,
  onClose,
  onRefresh,
}: {
  booking: any;
  mode: CalendarMode;
  allEmployees: any[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [booking, setBooking] = useState(initialBooking);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [reassignLoading, setReassignLoading] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(
    booking.employee_id?._id || booking.employee_id || "",
  );
  const [actionError, setActionError] = useState("");

  // Reschedule form state — pre-filled with current booking time
  const _start = new Date(booking.start_time);
  const pad = (n: number) => String(n).padStart(2, "0");
  const [rescheduleForm, setRescheduleForm] = useState({
    date: fmtISO(_start),
    time: `${pad(_start.getHours())}:${pad(_start.getMinutes())}`,
  });

  const handleReschedule = async () => {
    setRescheduleLoading(true);
    setActionError("");
    try {
      const [h, m] = rescheduleForm.time.split(":").map(Number);
      const newStart = new Date(rescheduleForm.date);
      newStart.setHours(h, m, 0, 0);
      const res = await fetch(`/api/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_time: newStart.toISOString(),
          duration: booking.duration,
          status: "rescheduled",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reschedule");
      setBooking((b: any) => ({
        ...b,
        start_time: data.data?.start_time ?? newStart.toISOString(),
        end_time: data.data?.end_time,
        status: "rescheduled",
      }));
      setShowReschedule(false);
      onRefresh();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const color = eventColor(booking, mode);
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);
  const customer = booking.user_id as any;
  const employee = booking.employee_id;
  const service = booking.service_id;
  const isEmployeeBased =
    !service?.service_type || service.service_type === "employee_based";

  const nextStatuses = STATUS_TRANSITIONS[booking.status] ?? [];

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const bookingDateStr = fmtISO(start);
  const bookingTimeStr = `${pad2(start.getHours())}:${pad2(start.getMinutes())}`;
  const bookingDuration =
    booking.duration || Math.round((end.getTime() - start.getTime()) / 60_000);
  const serviceId = service?._id || booking.service_id;

  const eligibleEmployees = allEmployees.filter(
    (emp) =>
      empCanTakeSlot(emp, bookingDateStr, bookingTimeStr, bookingDuration) &&
      empCanDoService(emp, serviceId),
  );

  const handleStatusChange = async (newStatus: string) => {
    setStatusLoading(newStatus);
    setActionError("");
    try {
      const res = await fetch("/api/bookings/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking._id, newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      setBooking((b: any) => ({ ...b, status: newStatus }));
      onRefresh();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setStatusLoading(null);
    }
  };

  const handleReassign = async () => {
    setReassignLoading(true);
    setActionError("");
    try {
      const res = await fetch(`/api/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: selectedEmpId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reassign");
      setBooking((b: any) => ({ ...b, employee_id: data.data?.employee_id }));
      setShowReassign(false);
      onRefresh();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setReassignLoading(false);
    }
  };

  const statusInfo = STATUS_STYLES[booking.status] ?? STATUS_STYLES.pending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end bg-black/40 p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white border border-gray-200 rounded-t-2xl sm:rounded-2xl w-full sm:w-84 shadow-2xl overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: color }} />
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {service?.name || "Booking"}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {start.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-900 p-1">
              <X size={16} />
            </button>
          </div>

          {/* Details */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <Clock size={13} className="text-gray-400 shrink-0" />
              <p className="text-sm text-gray-900">
                {fmtTime(start)} – {fmtTime(end)}
                <span className="text-gray-400 ml-1.5">
                  · {booking.duration} min
                </span>
              </p>
            </div>
            {customer && (
              <div className="flex items-center gap-2.5">
                <User size={13} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-sm text-gray-900">
                    {customer.name || "Walk-in"}
                  </p>
                  {customer.email && (
                    <p className="text-xs text-gray-400">{customer.email}</p>
                  )}
                </div>
              </div>
            )}
            {employee && (
              <div className="flex items-center gap-2.5">
                <Users size={13} className="text-gray-400 shrink-0" />
                <p className="text-sm text-gray-900">
                  {employee.full_name}
                  {isEmployeeBased && (
                    <button
                      onClick={() => setShowReassign((v) => !v)}
                      className="ml-2 text-[11px] text-[#051e3a] hover:underline">
                      Reassign
                    </button>
                  )}
                </p>
              </div>
            )}
            {service && (
              <div className="flex items-center gap-2.5">
                <Package size={13} className="text-gray-400 shrink-0" />
                <p className="text-sm text-gray-900">
                  {service.name}
                  {booking.total_price != null && (
                    <span className="text-gray-400 ml-1.5">
                      · ${booking.total_price}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                  statusInfo.badge,
                )}>
                {statusInfo.label}
              </span>
              <span
                className={cn(
                  "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                  booking.payment_status === "paid"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/20 text-amber-300",
                )}>
                {booking.payment_status}
              </span>
            </div>

            {booking.notes && (
              <p className="text-xs text-gray-400 bg-gray-100 rounded-lg p-2.5 leading-relaxed">
                {booking.notes}
              </p>
            )}
          </div>

          {/* Reassign employee inline */}
          {showReassign && isEmployeeBased && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2.5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Reassign Employee
              </p>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#051e3a]">
                <option value="">Unassigned</option>
                {eligibleEmployees.length > 0 ? (
                  eligibleEmployees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.full_name}
                    </option>
                  ))
                ) : (
                  <option disabled value="">
                    No available employees
                  </option>
                )}
              </select>
              {eligibleEmployees.length === 0 && (
                <p className="text-[10px] text-amber-400 mt-1">
                  No employees are available at this booking&apos;s time and
                  duration.
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowReassign(false)}
                  className="flex-1 py-1.5 text-xs font-semibold text-gray-400 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleReassign}
                  disabled={reassignLoading}
                  className="flex-1 py-1.5 text-xs font-bold bg-[#051e3a] text-white rounded-lg hover:bg-[#082040] disabled:opacity-50 flex items-center justify-center gap-1">
                  {reassignLoading && (
                    <Loader2 size={11} className="animate-spin" />
                  )}
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Reschedule form */}
          {showReschedule && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2.5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Reschedule Appointment
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">
                    New Date
                  </label>
                  <input
                    type="date"
                    value={rescheduleForm.date}
                    onChange={(e) =>
                      setRescheduleForm((f) => ({ ...f, date: e.target.value }))
                    }
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#051e3a]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">
                    New Time
                  </label>
                  <input
                    type="time"
                    value={rescheduleForm.time}
                    onChange={(e) =>
                      setRescheduleForm((f) => ({ ...f, time: e.target.value }))
                    }
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#051e3a]"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowReschedule(false)}
                  className="flex-1 py-1.5 text-xs font-semibold text-gray-400 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={rescheduleLoading}
                  className="flex-1 py-1.5 text-xs font-bold bg-purple-600 text-gray-900 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-1">
                  {rescheduleLoading && (
                    <Loader2 size={11} className="animate-spin" />
                  )}
                  Confirm
                </button>
              </div>
            </div>
          )}

          {/* Status change actions */}
          {!showReschedule && nextStatuses.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                Update Status
              </p>
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((st) => {
                  const info = STATUS_STYLES[st];
                  const actionColors: Record<string, string> = {
                    confirmed: "bg-[#051e3a] hover:bg-[#082040] text-white",
                    rescheduled: "bg-[#051e3a] hover:bg-[#082040] text-white",
                    cancelled: "bg-[#051e3a] hover:bg-[#082040] text-white",
                    no_show: "bg-[#051e3a] hover:bg-[#082040] text-white",
                    completed: "bg-[#051e3a] hover:bg-[#082040] text-white",
                  };
                  return (
                    <button
                      key={st}
                      disabled={!!statusLoading}
                      onClick={() => {
                        if (st === "rescheduled") {
                          setShowReschedule(true);
                        } else {
                          handleStatusChange(st);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50",
                        actionColors[st] ||
                          "bg-gray-700 hover:bg-gray-600 text-gray-900",
                      )}>
                      {statusLoading === st && (
                        <Loader2 size={11} className="animate-spin" />
                      )}
                      {info?.label ?? st}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {actionError && (
            <p className="mt-3 text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
              {actionError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CurrentTimeIndicator() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const top = (minutesFromMidnight(now) / 60) * HOUR_H;

  return (
    <div
      style={{
        position: "absolute",
        top: top - 1,
        left: 0,
        right: 0,
        zIndex: 10,
      }}
      className="pointer-events-none flex items-center">
      <div className="bg-red-500 text-gray-900 text-[9px] font-bold px-1 py-0.5 rounded shrink-0 ml-1">
        {fmtTime(now)}
      </div>
      <div className="flex-1 h-[1.5px] bg-red-500" />
    </div>
  );
}

// ─── Team Filter Dropdown ─────────────────────────────────────────────────────

function TeamFilterDropdown({
  employees,
  services,
  mode,
  selectedId,
  onSelect,
}: {
  employees: any[];
  services: any[];
  mode: CalendarMode;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const items = mode === "employee" ? employees : services;
  const selected = items.find((i) => i._id === selectedId);
  const label = selected
    ? selected.full_name || selected.name
    : mode === "employee"
      ? "All team"
      : "All resources";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors">
        {label}
        <ChevronDown size={13} className="text-gray-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl py-1.5 min-w-[180px] z-40 max-h-60 overflow-y-auto">
          <button
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
            className={cn(
              "w-full text-left px-3.5 py-2 text-sm transition-colors",
              selectedId === null
                ? "text-[#051e3a] font-semibold"
                : "text-gray-900 hover:bg-gray-100",
            )}>
            {mode === "employee" ? "All team" : "All resources"}
          </button>
          <div className="h-px bg-gray-100 mx-2 my-1" />
          {items.map((item) => (
            <button
              key={item._id}
              onClick={() => {
                onSelect(item._id);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center gap-2",
                selectedId === item._id
                  ? "text-[#051e3a] font-semibold"
                  : "text-gray-900 hover:bg-gray-100",
              )}>
              {mode === "employee" ? (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[8px] font-bold"
                  style={{ background: item.calendar_color || "#4DD0E1" }}>
                  {getInitials(item.full_name)}
                </div>
              ) : (
                <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 bg-gray-100">
                  {item.service_type === "group_session" ? (
                    <CalendarDays size={11} className="text-purple-400" />
                  ) : (
                    <Package size={11} className="text-blue-400" />
                  )}
                </div>
              )}
              <span className="truncate">{item.full_name || item.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Time Gutter (shared) ─────────────────────────────────────────────────────

// Time labels are centered ON the hour line using translateY(-50%)
// so the label text sits exactly at the same Y as the horizontal grid line.
function TimeGutter() {
  return (
    <div
      className="bg-white border-r border-gray-200 shrink-0"
      style={{ position: "sticky", left: 0, zIndex: 15, width: GUTTER_W }}>
      {HOURS.map((h) => (
        <div
          key={h}
          className="absolute left-0 right-0 flex items-center justify-end pr-2"
          style={{ top: h * HOUR_H }}>
          {/* -translate-y-1/2 centers the label vertically ON the hour line */}
          {h > 0 && (
            <span className="-translate-y-1/2 text-[10px] text-gray-500 leading-none whitespace-nowrap">
              {fmtHourLabel(h)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Hour / Half-hour Grid Lines ──────────────────────────────────────────────

function GridLines() {
  return (
    <>
      {HOURS.map((h) => (
        // Solid hour lines — slightly visible
        <div
          key={`hr-${h}`}
          className="absolute left-0 right-0"
          style={{
            top: h * HOUR_H,
            height: 0,
            borderTop: "1px solid #162640",
          }}
        />
      ))}
      {HOURS.map((h) => (
        // Dashed half-hour lines — more subtle
        <div
          key={`hh-${h}`}
          className="absolute left-0 right-0"
          style={{
            top: h * HOUR_H + HOUR_H / 2,
            height: 0,
            borderTop: "1px dashed #0d1e30",
          }}
        />
      ))}
    </>
  );
}

// ─── No-schedule Empty State ─────────────────────────────────────────────────

function NoScheduleState() {
  return (
    <div className="flex flex-col  items-center justify-center gap-5 py-20 px-6 text-center flex-1 min-h-[90vh]">
      {/* Icon: calendar + X badge */}
      <div className="relative ">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center shadow-lg">
          <CalendarDays size={38} className="text-[#051e3a]" />
        </div>
        <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
          <X size={14} className="text-gray-400" />
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-gray-900">
          No scheduled team members
        </h3>
        <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
          Add availability to your team by managing your scheduled shifts
        </p>
      </div>

      <div className="flex items-center gap-3 mt-1">
        <Link
          href="/dashboard/employees?tab=schedule"
          className="px-4 py-2 text-xs font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-full hover:bg-gray-100 hover:border-[#051e3a]/50 transition-colors">
          Scheduled shifts
        </Link>
        <Link
          href="/dashboard/employees"
          className="px-4 py-2 text-xs font-semibold text-gray-900 bg-white/10 border border-white/20 rounded-full hover:bg-white/15 transition-colors">
          View all team members
        </Link>
      </div>
    </div>
  );
}

// ─── Unavailability Overlay ───────────────────────────────────────────────────

function getUnavailableZones(
  employee: any,
  dateStr: string,
): { topPx: number; heightPx: number }[] {
  const dayName = DAY_NAMES[new Date(dateStr + "T12:00:00").getDay()];
  const daySched = (employee.availability_schedule ?? []).find(
    (s: any) => (s.day_of_week ?? "").toLowerCase() === dayName,
  );
  const toPx = (mins: number) => (mins / 60) * HOUR_H;

  if (!daySched?.is_working || !daySched.shifts?.length) {
    return [{ topPx: 0, heightPx: 24 * HOUR_H }];
  }

  const shifts = daySched.shifts
    .filter((s: any) => s.start && s.end)
    .map((s: any) => {
      const [sh, sm] = (s.start as string).split(":").map(Number);
      const [eh, em] = (s.end as string).split(":").map(Number);
      return { start: sh * 60 + sm, end: eh * 60 + em };
    })
    .sort((a: any, b: any) => a.start - b.start);

  const zones: { topPx: number; heightPx: number }[] = [];
  if (shifts[0].start > 0)
    zones.push({ topPx: 0, heightPx: toPx(shifts[0].start) });
  for (let i = 0; i < shifts.length - 1; i++) {
    if (shifts[i].end < shifts[i + 1].start)
      zones.push({
        topPx: toPx(shifts[i].end),
        heightPx: toPx(shifts[i + 1].start - shifts[i].end),
      });
  }
  const last = shifts[shifts.length - 1];
  if (last.end < 24 * 60)
    zones.push({ topPx: toPx(last.end), heightPx: toPx(24 * 60 - last.end) });
  return zones;
}

/** Returns the shift label for the header badge, e.g. "9:00 AM – 5:00 PM" or null if not working */
function getShiftLabel(employee: any, dateStr: string): string | null {
  const dayName = DAY_NAMES[new Date(dateStr + "T12:00:00").getDay()];
  const daySched = (employee.availability_schedule ?? []).find(
    (s: any) => (s.day_of_week ?? "").toLowerCase() === dayName,
  );
  if (!daySched?.is_working || !daySched.shifts?.length) return null;
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hr}:${m.toString().padStart(2, "0")} ${ap}`;
  };
  const s = daySched.shifts[0];
  return `${fmt(s.start)} – ${fmt(s.end)}`;
}

/** Unavailable zones for resource_based (availability_schedule) and group_session (group_schedule) columns */
function getResourceUnavailableZones(
  service: any,
  dateStr: string,
): { topPx: number; heightPx: number }[] {
  const dayName = DAY_NAMES[new Date(dateStr + "T12:00:00").getDay()];
  const toPx = (mins: number) => (mins / 60) * HOUR_H;
  const toMins = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  if (service.service_type === "resource_based") {
    const sched = (service.availability_schedule ?? []).find(
      (s: any) => (s.day_of_week ?? "").toLowerCase() === dayName,
    );
    if (!sched?.is_available) return [{ topPx: 0, heightPx: 24 * HOUR_H }];
    const startMins = toMins(sched.start_time || "09:00");
    const endMins = toMins(sched.end_time || "17:00");
    const zones: { topPx: number; heightPx: number }[] = [];
    if (startMins > 0) zones.push({ topPx: 0, heightPx: toPx(startMins) });
    if (endMins < 24 * 60)
      zones.push({ topPx: toPx(endMins), heightPx: toPx(24 * 60 - endMins) });
    return zones;
  }

  if (service.service_type === "group_session") {
    const groupDay = (service.group_schedule ?? []).find(
      (s: any) => (s.day_of_week ?? "").toLowerCase() === dayName,
    );
    if (!groupDay?.is_active || !groupDay.slots?.length)
      return [{ topPx: 0, heightPx: 24 * HOUR_H }];
    const slots = [...groupDay.slots]
      .map((s: any) => ({
        start: toMins(s.start_time),
        end: toMins(s.end_time),
      }))
      .sort((a, b) => a.start - b.start);
    const zones: { topPx: number; heightPx: number }[] = [];
    let prev = 0;
    for (const slot of slots) {
      if (slot.start > prev)
        zones.push({ topPx: toPx(prev), heightPx: toPx(slot.start - prev) });
      prev = slot.end;
    }
    if (prev < 24 * 60)
      zones.push({ topPx: toPx(prev), heightPx: toPx(24 * 60 - prev) });
    return zones;
  }

  return [];
}

/** Header label for resource/group columns, e.g. "9:00 AM – 5:00 PM" or null if unavailable */
function getServiceLabel(service: any, dateStr: string): string | null {
  const dayName = DAY_NAMES[new Date(dateStr + "T12:00:00").getDay()];
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hr}:${m.toString().padStart(2, "0")} ${ap}`;
  };

  if (service.service_type === "resource_based") {
    const sched = (service.availability_schedule ?? []).find(
      (s: any) => (s.day_of_week ?? "").toLowerCase() === dayName,
    );
    if (!sched?.is_available) return null;
    return `${fmt(sched.start_time)} – ${fmt(sched.end_time)}`;
  }

  if (service.service_type === "group_session") {
    const groupDay = (service.group_schedule ?? []).find(
      (s: any) => (s.day_of_week ?? "").toLowerCase() === dayName,
    );
    if (!groupDay?.is_active || !groupDay.slots?.length) return null;
    return groupDay.slots
      .map((s: any) => `${fmt(s.start_time)}–${fmt(s.end_time)}`)
      .join(", ");
  }

  return null;
}

function UnavailableZone({
  topPx,
  heightPx,
}: {
  topPx: number;
  heightPx: number;
}) {
  return (
    <div
      className="absolute left-0 right-0"
      style={{
        top: topPx,
        height: heightPx,
        zIndex: 4,
        cursor: "not-allowed",
        backgroundColor: "rgba(0,0,0,0.06)",
        backgroundImage:
          "repeating-linear-gradient(45deg,rgba(0,0,0,0.04) 0px,rgba(0,0,0,0.04) 1px,transparent 1px,transparent 6px)",
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

// ─── Employee Column (DayView per-employee column with hover indicator) ────────

function EmployeeColumn({
  col,
  date,
  bookings,
  blockedTimes,
  mode,
  onBookingClick,
  onBlockedTimeClick,
  onSlotClick,
}: {
  col: any;
  date: Date;
  bookings: any[];
  blockedTimes: any[];
  mode: CalendarMode;
  onBookingClick: (b: any) => void;
  onBlockedTimeClick: (entry: any) => void;
  onSlotClick?: (slot: SlotClick) => void;
}) {
  const [hoverY, setHoverY] = useState<number | null>(null);

  const unavailableZones =
    mode === "employee"
      ? getUnavailableZones(col, fmtISO(date))
      : getResourceUnavailableZones(col, fmtISO(date));

  const yToLabel = (y: number) => {
    const totalMin = Math.max(0, Math.floor((y / HOUR_H) * 60));
    const snapped = Math.round(totalMin / 15) * 15;
    const h = Math.floor(snapped / 60) % 24;
    const m = snapped % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  return (
    <div
      className="relative flex-1 border-r border-gray-200 last:border-r-0 cursor-crosshair"
      style={{ minWidth: COL_MIN_W }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoverY(e.clientY - rect.top);
      }}
      onMouseLeave={() => setHoverY(null)}
      onClick={(e) => {
        if (!onSlotClick) return;
        if ((e.target as Element).closest("button")) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - rect.top;
        const totalMin = Math.floor((y / HOUR_H) * 60);
        const snapped = Math.round(totalMin / 15) * 15;
        const t = new Date(date);
        t.setHours(Math.floor(snapped / 60), snapped % 60, 0, 0);
        onSlotClick({ time: t, date, column: col, x: e.clientX, y: e.clientY });
      }}>
      <GridLines />

      {(() => {
        const layout = computeOverlapLayout(bookings);
        return bookings.map((b) => {
          const { colIndex = 0, totalCols = 1 } = layout.get(b._id) ?? {};
          return (
            <EventBlock
              key={b._id}
              booking={b}
              mode={mode}
              onClick={() => onBookingClick(b)}
              colIndex={colIndex}
              totalCols={totalCols}
            />
          );
        });
      })()}

      {mode === "employee" &&
        blockedTimes.map((bt) => (
          <BlockedTimeBlock
            key={bt._id}
            entry={bt}
            onDelete={onBlockedTimeClick}
          />
        ))}

      {unavailableZones.map((zone, i) => (
        <UnavailableZone key={i} topPx={zone.topPx} heightPx={zone.heightPx} />
      ))}

      {/* Hover time indicator — shows on all zones */}
      {hoverY !== null && (
        <div
          className="absolute left-0 right-0 flex items-center pointer-events-none"
          style={{ top: hoverY - 9, zIndex: 20 }}>
          <span className="text-[10px] font-mono bg-gray-100 border border-[#051e3a]/50 text-blue-200 px-1.5 py-0.5 rounded-sm whitespace-nowrap ml-0.5 shadow">
            {yToLabel(hoverY)}
          </span>
          <div className="flex-1 h-px bg-[#051e3a]/25" />
        </div>
      )}
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({
  date,
  columns,
  bookings,
  blockedTimes,
  mode,
  onBookingClick,
  onBlockedTimeClick,
  onSlotClick,
  colHeaderTop = COL_HEADER_TOP,
}: {
  date: Date;
  columns: any[];
  bookings: any[];
  blockedTimes: any[];
  mode: CalendarMode;
  onBookingClick: (b: any) => void;
  onBlockedTimeClick: (entry: any) => void;
  onSlotClick?: (slot: SlotClick) => void;
  colHeaderTop?: number;
}) {
  const todayFlag = isToday(date);
  const gridH = 24 * HOUR_H;

  const bookingsByColumn = useMemo(() => {
    const map: Record<string, any[]> = {};
    columns.forEach((col) => {
      map[col._id] = [];
    });
    bookings.forEach((b) => {
      const colId =
        mode === "employee"
          ? b.employee_id?._id || b.employee_id
          : b.service_id?._id || b.service_id;
      if (colId && map[colId] !== undefined) map[colId].push(b);
    });
    return map;
  }, [bookings, columns, mode]);

  const blockedByColumn = useMemo(() => {
    const map: Record<string, any[]> = {};
    columns.forEach((col) => {
      map[col._id] = [];
    });
    blockedTimes.forEach((bt) => {
      const empId =
        bt.employee_id?._id ||
        bt.employee_id?.toString?.() ||
        String(bt.employee_id);
      if (map[empId] !== undefined) map[empId].push(bt);
    });
    return map;
  }, [blockedTimes, columns]);

  const allNotWorking =
    mode === "employee" &&
    columns.length > 0 &&
    columns.every((col) => getShiftLabel(col, fmtISO(date)) === null);

  if (allNotWorking) return <NoScheduleState />;

  return (
    <div className="overflow-x-auto">
      {/* Column headers — sticky below toolbar */}
      <div
        className="flex border-b border-gray-200 bg-white "
        style={{ position: "sticky", top: colHeaderTop, zIndex: 20 }}>
        <div
          className="shrink-0 border-r border-gray-200 bg-white"
          style={{ position: "sticky", left: 0, zIndex: 21, width: GUTTER_W }}
        />
        {columns.map((col) => {
          const label =
            mode === "employee"
              ? getShiftLabel(col, fmtISO(date))
              : getServiceLabel(col, fmtISO(date));
          const unavailableLabel =
            mode === "employee" ? "Not working today" : "Not available today";
          return (
            <div
              key={col._id}
              className="flex-1 border-r border-gray-200 last:border-r-0"
              style={{ minWidth: COL_MIN_W }}>
              <ColumnAvatar
                name={col.full_name || col.name}
                photo={col.employee_photo}
                color={
                  mode === "employee"
                    ? col.calendar_color
                    : resourceColor(col._id)
                }
                subtitle={col.job_title || col.service_type}
              />
              <div className="px-2 pb-2 flex justify-center">
                {label ? (
                  <span className="text-[9px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5 whitespace-nowrap">
                    {label}
                  </span>
                ) : (
                  <span className="text-[9px] font-medium text-gray-500 bg-gray-500/10 border border-gray-500/20 rounded-full px-2 py-0.5 whitespace-nowrap">
                    {unavailableLabel}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {columns.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-4">
            <p className="text-xs text-gray-600">
              No {mode === "employee" ? "team members" : "resources"}
            </p>
          </div>
        )}
      </div>

      {/* Time grid — natural height, browser scrolls */}
      <div className="relative flex" style={{ height: gridH }}>
        <TimeGutter />

        {columns.length > 0 ? (
          columns.map((col) => (
            <EmployeeColumn
              key={col._id}
              col={col}
              date={date}
              bookings={bookingsByColumn[col._id] || []}
              blockedTimes={blockedByColumn[col._id] || []}
              mode={mode}
              onBookingClick={onBookingClick}
              onBlockedTimeClick={onBlockedTimeClick}
              onSlotClick={onSlotClick}
            />
          ))
        ) : (
          <div className="relative flex-1">
            <GridLines />
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-4"
              style={{ top: "25%" }}>
              <CalendarDays size={36} className="text-gray-700" />
              <div className="text-center">
                <p className="text-gray-400 font-semibold text-sm">
                  {mode === "employee"
                    ? "No scheduled team members"
                    : "No resource services"}
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  {mode === "employee"
                    ? "Add availability via Scheduled Shifts"
                    : "Add resource or group session services"}
                </p>
              </div>
            </div>
          </div>
        )}

        {todayFlag && <CurrentTimeIndicator />}
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({
  weekDays,
  bookings,
  blockedTimes,
  mode,
  onBookingClick,
  onBlockedTimeClick,
  onSlotClick,
}: {
  weekDays: Date[];
  bookings: any[];
  blockedTimes: any[];
  mode: CalendarMode;
  onBookingClick: (b: any) => void;
  onBlockedTimeClick: (entry: any) => void;
  onSlotClick?: (slot: SlotClick) => void;
}) {
  const gridH = 24 * HOUR_H;

  const bookingsByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    weekDays.forEach((d) => {
      map[fmtISO(d)] = [];
    });
    bookings.forEach((b) => {
      const k = fmtISO(new Date(b.start_time));
      if (map[k]) map[k].push(b);
    });
    return map;
  }, [bookings, weekDays]);

  const blockedByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    weekDays.forEach((d) => {
      map[fmtISO(d)] = [];
    });
    blockedTimes.forEach((bt) => {
      const k = fmtISO(new Date(bt.start_time));
      if (map[k]) map[k].push(bt);
    });
    return map;
  }, [blockedTimes, weekDays]);

  return (
    <>
      {/* Day headers — sticky below toolbar */}
      <div
        className="flex border-b border-gray-200 bg-white"
        style={{ position: "sticky", top: COL_HEADER_TOP, zIndex: 20 }}>
        <div
          className="shrink-0 border-r border-gray-200"
          style={{ width: GUTTER_W }}
        />
        {weekDays.map((day, i) => {
          const todayFlag = isToday(day);
          return (
            <div
              key={i}
              className={cn(
                "flex-1 py-3 text-center border-r border-gray-200 last:border-r-0",
                todayFlag && "bg-[#051e3a]/5",
              )}>
              <p
                className={cn(
                  "text-xs font-semibold",
                  todayFlag ? "text-[#051e3a]" : "text-gray-500",
                )}>
                {DAY_SHORT[day.getDay()]}
              </p>
              <p
                className={cn(
                  "text-lg font-bold mt-0.5 w-8 h-8 flex items-center justify-center rounded-full mx-auto",
                  todayFlag ? "bg-[#051e3a] text-white" : "text-gray-900",
                )}>
                {day.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Time grid — natural height, browser scrolls */}
      <div className="relative flex" style={{ height: gridH }}>
        <TimeGutter />
        {weekDays.map((day, di) => {
          const key = fmtISO(day);
          const todayFlag = isToday(day);
          return (
            <div
              key={di}
              className={cn(
                "relative flex-1 border-r border-gray-200 last:border-r-0 cursor-crosshair",
                todayFlag && "bg-[#051e3a]/2",
              )}
              onClick={(e) => {
                if (!onSlotClick) return;
                if ((e.target as Element).closest("button")) return;
                const rect = (
                  e.currentTarget as HTMLElement
                ).getBoundingClientRect();
                const y = e.clientY - rect.top;
                const totalMin = Math.floor((y / HOUR_H) * 60);
                const snapped = Math.round(totalMin / 15) * 15;
                const t = new Date(day);
                t.setHours(Math.floor(snapped / 60), snapped % 60, 0, 0);
                onSlotClick({ time: t, date: day, x: e.clientX, y: e.clientY });
              }}>
              <GridLines />
              {(bookingsByDay[key] || []).map((b) => (
                <EventBlock
                  key={b._id}
                  booking={b}
                  mode={mode}
                  onClick={() => onBookingClick(b)}
                />
              ))}
              {mode === "employee" &&
                (blockedByDay[key] || []).map((bt) => (
                  <BlockedTimeBlock
                    key={bt._id}
                    entry={bt}
                    onDelete={onBlockedTimeClick}
                  />
                ))}
              {todayFlag && <CurrentTimeIndicator />}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Slot types ───────────────────────────────────────────────────────────────

interface SlotClick {
  time: Date;
  date: Date;
  column?: any;
  x: number;
  y: number;
}

// ─── Add Dropdown ─────────────────────────────────────────────────────────────

function AddDropdown({
  onAddAppointment,
  onAddBlockedTime,
}: {
  onAddAppointment: () => void;
  onAddBlockedTime: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#051e3a] text-white text-sm font-bold hover:bg-[#082040] transition-colors">
        <Plus size={14} />
        <span className="hidden sm:inline">Add</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl py-1.5 w-52 z-50">
          <button
            onClick={() => {
              onAddAppointment();
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-100 transition-colors">
            <CalendarCheck size={14} className="text-[#051e3a]" />
            Appointment
          </button>
          <button
            onClick={() => {
              onAddBlockedTime();
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-100 transition-colors">
            <Ban size={14} className="text-red-400" />
            Blocked time
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Slot Context Menu ────────────────────────────────────────────────────────

function SlotContextMenu({
  slot,
  onAddAppointment,
  onAddBlockedTime,
  onClose,
}: {
  slot: SlotClick;
  onAddAppointment: () => void;
  onAddBlockedTime: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Clamp to viewport after render
  const [pos, setPos] = useState({ x: slot.x + 8, y: slot.y + 8 });
  useEffect(() => {
    if (!ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();
    setPos({
      x: Math.min(slot.x + 8, window.innerWidth - width - 8),
      y: Math.min(slot.y + 8, window.innerHeight - height - 8),
    });
  }, [slot.x, slot.y]);

  const timeStr = `${slot.time.getHours().toString().padStart(2, "0")}:${slot.time.getMinutes().toString().padStart(2, "0")}`;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={ref}
        className="fixed z-50 bg-gray-200 border border-indigo-200 rounded-xl shadow-2xl w-56 overflow-hidden"
        style={{ left: pos.x, top: pos.y }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-indigo-200">
          <span className="text-sm font-bold text-gray-900">{timeStr}</span>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900">
            <X size={14} />
          </button>
        </div>
        <div className="py-1">
          <button
            onClick={() => {
              onAddAppointment();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-indigo-50 transition-colors">
            <CalendarCheck size={14} className="text-[#051e3a]" />
            Add appointment
          </button>
          <button
            onClick={() => {
              onAddBlockedTime();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-indigo-50 transition-colors">
            <Ban size={14} className="text-red-400" />
            Add blocked time
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Appointment Wizard Drawer ────────────────────────────────────────────────

// ─── Appointment Wizard ──────────────────────────────────────────────────────

type WizardStep = "service" | "employee" | "datetime" | "confirm";

function AppointmentWizard({
  employees,
  services,
  prefill,
  onClose,
  onSuccess,
}: {
  employees: any[];
  services: any[];
  prefill: SlotClick;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const fromSlot = !!prefill.column;
  const initDate = fmtISO(prefill.date);

  const [stepIdx, setStepIdx] = useState(0);
  const [serviceSearch, setServiceSearch] = useState("");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    prefill.column?._id || "",
  );
  const [date, setDate] = useState(initDate);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotFetchKey, setSlotFetchKey] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  // Holds the latest fetch params; read by the effect so it never has a stale closure.
  const slotParamsRef = useRef({ date: initDate, serviceId: "", empId: "" });

  const isEmployeeBased =
    !selectedService?.service_type ||
    selectedService?.service_type === "employee_based";

  // Max quantity for the selected slot: group slot capacity or resource max_concurrent_bookings
  const maxQuantity = useMemo(() => {
    if (!selectedService || isEmployeeBased) return 1;
    if (selectedService.service_type === "group_session" && selectedSlot) {
      const slotDate = new Date(selectedSlot);
      const dayName = DAY_NAMES[slotDate.getDay()];
      const slotMins = slotDate.getHours() * 60 + slotDate.getMinutes();
      const groupDay = (selectedService.group_schedule ?? []).find(
        (d: any) => (d.day_of_week ?? "").toLowerCase() === dayName,
      );
      const match = (groupDay?.slots ?? []).find((s: any) => {
        const [h, m] = (s.start_time || "0:0").split(":").map(Number);
        return h * 60 + m === slotMins;
      });
      if (match?.capacity) return match.capacity as number;
    }
    return (selectedService.max_concurrent_bookings as number) || 20;
  }, [selectedService, isEmployeeBased, selectedSlot]);

  const stepSequence = useMemo((): WizardStep[] => {
    const s: WizardStep[] = ["service"];
    if (isEmployeeBased) s.push("employee");
    s.push("datetime");
    s.push("confirm");
    return s;
  }, [isEmployeeBased]);

  const currentStep = stepSequence[stepIdx];
  const totalSteps = stepSequence.length;

  // Called from event handlers (never inside an effect) to reset display state
  // and kick off a new slot fetch.
  const triggerSlotFetch = (d: string, serviceId: string, empId: string) => {
    slotParamsRef.current = { date: d, serviceId, empId };
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSlot("");
    setSlotFetchKey((k) => k + 1);
  };

  // Only fires when slotFetchKey increments; reads fresh params from the ref.
  useEffect(() => {
    const { date: d, serviceId, empId } = slotParamsRef.current;
    if (!serviceId) return;
    let active = true;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const p = new URLSearchParams({
      date: d,
      service_id: serviceId,
      timezone: tz,
    });
    if (empId) p.set("employee_id", empId);
    fetch(`/api/bookings/available-slots?${p}`)
      .then((r) => r.json())
      .then((data) => {
        if (active && data.success) setSlots(data.available_slots || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setSlotsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slotFetchKey]);

  const goNext = () => {
    if (currentStep === "service" && !selectedService) {
      setError("Please select a service.");
      return;
    }
    if (currentStep === "datetime" && !selectedSlot) {
      setError("Please select an available time.");
      return;
    }
    setError("");
    const nextStep = stepSequence[stepIdx + 1];
    if (nextStep === "datetime" && selectedService) {
      triggerSlotFetch(date, selectedService._id, selectedEmpId);
    }
    setStepIdx((s) => Math.min(s + 1, totalSteps - 1));
  };

  const goBack = () => {
    setError("");
    setStepIdx((s) => Math.max(0, s - 1));
  };

  const handleSubmit = async () => {
    if (!selectedSlot) {
      setError("No time slot selected.");
      return;
    }
    setSubmitLoading(true);
    setError("");
    try {
      const res = await fetch("/api/calendar/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: selectedService._id,
          employee_id: selectedEmpId || null,
          start_time: selectedSlot,
          duration: selectedService.base_duration || 60,
          quantity: isEmployeeBased ? 1 : quantity,
          customer_name: customerName || undefined,
          notes: notes || undefined,
          total_price:
            (selectedService.base_price ?? 0) *
            (isEmployeeBased ? 1 : quantity),
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to create appointment");
      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredServices = useMemo(() => {
    const q = serviceSearch.toLowerCase();
    return services.filter(
      (s) =>
        !q ||
        s.name?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q),
    );
  }, [services, serviceSearch]);

  const groupedServices = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const svc of filteredServices) {
      const cat = svc.category || "Other";
      if (!map[cat]) map[cat] = [];
      map[cat].push(svc);
    }
    return map;
  }, [filteredServices]);

  const eligibleEmployees = useMemo(() => {
    if (!selectedService) return employees;
    return employees.filter((emp) => empCanDoService(emp, selectedService._id));
  }, [employees, selectedService]);

  const stepLabels: Record<WizardStep, string> = {
    service: "Service",
    employee: "Employee",
    datetime: "Date & Time",
    confirm: "Confirm",
  };

  const dateLabel = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Centered wizard card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-xl bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col pointer-events-auto"
          style={{ maxHeight: "92vh" }}
          onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-2">
              <CalendarCheck size={15} className="text-[#051e3a]" />
              <h2 className="text-sm font-bold text-gray-900">
                New Appointment
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-lg hover:bg-white/5">
              <X size={17} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex items-center px-6 py-3 border-b border-gray-200 shrink-0 gap-0">
            {stepSequence.map((step, i) => (
              <div
                key={step}
                className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-colors",
                      i < stepIdx
                        ? "bg-[#051e3a] text-white"
                        : i === stepIdx
                          ? "bg-[#051e3a] text-white ring-2 ring-[#051e3a]/30"
                          : "bg-gray-50 border border-gray-200 text-gray-600",
                    )}>
                    {i < stepIdx ? "✓" : i + 1}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium hidden sm:block whitespace-nowrap",
                      i === stepIdx
                        ? "text-gray-900"
                        : i < stepIdx
                          ? "text-[#051e3a]"
                          : "text-gray-600",
                    )}>
                    {stepLabels[step]}
                  </span>
                </div>
                {i < stepSequence.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-px mx-2",
                      i < stepIdx ? "bg-[#051e3a]/50" : "bg-gray-100",
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="flex-1 overflow-y-auto">
            {/* ── Step: Service ─────────────────────────────────────────── */}
            {currentStep === "service" && (
              <div className="p-5">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Select a Service
                </p>
                <div className="relative mb-4">
                  <Search
                    size={12}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="Search services…"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-[#051e3a] placeholder:text-gray-600"
                  />
                </div>
                {Object.keys(groupedServices).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No services found
                  </p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedServices).map(([cat, svcs]) => (
                      <div key={cat}>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                          {cat}
                        </p>
                        <div className="space-y-1.5">
                          {svcs.map((svc) => {
                            const sel = selectedService?._id === svc._id;
                            return (
                              <button
                                key={svc._id}
                                onClick={() => {
                                  setSelectedService(svc);
                                  setSelectedEmpId(prefill.column?._id || "");
                                  setSelectedSlot("");
                                  setQuantity(1);
                                }}
                                className={cn(
                                  "w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between",
                                  sel
                                    ? "bg-[#051e3a]/15 border-[#051e3a]/60 text-gray-900"
                                    : "bg-gray-50 border-gray-200 text-gray-600 hover:border-[#051e3a]/40",
                                )}>
                                <div>
                                  <p className="text-sm font-semibold">
                                    {svc.name}
                                  </p>
                                  <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                                    <span>{svc.base_duration} min</span>
                                    {svc.service_type && (
                                      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-[9px] text-gray-400">
                                        {svc.service_type.replace(/_/g, " ")}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                {svc.base_price != null && (
                                  <span
                                    className={cn(
                                      "text-sm font-bold shrink-0",
                                      sel ? "text-[#a093f8]" : "text-gray-400",
                                    )}>
                                    ${svc.base_price}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Step: Employee ────────────────────────────────────────── */}
            {currentStep === "employee" && (
              <div className="p-5">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Select an Employee
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedEmpId("")}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl border transition-all",
                      !selectedEmpId
                        ? "bg-[#051e3a]/15 border-[#051e3a]/60 text-gray-900"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-[#051e3a]/40",
                    )}>
                    <p className="text-sm font-semibold">Any available</p>
                    <p className="text-[11px] text-gray-500">
                      Auto-assign to the first available employee
                    </p>
                  </button>
                  {eligibleEmployees.map((emp) => {
                    const sel = selectedEmpId === emp._id;
                    const shiftLabel = getShiftLabel(emp, date);
                    return (
                      <button
                        key={emp._id}
                        onClick={() => setSelectedEmpId(emp._id)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3",
                          sel
                            ? "bg-[#051e3a]/15 border-[#051e3a]/60 text-gray-900"
                            : "bg-gray-50 border-gray-200 text-gray-600 hover:border-[#051e3a]/40",
                        )}>
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                          style={{
                            background: emp.calendar_color || "#1e3a5f",
                            color: "#fff",
                          }}>
                          {getInitials(emp.full_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {emp.full_name}
                          </p>
                          <p className="text-[11px] mt-0.5">
                            {shiftLabel ? (
                              <span className="text-emerald-400">
                                {shiftLabel}
                              </span>
                            ) : (
                              <span className="text-red-400">
                                Not working this day
                              </span>
                            )}
                          </p>
                        </div>
                        {sel && (
                          <div className="w-2 h-2 rounded-full bg-[#051e3a] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                  {eligibleEmployees.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-6">
                      No employees can perform this service
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Step: Date & Time ─────────────────────────────────────── */}
            {currentStep === "datetime" && (
              <div className="p-5 space-y-5">
                {fromSlot ? (
                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-200">
                    <CalendarDays
                      size={13}
                      className="text-[#051e3a] shrink-0"
                    />
                    <span>{dateLabel}</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Date
                    </p>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        if (selectedService) {
                          triggerSlotFetch(
                            e.target.value,
                            selectedService._id,
                            selectedEmpId,
                          );
                        }
                      }}
                      className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#051e3a] w-full"
                    />
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Available Times
                  </p>
                  {slotsLoading ? (
                    <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Fetching available times…</span>
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4">
                      No available times for this date. Try a different day or
                      employee.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {slots.map((slot) => {
                        const sel = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={cn(
                              "py-2 px-3 rounded-lg text-xs font-semibold border transition-all",
                              sel
                                ? "bg-[#051e3a] border-[#051e3a] text-gray-900"
                                : "bg-gray-50 border-gray-200 text-gray-600 hover:border-[#051e3a]/50 hover:bg-gray-50",
                            )}>
                            {fmtTime(new Date(slot))}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Step: Confirm ─────────────────────────────────────────── */}
            {currentStep === "confirm" && (
              <div className="p-5 space-y-4">
                {/* Booking summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Booking Summary
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Package size={13} className="text-[#051e3a] shrink-0" />
                      <span className="text-gray-900 font-semibold">
                        {selectedService?.name}
                      </span>
                      <span className="text-gray-500 text-xs">
                        · {selectedService?.base_duration} min
                      </span>
                      {selectedService?.base_price != null && (
                        <span className="text-gray-500 text-xs">
                          · ${selectedService.base_price}
                        </span>
                      )}
                    </div>
                    {selectedEmpId && (
                      <div className="flex items-center gap-2">
                        <User size={13} className="text-[#051e3a] shrink-0" />
                        <span className="text-gray-600">
                          {employees.find((e) => e._id === selectedEmpId)
                            ?.full_name ?? "—"}
                        </span>
                      </div>
                    )}
                    {selectedSlot && (
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-[#051e3a] shrink-0" />
                        <span className="text-gray-600">
                          {dateLabel} · {fmtTime(new Date(selectedSlot))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quantity — resource_based and group_session only */}
                {!isEmployeeBased && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Quantity
                      <span className="ml-1.5 font-normal text-gray-600 normal-case tracking-normal">
                        (max {maxQuantity})
                      </span>
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                        <Minus size={13} />
                      </button>
                      <span className="text-gray-900 font-bold text-lg w-8 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() =>
                          setQuantity((q) => Math.min(maxQuantity, q + 1))
                        }
                        disabled={quantity >= maxQuantity}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                        <Plus size={13} />
                      </button>
                      {selectedService?.base_price != null && quantity > 1 && (
                        <span className="text-xs text-gray-500 ml-1">
                          = $
                          {(selectedService.base_price * quantity).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Client */}
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Client (optional)
                  </p>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in / name…"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#051e3a] placeholder:text-gray-600"
                  />
                </div>

                {/* Notes */}
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Notes (optional)
                  </p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Optional notes…"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#051e3a] placeholder:text-gray-600 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 px-5 py-4 border-t border-gray-200 space-y-3">
            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
            <div className="flex items-center gap-3">
              {stepIdx > 0 && (
                <button
                  onClick={goBack}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-400 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  Back
                </button>
              )}
              <div className="flex-1" />
              {currentStep !== "confirm" ? (
                <button
                  onClick={goNext}
                  disabled={currentStep === "service" && !selectedService}
                  className="px-6 py-2.5 text-sm font-bold bg-[#051e3a] text-white rounded-xl hover:bg-[#082040] transition-colors disabled:opacity-50">
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitLoading || !selectedSlot}
                  className="px-6 py-2.5 text-sm font-bold bg-[#051e3a] text-white rounded-xl hover:bg-[#082040] transition-colors disabled:opacity-50 flex items-center gap-2">
                  {submitLoading && (
                    <Loader2 size={13} className="animate-spin" />
                  )}
                  Confirm Appointment
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Blocked Time Modal ───────────────────────────────────────────────────────

function BlockedTimeModal({
  employees,
  prefill,
  onClose,
  onSuccess,
}: {
  employees: any[];
  prefill: SlotClick;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const startHH = pad(prefill.time.getHours());
  const startMM = pad(prefill.time.getMinutes());
  const endH = prefill.time.getHours() + 1;
  const defaultEndTime = `${pad(endH >= 24 ? 23 : endH)}:${endH >= 24 ? "59" : startMM}`;

  const [form, setForm] = useState({
    employee_id: prefill.column?._id || (employees[0]?._id ?? ""),
    date: fmtISO(prefill.date),
    start_time: `${startHH}:${startMM}`,
    end_time: defaultEndTime,
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.employee_id || !form.date || !form.start_time || !form.end_time) {
      setError("Employee, date, start and end time are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [sh, sm] = form.start_time.split(":").map(Number);
      const [eh, em] = form.end_time.split(":").map(Number);
      const startDate = new Date(form.date);
      startDate.setHours(sh, sm, 0, 0);
      const endDate = new Date(form.date);
      endDate.setHours(eh, em, 0, 0);

      if (endDate <= startDate) {
        setError("End time must be after start time.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/employees/time-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: form.employee_id,
          type: "Blocked",
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          description: form.note || undefined,
          approved: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to block time");
      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 transition-colors";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end bg-black/50 p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white border border-gray-200 rounded-t-2xl sm:rounded-2xl w-full sm:w-96 shadow-2xl overflow-hidden">
        <div className="h-1 bg-red-500" />
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Ban size={16} className="text-red-400" />
              <h3 className="text-base font-bold text-gray-900">
                Add Blocked Time
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-900 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Employee <span className="text-red-400">*</span>
              </label>
              <select
                value={form.employee_id}
                onChange={(e) =>
                  setForm({ ...form, employee_id: e.target.value })
                }
                className={inputCls}>
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Start <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) =>
                    setForm({ ...form, start_time: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  End <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) =>
                    setForm({ ...form, end_time: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Note
              </label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={2}
                placeholder="Reason for blocking (optional)…"
                className={cn(
                  inputCls,
                  "placeholder:text-gray-600 resize-none",
                )}
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-2.5 mt-5">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-gray-400 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-bold bg-red-500 text-gray-900 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 size={13} className="animate-spin" />}
              Block Time
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile Day Tabs ──────────────────────────────────────────────────────────

function MobileDayTabs({
  weekDays,
  selectedIdx,
  onSelect,
}: {
  weekDays: Date[];
  selectedIdx: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] px-3 py-2 bg-white border-b border-gray-200">
      {weekDays.map((d, i) => {
        const todayFlag = isToday(d);
        const active = i === selectedIdx;
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={cn(
              "flex flex-col items-center min-w-[44px] px-2 py-1.5 rounded-xl border text-center transition-colors shrink-0",
              active
                ? "bg-[#051e3a] border-[#051e3a] text-gray-900"
                : todayFlag
                  ? "bg-[#051e3a]/10 border-[#051e3a]/30 text-[#051e3a]"
                  : "bg-gray-50 border-gray-200 text-gray-400",
            )}>
            <span className="text-[10px] font-semibold leading-none">
              {DAY_SHORT[d.getDay()]}
            </span>
            <span className="text-sm font-bold mt-0.5">{d.getDate()}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Calendar ────────────────────────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div className="bg-white text-gray-900">
      {/* Toolbar */}
      <div
        className="sticky bg-white z-30 border-b border-gray-200"
        style={{ top: DASH_HEADER_H }}>
        <div
          className="flex items-center gap-2 px-4"
          style={{ height: TOOLBAR_H }}>
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-44 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
          <div className="flex-1" />
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      </div>

      {/* Column headers */}
      <div
        className="sticky z-20 flex bg-white border-b border-gray-200"
        style={{ top: COL_HEADER_TOP_MD }}>
        <div className="w-14 shrink-0" />
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 border-l border-gray-200">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex">
        {/* Hour labels */}
        <div className="w-14 shrink-0 flex flex-col">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="flex items-start justify-end pr-2 pt-1"
              style={{ height: HOUR_H }}>
              <Skeleton className="h-3 w-8 rounded" />
            </div>
          ))}
        </div>
        {/* Columns */}
        {[...Array(4)].map((_, ci) => (
          <div key={ci} className="flex-1 border-l border-gray-200">
            {[...Array(9)].map((_, ri) => (
              <div
                key={ri}
                className="border-b border-gray-100"
                style={{ height: HOUR_H }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Calendar() {
  const [view, setView] = useState<CalendarView>("day");
  const [mode, setMode] = useState<CalendarMode>("employee");
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [filterId, setFilterId] = useState<string | null>(null);
  const [mobileDayIdx, setMobileDayIdx] = useState(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  });
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [slotClick, setSlotClick] = useState<SlotClick | null>(null);
  const [openModal, setOpenModal] = useState<
    "appointment" | "blocked_time" | null
  >(null);
  const [modalPrefill, setModalPrefill] = useState<SlotClick>({
    time: new Date(),
    date: new Date(),
    x: 0,
    y: 0,
  });

  const openAppointmentModal = (prefill?: SlotClick) => {
    setModalPrefill(
      prefill ?? { time: new Date(), date: currentDate, x: 0, y: 0 },
    );
    setSlotClick(null);
    setOpenModal("appointment");
  };
  const openBlockedTimeModal = (prefill?: SlotClick) => {
    setModalPrefill(
      prefill ?? { time: new Date(), date: currentDate, x: 0, y: 0 },
    );
    setSlotClick(null);
    setOpenModal("blocked_time");
  };
  const closeModal = () => setOpenModal(null);

  const { data: empData, isLoading: empLoading } = useGetEmployees();
  const { data: svcData } = useGetServices();

  const allEmployees = useMemo<any[]>(() => empData?.data ?? [], [empData]);
  const resourceServices = useMemo<any[]>(
    () =>
      (svcData?.data ?? []).filter(
        (s: any) =>
          s.service_type === "resource_based" ||
          s.service_type === "group_session",
      ),
    [svcData],
  );

  const monday = useMemo(() => getMonday(currentDate), [currentDate]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(monday, i)),
    [monday],
  );

  const { startDate, endDate } = useMemo(() => {
    if (view === "day") {
      const s = fmtISO(currentDate);
      return { startDate: s, endDate: s };
    }
    return { startDate: fmtISO(monday), endDate: fmtISO(addDays(monday, 6)) };
  }, [view, currentDate, monday]);

  const {
    data: bookingData,
    isLoading: bookingLoading,
    refetch,
  } = useGetCalendarBookings(startDate, endDate);
  const allBookings = useMemo<any[]>(
    () => bookingData?.data ?? [],
    [bookingData],
  );

  // Fetch blocked times for current date range
  const [blockedTimes, setBlockedTimes] = useState<any[]>([]);
  const [deletingBlock, setDeletingBlock] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchBlockedTimes = (sd: string, ed?: string) => {
    fetch(
      `/api/employees/time-off?start_date=${sd}T00:00:00Z&end_date=${ed ?? sd}T23:59:59Z`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setBlockedTimes(d.data ?? []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (startDate) fetchBlockedTimes(startDate, endDate);
  }, [startDate, endDate]);

  const handleBlockedTimeDelete = async () => {
    if (!deletingBlock) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/employees/time-off/${deletingBlock._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBlockedTimes((prev) =>
          prev.filter((bt) => bt._id !== deletingBlock._id),
        );
        setDeletingBlock(null);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = useMemo(() => {
    const source = mode === "employee" ? allEmployees : resourceServices;
    return filterId ? source.filter((s) => s._id === filterId) : source;
  }, [mode, allEmployees, resourceServices, filterId]);

  const goToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setCurrentDate(d);
    const day = d.getDay();
    setMobileDayIdx(day === 0 ? 6 : day - 1);
  };
  const goPrev = () =>
    view === "day"
      ? setCurrentDate((d) => addDays(d, -1))
      : setCurrentDate((d) => addDays(getMonday(d), -7));
  const goNext = () =>
    view === "day"
      ? setCurrentDate((d) => addDays(d, 1))
      : setCurrentDate((d) => addDays(getMonday(d), 7));

  const dateLabel = useMemo(() => {
    if (view === "day") {
      return currentDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
    const sun = addDays(monday, 6);
    return `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${sun.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  }, [view, currentDate, monday]);

  const mobileDate = weekDays[mobileDayIdx] ?? currentDate;

  // Auto-scroll to 6 AM on mount (window scroll)
  useEffect(() => {
    const y =
      COL_HEADER_TOP_MD + /* col header height approx */ 80 + 6 * HOUR_H - 40;
    window.scrollTo({ top: y, behavior: "auto" });
  }, []);

  if (empLoading && !empData) return <CalendarSkeleton />;

  return (
    <div className="bg-white text-gray-900">
      {/* ── Sticky toolbar ── */}
      <div
        className="sticky bg-white z-30 border-b border-gray-200"
        style={{ top: DASH_HEADER_H }}>
        {/* ── Primary row (all viewports) ── */}
        <div
          className="flex max-sm:flex-col max-sm:items-start items-center gap-2 px-3 md:px-4"
          style={{ height: TOOLBAR_H }}>
          {/* Today — desktop only */}
          <button
            onClick={goToday}
            className="hidden sm:block px-3 py-1.5 text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-full hover:bg-gray-100 transition-colors shrink-0">
            Today
          </button>

          {/* Date nav */}
          <div className="flex max-sm:mt-2 items-center bg-gray-50 border border-gray-200 rounded-full overflow-hidden shrink-0">
            <button
              onClick={goPrev}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold text-gray-900 px-2 min-w-[120px] md:min-w-[160px] text-center">
              {dateLabel}
            </span>
            <button
              onClick={goNext}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Filter — desktop only */}
          <div className="hidden sm:block shrink-0">
            <TeamFilterDropdown
              employees={allEmployees}
              services={resourceServices}
              mode={mode}
              selectedId={filterId}
              onSelect={setFilterId}
            />
          </div>

          <div className="flex-1" />

          {/* Desktop right controls */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            {/* Mode toggle */}
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full p-0.5 gap-0.5">
              {(["employee", "resource"] as CalendarMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setFilterId(null);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                    mode === m
                      ? "bg-[#051e3a] text-white"
                      : "text-gray-400 hover:text-gray-900",
                  )}>
                  {m === "employee" ? (
                    <Users size={12} />
                  ) : (
                    <Package size={12} />
                  )}
                  <span className="hidden md:inline">
                    {m === "employee" ? "Team" : "Resources"}
                  </span>
                </button>
              ))}
            </div>
            {/* Refresh */}
            <button
              onClick={() => refetch()}
              disabled={bookingLoading}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors">
              <RefreshCw
                size={13}
                className={cn(bookingLoading && "animate-spin")}
              />
            </button>
            {/* View toggle */}
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full p-0.5 gap-0.5">
              {(["day", "week"] as CalendarView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize",
                    view === v
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-400 hover:text-gray-900",
                  )}>
                  {v}
                </button>
              ))}
            </div>
            <AddDropdown
              onAddAppointment={() => openAppointmentModal()}
              onAddBlockedTime={() => openBlockedTimeModal()}
            />
          </div>

          {/* Mobile right controls */}
          <div className="sm:hidden flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => refetch()}
              disabled={bookingLoading}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-gray-900 transition-colors">
              <RefreshCw
                size={13}
                className={cn(bookingLoading && "animate-spin")}
              />
            </button>
            <AddDropdown
              onAddAppointment={() => openAppointmentModal()}
              onAddBlockedTime={() => openBlockedTimeModal()}
            />
          </div>
        </div>

        {/* ── Secondary row — mobile only ── */}
        <div className="sm:hidden flex mt-14 flex-col items-start gap-2 px-3 pb-2.5">
          {/* Mode toggle */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full p-0.5 gap-0.5">
            {(["employee", "resource"] as CalendarMode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setFilterId(null);
                }}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
                  mode === m
                    ? "bg-[#051e3a] text-white"
                    : "text-gray-500 hover:text-gray-900",
                )}>
                {m === "employee" ? <Users size={11} /> : <Package size={11} />}
                {m === "employee" ? "Team" : "Resources"}
              </button>
            ))}
          </div>
          {/* View toggle */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full p-0.5 gap-0.5">
            {(["day", "week"] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors capitalize",
                  view === v
                    ? "bg-[#051e3a] text-white"
                    : "text-gray-500 hover:text-gray-900",
                )}>
                {v}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          {/* Filter */}
          <TeamFilterDropdown
            employees={allEmployees}
            services={resourceServices}
            mode={mode}
            selectedId={filterId}
            onSelect={setFilterId}
          />
        </div>
      </div>

      {/* ── Week mobile day tabs ── */}
      {view === "week" && (
        <MobileDayTabs
          weekDays={weekDays}
          selectedIdx={mobileDayIdx}
          onSelect={(i) => {
            setMobileDayIdx(i);
            setCurrentDate(weekDays[i]);
          }}
        />
      )}

      {/* ── Loading ── */}
      {(bookingLoading || empLoading) && (
        <div className="flex items-center justify-center py-3 gap-2 border-b border-gray-200">
          <Loader2 size={14} className="animate-spin text-[#051e3a]" />
          <span className="text-xs text-gray-500">Loading bookings…</span>
        </div>
      )}

      {/* ── Calendar grid — desktop ── */}
      <div className="hidden sm:block">
        {view === "day" ? (
          <DayView
            date={currentDate}
            columns={columns}
            bookings={allBookings}
            blockedTimes={blockedTimes}
            mode={mode}
            onBookingClick={setSelectedBooking}
            onBlockedTimeClick={setDeletingBlock}
            onSlotClick={setSlotClick}
          />
        ) : (
          <WeekView
            weekDays={weekDays}
            bookings={allBookings}
            blockedTimes={blockedTimes}
            mode={mode}
            onBookingClick={setSelectedBooking}
            onBlockedTimeClick={setDeletingBlock}
            onSlotClick={setSlotClick}
          />
        )}
      </div>

      {/* ── Calendar grid — mobile (single day always) ── */}
      <div className="sm:hidden">
        <DayView
          date={view === "week" ? mobileDate : currentDate}
          columns={columns}
          colHeaderTop={COL_HEADER_TOP_MOBILE}
          bookings={allBookings.filter((b) =>
            sameDay(
              new Date(b.start_time),
              view === "week" ? mobileDate : currentDate,
            ),
          )}
          blockedTimes={blockedTimes.filter((bt) =>
            sameDay(
              new Date(bt.start_time),
              view === "week" ? mobileDate : currentDate,
            ),
          )}
          mode={mode}
          onBookingClick={setSelectedBooking}
          onBlockedTimeClick={setDeletingBlock}
          onSlotClick={setSlotClick}
        />
      </div>

      {/* ── Slot context menu ── */}
      {slotClick && (
        <SlotContextMenu
          slot={slotClick}
          onAddAppointment={() => openAppointmentModal(slotClick)}
          onAddBlockedTime={() => openBlockedTimeModal(slotClick)}
          onClose={() => setSlotClick(null)}
        />
      )}

      {/* ── Appointment modal ── */}
      {openModal === "appointment" && (
        <AppointmentWizard
          employees={allEmployees}
          services={svcData?.data ?? []}
          prefill={modalPrefill}
          onClose={closeModal}
          onSuccess={() => {
            closeModal();
            refetch();
          }}
        />
      )}

      {/* ── Blocked time modal ── */}
      {openModal === "blocked_time" && (
        <BlockedTimeModal
          employees={allEmployees}
          prefill={modalPrefill}
          onClose={closeModal}
          onSuccess={() => {
            closeModal();
            refetch();
            if (startDate) fetchBlockedTimes(startDate, endDate);
          }}
        />
      )}

      {/* ── Delete blocked time confirmation ── */}
      {deletingBlock && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) =>
            e.target === e.currentTarget && setDeletingBlock(null)
          }>
          <div className="bg-white border border-gray-200 rounded-2xl w-80 shadow-2xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <Ban size={16} className="text-red-400 shrink-0" />
              <h3 className="text-sm font-bold text-gray-900">
                Remove Blocked Time?
              </h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              {fmtTime(new Date(deletingBlock.start_time))} –{" "}
              {fmtTime(new Date(deletingBlock.end_time))}
              {deletingBlock.description && ` · ${deletingBlock.description}`}
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setDeletingBlock(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-400 border border-gray-200 rounded-xl hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleBlockedTimeDelete}
                disabled={deleteLoading}
                className="flex-1 py-2 text-xs font-bold bg-red-600 text-gray-900 rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                {deleteLoading && (
                  <Loader2 size={11} className="animate-spin" />
                )}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Booking detail ── */}
      {selectedBooking && (
        <BookingDetailPanel
          booking={selectedBooking}
          mode={mode}
          allEmployees={allEmployees}
          onClose={() => setSelectedBooking(null)}
          onRefresh={() => {
            refetch();
            setSelectedBooking(null);
          }}
        />
      )}
    </div>
  );
}
