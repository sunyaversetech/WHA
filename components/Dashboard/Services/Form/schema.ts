import { z } from "zod";

export const DURATION_OPTIONS = [
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "20 min", value: 20 },
  { label: "25 min", value: 25 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hr", value: 60 },
  { label: "1 hr 15 min", value: 75 },
  { label: "1 hr 30 min", value: 90 },
  { label: "1 hr 45 min", value: 105 },
  { label: "2 hr", value: 120 },
  { label: "2 hr 30 min", value: 150 },
  { label: "3 hr", value: 180 },
  { label: "3 hr 30 min", value: 210 },
  { label: "4 hr", value: 240 },
  { label: "5 hr", value: 300 },
  { label: "6 hr", value: 360 },
  { label: "7 hr", value: 420 },
  { label: "8 hr", value: 480 },
];

export const TREATMENT_TYPES = [
  "Hair treatments",
  "Color & highlights",
  "Styling",
  "Cuts & trims",
  "Nails",
  "Skin care",
  "Massage",
  "Makeup",
  "Waxing",
  "Other",
];

export const PRICE_TYPES = ["Fixed", "From", "Free", "Custom"] as const;

export const CATEGORY_COLORS = [
  { label: "Blue", hex: "#3b82f6" },
  { label: "Teal", hex: "#14b8a6" },
  { label: "Purple", hex: "#8b5cf6" },
  { label: "Pink", hex: "#ec4899" },
  { label: "Green", hex: "#22c55e" },
  { label: "Orange", hex: "#f97316" },
  { label: "Red", hex: "#ef4444" },
  { label: "Yellow", hex: "#eab308" },
  { label: "Indigo", hex: "#6366f1" },
] as const;

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const TIME_OPTIONS: { label: string; value: string }[] = (() => {
  const opts: { label: string; value: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? "AM" : "PM";
      opts.push({ label: `${hour12}:${mm} ${ampm}`, value: `${hh}:${mm}` });
    }
  }
  return opts;
})();

export const BUFFER_OPTIONS = [
  { label: "No buffer", value: 0 },
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
];

export const NOTICE_OPTIONS = [
  { label: "No minimum", value: 0 },
  { label: "1 hour", value: 1 },
  { label: "2 hours", value: 2 },
  { label: "4 hours", value: 4 },
  { label: "8 hours", value: 8 },
  { label: "24 hours", value: 24 },
  { label: "48 hours", value: 48 },
];

export const ADVANCE_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "21 days", value: 21 },
  { label: "30 days", value: 30 },
  { label: "60 days", value: 60 },
  { label: "90 days", value: 90 },
];

export const CANCELLATION_OPTIONS = [
  { label: "Can cancel anytime", value: "anytime" },
  { label: "2 hours before", value: "2h" },
  { label: "5 hours before", value: "5h" },
  { label: "10 hours before", value: "10h" },
  { label: "24 hours before", value: "24h" },
  { label: "Non-cancellable", value: "non_cancellable" },
];

export function defaultSchedule() {
  return DAYS_OF_WEEK.map((day) => ({
    day_of_week: day,
    is_available: day !== "Saturday" && day !== "Sunday",
    start_time: "09:00",
    end_time: "17:00",
  }));
}

export function defaultGroupSchedule() {
  return DAYS_OF_WEEK.map((day) => ({
    day_of_week: day,
    is_active: false,
    slots: [] as { start_time: string; end_time: string; capacity: number }[],
  }));
}

const availabilityDaySchema = z.object({
  day_of_week: z.string(),
  is_available: z.boolean(),
  start_time: z.string(),
  end_time: z.string(),
});

const groupSlotSchema = z.object({
  start_time: z.string(),
  end_time: z.string(),
  capacity: z.number().min(1, "Capacity must be at least 1"),
});

const groupDaySchema = z.object({
  day_of_week: z.string(),
  is_active: z.boolean(),
  slots: z.array(groupSlotSchema),
});

export const serviceSchema = z
  .object({
    _id: z.string().optional(),
    name: z
      .string()
      .min(2, "Service name must be at least 2 characters")
      .max(255),
    description: z.string().optional(),
    category_id: z.string().min(1, "Menu category is required"),

    price_type: z.enum(["Fixed", "From", "Free", "Custom"]),
    base_price: z.number().min(0),
    base_duration: z.number().min(5, "Select a duration"),
    buffer_time: z.number().min(0),

    // Allows "" as unselected state; refinement below enforces a valid choice
    service_type: z.string(),

    // Employee-based
    require_employee_selection: z.boolean(),
    assigned_employees: z.array(z.string()),
    allow_multiple_bookings: z.boolean(),
    max_bookings_per_slot: z.number().min(1),
    is_one_time_booking: z.boolean(),

    // Resource-based
    availability_type: z.enum(["always", "specific"]),
    availability_schedule: z.array(availabilityDaySchema),
    max_concurrent_bookings: z.number().min(1),

    // Group session
    group_schedule: z.array(groupDaySchema),
    waitlist_enabled: z.boolean(),

    // Settings
    min_notice_hours: z.number().min(0),
    advance_booking_days: z.number().min(1),
    cancellation_policy: z.string(),
    is_refundable: z.boolean(),

    is_active: z.boolean(),
  })
  .refine(
    (d) =>
      ["employee_based", "resource_based", "group_session"].includes(
        d.service_type,
      ),
    { message: "Please select a booking type", path: ["service_type"] },
  )
  .refine(
    (d) =>
      d.service_type !== "employee_based" ||
      d.assigned_employees.length >= 1,
    {
      message: "At least one team member is required",
      path: ["assigned_employees"],
    },
  )
  .refine(
    (d) =>
      d.service_type !== "group_session" ||
      d.group_schedule.some((day) => day.is_active && day.slots.length > 0),
    {
      message: "Add at least one time slot to an active day",
      path: ["group_schedule"],
    },
  );

export type ServiceFormValues = z.infer<typeof serviceSchema>;

export interface IService extends ServiceFormValues {
  _id: string;
  business_id: string;
  category: string;
  category_id: string;
  created_at: string;
  updated_at: string;
}
