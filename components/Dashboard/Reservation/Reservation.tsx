"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  RefreshCw,
  X,
  Clock,
  User,
  Users,
  Package,
  Loader2,
  ChevronDown,
  Calendar,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PER_PAGE_OPTIONS = [5, 10, 20, 30, 40, 50] as const;

const STATUS_META: Record<
  string,
  { label: string; badge: string; btn: string }
> = {
  pending: {
    label: "Pending",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    btn: "bg-[#051e3a] hover:bg-[#082040] text-white",
  },
  confirmed: {
    label: "Confirmed",
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    btn: "bg-[#051e3a] hover:bg-[#082040] text-white",
  },
  rescheduled: {
    label: "Rescheduled",
    badge: "bg-purple-50 text-purple-700 border border-purple-200",
    btn: "bg-[#051e3a] hover:bg-[#082040] text-white",
  },
  completed: {
    label: "Completed",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    btn: "bg-[#051e3a] hover:bg-[#082040] text-white",
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-red-50 text-red-700 border border-red-200",
    btn: "bg-[#051e3a] hover:bg-[#082040] text-white",
  },
  no_show: {
    label: "No Show",
    badge: "bg-gray-100 text-gray-600 border border-gray-200",
    btn: "bg-[#051e3a] hover:bg-[#082040] text-white",
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

const PAYMENT_META: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  unpaid: "bg-amber-50 text-amber-700",
  pending: "bg-amber-50 text-amber-700",
  refunded: "bg-gray-100 text-gray-600",
};

const DATE_PRESETS = ["Today", "This week", "This month", "All time"] as const;
type DatePreset = (typeof DATE_PRESETS)[number];

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function fmtTime(d: Date) {
  const h = d.getHours(),
    m = d.getMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  return `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${m.toString().padStart(2, "0")} ${ap}`;
}
function fmtISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function presetRange(
  preset: DatePreset,
): { start: string; end: string } | null {
  const now = new Date();
  if (preset === "Today") {
    const s = fmtISO(now);
    return { start: s, end: s };
  }
  if (preset === "This week") {
    const day = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { start: fmtISO(mon), end: fmtISO(sun) };
  }
  if (preset === "This month") {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: fmtISO(s), end: fmtISO(e) };
  }
  return null;
}

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function empCanTakeSlot(
  employee: any,
  dateStr: string,
  timeStr: string,
  durationMins: number,
): boolean {
  if (!dateStr || !timeStr) return true;
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

function empCanDoService(employee: any, serviceId: string): boolean {
  if (!employee.service_overrides?.length) return true;
  return employee.service_overrides.some((o: any) => {
    const id =
      typeof o.service_id === "string"
        ? o.service_id
        : (o.service_id?._id ?? o.service_id)?.toString();
    return id === serviceId;
  });
}

// ─── Booking detail side-panel ────────────────────────────────────────────────

function BookingDetailPanel({
  booking: initial,
  allEmployees,
  onClose,
  onUpdated,
}: {
  booking: any;
  allEmployees: any[];
  onClose: () => void;
  onUpdated: (updated: any) => void;
}) {
  const [booking, setBooking] = useState(initial);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [reassignLoading, setReassignLoading] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(
    booking.employee_id?._id || booking.employee_id || "",
  );
  const [error, setError] = useState("");
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);
  const customer = booking.user_id as any;
  const employee = booking.employee_id;
  const service = booking.service_id;
  const isEmployeeBased =
    !service?.service_type || service.service_type === "employee_based";
  const nextStatuses = STATUS_TRANSITIONS[booking.status] ?? [];

  const pad = (n: number) => String(n).padStart(2, "0");
  const [rescheduleForm, setRescheduleForm] = useState({
    date: fmtISO(start),
    time: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
  });

  const handleStatusChange = async (newStatus: string) => {
    setStatusLoading(newStatus);
    setError("");
    try {
      const res = await fetch("/api/bookings/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking._id, newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const updated = { ...booking, status: newStatus };
      setBooking(updated);
      onUpdated(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setStatusLoading(null);
    }
  };

  const handleReschedule = async () => {
    setRescheduleLoading(true);
    setError("");
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
      if (!res.ok) throw new Error(data.error || "Failed");
      const updated = {
        ...booking,
        start_time: data.data?.start_time,
        end_time: data.data?.end_time,
        status: "rescheduled",
      };
      setBooking(updated);
      onUpdated(updated);
      setShowReschedule(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleReassign = async () => {
    setReassignLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: selectedEmpId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const updated = { ...booking, employee_id: data.data?.employee_id };
      setBooking(updated);
      onUpdated(updated);
      setShowReassign(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setReassignLoading(false);
    }
  };

  const statusInfo = STATUS_META[booking.status] ?? STATUS_META.pending;
  const inputCls =
    "w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#051e3a]";

  const _start = new Date(booking.start_time);
  const _end = new Date(booking.end_time);
  const _pad = (n: number) => String(n).padStart(2, "0");
  const _bookingDateStr = `${_start.getFullYear()}-${_pad(_start.getMonth() + 1)}-${_pad(_start.getDate())}`;
  const _bookingTimeStr = `${_pad(_start.getHours())}:${_pad(_start.getMinutes())}`;
  const _bookingDuration =
    booking.duration ||
    Math.round((_end.getTime() - _start.getTime()) / 60_000);
  const _serviceId = (booking.service_id?._id ?? booking.service_id) || "";

  const eligibleEmployees = allEmployees.filter(
    (emp) =>
      empCanTakeSlot(emp, _bookingDateStr, _bookingTimeStr, _bookingDuration) &&
      empCanDoService(emp, _serviceId),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:w-96 bg-white border-l border-gray-200 flex flex-col shadow-2xl overflow-y-auto">
        <div className="h-1.5 bg-[#051e3a] shrink-0" />

        <div className="p-5 flex-1">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {service?.name || "Booking"}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{fmtDate(start)}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-900 p-1">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3 mb-5">
            <div className="flex items-center gap-2.5">
              <Clock size={13} className="text-gray-400 shrink-0" />
              <p className="text-sm text-gray-900">
                {fmtTime(start)} – {fmtTime(end)}{" "}
                <span className="text-gray-400">· {booking.duration} min</span>
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
            <div className="flex items-center gap-2 flex-wrap">
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
                  PAYMENT_META[booking.payment_status] ||
                    "bg-gray-500/20 text-gray-600",
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

          {showReassign && isEmployeeBased && (
            <div className="mb-4 pt-4 border-t border-gray-200 space-y-2.5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Reassign Employee
              </p>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className={inputCls}>
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

          {showReschedule && (
            <div className="mb-4 pt-4 border-t border-gray-200 space-y-2.5">
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
                    className={inputCls}
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
                    className={inputCls}
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
                  className="flex-1 py-1.5 text-xs font-bold bg-[#051e3a] text-white rounded-lg hover:bg-[#082040] disabled:opacity-50 flex items-center justify-center gap-1">
                  {rescheduleLoading && (
                    <Loader2 size={11} className="animate-spin" />
                  )}
                  Confirm
                </button>
              </div>
            </div>
          )}

          {!showReschedule && nextStatuses.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                Update Status
              </p>
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((st) => (
                  <button
                    key={st}
                    disabled={!!statusLoading}
                    onClick={() =>
                      st === "rescheduled"
                        ? setShowReschedule(true)
                        : handleStatusChange(st)
                    }
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50",
                      STATUS_META[st]?.btn ||
                        "bg-gray-700 hover:bg-gray-600 text-gray-900",
                    )}>
                    {statusLoading === st && (
                      <Loader2 size={11} className="animate-spin" />
                    )}
                    {STATUS_META[st]?.label ?? st}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page numbers helper ──────────────────────────────────────────────────────

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3)
    return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

// ─── Main page ────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  "all",
  "pending",
  "confirmed",
  "rescheduled",
  "completed",
  "no_show",
  "cancelled",
];

export default function Reservation() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("All time");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    all: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const tz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  useEffect(() => {
    let active = true;
    const range = presetRange(datePreset);
    const params = new URLSearchParams({
      timezone: tz,
      statuses: "",
      page: String(page),
      limit: String(pageSize),
    });
    if (statusFilter !== "all") params.set("status_filter", statusFilter);
    if (range) {
      params.set("start_date", range.start);
      params.set("end_date", range.end);
    }

    // setLoading inside .then so it is not a synchronous setState in effect body
    Promise.resolve()
      .then(() => {
        if (active) setLoading(true);
      })
      .then(() => fetch(`/api/calendar/bookings?${params}`))
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.success) {
          setBookings(data.data ?? []);
          setTotal(data.total ?? 0);
          setTotalPages(data.totalPages ?? 1);
          setStatusCounts(data.status_counts ?? { all: 0 });
        }
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [datePreset, tz, statusFilter, page, pageSize, refreshKey]);

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAllEmployees(d.data ?? []);
      })
      .catch(() => {});
  }, []);

  // Client-side search across current page only
  const filtered = useMemo(() => {
    if (!search.trim()) return bookings;
    const q = search.toLowerCase();
    return bookings.filter(
      (b) =>
        (b.user_id?.name || "").toLowerCase().includes(q) ||
        (b.user_id?.email || "").toLowerCase().includes(q) ||
        (b.service_id?.name || "").toLowerCase().includes(q) ||
        (b.employee_id?.full_name || "").toLowerCase().includes(q),
    );
  }, [bookings, search]);

  const handleBookingUpdated = (updated: any) => {
    setBookings((prev) =>
      prev.map((b) => (b._id === updated._id ? { ...b, ...updated } : b)),
    );
    if (selectedBooking?._id === updated._id)
      setSelectedBooking({ ...selectedBooking, ...updated });
  };

  const pages = pageNumbers(page, totalPages);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ── Page header ── */}
      <div className="border-b border-gray-200 px-6 py-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reservations</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {total} total booking{total !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Date preset */}
            <div className="relative">
              <select
                value={datePreset}
                onChange={(e) => {
                  setDatePreset(e.target.value as DatePreset);
                  setPage(1);
                }}
                className="bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-[#051e3a] appearance-none cursor-pointer">
                {DATE_PRESETS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <Calendar
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <ChevronDown
                size={11}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search on this page…"
                className="bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg pl-8 pr-8 py-2 w-48 focus:outline-none focus:border-[#051e3a] placeholder:text-gray-600"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900">
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setRefreshKey((k) => k + 1);
                setPage(1);
              }}
              disabled={loading}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-[#051e3a] transition-colors disabled:opacity-50">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto [scrollbar-width:none]">
          {STATUS_TABS.map((st) => {
            const meta = STATUS_META[st];
            const count = statusCounts[st] ?? 0;
            const active = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                  active
                    ? "bg-[#051e3a] text-white"
                    : "text-gray-400 hover:text-gray-900 hover:bg-gray-50",
                )}>
                {st === "all" ? "All" : (meta?.label ?? st)}
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-gray-50 text-gray-400",
                  )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        {loading ? (
          <table className="w-full min-w-180">
            <thead>
              <tr className="border-b border-gray-200 bg-white">
                {["Client", "Service", "Employee", "Date & Time", "Duration", "Amount", "Status", "Payment"].map((h) => (
                  <th key={h} className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(pageSize)].map((_, i) => (
                <tr key={i} className="border-b border-gray-200/60 bg-white">
                  {/* Client */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3 w-24 rounded" />
                        <Skeleton className="h-2.5 w-32 rounded" />
                      </div>
                    </div>
                  </td>
                  {/* Service */}
                  <td className="px-4 py-3.5">
                    <Skeleton className="h-3 w-28 rounded" />
                  </td>
                  {/* Employee */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                  </td>
                  {/* Date & Time */}
                  <td className="px-4 py-3.5">
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-16 rounded" />
                      <Skeleton className="h-2.5 w-24 rounded" />
                    </div>
                  </td>
                  {/* Duration */}
                  <td className="px-4 py-3.5">
                    <Skeleton className="h-3 w-12 rounded" />
                  </td>
                  {/* Amount */}
                  <td className="px-4 py-3.5">
                    <Skeleton className="h-3 w-10 rounded" />
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </td>
                  {/* Payment */}
                  <td className="px-4 py-3.5">
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Ban size={32} className="text-gray-600" />
            <p className="text-sm text-gray-400">No reservations found</p>
            {(search || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setPage(1);
                }}
                className="text-xs text-[#051e3a] hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <table className="w-full min-w-180">
            <thead>
              <tr className="border-b border-gray-200 bg-white">
                {[
                  "Client",
                  "Service",
                  "Employee",
                  "Date & Time",
                  "Duration",
                  "Amount",
                  "Status",
                  "Payment",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const start = new Date(b.start_time);
                const customer = b.user_id as any;
                const employee = b.employee_id as any;
                const service = b.service_id as any;
                const statusInfo = STATUS_META[b.status] ?? STATUS_META.pending;
                return (
                  <tr
                    key={b._id}
                    onClick={() => setSelectedBooking(b)}
                    className="border-b border-gray-200/60 cursor-pointer transition-colors hover:bg-gray-50/60 bg-white">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-900 shrink-0">
                          {(customer?.name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 leading-tight">
                            {customer?.name || "Walk-in"}
                          </p>
                          {customer?.email && (
                            <p className="text-[11px] text-gray-500 leading-tight">
                              {customer.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-900">
                        {service?.name || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      {employee?.full_name ? (
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                            style={{
                              background: employee.calendar_color || "#1a3a60",
                            }}>
                            {employee.full_name[0]}
                          </div>
                          <p className="text-sm text-gray-900">
                            {employee.full_name}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Unassigned</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-900 whitespace-nowrap">
                        {fmtTime(start)}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {start.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-600">{b.duration} min</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-gray-900">
                        ${b.total_price ?? 0}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                          statusInfo.badge,
                        )}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                          PAYMENT_META[b.payment_status] ||
                            "bg-gray-500/20 text-gray-600",
                        )}>
                        {b.payment_status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && total > 0 && (
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-400">
              Showing {Math.min((page - 1) * pageSize + 1, total)}–
              {Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Per page</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-[#051e3a] cursor-pointer">
                {PER_PAGE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={cn(
                    "cursor-pointer select-none",
                    page === 1 && "pointer-events-none opacity-40",
                  )}
                />
              </PaginationItem>

              {pages.map((p, i) =>
                p === "…" ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === page}
                      onClick={() => setPage(p as number)}
                      className="cursor-pointer select-none">
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={cn(
                    "cursor-pointer select-none",
                    page === totalPages && "pointer-events-none opacity-40",
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {selectedBooking && (
        <BookingDetailPanel
          booking={selectedBooking}
          allEmployees={allEmployees}
          onClose={() => setSelectedBooking(null)}
          onUpdated={handleBookingUpdated}
        />
      )}
    </div>
  );
}
