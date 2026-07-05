import mongoose, { model, models } from "mongoose";

const employee_schema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, index: true, ref: "User" },

    full_name: { type: String, required: true },
    last_name: { type: String },
    email: { type: String, lowercase: true, sparse: true },
    phone_number: { type: String },
    additional_phone_number: { type: String },
    country: { type: String },

    birthday: { type: String },
    birth_year: { type: Number },

    bio: { type: String },

    // ── Work details ──
    job_title: { type: String },
    employment_type: {
      type: String,
      enum: ["full-time", "part-time", "casual", "contractor", ""],
      default: "",
    },
    employment_start_date: { type: String },
    employment_start_year: { type: Number },
    employment_end_date: { type: String },
    employment_end_year: { type: Number },
    employee_id: { type: String },

    // ── Calendar ──
    calendar_color: { type: String, default: "#4DD0E1" },

    // ── Addresses ──
    addresses: [
      {
        name: { type: String, required: true },
        address: { type: String },
      },
    ],

    // ── Emergency contacts ──
    emergency_contacts: [
      {
        name: { type: String, required: true },
        relation: { type: String },
        phone: { type: String },
      },
    ],

    // ── Services ──
    service_overrides: [
      {
        service_id: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
        custom_price: { type: Number },
        custom_duration: { type: Number },
      },
    ],

    // ── Repeating schedule config ──
    repeating_schedule_config: {
      schedule_type: { type: String, default: "Every week" },
      start_date: { type: String },
      ends_type: { type: String, default: "Never" },
      end_date: { type: String },
      end_occurrences: { type: Number },
    },

    // ── Availability ──
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
        shifts: [
          {
            start: { type: String },
            end: { type: String },
          },
        ],
      },
    ],

    // ── Media & status ──
    employee_photo: { type: String },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

export const Employee = models.Employee || model("Employee", employee_schema);
