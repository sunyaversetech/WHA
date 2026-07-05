import mongoose, { model, models } from "mongoose";

const employee_shift_override_schema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    is_day_off: { type: Boolean, default: false },
    shifts: [
      {
        start: { type: String },
        end: { type: String },
      },
    ],
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

employee_shift_override_schema.index(
  { employee_id: 1, date: 1 },
  { unique: true },
);

export const EmployeeShiftOverride =
  models.EmployeeShiftOverride ||
  model("EmployeeShiftOverride", employee_shift_override_schema);
