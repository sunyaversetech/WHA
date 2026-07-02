import mongoose, { model, models } from "mongoose";

const employee_time_off_schema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    type: { type: String, default: "Annual leave" },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    repeat: { type: Boolean, default: false },
    description: { type: String },
    approved: { type: Boolean, default: false },
    reason: { type: String },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

export const EmployeeTimeOff =
  models.EmployeeTimeOff || model("EmployeeTimeOff", employee_time_off_schema);
