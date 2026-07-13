"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  CalendarDays,
  X,
  MoreHorizontal,
  Loader2,
  Ban,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useGetServices } from "@/services/services.service";
import {
  useGetResourceOverrides,
  useUpsertResourceOverride,
} from "@/services/resources.service";

const DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DAY_KEY_TO_FULL: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function fmtISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const mo = monday.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const su = sunday.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${mo} – ${su}`;
}

function isPastDay(d: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

function isToday(d: Date): boolean {
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

type CellInfo =
  | { kind: "closed" }
  | { kind: "no_schedule" }
  | { kind: "resource"; qty: number; overridden: boolean }
  | {
      kind: "group";
      slots: { start_time: string; end_time: string; capacity: number }[];
    };

function getCellInfo(service: any, dayDate: Date, overrides: any[]): CellInfo {
  const override = overrides.find(
    (o) =>
      o.service_id === service._id ||
      o.service_id?.toString() === service._id?.toString(),
  );

  if (override?.is_closed) return { kind: "closed" };

  if (service.service_type === "resource_based") {
    const qty =
      override?.quantity_override != null
        ? override.quantity_override
        : (service.max_concurrent_bookings ?? 1);

    if (service.availability_type === "specific") {
      const shortKey =
        DAY_KEYS[dayDate.getDay() === 0 ? 6 : dayDate.getDay() - 1];
      const fullDay = DAY_KEY_TO_FULL[shortKey];
      const scheduled = (service.availability_schedule ?? []).find(
        (s: any) => s.day_of_week === fullDay || s.day_of_week === shortKey,
      );
      if (!scheduled?.is_available) return { kind: "no_schedule" };
    }

    return {
      kind: "resource",
      qty,
      overridden: override?.quantity_override != null,
    };
  }

  if (service.service_type === "group_session") {
    const shortKey =
      DAY_KEYS[dayDate.getDay() === 0 ? 6 : dayDate.getDay() - 1];
    const fullDay = DAY_KEY_TO_FULL[shortKey];
    const daySchedule = (service.group_schedule ?? []).find(
      (d: any) =>
        (d.day_of_week === fullDay || d.day_of_week === shortKey) &&
        d.is_active,
    );
    if (!daySchedule || !daySchedule.slots?.length)
      return { kind: "no_schedule" };
    return { kind: "group", slots: daySchedule.slots };
  }

  return { kind: "no_schedule" };
}

// ─── Service Icon ─────────────────────────────────────────────────────────────

function ServiceIcon({ type, size = 16 }: { type: string; size?: number }) {
  if (type === "group_session")
    return <CalendarDays size={size} className="text-purple-400" />;
  return <Package size={size} className="text-blue-400" />;
}

// ─── Service Action Dropdown ──────────────────────────────────────────────────

function ServiceActionDropdown({ onEdit }: { onEdit: () => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-svc-menu]")) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const toggle = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ x: r.right, y: r.bottom + 4 });
    }
    setOpen((v) => !v);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="w-6 h-6 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100">
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <div
          data-svc-menu
          style={{ position: "fixed", left: pos.x - 160, top: pos.y }}
          className="bg-white border border-gray-200 rounded-xl shadow-2xl py-1.5 min-w-[160px] z-50">
          <button
            onClick={() => {
              onEdit();
              setOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-2">
            <ExternalLink size={13} className="text-gray-400" />
            Edit service
          </button>
        </div>
      )}
    </>
  );
}

// ─── Day Override Dialog ──────────────────────────────────────────────────────

function DayOverrideDialog({
  service,
  dayDate,
  currentOverride,
  onClose,
  onSave,
  isSaving,
}: {
  service: any;
  dayDate: Date;
  currentOverride: any;
  onClose: () => void;
  onSave: (payload: {
    is_closed: boolean;
    quantity_override?: number | null;
  }) => void;
  isSaving?: boolean;
}) {
  const [isClosed, setIsClosed] = useState<boolean>(
    currentOverride?.is_closed ?? false,
  );
  const [qty, setQty] = useState<string>(
    currentOverride?.quantity_override != null
      ? String(currentOverride.quantity_override)
      : "",
  );

  const isResource = service.service_type === "resource_based";
  const dateLabel = dayDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}>
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{service.name}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{dateLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Closed toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {service.service_type === "group_session"
                  ? "Cancel all sessions"
                  : "Closed for this day"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {service.service_type === "group_session"
                  ? "No bookings for all slots on this day"
                  : "No bookings will be accepted"}
              </p>
            </div>
            <button
              onClick={() => setIsClosed((v) => !v)}
              className={cn(
                "w-10 h-5.5 rounded-full border relative transition-colors shrink-0",
                isClosed
                  ? "bg-red-500 border-red-500"
                  : "bg-gray-50 border-gray-200",
              )}
              style={{ height: "22px", width: "40px" }}>
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                  isClosed && "translate-x-[18px]",
                )}
              />
            </button>
          </div>

          {/* Quantity override (resource_based only) */}
          {isResource && !isClosed && (
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">
                Override quantity
              </p>
              <p className="text-xs text-gray-400 mb-2.5">
                Default: {service.max_concurrent_bookings ?? 1} units. Leave
                blank to use default.
              </p>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder={String(service.max_concurrent_bookings ?? 1)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-[#051e3a] transition-colors placeholder:text-gray-600"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          {currentOverride && (
            <button
              onClick={() =>
                onSave({ is_closed: false, quantity_override: null })
              }
              disabled={isSaving}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 border border-gray-200 rounded-full px-3.5 py-1.5 hover:bg-gray-50 transition-colors">
              <RotateCcw size={13} /> Reset
            </button>
          )}
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-sm text-gray-400 border border-gray-200 rounded-full px-4 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({
                is_closed: isClosed,
                quantity_override:
                  isResource && !isClosed && qty !== ""
                    ? Math.max(1, parseInt(qty, 10))
                    : null,
              })
            }
            disabled={isSaving}
            className="flex items-center gap-1.5 text-sm font-semibold bg-[#051e3a] text-white rounded-full px-4 py-1.5 hover:bg-[#082040] disabled:opacity-60 transition-colors">
            {isSaving && <Loader2 size={13} className="animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cell Renderer ────────────────────────────────────────────────────────────

function DayCell({
  service,
  dayDate,
  overrides,
  onOpen,
}: {
  service: any;
  dayDate: Date;
  overrides: any[];
  onOpen: () => void;
}) {
  const past = isPastDay(dayDate);
  const today = isToday(dayDate);
  const info = getCellInfo(service, dayDate, overrides);

  const inner = (() => {
    if (info.kind === "closed")
      return (
        <div className="flex flex-col items-center gap-0.5">
          <Ban size={12} className={past ? "text-red-800" : "text-red-300"} />
          <p
            className={cn(
              "text-[10px] font-semibold",
              past ? "text-red-800" : "text-red-200",
            )}>
            Closed
          </p>
        </div>
      );

    if (info.kind === "no_schedule")
      return (
        <p className="text-[10px] text-gray-700">
          {service.service_type === "group_session"
            ? "No sessions"
            : "Unavail."}
        </p>
      );

    if (info.kind === "resource")
      return (
        <div className="text-center">
          <p
            className={cn(
              "text-[10px] font-bold leading-tight",
              past
                ? info.overridden
                  ? "text-blue-800"
                  : "text-emerald-800"
                : info.overridden
                  ? "text-blue-200"
                  : "text-emerald-200",
            )}>
            Open
          </p>
          <p
            className={cn(
              "text-[10px] leading-tight",
              past
                ? info.overridden
                  ? "text-blue-900"
                  : "text-emerald-900"
                : info.overridden
                  ? "text-blue-300"
                  : "text-emerald-300",
            )}>
            {info.qty} {info.qty === 1 ? "unit" : "units"}
            {info.overridden && " ✎"}
          </p>
        </div>
      );

    if (info.kind === "group")
      return (
        <div className="space-y-0.5 text-center">
          {info.slots.slice(0, 3).map((s, i) => (
            <p
              key={i}
              className={cn(
                "text-[9px] font-semibold leading-tight",
                past ? "text-purple-800" : "text-purple-200",
              )}>
              {s.start_time}–{s.end_time}
            </p>
          ))}
          {info.slots.length > 3 && (
            <p
              className={cn(
                "text-[9px]",
                past ? "text-gray-700" : "text-gray-400",
              )}>
              +{info.slots.length - 3}
            </p>
          )}
        </div>
      );

    return null;
  })();

  const bg = (() => {
    if (info.kind === "no_schedule")
      return past
        ? "bg-white/30 border border-gray-200/40"
        : "bg-gray-50/50 border border-gray-200/60";
    if (past) {
      if (info.kind === "closed")
        return "bg-red-950/20 border border-red-900/20";
      if (info.kind === "resource")
        return info.overridden
          ? "bg-blue-950/20 border border-blue-900/20"
          : "bg-emerald-950/20 border border-emerald-900/15";
      if (info.kind === "group")
        return "bg-purple-950/20 border border-purple-900/15";
    }
    if (info.kind === "closed") return "bg-red-900/60 border border-red-700/60";
    if (info.kind === "resource")
      return info.overridden
        ? "bg-blue-900/60 border border-blue-700/50"
        : "bg-emerald-900/60 border border-emerald-700/50";
    if (info.kind === "group")
      return "bg-purple-900/60 border border-purple-700/50";
    return "bg-gray-50";
  })();

  if (past || info.kind === "no_schedule") {
    return (
      <div
        className={cn(
          "w-full rounded-lg px-2 py-2.5 min-h-[52px] flex items-center justify-center opacity-50",
          bg,
        )}>
        {inner}
      </div>
    );
  }

  return (
    <button
      onClick={onOpen}
      className={cn(
        "w-full rounded-lg px-2 py-2.5 min-h-[52px] flex items-center justify-center hover:brightness-110 active:scale-[0.97] transition-all cursor-pointer shadow-sm",
        bg,
        today && "ring-2 ring-[#051e3a]/60 ring-offset-1 ring-offset-[#051e3a]",
      )}>
      {inner}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Resources() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: svcData } = useGetServices();

  const services = useMemo<any[]>(
    () =>
      (svcData?.data ?? []).filter(
        (s: any) =>
          s.service_type === "resource_based" ||
          s.service_type === "group_session",
      ),
    [svcData],
  );

  const [monday, setMonday] = useState<Date>(() => getMonday(new Date()));
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(monday, i)),
    [monday],
  );

  const weekStartISO = fmtISODate(monday);
  const weekEndISO = fmtISODate(addDays(monday, 6));

  const { data: overridesData } = useGetResourceOverrides(
    weekStartISO,
    weekEndISO,
  );
  const overrides = useMemo<any[]>(
    () => overridesData?.data ?? [],
    [overridesData],
  );

  const { mutate: upsertOverride, isPending: savingOverride } =
    useUpsertResourceOverride();

  const [overrideDialog, setOverrideDialog] = useState<{
    service: any;
    dayDate: Date;
  } | null>(null);

  const goThisWeek = () => setMonday(getMonday(new Date()));
  const goPrev = () => setMonday((m) => addDays(m, -7));
  const goNext = () => setMonday((m) => addDays(m, 7));

  const getOverride = (service: any, dayDate: Date) => {
    const dateStr = fmtISODate(dayDate);
    return overrides.find(
      (o) =>
        (o.service_id === service._id ||
          o.service_id?.toString() === service._id?.toString()) &&
        o.date === dateStr,
    );
  };

  const handleSaveOverride = (
    service: any,
    dayDate: Date,
    payload: { is_closed: boolean; quantity_override?: number | null },
  ) => {
    const isReset = !payload.is_closed && payload.quantity_override == null;
    if (isReset) {
      const existing = getOverride(service, dayDate);
      if (existing) {
        upsertOverride(
          {
            service_id: service._id,
            date: fmtISODate(dayDate),
            is_closed: false,
            quantity_override: null,
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["resourceOverrides"],
              });
              setOverrideDialog(null);
            },
          },
        );
      } else {
        setOverrideDialog(null);
      }
      return;
    }

    upsertOverride(
      {
        service_id: service._id,
        date: fmtISODate(dayDate),
        ...payload,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["resourceOverrides"] });
          setOverrideDialog(null);
        },
      },
    );
  };

  const selectedDayDate = weekDays[selectedDayIdx];

  return (
    <div className="min-h-screen text-gray-700">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#051e3a]">
            Resources
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">
            Manage resource and group session availability by day
          </p>
        </div>
      </div>

      {/* ── Desktop week nav ── */}
      <div className="hidden md:flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button
            onClick={goThisWeek}
            className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors">
            This week
          </button>
          <div className="flex items-center gap-1 border border-gray-200 bg-white rounded-full px-2 py-1.5">
            <button
              onClick={goPrev}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-900">
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold text-gray-900 px-2 min-w-[170px] text-center">
              {fmtWeekRange(monday)}
            </span>
            <button
              onClick={goNext}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-900">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-900/60 border border-emerald-700/40" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-950/60 border border-red-800/40" />
            Closed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-950/60 border border-purple-800/40" />
            Sessions
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-950/60 border border-blue-800/40" />
            Qty overridden
          </span>
        </div>
      </div>

      {/* ── Mobile week nav ── */}
      <div className="md:hidden mb-4 space-y-3">
        <div className="flex items-center justify-between bg-white rounded-2xl px-3 py-2 border border-gray-200">
          <button
            onClick={goPrev}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goThisWeek}
            className="text-sm font-semibold text-gray-900">
            {monday.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            –{" "}
            {addDays(monday, 6).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </button>
          <button
            onClick={goNext}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] pb-0.5">
          {weekDays.map((day, i) => (
            <button
              key={i}
              onClick={() => setSelectedDayIdx(i)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[52px] px-2 py-2 rounded-xl border text-xs font-semibold transition-colors shrink-0",
                selectedDayIdx === i
                  ? "bg-white border-gray-200 text-gray-900"
                  : "bg-white border-gray-200 text-[#051e3a] hover:bg-gray-50",
              )}>
              <span>{DAY_SHORT[i]}</span>
              <span className="text-[10px] font-normal mt-0.5 opacity-70">
                {day.getDate()}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Desktop Table ── */}
      <div className="hidden md:block border border-gray-200 rounded-2xl overflow-hidden bg-white/5">
        {/* Header */}
        <div className="grid grid-cols-[220px_repeat(7,1fr)] border-b border-gray-200">
          <div className="px-4 py-3 flex items-center border-r border-gray-200">
            <span className="text-sm font-semibold text-gray-700">
              Resource / Service
            </span>
          </div>
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={cn(
                "px-3 py-3 text-center",
                i < 6 && "border-r border-gray-200",
                isToday(day) && "bg-[#051e3a]/5",
              )}>
              <p
                className={cn(
                  "text-sm font-bold",
                  isToday(day) ? "text-[#051e3a]" : "text-gray-700",
                )}>
                {DAY_SHORT[i]}, {fmtShort(day)}
              </p>
            </div>
          ))}
        </div>

        {/* Rows */}
        {services.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Package size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-semibold">
              No resource or group session services yet
            </p>
            <p className="text-gray-600 text-xs mt-1">
              Add a Resource or Group Session service to manage it here.
            </p>
            <button
              onClick={() => router.push("/dashboard/services/add")}
              className="mt-4 text-sm font-semibold text-[#051e3a] hover:text-purple-300 transition-colors">
              + Create service
            </button>
          </div>
        ) : (
          services.map((svc, si) => (
            <div
              key={svc._id}
              className={cn(
                "group grid grid-cols-[220px_repeat(7,1fr)]",
                si < services.length - 1 && "border-b border-gray-200",
              )}>
              {/* Service info cell */}
              <div className="px-4 py-4 flex items-center gap-2.5 border-r border-gray-200 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                  <ServiceIcon type={svc.service_type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">
                    {svc.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {svc.service_type === "resource_based"
                      ? `${svc.max_concurrent_bookings ?? 1} units`
                      : "Group session"}
                  </p>
                </div>
                <ServiceActionDropdown
                  onEdit={() =>
                    router.push(`/dashboard/services/edit/${svc._id}`)
                  }
                />
              </div>

              {/* Day cells */}
              {weekDays.map((dayDate, di) => (
                <div
                  key={di}
                  className={cn(
                    "px-2 py-3 flex items-center justify-center",
                    di < 6 && "border-r border-gray-200",
                    isToday(dayDate) && "bg-[#051e3a]/5",
                  )}>
                  <DayCell
                    service={svc}
                    dayDate={dayDate}
                    overrides={overrides.filter(
                      (o) =>
                        (o.service_id === svc._id ||
                          o.service_id?.toString() === svc._id?.toString()) &&
                        o.date === fmtISODate(dayDate),
                    )}
                    onOpen={() =>
                      !isPastDay(dayDate) &&
                      setOverrideDialog({ service: svc, dayDate })
                    }
                  />
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* ── Mobile List (single day) ── */}
      <div className="md:hidden space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {selectedDayDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        {services.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-500 text-sm">No resource services yet.</p>
            <button
              onClick={() => router.push("/dashboard/services/add")}
              className="mt-3 text-sm font-semibold text-[#051e3a]">
              + Create service
            </button>
          </div>
        ) : (
          services.map((svc) => {
            const dayOverride = getOverride(svc, selectedDayDate);
            const info = getCellInfo(
              svc,
              selectedDayDate,
              [dayOverride].filter(Boolean),
            );
            const past = isPastDay(selectedDayDate);

            return (
              <div
                key={svc._id}
                className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                  <ServiceIcon type={svc.service_type} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {svc.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {info.kind === "closed"
                      ? "Closed"
                      : info.kind === "no_schedule"
                        ? "Unavailable"
                        : info.kind === "resource"
                          ? `Open · ${info.qty} ${info.qty === 1 ? "unit" : "units"}`
                          : `${info.slots.length} session${info.slots.length !== 1 ? "s" : ""}`}
                  </p>
                </div>
                {!past && (
                  <button
                    onClick={() =>
                      setOverrideDialog({
                        service: svc,
                        dayDate: selectedDayDate,
                      })
                    }
                    className="text-sm font-semibold text-[#051e3a] hover:text-purple-300 transition-colors shrink-0">
                    Configure
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Day Override Dialog ── */}
      {overrideDialog && (
        <DayOverrideDialog
          service={overrideDialog.service}
          dayDate={overrideDialog.dayDate}
          currentOverride={getOverride(
            overrideDialog.service,
            overrideDialog.dayDate,
          )}
          onClose={() => setOverrideDialog(null)}
          onSave={(payload) =>
            handleSaveOverride(
              overrideDialog.service,
              overrideDialog.dayDate,
              payload,
            )
          }
          isSaving={savingOverride}
        />
      )}
    </div>
  );
}
