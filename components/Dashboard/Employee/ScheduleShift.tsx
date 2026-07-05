"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  ArrowUpDown,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetEmployees,
  useUpdateEmployeeSchedule,
  useCreateTimeOff,
  useGetShiftOverrides,
  useUpsertShiftOverride,
} from "@/services/employee.service";
import { useRouter } from "next/navigation";

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type DayKey = (typeof DAY_KEYS)[number];

const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
    .toString()
    .padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

function nextTimeOption(time: string, offset = 1): string {
  const idx = TIME_OPTIONS.indexOf(time);
  return TIME_OPTIONS[Math.min(idx + offset, TIME_OPTIONS.length - 1)];
}

const TIME_OFF_TYPES = [
  "Annual leave",
  "Sick leave",
  "Personal leave",
  "Unpaid leave",
  "Other",
];
const SCHEDULE_TYPES = ["Every week", "Every 2 weeks", "Custom"];
const ENDS_OPTIONS = ["Never", "On a specific date", "After occurrences"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmtShort(d: Date) {
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

function fmtWeekRange(mon: Date): string {
  const sun = addDays(mon, 6);
  return `${MONTH_SHORT[mon.getMonth()]} ${mon.getDate()} – ${MONTH_SHORT[sun.getMonth()]} ${sun.getDate()}, ${sun.getFullYear()}`;
}

function fmtDayFull(d: Date): string {
  return `${DAY_SHORT[(d.getDay() + 6) % 7]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

function fmtDateShort(d: Date): string {
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function getDaySchedule(schedule: any[], dayKey: string) {
  return schedule?.find((s: any) => s.day_of_week === dayKey);
}

function fmtISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Returns effective shifts for a specific date: override wins over repeating schedule
function getEffectiveDayData(
  emp: any,
  date: Date,
  overrides: any[],
): { is_working: boolean; shifts: ShiftSlot[]; overrideId?: string } {
  const iso = fmtISODate(date);
  const override = overrides.find(
    (o) => o.employee_id === emp._id && o.date === iso,
  );
  if (override) {
    return {
      is_working: !override.is_day_off && override.shifts?.length > 0,
      shifts: override.shifts ?? [],
      overrideId: override._id,
    };
  }
  const dayKey = DAY_KEYS[(date.getDay() + 6) % 7];
  const s = getDaySchedule(emp.availability_schedule ?? [], dayKey);
  return {
    is_working: s?.is_working ?? false,
    shifts: s?.shifts ?? [],
  };
}

function slotMins(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
}

function fmtHours(mins: number): string {
  if (mins === 0) return "0 min";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_BG = [
  "bg-teal-600",
  "bg-purple-600",
  "bg-blue-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-emerald-600",
  "bg-pink-600",
  "bg-indigo-600",
];

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function Avatar({ emp, idx }: { emp: any; idx: number }) {
  if (emp.employee_photo) {
    return (
      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
        <Image
          src={emp.employee_photo}
          alt={emp.full_name}
          width={36}
          height={36}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold",
        AVATAR_BG[idx % AVATAR_BG.length],
      )}>
      {initials(emp.full_name)}
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const SEL =
  "w-full bg-[#061930] border border-[#0e3258] text-white text-sm rounded-lg px-3 py-2.5 appearance-none outline-none focus:border-[#6B5CE7] transition-colors";
const BTN_GHOST =
  "px-5 py-2 rounded-full border border-[#0e3258] text-white text-sm font-semibold hover:bg-[#082040] transition-colors";
const BTN_PRIMARY =
  "px-5 py-2 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-100 transition-colors";

// ─── Types ────────────────────────────────────────────────────────────────────

type ShiftSlot = { start: string; end: string };
type DayEdit = { enabled: boolean; slots: ShiftSlot[] };
type RepeatingConfig = {
  schedule_type: string;
  start_date: string;
  ends_type: string;
  end_date?: string;
  end_occurrences?: number;
};
type CtxMenuState = {
  x: number;
  y: number;
  emp: any;
  empIdx: number;
  dayKey: DayKey;
  dayDate: Date;
};

// ─── Checkmark SVG ───────────────────────────────────────────────────────────

function CheckMark() {
  return (
    <svg
      viewBox="0 0 10 8"
      className="w-3 h-3"
      fill="none"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M1 4l3 3 5-6" />
    </svg>
  );
}

// ─── SelectField helper ───────────────────────────────────────────────────────

function SelectField({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  className?: string;
}) {
  return (
    <div className="relative text-gray-100">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(SEL, className, "text-gray-100")}>
        {options.map((o) => (
          <option key={o} value={o} className="text-gray-100">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-100 pointer-events-none"
      />
    </div>
  );
}

// ─── Context Menu ─────────────────────────────────────────────────────────────

function ShiftContextMenu({
  menu,
  onEditDay,
  onRepeating,
  onTimeOff,
  onDelete,
  onClose,
}: {
  menu: CtxMenuState;
  onEditDay: () => void;
  onRepeating: () => void;
  onTimeOff: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ position: "fixed", top: menu.y, left: menu.x, zIndex: 999 }}
      className="bg-[#082040] border border-[#0e3258] rounded-xl shadow-2xl py-1.5 min-w-52.5">
      {(
        [
          { label: "Edit this day", action: onEditDay },
          { label: "Set repeating shifts", action: onRepeating },
          { label: "Add time off", action: onTimeOff },
        ] as const
      ).map(({ label, action }) => (
        <button
          key={label}
          onClick={() => {
            action();
            onClose();
          }}
          className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#0d2d4e] transition-colors">
          {label}
        </button>
      ))}
      <div className="border-t border-[#0e3258] my-1" />
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-[#0d2d4e] transition-colors">
        Delete this shift
      </button>
    </div>
  );
}

// ─── Edit Day Dialog ──────────────────────────────────────────────────────────

function EditDayDialog({
  emp,
  dayDate,
  initialSlots,
  onClose,
  onSave,
  isSaving,
}: {
  emp: any;
  dayDate: Date;
  initialSlots: ShiftSlot[];
  onClose: () => void;
  onSave: (slots: ShiftSlot[]) => void;
  isSaving?: boolean;
}) {
  const [slots, setSlots] = useState<ShiftSlot[]>(() =>
    initialSlots.length > 0 ? initialSlots : [{ start: "09:00", end: "17:00" }],
  );

  const totalMins = slots.reduce((acc, s) => acc + slotMins(s.start, s.end), 0);
  const firstName = emp.full_name.split(" ")[0];

  const updateSlot = (i: number, field: "start" | "end", val: string) =>
    setSlots((prev) => {
      const next = prev.map((s, idx) =>
        idx === i ? { ...s, [field]: val } : { ...s },
      );
      if (field === "start") {
        if (next[i].end <= next[i].start)
          next[i].end = nextTimeOption(next[i].start);
      } else {
        if (next[i].end <= next[i].start)
          next[i].start =
            TIME_OPTIONS[Math.max(0, TIME_OPTIONS.indexOf(next[i].end) - 1)];
        if (i < next.length - 1 && next[i + 1].start < next[i].end) {
          next[i + 1].start = next[i].end;
          if (next[i + 1].end <= next[i + 1].start)
            next[i + 1].end = nextTimeOption(next[i + 1].start);
        }
      }
      return next;
    });
  const removeSlot = (i: number) =>
    setSlots((p) => p.filter((_, idx) => idx !== i));
  const addSlot = () =>
    setSlots((prev) => {
      const last = prev[prev.length - 1];
      return [...prev, { start: last.end, end: nextTimeOption(last.end, 2) }];
    });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}>
      <div className="bg-[#051e3a] border border-[#0e3258] rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-xl font-bold text-white">
            {firstName}&apos;s shift {fmtDayFull(dayDate)}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white ml-3 mt-0.5 transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-6">
          You are editing this day&apos;s shifts only. To set repeating shifts,
          go to{" "}
          <span className="text-[#6B5CE7] cursor-pointer hover:underline">
            scheduled shifts
          </span>
          .
        </p>

        <div className="grid grid-cols-[1fr_1fr_36px] gap-2 mb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Start time
          </p>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            End time
          </p>
          <div />
        </div>
        <div className="space-y-2 mb-5">
          {slots.map((slot, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_1fr_36px] gap-2 items-center">
              <SelectField
                value={slot.start}
                onChange={(v) => updateSlot(i, "start", v)}
                options={TIME_OPTIONS.filter(
                  (t) => (i === 0 || t >= slots[i - 1].end) && t < slot.end,
                )}
              />
              <SelectField
                value={slot.end}
                onChange={(v) => updateSlot(i, "end", v)}
                options={TIME_OPTIONS.filter((t) => t > slot.start)}
              />
              <button
                onClick={() => removeSlot(i)}
                disabled={slots.length === 1}
                className="flex items-center justify-center text-gray-500 hover:text-red-400 disabled:opacity-30 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-8">
          <button
            onClick={addSlot}
            className="flex items-center gap-1.5 text-sm text-white border border-[#0e3258] rounded-full px-3.5 py-1.5 hover:bg-[#082040] transition-colors">
            <Plus size={14} /> Add shift
          </button>
          <span className="text-sm text-gray-400">
            Total shift duration:{" "}
            <span className="text-white font-semibold">
              {fmtHours(totalMins)}
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => onSave([])}
            disabled={isSaving}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-[#0e3258] text-red-400 hover:bg-[#082040] disabled:opacity-50 transition-colors">
            <Trash2 size={15} />
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} disabled={isSaving} className={BTN_GHOST}>
              Cancel
            </button>
            <button
              onClick={() => onSave(slots)}
              disabled={isSaving}
              className={cn(
                BTN_PRIMARY,
                "flex items-center gap-1.5 disabled:opacity-70",
              )}>
              {isSaving && <Loader2 size={13} className="animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Time Off Dialog ──────────────────────────────────────────────────────────

function combineDatetime(dateStr: string, timeStr: string): string {
  const date = new Date(dateStr);
  const [h, m] = timeStr.split(":").map(Number);
  date.setHours(h, m, 0, 0);
  return date.toISOString();
}

function TimeOffDialog({
  employees,
  defaultEmpId,
  defaultDate,
  onClose,
  onSave,
  isSaving,
}: {
  employees: any[];
  defaultEmpId?: string;
  defaultDate?: Date;
  onClose: () => void;
  onSave: (payload: any) => void;
  isSaving?: boolean;
}) {
  const dateOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 60 }, (_, i) => fmtDateShort(addDays(now, i)));
  }, []);

  const [empId, setEmpId] = useState(defaultEmpId ?? employees[0]?._id ?? "");
  const [type, setType] = useState(TIME_OFF_TYPES[0]);
  const [startDate, setStartDate] = useState(
    () => (defaultDate ? fmtDateShort(defaultDate) : null) ?? dateOptions[0],
  );
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [repeat, setRepeat] = useState(false);
  const [desc, setDesc] = useState("");
  const [approved, setApproved] = useState(false);

  const totalMins = slotMins(startTime, endTime);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}>
      <div className="bg-[#051e3a] border border-[#0e3258] rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add time off</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-sm font-semibold text-white mb-2">Team member</p>
            <div className="relative">
              <select
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                className={SEL}>
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.full_name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-2">Type</p>
            <SelectField
              value={type}
              onChange={setType}
              options={TIME_OFF_TYPES}
            />
          </div>
        </div>

        <p className="text-sm font-semibold text-white mb-2">Start date</p>
        <div className="grid grid-cols-1 gap-2 mb-4 items-center">
          <SelectField
            value={startDate}
            onChange={setStartDate}
            options={dateOptions}
          />
          <div className="">
            <p className="text-xs text-gray-400 mb-1.5">Start time</p>
            <SelectField
              value={startTime}
              onChange={setStartTime}
              options={TIME_OPTIONS}
              className="w-full"
            />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1.5">End time</p>
            <SelectField
              value={endTime}
              onChange={setEndTime}
              options={TIME_OPTIONS}
              className="w-full"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={repeat}
            onChange={(e) => setRepeat(e.target.checked)}
            className="w-4 h-4 accent-[#051e3a]"
          />
          <span className="text-sm text-white">Repeat</span>
        </label>

        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <p className="text-sm font-semibold text-white">Description</p>
            <span className="text-xs text-gray-500">{desc.length}/100</span>
          </div>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value.slice(0, 100))}
            placeholder="Add description or note (optional)"
            rows={4}
            className="w-full bg-[#061930] border border-[#0e3258] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#6B5CE7] transition-colors resize-none"
          />
        </div>

        <div className="flex items-center justify-between mb-1.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={approved}
              onChange={(e) => setApproved(e.target.checked)}
              className="w-4 h-4 accent-[#051e3a]"
            />
            <span className="text-sm text-white">Approved</span>
          </label>
          <span className="text-sm font-bold text-white">
            Time off total: {fmtHours(totalMins)}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-6">
          Online bookings cannot be placed during time off.
        </p>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} disabled={isSaving} className={BTN_GHOST}>
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({
                employee_id: empId,
                type,
                start_time: combineDatetime(startDate, startTime),
                end_time: combineDatetime(startDate, endTime),
                repeat,
                description: desc,
                approved,
              })
            }
            disabled={isSaving}
            className={cn(
              BTN_PRIMARY,
              "flex items-center gap-1.5 disabled:opacity-70",
            )}>
            {isSaving && <Loader2 size={13} className="animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Repeating Shifts Panel ───────────────────────────────────────────────────

function RepeatingShiftsPanel({
  emp,
  onClose,
  onSave,
  isSaving,
}: {
  emp: any;
  onClose: () => void;
  onSave: (days: Record<string, DayEdit>, config: RepeatingConfig) => void;
  isSaving?: boolean;
}) {
  const cfg = emp.repeating_schedule_config ?? {};

  const dateOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 365 }, (_, i) => fmtDateShort(addDays(now, i)));
  }, []);

  const [scheduleType, setScheduleType] = useState<string>(
    () => cfg.schedule_type ?? SCHEDULE_TYPES[0],
  );
  const [startDate, setStartDate] = useState<string>(
    () => cfg.start_date ?? dateOptions[0],
  );
  const [ends, setEnds] = useState<string>(
    () => cfg.ends_type ?? ENDS_OPTIONS[0],
  );
  const [endDate, setEndDate] = useState<string>(
    () => cfg.end_date ?? dateOptions[1],
  );
  const [endOccurrences, setEndOccurrences] = useState<number>(
    () => cfg.end_occurrences ?? 1,
  );

  const [days, setDays] = useState<Record<string, DayEdit>>(() => {
    const schedule = emp.availability_schedule ?? [];
    return Object.fromEntries(
      DAY_KEYS.map((key) => {
        const s = getDaySchedule(schedule, key);
        return [
          key,
          {
            enabled: !!s?.is_working,
            slots:
              s?.is_working && s.shifts?.length
                ? s.shifts.map((sh: any) => ({ start: sh.start, end: sh.end }))
                : [{ start: "09:00", end: "17:00" }],
          },
        ];
      }),
    ) as Record<string, DayEdit>;
  });

  const totalWeekMins = useMemo(
    () =>
      DAY_KEYS.reduce((acc, key) => {
        const day = days[key];
        if (!day?.enabled) return acc;
        return (
          acc + day.slots.reduce((a, s) => a + slotMins(s.start, s.end), 0)
        );
      }, 0),
    [days],
  );

  const toggleDay = (key: string) =>
    setDays((p) => ({ ...p, [key]: { ...p[key], enabled: !p[key].enabled } }));

  const updateSlot = (
    key: string,
    si: number,
    field: "start" | "end",
    val: string,
  ) =>
    setDays((p) => {
      const next = p[key].slots.map((s) => ({ ...s }));
      next[si][field] = val;
      if (field === "start") {
        if (next[si].end <= next[si].start)
          next[si].end = nextTimeOption(next[si].start);
      } else {
        if (next[si].end <= next[si].start)
          next[si].start =
            TIME_OPTIONS[Math.max(0, TIME_OPTIONS.indexOf(next[si].end) - 1)];
        if (si < next.length - 1 && next[si + 1].start < next[si].end) {
          next[si + 1].start = next[si].end;
          if (next[si + 1].end <= next[si + 1].start)
            next[si + 1].end = nextTimeOption(next[si + 1].start);
        }
      }
      return { ...p, [key]: { ...p[key], slots: next } };
    });

  const addSlot = (key: string) =>
    setDays((p) => {
      const slots = p[key].slots;
      const last = slots[slots.length - 1];
      return {
        ...p,
        [key]: {
          ...p[key],
          slots: [
            ...slots,
            { start: last.end, end: nextTimeOption(last.end, 2) },
          ],
        },
      };
    });

  const removeSlot = (key: string, si: number) =>
    setDays((p) => ({
      ...p,
      [key]: { ...p[key], slots: p[key].slots.filter((_, i) => i !== si) },
    }));

  const handleSave = () => {
    const config: RepeatingConfig = {
      schedule_type: scheduleType,
      start_date: startDate,
      ends_type: ends,
      ...(ends === "On a specific date" && { end_date: endDate }),
      ...(ends === "After occurrences" && { end_occurrences: endOccurrences }),
    };
    onSave(days, config);
  };

  const firstName = emp.full_name.split(" ")[0];
  const scheduleLabel =
    scheduleType === "Every week"
      ? "Weekly"
      : scheduleType === "Every 2 weeks"
        ? "Bi-weekly"
        : "Custom";

  return (
    <div className="fixed inset-0 z-50 bg-[#051e3a] overflow-y-auto">
      <div className="sticky top-0 z-10 bg-[#051e3a] border-b border-[#0e3258]">
        <div className="flex items-center justify-end gap-2 px-8 py-4">
          <button onClick={onClose} disabled={isSaving} className={BTN_GHOST}>
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              BTN_PRIMARY,
              "flex items-center gap-1.5 disabled:opacity-70",
            )}>
            {isSaving && <Loader2 size={13} className="animate-spin" />}
            Save
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
        {/* Left sidebar */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Set {firstName}&apos;s repeating shifts
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              Set weekly, biweekly or custom shifts. Changes saved will apply to
              all upcoming shifts for the selected period.{" "}
              <span className="text-[#6B5CE7] cursor-pointer hover:underline">
                Learn more
              </span>
            </p>
          </div>

          <div className="bg-[#082040] text-white border border-[#0e3258] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0e3258] flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-[#6B5CE7]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white ">{emp.full_name}</p>
              <p className="text-xs text-gray-400">All locations</p>
            </div>
          </div>

          <div className="bg-[#082040] border border-[#0e3258] rounded-xl p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Schedule type
              </p>
              <SelectField
                value={scheduleType}
                onChange={setScheduleType}
                options={SCHEDULE_TYPES}
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Start date
              </p>
              <SelectField
                value={startDate}
                onChange={setStartDate}
                options={dateOptions}
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Ends
              </p>
              <SelectField
                value={ends}
                onChange={setEnds}
                options={ENDS_OPTIONS}
              />
              {ends === "On a specific date" && (
                <div className="mt-2">
                  <SelectField
                    value={endDate}
                    onChange={setEndDate}
                    options={dateOptions.filter((d) => d !== startDate)}
                  />
                </div>
              )}
              {ends === "After occurrences" && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={endOccurrences}
                    onChange={(e) =>
                      setEndOccurrences(Math.max(1, Number(e.target.value)))
                    }
                    className="w-20 bg-[#061930] border border-[#0e3258] text-white text-sm rounded-lg px-3 py-2.5 outline-none focus:border-[#6B5CE7] transition-colors"
                  />
                  <span className="text-sm text-gray-400">occurrences</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#082040] border border-[#0e3258] rounded-xl p-4 flex items-start gap-2.5">
            <Info size={14} className="text-gray-400 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-200 leading-relaxed">
              Team members will not be scheduled on business closed periods.
            </p>
          </div>
        </div>

        <div>
          <div className="flex flex-col items-baseline gap-2 mb-6">
            <h2 className="text-lg font-bold text-white">{scheduleLabel}</h2>
            <span className="text-sm text-gray-400">
              {fmtHours(totalWeekMins)} total
            </span>
          </div>

          <div className="space-y-1">
            {DAY_KEYS.map((key, di) => {
              const day = days[key];
              if (!day) return null;
              const dayMins = day.enabled
                ? day.slots.reduce((a, s) => a + slotMins(s.start, s.end), 0)
                : 0;

              return (
                <div
                  key={key}
                  className="grid grid-cols-[180px_1fr] gap-4 items-start py-3 border-b border-[#082040]">
                  <div className="flex items-center gap-3 pt-1.5">
                    <button
                      onClick={() => toggleDay(key)}
                      className={cn(
                        "w-5 h-5 rounded flex items-center justify-center border shrink-0 transition-colors",
                        day.enabled
                          ? "bg-[#6B5CE7] border-[#6B5CE7]"
                          : "bg-transparent border-[#1a3a5c]",
                      )}>
                      {day.enabled && <CheckMark />}
                    </button>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {DAY_FULL[di]}
                      </p>
                      {day.enabled && (
                        <p className="text-xs text-gray-400">
                          {fmtHours(dayMins)}
                        </p>
                      )}
                    </div>
                  </div>

                  {!day.enabled ? (
                    <p className="text-sm text-gray-500 pt-1.5">Not working</p>
                  ) : (
                    <div className="space-y-2">
                      {day.slots.map((slot, si) => (
                        <div key={si} className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <select
                              value={slot.start}
                              onChange={(e) =>
                                updateSlot(key, si, "start", e.target.value)
                              }
                              className={SEL}>
                              {TIME_OPTIONS.filter(
                                (t) =>
                                  (si === 0 || t >= day.slots[si - 1].end) &&
                                  t < slot.end,
                              ).map((t) => (
                                <option
                                  key={t}
                                  value={t}
                                  className="text-gray-100">
                                  <p className="text-gray-100!">{t}</p>
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={13}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-100 pointer-events-none"
                            />
                          </div>
                          <span className="text-sm text-gray-400 shrink-0">
                            to
                          </span>
                          <div className="relative flex-1">
                            <select
                              value={slot.end}
                              onChange={(e) =>
                                updateSlot(key, si, "end", e.target.value)
                              }
                              className={SEL}>
                              {TIME_OPTIONS.filter((t) => t > slot.start).map(
                                (t) => (
                                  <option
                                    key={t}
                                    value={t}
                                    className="text-gray-100">
                                    <p className="text-gray-100">{t}</p>
                                  </option>
                                ),
                              )}
                            </select>
                            <ChevronDown
                              size={13}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                          </div>
                          <button
                            onClick={() => addSlot(key)}
                            className="text-gray-500 hover:text-white transition-colors p-1 shrink-0">
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => removeSlot(key, si)}
                            disabled={day.slots.length === 1}
                            className="text-gray-500 hover:text-red-400 disabled:opacity-30 transition-colors p-1 shrink-0">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Button Dropdown ──────────────────────────────────────────────────────

function AddDropdown({
  onTimeOff,
  onNewMember,
}: {
  onTimeOff: () => void;
  onNewMember: () => void;
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

  const router = useRouter();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-100 transition-colors">
        Add
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 bg-[#051e3a] border border-[#0e3258] rounded-xl shadow-2xl py-1.5 min-w-50 z-50">
          <button
            onClick={() => {
              onTimeOff();
              setOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#0d2d4e] transition-colors">
            Time off
          </button>
          <button
            onClick={() => {
              onNewMember();
              setOpen(false);
              router.push("/dashboard/employees/add");
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#0d2d4e] transition-colors">
            New team member
          </button>
          <button
            onClick={() => setOpen(false)}
            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#0d2d4e] transition-colors">
            Business closed period
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ScheduleShift() {
  const { data: empData } = useGetEmployees();
  const employees = useMemo<any[]>(() => empData?.data ?? [], [empData]);

  const queryClient = useQueryClient();
  const { mutate: updateSchedule, isPending: savingSchedule } =
    useUpdateEmployeeSchedule();
  const { mutate: createTimeOff, isPending: savingTimeOff } =
    useCreateTimeOff();
  const { mutate: upsertOverride, isPending: savingOverride } =
    useUpsertShiftOverride();

  const [monday, setMonday] = useState<Date>(() => getMonday(new Date()));
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(monday, i)),
    [monday],
  );

  const weekStartISO = fmtISODate(monday);
  const weekEndISO = fmtISODate(addDays(monday, 6));
  const { data: overridesData } = useGetShiftOverrides(
    weekStartISO,
    weekEndISO,
  );
  const overrides = useMemo<any[]>(
    () => overridesData?.data ?? [],
    [overridesData],
  );

  const handleSaveEditDay = (emp: any, dayDate: Date, slots: ShiftSlot[]) => {
    upsertOverride(
      {
        employee_id: emp._id,
        date: fmtISODate(dayDate),
        shifts: slots,
        is_day_off: slots.length === 0,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["shiftOverrides"] });
          setEditDialog(null);
        },
      },
    );
  };

  const handleSaveRepeating = (
    emp: any,
    days: Record<string, DayEdit>,
    config: RepeatingConfig,
  ) => {
    const schedule = DAY_KEYS.map((key) => {
      const d = days[key];
      return {
        day_of_week: key,
        is_working: d?.enabled ?? false,
        shifts: d?.enabled ? d.slots : [],
      };
    });
    updateSchedule(
      { empId: emp._id, schedule, config },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["employees"] });
          setRepeatingPanel(null);
        },
      },
    );
  };

  const handleSaveTimeOff = (payload: any) => {
    createTimeOff(payload, {
      onSuccess: () => setTimeOffDialog(null),
    });
  };

  const handleDeleteShift = (emp: any, dayDate: Date) => {
    upsertOverride(
      {
        employee_id: emp._id,
        date: fmtISODate(dayDate),
        shifts: [],
        is_day_off: true,
      },
      {
        onSuccess: () =>
          queryClient.invalidateQueries({ queryKey: ["shiftOverrides"] }),
      },
    );
  };

  const goThisWeek = () => setMonday(getMonday(new Date()));
  const goPrev = () => setMonday((m) => addDays(m, -7));
  const goNext = () => setMonday((m) => addDays(m, 7));

  const colTotals = useMemo(
    () =>
      weekDays.map((day) =>
        employees.reduce((acc, emp) => {
          const eff = getEffectiveDayData(emp, day, overrides);
          return (
            acc +
            (eff.is_working
              ? eff.shifts.reduce(
                  (a: number, s: ShiftSlot) => a + slotMins(s.start, s.end),
                  0,
                )
              : 0)
          );
        }, 0),
      ),
    [employees, weekDays, overrides],
  );

  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  const [editDialog, setEditDialog] = useState<{
    emp: any;
    dayDate: Date;
    initialSlots: ShiftSlot[];
  } | null>(null);
  const [timeOffDialog, setTimeOffDialog] = useState<{
    emp: any;
    dayDate: Date;
  } | null>(null);
  const [repeatingPanel, setRepeatingPanel] = useState<{ emp: any } | null>(
    null,
  );

  const openCtxMenu = (
    e: React.MouseEvent,
    emp: any,
    empIdx: number,
    dayKey: DayKey,
    dayDate: Date,
  ) => {
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, emp, empIdx, dayKey, dayDate });
  };

  return (
    <div className="min-h-screen  text-[#0e3258] p-6 md:p-8">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Scheduled shifts</h1>
        <div className="flex gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#333] text-sm font-semibold
           text-[#0e3258] hover:bg-[#082040] transition-colors">
            Options
            <ChevronDown size={14} />
          </button>
          <AddDropdown
            onTimeOff={() =>
              setTimeOffDialog({
                emp: employees[0] ?? null,
                dayDate: new Date(),
              })
            }
            onNewMember={() => {}}
          />
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div className="flex items-center justify-between mb-5">
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#0e3258] text-white 
        bg-[#051e3a] text-sm font-semibold hover:bg-[#0d2d4e] transition-colors">
          <ArrowUpDown size={14} className="text-gray-400" />
          Custom order
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={goThisWeek}
            className="px-4 py-2 rounded-full border border-[#0e3258] bg-[#051e3a] text-sm font-semibold text-white hover:bg-[#0d2d4e] transition-colors">
            This week
          </button>
          <div className="flex items-center gap-1 border border-[#0e3258] bg-[#051e3a] rounded-full px-2 py-1.5">
            <button
              onClick={goPrev}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#0d2d4e] transition-colors text-gray-400 hover:text-white">
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold text-white px-2 min-w-[170px] text-center">
              {fmtWeekRange(monday)}
            </span>
            <button
              onClick={goNext}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#0d2d4e] transition-colors text-gray-400 hover:text-white">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="border border-[#0e3258] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[220px_repeat(7,1fr)] border-b border-[#0e3258]">
          <div className="px-4 py-3 flex items-center gap-1.5 border-r border-[#0e3258]">
            <span className="text-sm font-semibold text-[#0e3258]">
              Team member
            </span>
            <button className="text-[#6B5CE7] text-sm font-semibold hover:opacity-70 transition-opacity">
              Change
            </button>
          </div>
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={cn(
                "px-3 py-3 text-center",
                i < 6 && "border-r border-[#0e3258]",
              )}>
              <p className="text-sm font-bold text-[#0e3258]">
                {DAY_SHORT[i]}, {fmtShort(day)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {fmtHours(colTotals[i])}
              </p>
            </div>
          ))}
        </div>

        {employees.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500 text-sm">
            No team members found.
          </div>
        ) : (
          employees.map((emp, empIdx) => {
            const weekMins = weekDays.reduce((acc, day) => {
              const eff = getEffectiveDayData(emp, day, overrides);
              return (
                acc +
                (eff.is_working
                  ? eff.shifts.reduce(
                      (a: number, s: ShiftSlot) => a + slotMins(s.start, s.end),
                      0,
                    )
                  : 0)
              );
            }, 0);

            return (
              <div
                key={emp._id}
                className={cn(
                  "grid grid-cols-[220px_repeat(7,1fr)]",
                  empIdx < employees.length - 1 && "border-b border-[#0e3258]",
                )}>
                <div className="px-4 py-4 flex items-center gap-3 border-r border-[#0e3258]">
                  <Avatar emp={emp} idx={empIdx} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0e3258] truncate">
                      {emp.full_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fmtHours(weekMins)}
                    </p>
                  </div>
                  <button
                    onClick={() => setRepeatingPanel({ emp })}
                    className="text-gray-500 hover:text-gray-300 transition-colors shrink-0">
                    <Pencil size={14} />
                  </button>
                </div>

                {DAY_KEYS.map((key, di) => {
                  const dayDate = weekDays[di];
                  const eff = getEffectiveDayData(emp, dayDate, overrides);

                  return (
                    <div
                      key={key}
                      className={cn(
                        "px-2 py-4 flex items-center justify-center",
                        di < 6 && "border-r border-[#0e3258]",
                      )}>
                      {eff.is_working ? (
                        <button
                          onClick={(e) =>
                            openCtxMenu(e, emp, empIdx, key, dayDate)
                          }
                          className="w-full bg-[#1e3a7a] hover:bg-[#2435a0] transition-colors rounded-lg px-2 py-2.5 text-center cursor-pointer space-y-0.5">
                          {eff.shifts.map((sh: ShiftSlot, si: number) => (
                            <p
                              key={si}
                              className="text-xs font-semibold text-white leading-tight">
                              {sh.start} – {sh.end}
                            </p>
                          ))}
                        </button>
                      ) : (
                        <button
                          onClick={(e) =>
                            openCtxMenu(e, emp, empIdx, key, dayDate)
                          }
                          className="w-full bg-[#082040] hover:bg-[#0d2d4e] transition-colors rounded-lg px-2 py-2.5 text-center cursor-pointer">
                          <p className="text-xs font-medium text-gray-500 leading-none">
                            Not working
                          </p>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* ── Footer note ── */}
      <div className="mt-4 flex items-start gap-3 bg-[#051e3a] border border-[#0e3258] rounded-xl px-5 py-3.5">
        <Info
          size={16}
          className="text-gray-500 bg-indigo-950 shrink-0 mt-0.5"
        />
        <p className="text-sm text-gray-400 leading-relaxed">
          The team roster shows your availability for bookings and is not linked
          to your business standard opening hours. To set your standard opening
          hours,{" "}
          <a
            href="/dashboard/settings"
            className="text-[#6B5CE7] hover:underline">
            click here.
          </a>
        </p>
      </div>

      {/* ── Overlays ── */}
      {ctxMenu && (
        <ShiftContextMenu
          menu={ctxMenu}
          onEditDay={() => {
            const eff = getEffectiveDayData(
              ctxMenu.emp,
              ctxMenu.dayDate,
              overrides,
            );
            setEditDialog({
              emp: ctxMenu.emp,
              dayDate: ctxMenu.dayDate,
              initialSlots: eff.shifts,
            });
          }}
          onRepeating={() => setRepeatingPanel({ emp: ctxMenu.emp })}
          onTimeOff={() =>
            setTimeOffDialog({
              emp: ctxMenu.emp,
              dayDate: ctxMenu.dayDate,
            })
          }
          onDelete={() => handleDeleteShift(ctxMenu.emp, ctxMenu.dayDate)}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {editDialog && (
        <EditDayDialog
          emp={editDialog.emp}
          dayDate={editDialog.dayDate}
          initialSlots={editDialog.initialSlots}
          onClose={() => setEditDialog(null)}
          onSave={(slots) =>
            handleSaveEditDay(editDialog.emp, editDialog.dayDate, slots)
          }
          isSaving={savingOverride}
        />
      )}

      {timeOffDialog && employees.length > 0 && (
        <TimeOffDialog
          employees={employees}
          defaultEmpId={timeOffDialog.emp?._id}
          defaultDate={timeOffDialog.dayDate}
          onClose={() => setTimeOffDialog(null)}
          onSave={handleSaveTimeOff}
          isSaving={savingTimeOff}
        />
      )}

      {repeatingPanel && (
        <RepeatingShiftsPanel
          emp={repeatingPanel.emp}
          onClose={() => setRepeatingPanel(null)}
          onSave={(days, config) =>
            handleSaveRepeating(repeatingPanel.emp, days, config)
          }
          isSaving={savingSchedule}
        />
      )}
    </div>
  );
}
