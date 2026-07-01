"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

import { useGetSingleDashboardBusiness } from "@/services/business.service";
import Loading from "@/app/search/loading";

/* ── types ────────────────────────────────────────────────────────────────── */
type TimeSlot = { from: string; to: string };
type DaySchedule = { open: boolean; slots: TimeSlot[] };
type WeekSchedule = Record<string, DaySchedule>;

export type OperatingHourPostType = {
  business_id?: string;
  is24_7: boolean;
  schedule: WeekSchedule;
};

/* ── constants ────────────────────────────────────────────────────────────── */
const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const TIME_OPTS: { value: string; label: string }[] = (() => {
  const opts: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ap = h < 12 ? "AM" : "PM";
      opts.push({
        value: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
        label: `${h12}:${String(m).padStart(2, "0")} ${ap}`,
      });
    }
  }
  return opts;
})();

const EMPTY_SCHEDULE: WeekSchedule = DAY_KEYS.reduce(
  (acc, k, i) => ({
    ...acc,
    [k]: {
      open: i < 5,
      slots: i < 5 ? [{ from: "09:00", to: "18:00" }] : [],
    },
  }),
  {} as WeekSchedule,
);

export const DEFAULT_SCHEDULE = EMPTY_SCHEDULE;

type FormState = { is24_7: boolean; schedule: WeekSchedule };

