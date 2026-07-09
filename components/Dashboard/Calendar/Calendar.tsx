"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  ChevronDown,
  X,
  Clock,
  Package,
  Users,
  CalendarDays,
  User,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetEmployees } from "@/services/employee.service";
import { useGetServices } from "@/services/services.service";
import { useGetCalendarBookings } from "@/services/calendar.service";

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_H = 64; // px per hour
const GUTTER_W = 56; // time-label gutter width

// Sticky offsets — these match the dashboard layout's header heights exactly:
// Dashboard header: h-[56px] on mobile, h-[60px] on md+
// Calendar toolbar: h-[52px]
// Column headers need to stick below both
const TOOLBAR_H = 52;
const DASH_HEADER_H = 56; // matches h-[56px] in DashboardLayout
const DASH_HEADER_H_MD = 60; // matches md:h-[60px] in DashboardLayout
const COL_HEADER_TOP = DASH_HEADER_H + TOOLBAR_H; // 108
const COL_HEADER_TOP_MD = DASH_HEADER_H_MD + TOOLBAR_H; // 112

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const RESOURCE_PALETTE = [
  "#6B5CE7",
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
  return d.toISOString().split("T")[0];
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
      <p className="text-xs font-semibold text-white leading-tight text-center truncate max-w-[130px]">
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

// ─── Event Block ──────────────────────────────────────────────────────────────

function EventBlock({
  booking,
  mode,
  onClick,
}: {
  booking: any;
  mode: CalendarMode;
  onClick: () => void;
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
  const isShort = height < 44;

  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        top,
        left: 2,
        right: 2,
        height,
        background: color,
        color: textCol,
        zIndex: 2,
      }}
      className="rounded-md px-1.5 text-left overflow-hidden shadow hover:brightness-110 active:scale-[0.98] transition-all">
      {isShort ? (
        <p className="text-[10px] font-semibold leading-tight truncate">
          {fmtTime(start)} · {customerName}
        </p>
      ) : (
        <>
          <p className="text-[10px] font-bold leading-tight truncate">
            {fmtTime(start)} – {fmtTime(end)}
          </p>
          <p className="text-[11px] font-semibold leading-tight truncate mt-0.5">
            {customerName}
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

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  confirmed: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  completed: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  cancelled: "bg-red-500/20 text-red-300 border border-red-500/30",
  no_show: "bg-gray-500/20 text-gray-300 border border-gray-500/30",
};

function BookingDetailPanel({
  booking,
  mode,
  onClose,
}: {
  booking: any;
  mode: CalendarMode;
  onClose: () => void;
}) {
  const color = eventColor(booking, mode);
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);
  const customer = booking.user_id as any;
  const employee = booking.employee_id;
  const service = booking.service_id;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end bg-black/40 p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#0a1929] border border-[#0e3258] rounded-t-2xl sm:rounded-2xl w-full sm:w-80 shadow-2xl overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: color }} />
        <div className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">
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
              className="text-gray-400 hover:text-white p-1">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Clock size={13} className="text-gray-400 shrink-0" />
              <p className="text-sm text-white">
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
                  <p className="text-sm text-white">
                    {customer.name || "Guest"}
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
                <p className="text-sm text-white">{employee.full_name}</p>
              </div>
            )}
            {service && (
              <div className="flex items-center gap-2.5">
                <Package size={13} className="text-gray-400 shrink-0" />
                <p className="text-sm text-white">
                  {service.name}
                  {booking.total_price != null && (
                    <span className="text-gray-400 ml-1.5">
                      · ${booking.total_price}
                    </span>
                  )}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                  STATUS_STYLES[booking.status] || STATUS_STYLES.pending,
                )}>
                {booking.status?.charAt(0).toUpperCase() +
                  booking.status?.slice(1)}
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
              <p className="text-xs text-gray-400 bg-[#0d2d4e] rounded-lg p-2.5 leading-relaxed">
                {booking.notes}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Current Time Indicator ───────────────────────────────────────────────────

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
      <div className="bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded shrink-0 ml-1">
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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0e1f35] border border-[#1a3a60] text-sm font-semibold text-white hover:bg-[#142840] transition-colors">
        {label}
        <ChevronDown size={13} className="text-gray-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 bg-[#0a1929] border border-[#1a3a60] rounded-xl shadow-2xl py-1.5 min-w-[180px] z-40 max-h-60 overflow-y-auto">
          <button
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
            className={cn(
              "w-full text-left px-3.5 py-2 text-sm transition-colors",
              selectedId === null
                ? "text-[#6B5CE7] font-semibold"
                : "text-white hover:bg-[#0d2d4e]",
            )}>
            {mode === "employee" ? "All team" : "All resources"}
          </button>
          <div className="h-px bg-[#1a3a60] mx-2 my-1" />
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
                  ? "text-[#6B5CE7] font-semibold"
                  : "text-white hover:bg-[#0d2d4e]",
              )}>
              {mode === "employee" ? (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[8px] font-bold"
                  style={{ background: item.calendar_color || "#4DD0E1" }}>
                  {getInitials(item.full_name)}
                </div>
              ) : (
                <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 bg-[#1a3a60]">
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
      className="bg-[#060f1a] border-r border-[#162640] shrink-0"
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

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({
  date,
  columns,
  bookings,
  mode,
  onBookingClick,
}: {
  date: Date;
  columns: any[];
  bookings: any[];
  mode: CalendarMode;
  onBookingClick: (b: any) => void;
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

  return (
    <>
      {/* Column headers — sticky below toolbar */}
      <div
        className="flex border-b border-[#162640] bg-[#060f1a]"
        style={{ position: "sticky", top: COL_HEADER_TOP, zIndex: 20 }}>
        <div
          className="shrink-0 border-r border-[#162640]"
          style={{ width: GUTTER_W }}
        />
        {columns.map((col) => (
          <div
            key={col._id}
            className="flex-1 border-r border-[#162640] last:border-r-0">
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
          </div>
        ))}
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
            <div
              key={col._id}
              className="relative flex-1 border-r border-[#162640] last:border-r-0">
              <GridLines />
              {(bookingsByColumn[col._id] || []).map((b) => (
                <EventBlock
                  key={b._id}
                  booking={b}
                  mode={mode}
                  onClick={() => onBookingClick(b)}
                />
              ))}
            </div>
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
    </>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({
  weekDays,
  bookings,
  mode,
  onBookingClick,
}: {
  weekDays: Date[];
  bookings: any[];
  mode: CalendarMode;
  onBookingClick: (b: any) => void;
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

  return (
    <>
      {/* Day headers — sticky below toolbar */}
      <div
        className="flex border-b border-[#162640] bg-[#060f1a]"
        style={{ position: "sticky", top: COL_HEADER_TOP, zIndex: 20 }}>
        <div
          className="shrink-0 border-r border-[#162640]"
          style={{ width: GUTTER_W }}
        />
        {weekDays.map((day, i) => {
          const todayFlag = isToday(day);
          return (
            <div
              key={i}
              className={cn(
                "flex-1 py-3 text-center border-r border-[#162640] last:border-r-0",
                todayFlag && "bg-[#6B5CE7]/5",
              )}>
              <p
                className={cn(
                  "text-xs font-semibold",
                  todayFlag ? "text-[#6B5CE7]" : "text-gray-500",
                )}>
                {DAY_SHORT[day.getDay()]}
              </p>
              <p
                className={cn(
                  "text-lg font-bold mt-0.5 w-8 h-8 flex items-center justify-center rounded-full mx-auto",
                  todayFlag ? "bg-[#6B5CE7] text-white" : "text-white",
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
                "relative flex-1 border-r border-[#162640] last:border-r-0",
                todayFlag && "bg-[#6B5CE7]/2",
              )}>
              <GridLines />
              {(bookingsByDay[key] || []).map((b) => (
                <EventBlock
                  key={b._id}
                  booking={b}
                  mode={mode}
                  onClick={() => onBookingClick(b)}
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
    <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] px-3 py-2 bg-[#060f1a] border-b border-[#162640]">
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
                ? "bg-[#6B5CE7] border-[#6B5CE7] text-white"
                : todayFlag
                  ? "bg-[#6B5CE7]/10 border-[#6B5CE7]/30 text-[#6B5CE7]"
                  : "bg-[#0d2040] border-[#1a3060] text-gray-400",
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

export default function Calendar() {
  const router = useRouter();

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

  return (
    // No height/overflow constraints — the page (window) scrolls naturally
    <div className="bg-[#060f1a] text-white">
      {/* ── Sticky Toolbar ── */}
      <div
        className="flex items-center gap-2 px-3 md:px-4 border-b border-[#162640] bg-[#060f1a] flex-wrap"
        style={{
          position: "sticky",
          top: DASH_HEADER_H,
          zIndex: 30,
          height: TOOLBAR_H,
        }}>
        {/* Left */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-sm font-semibold text-white bg-[#0d2040] border border-[#1a3a60] rounded-full hover:bg-[#142840] transition-colors">
            Today
          </button>
          <div className="flex items-center bg-[#0d2040] border border-[#1a3a60] rounded-full overflow-hidden">
            <button
              onClick={goPrev}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#142840] transition-colors">
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold text-white px-2 min-w-[110px] md:min-w-[160px] text-center">
              {dateLabel}
            </span>
            <button
              onClick={goNext}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#142840] transition-colors">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        <div className="hidden sm:block">
          <TeamFilterDropdown
            employees={allEmployees}
            services={resourceServices}
            mode={mode}
            selectedId={filterId}
            onSelect={setFilterId}
          />
        </div>

        <div className="flex-1" />

        {/* Right */}
        <div className="flex items-center gap-1.5">
          <div className="hidden sm:flex items-center bg-[#0d2040] border border-[#1a3a60] rounded-full p-0.5 gap-0.5">
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
                    ? "bg-[#6B5CE7] text-white"
                    : "text-gray-400 hover:text-white",
                )}>
                {m === "employee" ? <Users size={12} /> : <Package size={12} />}
                <span className="hidden md:inline">
                  {m === "employee" ? "Team" : "Resources"}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => refetch()}
            disabled={bookingLoading}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-[#1a3a60] text-gray-400 hover:text-white hover:bg-[#0d2040] transition-colors">
            <RefreshCw
              size={13}
              className={cn(bookingLoading && "animate-spin")}
            />
          </button>

          <div className="flex items-center bg-[#0d2040] border border-[#1a3a60] rounded-full p-0.5 gap-0.5">
            {(["day", "week"] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize",
                  view === v
                    ? "bg-white text-[#060f1a]"
                    : "text-gray-400 hover:text-white",
                )}>
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={() => router.push("/dashboard/services")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#060f1a] text-sm font-bold hover:bg-gray-100 transition-colors">
            <Plus size={14} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>

      {/* ── Mobile: mode + filter bar ── */}
      <div className="sm:hidden flex items-center gap-2 px-3 py-2 border-b border-[#162640] bg-[#060f1a]">
        <div className="flex items-center bg-[#0d2040] border border-[#1a3a60] rounded-full p-0.5 gap-0.5">
          {(["employee", "resource"] as CalendarMode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setFilterId(null);
              }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
                mode === m ? "bg-[#6B5CE7] text-white" : "text-gray-400",
              )}>
              {m === "employee" ? <Users size={11} /> : <Package size={11} />}
              {m === "employee" ? "Team" : "Resources"}
            </button>
          ))}
        </div>
        <TeamFilterDropdown
          employees={allEmployees}
          services={resourceServices}
          mode={mode}
          selectedId={filterId}
          onSelect={setFilterId}
        />
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
        <div className="flex items-center justify-center py-3 gap-2 border-b border-[#162640]">
          <Loader2 size={14} className="animate-spin text-[#6B5CE7]" />
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
            mode={mode}
            onBookingClick={setSelectedBooking}
          />
        ) : (
          <WeekView
            weekDays={weekDays}
            bookings={allBookings}
            mode={mode}
            onBookingClick={setSelectedBooking}
          />
        )}
      </div>

      {/* ── Calendar grid — mobile (single day always) ── */}
      <div className="sm:hidden">
        <DayView
          date={view === "week" ? mobileDate : currentDate}
          columns={columns}
          bookings={allBookings.filter((b) =>
            sameDay(
              new Date(b.start_time),
              view === "week" ? mobileDate : currentDate,
            ),
          )}
          mode={mode}
          onBookingClick={setSelectedBooking}
        />
      </div>

      {/* ── Booking detail ── */}
      {selectedBooking && (
        <BookingDetailPanel
          booking={selectedBooking}
          mode={mode}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}
