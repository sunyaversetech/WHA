// server/models/BookingLock.model.ts
import mongoose, { models, model } from "mongoose";

const booking_lock_schema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, index: true },
    user_id: { type: String, required: true, index: true },
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
    inventory_quantity: { type: Number, default: 0 },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    expires_at: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 5 * 60 * 1000),
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

// TTL index — MongoDB auto-deletes expired locks
booking_lock_schema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// ─── FIX 3: Split unique indexes by business_type use-case ────────────────────
//
// OLD (broken) index:
//   { business_id, employee_id, start_time, end_time } — unique
//
// Why it broke item-based inventory:
//   For item-based services there is NO employee_id (it's null).
//   MongoDB treats all nulls as equal in unique indexes, so the SECOND
//   user trying to lock the same time slot gets an E11000 duplicate key
//   error. Their lock is never created, yet the booking route proceeds
//   without a valid lock — skipping the inventory concurrency check entirely.
//
// Fix — two separate, purpose-fit indexes:
//
//   1. Employee-based: one employee can only hold one lock per time window.
//      Partial filter excludes item-based locks (employee_id != null).
//
//   2. Item-based: one USER can only hold one lock per service+time window
//      (prevents the same user double-locking). Multiple different users
//      CAN each hold their own lock, which is correct — their quantities
//      are summed during the inventory check.

booking_lock_schema.index(
  {
    business_id: 1,
    employee_id: 1,
    start_time: 1,
    end_time: 1,
  },
  {
    unique: true,
    partialFilterExpression: { employee_id: { $ne: null } },
    name: "unique_employee_lock",
  },
);

booking_lock_schema.index(
  {
    business_id: 1,
    service_id: 1,
    user_id: 1,
    start_time: 1,
    end_time: 1,
  },
  {
    unique: true,
    partialFilterExpression: { employee_id: null },
    name: "unique_item_lock_per_user",
  },
);

export const BookingLock =
  models.BookingLock || model("BookingLock", booking_lock_schema);
