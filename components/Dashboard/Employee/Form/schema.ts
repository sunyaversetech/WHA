import { z } from "zod";

export const weekdayEnum = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const availabilitySchema = z.object({
  day_of_week: weekdayEnum,
  is_working: z.boolean(),
  shift_start: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be in HH:MM format")
    .optional(),
  shift_end: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be in HH:MM format")
    .optional(),
});

export const serviceOverrideSchema = z.object({
  service_id: z.string().min(1, "Service ID is required"),
  custom_price: z.number().min(0).optional(),
  custom_duration: z.number().min(1).optional(),
});

export const addressSchema = z.object({
  name: z.string().min(1, "Address name is required"),
  address: z.string().optional(),
});

export const emergencyContactSchema = z.object({
  name: z.string().min(1, "Contact name is required"),
  relation: z.string().optional(),
  phone: z.string().optional(),
});

export const employeeSchema = z.object({
  _id: z.string().optional(),

  // Personal info
  full_name: z.string().min(2, "Full name must be at least 2 characters."),
  last_name: z.string().optional(),
  email: z.union([z.literal(""), z.email("Invalid email address.")]).optional(),
  phone_number: z.string().optional(),
  additional_phone_number: z.string().optional(),
  country: z.string().optional(),
  birthday: z.string().optional(),
  birth_year: z.number().int().min(1900).max(new Date().getFullYear()).optional(),

  // Work details
  job_title: z.string().optional(),
  employment_type: z
    .enum(["full-time", "part-time", "casual", "contractor", ""])
    .optional(),
  employment_start_date: z.string().optional(),
  employment_start_year: z.number().int().optional(),
  employment_end_date: z.string().optional(),
  employment_end_year: z.number().int().optional(),
  employee_id: z.string().optional(),

  // Calendar
  calendar_color: z.string().optional(),

  // Notes / bio
  bio: z.string().optional(),

  // Addresses & emergency contacts
  addresses: z.array(addressSchema).optional(),
  emergency_contacts: z.array(emergencyContactSchema).optional(),

  // Services & schedule
  service_overrides: z.array(serviceOverrideSchema),
  availability_schedule: z.array(availabilitySchema),

  // Media & status
  employee_photo: z.any(),
  is_active: z.boolean(),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

export interface IEmployee extends EmployeeFormValues {
  _id: string;
  business_id: string;
  created_at?: string;
  updated_at?: string;
}
