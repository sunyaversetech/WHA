import { z } from "zod";

export const serviceSchema = z.object({
  _id: z.string().optional(),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name cannot exceed 100 characters."),
  description: z.string().optional(),
  category: z
    .string()
    .min(2, "Category must be at least 2 characters.")
    .max(100, "Category cannot exceed 100 characters."),
  base_price: z.number().min(0, "Price must be 0 or greater."),
  base_duration: z.number().min(1, "Duration must be at least 1 minute."),
  buffer_time: z.number().min(0, "Buffer time cannot be negative."),
  require_employee_selection: z.boolean(),
  business_type: z.string(),
  inventory: z
    .number()
    .min(0, "Inventory must be 0 or greater.")
    .or(z.literal("")),
  is_active: z.boolean(),
  assigned_employees: z
    .array(z.string())
    .optional()
    .or(z.literal(""))
    .or(z.array(z.any()).optional()),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;

export interface IService extends ServiceFormValues {
  _id: string;
  business_id: string;
  created_at?: string;
  updated_at?: string;
}
