"use client";

import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  CalendarDays,
  X,
  Loader2,
  Ban,
  RotateCcw,
  Plus,
  Trash2,
  Settings2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetServices } from "@/services/services.service";
import {
  useGetResourceOverrides,
  useUpsertResourceOverride,
  useUpdateResourceSchedule,
} from "@/services/resources.service";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

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

// ─── Date helpers ─────────────────────────────────────────────────────────────

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
  const mo = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const su = sunday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

// ─── Schedule helpers ─────────────────────────────────────────────────────────

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
}
function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h && !m) return "0 hr";
  return m ? `${h}h ${m}m` : `${h} hr`;
}

function initResourceSchedule(service: any) {
  return DAYS.map((day) => {
    const existing = (service.availability_schedule ?? []).find(
      (s: any) => s.day_of_week === day,
    );
    return {
      day_of_week: day,
      is_available: existing?.is_available ?? false,
      start_time: existing?.start_time ?? "09:00",
      end_time: existing?.end_time ?? "17:00",
    };
  });
}

function initGroupSchedule(service: any) {
  return DAYS.map((day) => {
    const existing = (service.group_schedule ?? []).find(
      (s: any) => s.day_of_week === day,
    );
    return {
      day_of_week: day,
      is_active: existing?.is_active ?? false,
      slots: [...(existing?.slots ?? [])],
    };
  });
}

// ─── Cell info ────────────────────────────────────────────────────────────────

type CellInfo =
  | { kind: "closed" }
  | { kind: "no_schedule" }
  | { kind: "resource"; qty: number; overridden: boolean }
  | { kind: "group"; slots: { start_time: string; end_time: string; capacity: number }[] };

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
      const shortKey = DAY_KEYS[dayDate.getDay() === 0 ? 6 : dayDate.getDay() - 1];
      const fullDay = DAY_KEY_TO_FULL[shortKey];
      const scheduled = (service.availability_schedule ?? []).find(
        (s: any) => s.day_of_week === fullDay || s.day_of_week === shortKey,
      );
      if (!scheduled?.is_available) return { kind: "no_schedule" };
    }
    return { kind: "resource", qty, overridden: override?.quantity_override != null };
  }

  if (service.service_type === "group_session") {
    const shortKey = DAY_KEYS[dayDate.getDay() === 0 ? 6 : dayDate.getDay() - 1];
    const fullDay = DAY_KEY_TO_FULL[shortKey];
    const daySchedule = (service.group_schedule ?? []).find(
      (d: any) =>
        (d.day_of_week === fullDay || d.day_of_week === shortKey) && d.is_active,
    );
    if (!daySchedule || !daySchedule.slots?.length) return { kind: "no_schedule" };
    return { kind: "group", slots: daySchedule.slots };
  }

  return { kind: "no_schedule" };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ServiceIcon({ type, size = 16 }: { type: string; size?: number }) {
  if (type === "group_session")
    return <CalendarDays size={size} className="text-purple-400" />;
  return <Package size={size} className="text-blue-400" />;
}

function DayToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
        checked
          ? "bg-[#051e3a] border-[#051e3a]"
          : "bg-white border-gray-300 hover:border-[#051e3a]",
      )}>
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path
            d="M1 4L3.5 6.5L9 1.5"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
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
  onSave: (payload: { is_closed: boolean; quantity_override?: number | null }) => void;
  isSaving?: boolean;
}) {
  const [isClosed, setIsClosed] = useState<boolean>(currentOverride?.is_closed ?? false);
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{service.name}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{dateLabel}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {service.service_type === "group_session" ? "Cancel all sessions" : "Closed for this day"}
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
                "relative rounded-full border transition-colors shrink-0",
                isClosed ? "bg-red-500 border-red-500" : "bg-gray-50 border-gray-200",
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

          {isResource && !isClosed && (
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Override quantity</p>
              <p className="text-xs text-gray-400 mb-2.5">
                Default: {service.max_concurrent_bookings ?? 1} units. Leave blank to use default.
              </p>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder={String(service.max_concurrent_bookings ?? 1)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-[#051e3a] transition-colors placeholder:text-gray-400"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          {currentOverride && (
            <button
              onClick={() => onSave({ is_closed: false, quantity_override: null })}
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

// ─── Resource Schedule Drawer ─────────────────────────────────────────────────

function ResourceScheduleDrawer({
  service,
  onClose,
  onSaved,
}: {
  service: any;
  onClose: () => void;
  onSaved: (updated: any) => void;
}) {
  const isResource = service.service_type === "resource_based";

  const [maxQty, setMaxQty] = useState<number>(service.max_concurrent_bookings ?? 1);
  const [availType, setAvailType] = useState<"always" | "specific">(
    service.availability_type ?? "always",
  );
  const [resourceSched, setResourceSched] = useState(() => initResourceSchedule(service));
  const [groupSched, setGroupSched] = useState(() => initGroupSchedule(service));

  const { mutate, isPending: saving } = useUpdateResourceSchedule();

  const totalMins = useMemo(
    () =>
      isResource && availType === "specific"
        ? resourceSched
            .filter((d) => d.is_available)
            .reduce((s, d) => s + minutesBetween(d.start_time, d.end_time), 0)
        : 0,
    [resourceSched, availType, isResource],
  );

  const totalSessions = useMemo(
    () =>
      !isResource
        ? groupSched.filter((d) => d.is_active).reduce((s, d) => s + d.slots.length, 0)
        : 0,
    [groupSched, isResource],
  );

  const setResourceDay = (i: number, patch: Partial<(typeof resourceSched)[0]>) =>
    setResourceSched((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const setGroupDay = (i: number, patch: Partial<(typeof groupSched)[0]>) =>
    setGroupSched((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const addGroupSlot = (dayIdx: number) =>
    setGroupSched((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? { ...d, slots: [...d.slots, { start_time: "09:00", end_time: "10:00", capacity: 1 }] }
          : d,
      ),
    );

  const updateGroupSlot = (dayIdx: number, slotIdx: number, patch: any) =>
    setGroupSched((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? {
              ...d,
              slots: d.slots.map((s: any, si: number) =>
                si === slotIdx ? { ...s, ...patch } : s,
              ),
            }
          : d,
      ),
    );

  const removeGroupSlot = (dayIdx: number, slotIdx: number) =>
    setGroupSched((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? { ...d, slots: d.slots.filter((_: any, si: number) => si !== slotIdx) }
          : d,
      ),
    );

  const handleSave = () => {
    const payload: any = {};
    if (isResource) {
      payload.availability_type = availType;
      payload.max_concurrent_bookings = Math.max(1, maxQty);
      payload.availability_schedule = resourceSched;
    } else {
      payload.group_schedule = groupSched;
    }
    mutate(
      { id: service._id, ...payload },
      {
        onSuccess: (data) => {
          onSaved(data.data);
          onClose();
        },
      },
    );
  };

  const timeCls =
    "border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-[#051e3a] focus:outline-none focus:border-[#051e3a] bg-white";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:w-130 bg-white flex flex-col shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-[#051e3a] shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
              <ServiceIcon type={service.service_type} size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-[#051e3a] truncate">{service.name}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {isResource
                  ? `Resource · ${maxQty} unit${maxQty !== 1 ? "s" : ""}`
                  : "Group session"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              disabled={saving}
              className="text-sm text-gray-400 border border-gray-200 rounded-full px-4 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-sm font-semibold bg-[#051e3a] text-white rounded-full px-4 py-1.5 hover:bg-[#082040] disabled:opacity-60 transition-colors">
              {saving && <Loader2 size={13} className="animate-spin" />}
              Save
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ── Resource-based ── */}
          {isResource && (
            <div className="p-6 space-y-6">
              {/* Quantity stepper */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Max concurrent units
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setMaxQty((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-lg font-bold transition-colors">
                      –
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={maxQty}
                      onChange={(e) => setMaxQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 text-center text-sm font-bold text-[#051e3a] outline-none bg-transparent border-x border-gray-200 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => setMaxQty((q) => q + 1)}
                      className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-lg font-bold transition-colors">
                      +
                    </button>
                  </div>
                  <span className="text-sm text-gray-400">units available at a time</span>
                </div>
              </div>

              {/* Availability type */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Availability
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(["always", "specific"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setAvailType(t)}
                      className={cn(
                        "py-2.5 rounded-xl text-sm font-semibold border transition-colors",
                        availType === t
                          ? "bg-[#051e3a] text-white border-[#051e3a]"
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50",
                      )}>
                      {t === "always" ? "Always available" : "Specific schedule"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weekly schedule */}
              {availType === "specific" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Weekly schedule
                    </p>
                    <p className="text-xs text-gray-400 font-semibold">
                      {formatHours(totalMins)} total
                    </p>
                  </div>
                  <div className="space-y-2">
                    {resourceSched.map((day, i) => (
                      <div
                        key={day.day_of_week}
                        className="border border-gray-100 rounded-xl p-3.5 bg-white">
                        <div className="flex items-center gap-3">
                          <DayToggle
                            checked={day.is_available}
                            onChange={(v) => setResourceDay(i, { is_available: v })}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#051e3a]">
                              {day.day_of_week}
                            </p>
                            <p className="text-xs text-gray-400">
                              {day.is_available
                                ? formatHours(minutesBetween(day.start_time, day.end_time))
                                : "Not working"}
                            </p>
                          </div>
                        </div>
                        {day.is_available && (
                          <div className="flex items-center gap-2 mt-3 pl-8">
                            <input
                              type="time"
                              value={day.start_time}
                              onChange={(e) => setResourceDay(i, { start_time: e.target.value })}
                              className={timeCls}
                            />
                            <span className="text-xs text-gray-400 shrink-0">to</span>
                            <input
                              type="time"
                              value={day.end_time}
                              onChange={(e) => setResourceDay(i, { end_time: e.target.value })}
                              className={timeCls}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Group session ── */}
          {!isResource && (
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Weekly sessions
                  </p>
                  <p className="text-xs text-gray-400 font-semibold">
                    {totalSessions} slot{totalSessions !== 1 ? "s" : ""} / week
                  </p>
                </div>
                <div className="space-y-2">
                  {groupSched.map((day, i) => (
                    <div
                      key={day.day_of_week}
                      className="border border-gray-100 rounded-xl p-3.5 bg-white">
                      <div className="flex items-center gap-3">
                        <DayToggle
                          checked={day.is_active}
                          onChange={(v) => setGroupDay(i, { is_active: v })}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#051e3a]">{day.day_of_week}</p>
                          <p className="text-xs text-gray-400">
                            {!day.is_active
                              ? "No sessions"
                              : `${day.slots.length} slot${day.slots.length !== 1 ? "s" : ""}`}
                          </p>
                        </div>
                      </div>

                      {day.is_active && (
                        <div className="mt-3 pl-8 space-y-2">
                          {day.slots.map((slot: any, si: number) => (
                            <div
                              key={si}
                              className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                              <input
                                type="time"
                                value={slot.start_time}
                                onChange={(e) =>
                                  updateGroupSlot(i, si, { start_time: e.target.value })
                                }
                                className={timeCls}
                              />
                              <span className="text-xs text-gray-400 shrink-0">to</span>
                              <input
                                type="time"
                                value={slot.end_time}
                                onChange={(e) =>
                                  updateGroupSlot(i, si, { end_time: e.target.value })
                                }
                                className={timeCls}
                              />
                              <div className="flex items-center gap-1 ml-auto shrink-0">
                                <input
                                  type="number"
                                  min={1}
                                  value={slot.capacity}
                                  onChange={(e) =>
                                    updateGroupSlot(i, si, {
                                      capacity: Math.max(1, parseInt(e.target.value) || 1),
                                    })
                                  }
                                  className="w-14 border border-gray-200 rounded-lg px-2 py-2 text-sm text-center text-[#051e3a] focus:outline-none focus:border-[#051e3a] bg-white"
                                />
                                <span className="text-[11px] text-gray-400">cap</span>
                                <button
                                  onClick={() => removeGroupSlot(i, si)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => addGroupSlot(i)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-[#051e3a] hover:text-blue-700 transition-colors py-1">
                            <Plus size={13} />
                            Add slot
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────

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
          <p className={cn("text-[10px] font-semibold", past ? "text-red-800" : "text-red-200")}>
            Closed
          </p>
        </div>
      );
    if (info.kind === "no_schedule")
      return (
        <p className="text-[10px] text-gray-700">
          {service.service_type === "group_session" ? "No sessions" : "Unavail."}
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
            <p className={cn("text-[9px]", past ? "text-gray-700" : "text-gray-400")}>
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
      if (info.kind === "closed") return "bg-red-950/20 border border-red-900/20";
      if (info.kind === "resource")
        return info.overridden
          ? "bg-blue-950/20 border border-blue-900/20"
          : "bg-emerald-950/20 border border-emerald-900/15";
      if (info.kind === "group") return "bg-purple-950/20 border border-purple-900/15";
    }
    if (info.kind === "closed") return "bg-red-900/60 border border-red-700/60";
    if (info.kind === "resource")
      return info.overridden
        ? "bg-blue-900/60 border border-blue-700/50"
        : "bg-emerald-900/60 border border-emerald-700/50";
    if (info.kind === "group") return "bg-purple-900/60 border border-purple-700/50";
    return "bg-gray-50";
  })();

  if (past || info.kind === "no_schedule") {
    return (
      <div
        className={cn(
          "w-full rounded-lg px-2 py-2.5 min-h-13 flex items-center justify-center opacity-50",
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
        "w-full rounded-lg px-2 py-2.5 min-h-13 flex items-center justify-center hover:brightness-110 active:scale-[0.97] transition-all cursor-pointer shadow-sm",
        bg,
        today && "ring-2 ring-[#051e3a]/60 ring-offset-1 ring-offset-[#051e3a]",
      )}>
      {inner}
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ResourcesSkeleton() {
  return (
    <>
      <div className="hidden md:block border border-gray-200 rounded-2xl overflow-hidden bg-white/5">
        <div className="grid grid-cols-[220px_repeat(7,1fr)] border-b border-gray-200">
          <div className="px-4 py-3 flex items-center border-r border-gray-200">
            <span className="text-sm font-semibold text-gray-700">Resource / Service</span>
          </div>
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className={cn("px-3 py-3 flex items-center justify-center", i < 6 && "border-r border-gray-200")}>
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          ))}
        </div>
        {[...Array(3)].map((_, ri) => (
          <div
            key={ri}
            className={cn("grid grid-cols-[220px_repeat(7,1fr)]", ri < 2 && "border-b border-gray-200")}>
            <div className="px-4 py-4 flex items-center gap-2.5 border-r border-gray-200">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-28 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            </div>
            {[...Array(7)].map((_, di) => (
              <div
                key={di}
                className={cn("px-2 py-3 flex items-center justify-center", di < 6 && "border-r border-gray-200")}>
                <Skeleton className="w-full h-13 rounded-lg" />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="md:hidden space-y-3">
        <Skeleton className="h-3.5 w-44 rounded" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-36 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
            <Skeleton className="h-3.5 w-16 rounded" />
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Resources() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: svcData, isPending: loadingServices } = useGetServices();

  const services = useMemo<any[]>(
    () =>
      (svcData?.data ?? []).filter(
        (s: any) =>
          s.service_type === "resource_based" || s.service_type === "group_session",
      ),
    [svcData],
  );

  const [monday, setMonday] = useState<Date>(() => getMonday(new Date()));
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [drawerService, setDrawerService] = useState<any>(null);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(monday, i)),
    [monday],
  );

  const weekStartISO = fmtISODate(monday);
  const weekEndISO = fmtISODate(addDays(monday, 6));

  const { data: overridesData } = useGetResourceOverrides(weekStartISO, weekEndISO);
  const overrides = useMemo<any[]>(() => overridesData?.data ?? [], [overridesData]);

  const { mutate: upsertOverride, isPending: savingOverride } = useUpsertResourceOverride();

  const [overrideDialog, setOverrideDialog] = useState<{ service: any; dayDate: Date } | null>(null);

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
          { service_id: service._id, date: fmtISODate(dayDate), is_closed: false, quantity_override: null },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["resourceOverrides"] });
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
      { service_id: service._id, date: fmtISODate(dayDate), ...payload },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["resourceOverrides"] });
          setOverrideDialog(null);
        },
      },
    );
  };

  const handleScheduleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["getservices"] });
  };

  const selectedDayDate = weekDays[selectedDayIdx];

  return (
    <div className="min-h-screen text-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#051e3a]">Resources</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">
            Manage resource and group session availability by day
          </p>
        </div>
      </div>

      {/* Desktop week nav */}
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
            <span className="text-sm font-semibold text-gray-900 px-2 min-w-42.5 text-center">
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

      {/* Mobile week nav */}
      <div className="md:hidden mb-4 space-y-3">
        <div className="flex items-center justify-between bg-white rounded-2xl px-3 py-2 border border-gray-200">
          <button
            onClick={goPrev}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={goThisWeek} className="text-sm font-semibold text-gray-900">
            {monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {" – "}
            {addDays(monday, 6).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
                "flex flex-col items-center justify-center min-w-13 px-2 py-2 rounded-xl border text-xs font-semibold transition-colors shrink-0",
                selectedDayIdx === i
                  ? "bg-white border-gray-200 text-gray-900"
                  : "bg-white border-gray-200 text-[#051e3a] hover:bg-gray-50",
              )}>
              <span>{DAY_SHORT[i]}</span>
              <span className="text-[10px] font-normal mt-0.5 opacity-70">{day.getDate()}</span>
            </button>
          ))}
        </div>
      </div>

      {loadingServices ? (
        <ResourcesSkeleton />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block border border-gray-200 rounded-2xl overflow-hidden bg-white/5">
            <div className="grid grid-cols-[240px_repeat(7,1fr)] border-b border-gray-200">
              <div className="px-4 py-3 flex items-center border-r border-gray-200">
                <span className="text-sm font-semibold text-gray-700">Resource / Service</span>
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
                    "group grid grid-cols-[240px_repeat(7,1fr)]",
                    si < services.length - 1 && "border-b border-gray-200",
                  )}>
                  {/* Service info cell */}
                  <div className="px-4 py-4 flex items-center gap-2.5 border-r border-gray-200 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <ServiceIcon type={svc.service_type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate">{svc.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {svc.service_type === "resource_based"
                          ? `${svc.max_concurrent_bookings ?? 1} units`
                          : "Group session"}
                      </p>
                    </div>
                    <button
                      onClick={() => setDrawerService(svc)}
                      title="Manage schedule"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#051e3a] hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                      <Settings2 size={14} />
                    </button>
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
                          !isPastDay(dayDate) && setOverrideDialog({ service: svc, dayDate })
                        }
                      />
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Mobile List (single day) */}
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
                const info = getCellInfo(svc, selectedDayDate, [dayOverride].filter(Boolean));
                const past = isPastDay(selectedDayDate);

                return (
                  <div
                    key={svc._id}
                    className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                      <ServiceIcon type={svc.service_type} size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{svc.name}</p>
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
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setDrawerService(svc)}
                        className="text-xs font-semibold text-gray-400 hover:text-[#051e3a] border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                        <Settings2 size={12} />
                        Schedule
                      </button>
                      {!past && (
                        <button
                          onClick={() => setOverrideDialog({ service: svc, dayDate: selectedDayDate })}
                          className="text-xs font-semibold text-[#051e3a] hover:text-purple-600 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50 transition-colors">
                          Override
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Day Override Dialog */}
      {overrideDialog && (
        <DayOverrideDialog
          service={overrideDialog.service}
          dayDate={overrideDialog.dayDate}
          currentOverride={getOverride(overrideDialog.service, overrideDialog.dayDate)}
          onClose={() => setOverrideDialog(null)}
          onSave={(payload) =>
            handleSaveOverride(overrideDialog.service, overrideDialog.dayDate, payload)
          }
          isSaving={savingOverride}
        />
      )}

      {/* Resource Schedule Drawer */}
      {drawerService && (
        <ResourceScheduleDrawer
          service={drawerService}
          onClose={() => setDrawerService(null)}
          onSaved={handleScheduleSaved}
        />
      )}
    </div>
  );
}
