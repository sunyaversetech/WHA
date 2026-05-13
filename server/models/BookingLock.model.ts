import mongoose, { models } from "mongoose";
import { model } from "mongoose";

const booking_lock_schema = new mongoose.Schema(
  {
    business_id: {
      type: String,
      required: true,
      index: true,
    },
    service_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },

    expires_at: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 60 * 1000),
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

booking_lock_schema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

booking_lock_schema.index({
  business_id: 1,
  employee_id: 1,
  start_time: 1,
  end_time: 1,
});

// const BookingLock = mongoose.model("BookingLock", booking_lock_schema);
export const BookingLock =
  models.BookingLock || model("BookingLock", booking_lock_schema);
