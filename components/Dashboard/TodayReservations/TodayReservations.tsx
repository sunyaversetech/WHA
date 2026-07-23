"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Clock,
  Users,
  Package,
  RefreshCw,
  Loader2,
  CalendarDays,
  X,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

type Booking = {
  _id: string;
  start_time: string;
  end_time: string;
  duration: number;
  total_price: number;
  status: string;
  payment_status: string;
  notes?: string;
  service_id: { _id: string; name: string } | null;
  employee_id: { _id: string; full_name: string } | null;
  user_id: { _id: string; name: string; email: string } | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; badge: string }> = {
  pending: {
    label: "Pending",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  confirmed: {
    label: "Confirmed",
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  rescheduled: {
    label: "Rescheduled",
    badge: "bg-purple-50 text-purple-700 border border-purple-200",
  },
  arrived: {
    label: "Arrived",
    badge: "bg-teal-50 text-teal-700 border border-teal-200",
  },
  completed: {
    label: "Completed",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-red-50 text-red-700 border border-red-200",
  },
  no_show: {
    label: "No Show",
    badge: "bg-gray-100 text-gray-600 border border-gray-200",
  },
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["arrived", "completed", "cancelled"],
  rescheduled: ["confirmed", "cancelled"],
  arrived: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
};

const STATUS_ACTION_COLORS: Record<string, string> = {
  confirmed: "bg-[#051e3a] hover:bg-[#082040] text-white",
  arrived: "bg-teal-600 hover:bg-teal-700 text-white",
  completed: "bg-emerald-600 hover:bg-emerald-700 text-white",
  cancelled: "bg-red-600 hover:bg-red-700 text-white",
  no_show: "bg-gray-500 hover:bg-gray-600 text-white",
  rescheduled: "bg-purple-600 hover:bg-purple-700 text-white",
};

const PAYMENT_META: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  unpaid: "bg-amber-50 text-amber-700",
  pending: "bg-amber-50 text-amber-700",
  refunded: "bg-gray-100 text-gray-600",
};

type TimeSlot = "all" | "morning" | "afternoon" | "evening";
const TIME_SLOTS: { id: TimeSlot; label: string; range: string }[] = [
  { id: "all", label: "All day", range: "" },
  { id: "morning", label: "Morning", range: "12 AM – 12 PM" },
  { id: "afternoon", label: "Afternoon", range: "12 PM – 5 PM" },
  { id: "evening", label: "Evening", range: "5 PM – 12 AM" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtTime(d: Date) {
  const h = d.getHours(),
    m = d.getMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  return `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${m.toString().padStart(2, "0")} ${ap}`;
}

function todayISO() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const mo = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

function getTimeSlot(date: Date): TimeSlot {
  const h = date.getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BookingSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-3 w-28 rounded" />
        <Skeleton className="h-3 w-28 rounded" />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-7 w-20 rounded-lg" />
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center gap-4">
      <div className={cn("w-2 h-10 rounded-full shrink-0", color)} />
      <div>
        <p className="text-2xl font-bold text-[#051e3a]">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Booking Card ─────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  onStatusChange,
  statusLoading,
}: {
  booking: Booking;
  onStatusChange: (id: string, status: string) => void;
  statusLoading: string | null;
}) {
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);
  const statusInfo = STATUS_META[booking.status] ?? STATUS_META.pending;
  const nextStatuses = STATUS_TRANSITIONS[booking.status] ?? [];
  const customer = booking.user_id;
  const employee = booking.employee_id;
  const service = booking.service_id;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#051e3a] truncate">
            {customer?.name || "Walk-in"}
          </p>
          {customer?.email && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {customer.email}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap",
              statusInfo.badge,
            )}>
            {statusInfo.label}
          </span>
          {booking.payment_status && (
            <span
              className={cn(
                "text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize whitespace-nowrap",
                PAYMENT_META[booking.payment_status] ?? PAYMENT_META.pending,
              )}>
              {booking.payment_status}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock size={12} className="shrink-0 text-gray-400" />
          <span>
            {fmtTime(start)} – {fmtTime(end)}
            <span className="text-gray-400 ml-1">· {booking.duration} min</span>
          </span>
        </div>
        {service && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Package size={12} className="shrink-0 text-gray-400" />
            <span className="truncate">
              {service.name}
              {booking.total_price != null && (
                <span className="text-gray-400 ml-1">
                  · ${booking.total_price}
                </span>
              )}
            </span>
          </div>
        )}
        {employee && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Users size={12} className="shrink-0 text-gray-400" />
            <span className="truncate">{employee.full_name}</span>
          </div>
        )}
        {booking.notes && (
          <div className="flex items-start gap-2 text-xs text-gray-500 sm:col-span-2">
            <span className="shrink-0 text-gray-400 mt-0.5">📝</span>
            <span className="truncate">{booking.notes}</span>
          </div>
        )}
      </div>

      {nextStatuses.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
          {nextStatuses.map((st) => (
            <button
              key={st}
              disabled={!!statusLoading}
              onClick={() => onStatusChange(booking._id, st)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50",
                STATUS_ACTION_COLORS[st] ??
                  "bg-gray-600 hover:bg-gray-700 text-white",
              )}>
              {statusLoading === `${booking._id}:${st}` && (
                <Loader2 size={10} className="animate-spin" />
              )}
              {STATUS_META[st]?.label ?? st}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TodayReservations() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const fetchBookings = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/bookings/today?date=${todayISO()}`);
      const data = await res.json();
      if (data.success) setBookings(data.data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load — no synchronous setState in the effect body
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/bookings/today?date=${todayISO()}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled && data.success) setBookings(data.data ?? []); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    const key = `${bookingId}:${newStatus}`;
    setStatusLoading(key);
    try {
      const res = await fetch("/api/bookings/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) =>
          prev.map((b) =>
            b._id === bookingId ? { ...b, status: newStatus } : b,
          ),
        );
      }
    } finally {
      setStatusLoading(null);
    }
  };

  const filtered = useMemo(() => {
    let list = [...bookings];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          (b.user_id?.name ?? "").toLowerCase().includes(q) ||
          (b.user_id?.email ?? "").toLowerCase().includes(q),
      );
    }

    if (timeSlot !== "all") {
      list = list.filter(
        (b) => getTimeSlot(new Date(b.start_time)) === timeSlot,
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((b) => b.status === statusFilter);
    }

    return list;
  }, [bookings, search, timeSlot, statusFilter]);

  // Stats derived from ALL bookings for today (not filtered)
  const stats = useMemo(
    () => ({
      total: bookings.length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      arrived: bookings.filter((b) => b.status === "arrived").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) =>
        ["cancelled", "no_show"].includes(b.status),
      ).length,
    }),
    [bookings],
  );

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const allStatuses = Array.from(new Set(bookings.map((b) => b.status)));

  return (
    <div className="min-h-screen max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={20} className="text-[#051e3a]" />
            <h1 className="text-2xl font-bold text-[#051e3a]">
              Today&apos;s Reservations
            </h1>
          </div>
          <p className="text-sm text-gray-400">{dateLabel}</p>
        </div>
        <button
          onClick={() => fetchBookings()}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold text-[#051e3a] hover:bg-gray-50 transition-colors shrink-0">
          <RefreshCw size={14} className={cn(refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Total today"
            value={stats.total}
            color="bg-[#051e3a]"
          />
          <StatCard
            label="Confirmed"
            value={stats.confirmed}
            color="bg-blue-400"
          />
          <StatCard label="Arrived" value={stats.arrived} color="bg-teal-400" />
          <StatCard
            label="Completed"
            value={stats.completed}
            color="bg-emerald-400"
          />
        </div>
      )}

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name or email…"
            className="w-full bg-white border border-gray-200 text-[#051e3a] text-sm rounded-full pl-9 pr-9 py-2.5 outline-none placeholder:text-gray-400 focus:border-[#051e3a] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status filter */}
        {allStatuses.length > 1 && (
          <div className="relative shrink-0">
            <button
              onClick={() => setStatusMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-semibold text-[#051e3a] hover:bg-gray-50 transition-colors">
              {statusFilter === "all"
                ? "All statuses"
                : (STATUS_META[statusFilter]?.label ?? statusFilter)}
              <ChevronDown size={13} className="text-gray-400" />
            </button>
            {statusMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setStatusMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-20 min-w-[160px]">
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                      setStatusMenuOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm transition-colors",
                      statusFilter === "all"
                        ? "font-semibold text-[#051e3a]"
                        : "text-gray-600 hover:bg-gray-50",
                    )}>
                    All statuses
                  </button>
                  {allStatuses.map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setStatusFilter(st);
                        setStatusMenuOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm transition-colors",
                        statusFilter === st
                          ? "font-semibold text-[#051e3a]"
                          : "text-gray-600 hover:bg-gray-50",
                      )}>
                      {STATUS_META[st]?.label ?? st}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Time slot filter pills */}
      <div className="flex gap-2 flex-wrap mb-5">
        {TIME_SLOTS.map((ts) => (
          <button
            key={ts.id}
            onClick={() => setTimeSlot(ts.id)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors",
              timeSlot === ts.id
                ? "bg-[#051e3a] text-white border-[#051e3a]"
                : "bg-white text-[#051e3a] border-gray-200 hover:bg-gray-50",
            )}>
            {ts.label}
            {ts.range && (
              <span
                className={cn(
                  "text-[11px] font-normal",
                  timeSlot === ts.id ? "text-white/70" : "text-gray-400",
                )}>
                {ts.range}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <BookingSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-20 text-center">
          <CalendarDays size={40} className="mx-auto text-gray-200 mb-4" />
          <p className="text-base font-semibold text-gray-400">
            {bookings.length === 0
              ? "No reservations for today"
              : "No results match your filters"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {bookings.length === 0
              ? "Bookings made for today will appear here."
              : "Try adjusting your search or filters."}
          </p>
          {(search || timeSlot !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setTimeSlot("all");
                setStatusFilter("all");
              }}
              className="mt-4 px-5 py-2 rounded-full border border-gray-200 text-sm font-semibold text-[#051e3a] hover:bg-gray-50 transition-colors">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">
            Showing {filtered.length} of {bookings.length} reservation
            {bookings.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-3">
            {filtered.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onStatusChange={handleStatusChange}
                statusLoading={statusLoading}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
