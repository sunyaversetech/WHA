import mongoose, { model, models } from "mongoose";

const employee_time_off_schema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  reason: { type: String },
});

export const EmployeeTimeOff =
  models.EmployeeTimeOff || model("Employee", employee_time_off_schema);
