// @/schemas/employee.schema.ts
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

export const employeeSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters."),
  email: z
    .string()
    .email("Invalid email address.")
    .optional()
    .or(z.literal("")),
  phone_number: z.string().optional(),
  bio: z.string().optional(),
  employee_photo: z.string().optional(),
  is_active: z.boolean(),
  availability_schedule: z.array(availabilitySchema),
  service_overrides: z.array(serviceOverrideSchema),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

export interface IEmployee extends EmployeeFormValues {
  _id: string;
  business_id: string;
  created_at?: string;
  updated_at?: string;
}
