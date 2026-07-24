"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  CalendarDays,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetSingleService } from "@/services/services.service";
import { useUpdateResourceSchedule } from "@/services/resources.service";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Day Toggle ───────────────────────────────────────────────────────────────

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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-5 w-48 rounded" />
          <Skeleton className="h-3.5 w-24 rounded" />
        </div>
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-3">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Editor (receives already-loaded service) ─────────────────────────────────

function ScheduleEditor({ service }: { service: any }) {
  const router = useRouter();
  const isResource = service.service_type === "resource_based";
  const { mutate, isPending: saving } = useUpdateResourceSchedule();

  const [maxQty, setMaxQty] = useState<number>(service.max_concurrent_bookings ?? 1);
  const [availType, setAvailType] = useState<"always" | "specific">(
    service.availability_type ?? "always",
  );
  const [resourceSched, setResourceSched] = useState(() => initResourceSchedule(service));
  const [groupSched, setGroupSched] = useState(() => initGroupSchedule(service));
  const [saved, setSaved] = useState(false);

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
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => router.push("/dashboard/resources"), 800);
        },
      },
    );
  };

  const timeCls =
    "border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-[#051e3a] focus:outline-none focus:border-[#051e3a] bg-white";

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Sticky top bar */}
      <div className="sticky top-14 md:top-15 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/resources")}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-[#051e3a] hover:bg-gray-50 transition-colors shrink-0">
          <ArrowLeft size={16} />
        </button>

        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
            {isResource ? (
              <Package size={16} className="text-blue-400" />
            ) : (
              <CalendarDays size={16} className="text-purple-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#051e3a] truncate">{service.name}</p>
            <p className="text-xs text-gray-400">
              {isResource ? "Resource schedule" : "Group session schedule"}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="flex items-center gap-1.5 text-sm font-bold bg-[#051e3a] text-white rounded-full px-5 py-2 hover:bg-[#082040] disabled:opacity-60 transition-colors shrink-0">
          {saving && <Loader2 size={13} className="animate-spin" />}
          {saved ? "Saved ✓" : "Save"}
        </button>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Resource-based ── */}
        {isResource && (
          <>
            {/* Capacity */}
            <section className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Capacity
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMaxQty((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-xl font-bold transition-colors">
                    –
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={maxQty}
                    onChange={(e) => setMaxQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 text-center text-base font-bold text-[#051e3a] outline-none bg-transparent border-x border-gray-200 py-2"
                  />
                  <button
                    type="button"
                    onClick={() => setMaxQty((q) => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-xl font-bold transition-colors">
                    +
                  </button>
                </div>
                <p className="text-sm text-gray-500">units available at a time</p>
              </div>
            </section>

            {/* Availability type */}
            <section className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Availability
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(["always", "specific"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setAvailType(t)}
                    className={cn(
                      "py-3 rounded-xl text-sm font-semibold border transition-colors",
                      availType === t
                        ? "bg-[#051e3a] text-white border-[#051e3a]"
                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50",
                    )}>
                    {t === "always" ? "Always available" : "Specific schedule"}
                  </button>
                ))}
              </div>
            </section>

            {/* Weekly schedule */}
            {availType === "specific" && (
              <section className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Weekly schedule
                  </p>
                  <p className="text-sm font-semibold text-[#051e3a]">
                    {formatHours(totalMins)} total
                  </p>
                </div>
                <div className="space-y-2">
                  {resourceSched.map((day, i) => (
                    <div
                      key={day.day_of_week}
                      className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        <DayToggle
                          checked={day.is_available}
                          onChange={(v) => setResourceDay(i, { is_available: v })}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#051e3a]">{day.day_of_week}</p>
                          <p className="text-xs text-gray-400">
                            {day.is_available
                              ? formatHours(minutesBetween(day.start_time, day.end_time))
                              : "Not working"}
                          </p>
                        </div>
                      </div>
                      {day.is_available && (
                        <div className="flex items-center gap-3 mt-3 pl-8">
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
              </section>
            )}
          </>
        )}

        {/* ── Group session ── */}
        {!isResource && (
          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Weekly sessions
              </p>
              <p className="text-sm font-semibold text-[#051e3a]">
                {totalSessions} slot{totalSessions !== 1 ? "s" : ""} / week
              </p>
            </div>
            <div className="space-y-2">
              {groupSched.map((day, i) => (
                <div
                  key={day.day_of_week}
                  className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
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
                          className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2.5 flex-wrap">
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
                          <div className="flex items-center gap-1.5 ml-auto shrink-0">
                            <input
                              type="number"
                              min={1}
                              value={slot.capacity}
                              onChange={(e) =>
                                updateGroupSlot(i, si, {
                                  capacity: Math.max(1, parseInt(e.target.value) || 1),
                                })
                              }
                              className="w-16 border border-gray-200 rounded-lg px-2 py-2 text-sm text-center text-[#051e3a] focus:outline-none focus:border-[#051e3a] bg-white"
                            />
                            <span className="text-xs text-gray-400">cap</span>
                            <button
                              onClick={() => removeGroupSlot(i, si)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => addGroupSlot(i)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#051e3a] hover:text-blue-700 transition-colors py-1.5">
                        <Plus size={13} />
                        Add slot
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bottom save */}
        <div className="pb-8">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold bg-[#051e3a] text-white rounded-2xl py-3.5 hover:bg-[#082040] disabled:opacity-60 transition-colors">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saved ? "Schedule saved ✓" : "Save schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page (loads service by id) ───────────────────────────────────────────────

export default function ResourceSchedulePage({ id }: { id: string }) {
  const { data, isPending } = useGetSingleService(id);

  if (isPending) return <PageSkeleton />;

  const service = data?.data;
  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-gray-400">
        <Package size={36} className="text-gray-300" />
        <p className="text-sm font-semibold">Service not found</p>
      </div>
    );
  }

  if (
    service.service_type !== "resource_based" &&
    service.service_type !== "group_session"
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-gray-400">
        <p className="text-sm font-semibold">
          Schedule management is only available for Resource and Group Session services.
        </p>
      </div>
    );
  }

  return <ScheduleEditor service={service} />;
}
