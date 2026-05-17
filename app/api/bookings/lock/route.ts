import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDb } from "@/lib/db";
import Booking from "@/server/models/Booking.model";
import { BookingLock } from "@/server/models/BookingLock.model";

export async function POST(request: Request) {
  await connectToDb();

  // Start a client session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { business_id, service_id, employee_id, start_time, end_time } =
      await request.json();

    const requested_start = new Date(start_time);
    const requested_end = new Date(end_time);

    // 1. Check for ANY overlapping confirmed bookings OR active locks within this session
    const overlap_query = {
      employee_id,
      $or: [
        {
          start_time: { $lt: requested_end },
          end_time: { $gt: requested_start },
        },
      ],
    };

    // Query both collections inside the transaction session
    const [existing_booking, existing_lock] = await Promise.all([
      Booking.findOne(overlap_query).session(session),
      BookingLock.findOne(overlap_query).session(session),
    ]);

    if (existing_booking || existing_lock) {
      // Abort transaction and release the session
      await session.abortTransaction();
      session.endSession();

      return NextResponse.json(
        {
          success: false,
          message: "This slot was just taken. Please choose another time.",
        },
        { status: 409 },
      );
    }

    // 2. If free, write the lock inside the transaction session
    const new_lock = await BookingLock.create(
      [
        {
          business_id,
          service_id,
          employee_id,
          start_time: requested_start,
          end_time: requested_end,
          expires_at: new Date(Date.now() + 5 * 60 * 1000),
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({ success: true, lock_id: new_lock[0]._id });
  } catch (error: any) {
    // If anything fails, roll back all database mutations safely
    await session.abortTransaction();
    session.endSession();
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
