import { z } from "zod";

export const DURATION_OPTIONS = [
  { label: "5 min",       value: 5   },
  { label: "10 min",      value: 10  },
  { label: "15 min",      value: 15  },
  { label: "20 min",      value: 20  },
  { label: "25 min",      value: 25  },
  { label: "30 min",      value: 30  },
  { label: "45 min",      value: 45  },
  { label: "1 hr",        value: 60  },
  { label: "1 hr 15 min", value: 75  },
  { label: "1 hr 30 min", value: 90  },
  { label: "1 hr 45 min", value: 105 },
  { label: "2 hr",        value: 120 },
  { label: "2 hr 30 min", value: 150 },
  { label: "3 hr",        value: 180 },
  { label: "3 hr 30 min", value: 210 },
  { label: "4 hr",        value: 240 },
  { label: "5 hr",        value: 300 },
  { label: "6 hr",        value: 360 },
  { label: "7 hr",        value: 420 },
  { label: "8 hr",        value: 480 },
];

export const PRICE_TYPES = ["Fixed", "From", "Free", "Custom"] as const;

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
      const value = `${hh}:${mm}`;
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? "AM" : "PM";
      opts.push({ label: `${hour12}:${mm} ${ampm}`, value });
    }
  }
  return opts;
})();

const availabilityDaySchema = z.object({
  day_of_week:  z.string(),
  is_available: z.boolean(),
  start_time:   z.string(),
  end_time:     z.string(),
});

export const resourceSchema = z.object({
  _id:               z.string().optional(),
  name:              z.string().min(2, "Resource name must be at least 2 characters").max(255),
  description:       z.string().optional(),
  category_id:       z.string().optional(),
  price_type:        z.enum(["Fixed", "From", "Free", "Custom"]),
  base_price:        z.number().min(0, "Price must be 0 or more"),
  base_duration:     z.number().min(5, "Select a duration"),
  buffer_time:       z.number().min(0),
  availability_type: z.enum(["always", "specific"]),
  availability_schedule: z.array(availabilityDaySchema),
  allow_multiple_bookings: z.boolean(),
  max_concurrent_bookings: z.number().min(1, "Must be at least 1"),
  is_active:         z.boolean(),
});

export type ResourceFormValues = z.infer<typeof resourceSchema>;

export interface IResource extends ResourceFormValues {
  _id: string;
  business_id: string;
  category: string;
  category_id?: string;
  created_at: string;
  updated_at: string;
}

export function defaultSchedule(): ResourceFormValues["availability_schedule"] {
  return DAYS_OF_WEEK.map((day) => ({
    day_of_week:  day,
    is_available: day !== "Saturday" && day !== "Sunday",
    start_time:   "09:00",
    end_time:     "17:00",
  }));
}