/* ── main component ───────────────────────────────────────────────────────── */
export function BusinessHoursForm() {
  const { data: session } = useSession();
  const { data: bizData, isLoading } = useGetSingleDashboardBusiness(
    session?.user?.id || "",
  );

  /* Derive server state without an effect */
  const serverState = useMemo<FormState>(() => {
    const biz = bizData?.data;
    if (!biz) return { is24_7: false, schedule: EMPTY_SCHEDULE };
    const raw = biz.schedule as Record<string, any> | null | undefined;
    if (!raw || typeof raw !== "object") {
      return { is24_7: biz.is24_7 ?? false, schedule: EMPTY_SCHEDULE };
    }
    const merged: WeekSchedule = { ...EMPTY_SCHEDULE };
    for (const key of DAY_KEYS) {
      const s = raw[key];
      if (s) merged[key] = { open: s.open ?? false, slots: s.slots ?? [] };
    }
    return { is24_7: biz.is24_7 ?? false, schedule: merged };
  }, [bizData]);

  /* Local edits layer — null until user touches anything */
  const [localEdits, setLocalEdits] = useState<FormState | null>(null);
  const [selectedDay, setSelectedDay] = useState("mon");
  const [isSaving, setIsSaving] = useState(false);

  /* Active form = local edits if any, otherwise server state */
  const active = localEdits ?? serverState;
  const { is24_7, schedule } = active;

  /* ── helpers that always write to localEdits ─────────────────────────── */
  const patchSchedule = (updater: (prev: WeekSchedule) => WeekSchedule) =>
    setLocalEdits((prev) => {
      const base = prev ?? serverState;
      return { ...base, schedule: updater(base.schedule) };
    });

  const setIs24_7 = (v: boolean) =>
    setLocalEdits((prev) => ({ ...(prev ?? serverState), is24_7: v }));

  const toggleDay = (key: string) =>
    patchSchedule((p) => ({
      ...p,
      [key]: {
        open: !p[key].open,
        slots: !p[key].open ? [{ from: "09:00", to: "18:00" }] : [],
      },
    }));

  const addSlot = (key: string) => {
    if (schedule[key].slots.length >= 2) return;
    patchSchedule((p) => ({
      ...p,
      [key]: {
        ...p[key],
        slots: [...p[key].slots, { from: "18:00", to: "21:00" }],
      },
    }));
  };

  const removeSlot = (key: string, i: number) =>
    patchSchedule((p) => {
      const slots = p[key].slots.filter((_, j) => j !== i);
      return { ...p, [key]: { open: slots.length > 0, slots } };
    });

  const updateSlot = (
    key: string,
    i: number,
    field: "from" | "to",
    v: string,
  ) =>
    patchSchedule((p) => {
      const slots = [...p[key].slots];
      slots[i] = { ...slots[i], [field]: v };
      return { ...p, [key]: { ...p[key], slots } };
    });

  /* ── save ─────────────────────────────────────────────────────────────── */
  const onSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/business/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is24_7, schedule }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Schedule updated successfully");
      setLocalEdits(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update schedule");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loading />;

  const day = schedule[selectedDay];
  const dayIdx = DAY_KEYS.indexOf(selectedDay);

  /* ── render ───────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* 24/7 toggle */}
      <div
        className={cn(
          "flex items-center justify-between p-4 border-2 rounded-xl transition-colors",
          is24_7
            ? "border-[#051e3a]/30 bg-[#051e3a]/5"
            : "border-gray-200 bg-white",
        )}>
        <div>
          <p className="font-bold text-[#051e3a] text-[15px]">Open 24 / 7</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Your business is open all day, every day
          </p>
        </div>
        <Switch checked={is24_7} onCheckedChange={setIs24_7} />
      </div>

      {!is24_7 && (
        <>
          {/* ── Day tab row ── */}
          <div className="flex gap-2 flex-wrap">
            {SHORT_DAYS.map((d, i) => {
              const key = DAY_KEYS[i];
              const sel = selectedDay === key;
              const isOpen = schedule[key].open;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(key)}
                  className={cn(
                    "relative px-3.5 py-2 rounded-full border-2 text-sm font-bold transition-all",
                    sel
                      ? "border-[#051e3a] bg-[#051e3a] text-white"
                      : isOpen
                        ? "border-gray-200 bg-white text-gray-900 hover:border-gray-300"
                        : "border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300",
                  )}>
                  {d}
                  {isOpen && !sel && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-2 border-white" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Day detail card ── */}
          <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
            {/* Card header */}
            <div
              className={cn(
                "flex items-center justify-between px-5 py-4 border-b border-gray-100",
                day.open ? "bg-white" : "bg-gray-50",
              )}>
              <div>
                <p className="font-bold text-base text-[#051e3a]">
                  {FULL_DAYS[dayIdx]}
                </p>
                <p
                  className={cn(
                    "text-sm font-semibold mt-0.5",
                    day.open ? "text-emerald-500" : "text-gray-400",
                  )}>
                  {day.open
                    ? `${day.slots.length} shift${day.slots.length !== 1 ? "s" : ""} configured`
                    : "Closed — not available"}
                </p>
              </div>
              <Switch
                checked={day.open}
                onCheckedChange={() => toggleDay(selectedDay)}
              />
            </div>

            {/* Shifts */}
            {day.open && (
              <div className="p-5 space-y-4 bg-white">
                {day.slots.map((slot, i) => (
                  <div key={i} className="space-y-1.5">
                    {day.slots.length > 1 && (
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Shift {i + 1}
                      </p>
                    )}
                    <div className="flex items-center gap-2.5">
                      {/* From */}
                      <div className="flex-1 space-y-1">
                        {i === 0 && day.slots.length === 1 && (
                          <p className="text-xs text-gray-400 font-medium">
                            Opens
                          </p>
                        )}
                        <select
                          value={slot.from}
                          onChange={(e) =>
                            updateSlot(selectedDay, i, "from", e.target.value)
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white cursor-pointer focus:outline-none focus:border-[#051e3a] transition-colors">
                          {TIME_OPTS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <span className="text-gray-400 font-semibold text-sm shrink-0 mt-5">
                        to
                      </span>

                      {/* To */}
                      <div className="flex-1 space-y-1">
                        {i === 0 && day.slots.length === 1 && (
                          <p className="text-xs text-gray-400 font-medium">
                            Closes
                          </p>
                        )}
                        <select
                          value={slot.to}
                          onChange={(e) =>
                            updateSlot(selectedDay, i, "to", e.target.value)
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white cursor-pointer focus:outline-none focus:border-[#051e3a] transition-colors">
                          {TIME_OPTS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Remove shift */}
                      <button
                        type="button"
                        onClick={() => removeSlot(selectedDay, i)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1 shrink-0 mt-5">
                        <X size={17} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add second shift */}
                {day.slots.length < 2 && (
                  <button
                    type="button"
                    onClick={() => addSlot(selectedDay)}
                    className="flex items-center gap-1.5 text-[#051e3a] font-semibold text-sm py-1 hover:opacity-70 transition-opacity">
                    <Plus size={15} />
                    Add second shift
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Week overview grid ── */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Week overview
            </p>
            <div className="grid grid-cols-7 gap-1">
              {DAY_KEYS.map((key, i) => {
                const d = schedule[key];
                const isSel = selectedDay === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDay(key)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl text-[11px] font-semibold transition-colors",
                      isSel
                        ? "bg-[#051e3a] text-white"
                        : "text-gray-500 hover:bg-white",
                    )}>
                    <span>{SHORT_DAYS[i]}</span>
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        d.open
                          ? isSel
                            ? "bg-emerald-300"
                            : "bg-emerald-400"
                          : isSel
                            ? "bg-white/30"
                            : "bg-gray-200",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[10px]",
                        isSel ? "text-white/70" : "text-gray-400",
                      )}>
                      {d.open ? `${d.slots.length}s` : "off"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Save button ── */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={onSave}
          disabled={isSaving || localEdits === null}
          className="bg-[#051e3a] hover:bg-[#0a3060] text-white px-8">
          {isSaving && <Loader2 size={14} className="mr-2 animate-spin" />}
          Save Schedule
        </Button>
      </div>
    </div>
  );
}
