import { z } from "zod";

export const DURATION_OPTIONS = [
  { label: "5 min",        value: 5   },
  { label: "10 min",       value: 10  },
  { label: "15 min",       value: 15  },
  { label: "20 min",       value: 20  },
  { label: "25 min",       value: 25  },
  { label: "30 min",       value: 30  },
  { label: "45 min",       value: 45  },
  { label: "1 hr",         value: 60  },
  { label: "1 hr 15 min",  value: 75  },
  { label: "1 hr 30 min",  value: 90  },
  { label: "1 hr 45 min",  value: 105 },
  { label: "2 hr",         value: 120 },
  { label: "2 hr 30 min",  value: 150 },
  { label: "3 hr",         value: 180 },
  { label: "3 hr 30 min",  value: 210 },
  { label: "4 hr",         value: 240 },
  { label: "5 hr",         value: 300 },
  { label: "6 hr",         value: 360 },
  { label: "7 hr",         value: 420 },
  { label: "8 hr",         value: 480 },
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
  { label: "Blue",   hex: "#3b82f6" },
  { label: "Teal",   hex: "#14b8a6" },
  { label: "Purple", hex: "#8b5cf6" },
  { label: "Pink",   hex: "#ec4899" },
  { label: "Green",  hex: "#22c55e" },
  { label: "Orange", hex: "#f97316" },
  { label: "Red",    hex: "#ef4444" },
  { label: "Yellow", hex: "#eab308" },
  { label: "Indigo", hex: "#6366f1" },
] as const;

export const serviceSchema = z.object({
  _id:                        z.string().optional(),
  name:                       z.string().min(2, "Service name must be at least 2 characters").max(255),
  description:                z.string().optional(),
  category_id:                z.string().optional(),
  price_type:                 z.enum(["Fixed", "From", "Free", "Custom"]),
  base_price:                 z.number().min(0, "Price must be 0 or more"),
  base_duration:              z.number().min(5, "Select a duration"),
  buffer_time:                z.number().min(0),
  require_employee_selection: z.boolean(),
  assigned_employees:         z.array(z.string()),
  is_active:                  z.boolean(),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;

export interface IService extends ServiceFormValues {
  _id: string;
  business_id: string;
  category: string;
  category_id?: string;
  created_at: string;
  updated_at: string;
}
