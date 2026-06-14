import mongoose, { model, models } from "mongoose";

const employee_schema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, index: true, ref: "User" },
    full_name: { type: String, required: true },
    email: { type: String, lowercase: true, unique: true },
    phone_number: { type: String },
    bio: { type: String },

    service_overrides: [
      {
        service_id: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
        custom_price: { type: Number },
        custom_duration: { type: Number },
      },
    ],

    availability_schedule: [
      {
        day_of_week: {
          type: String,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
        },
        is_working: { type: Boolean, default: true },
        shift_start: { type: String },
        shift_end: { type: String },
      },
    ],

    employee_photo: {
      type: String,
    },

    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

// const Employee = mongoose.model("Employee", employee_schema);
export const Employee = models.Employee || model("Employee", employee_schema);
