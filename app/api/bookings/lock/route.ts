import { connectToDb } from "@/lib/db";
import { BookingLock } from "@/server/models/BookingLock.model";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await connectToDb();
    const { business_id, employee_id, start_time, end_time } =
      await request.json();

    const existing_lock = await BookingLock.findOne({
      employee_id,
      $or: [{ start_time: { $lt: end_time }, end_time: { $gt: start_time } }],
    });

    if (existing_lock) {
      return NextResponse.json(
        {
          success: false,
          message: "This time slot is temporarily held by another user.",
        },
        { status: 409 },
      );
    }

    const lock = await BookingLock.create({
      business_id,
      employee_id,
      start_time,
      end_time,
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
    });

    return NextResponse.json({ success: true, lock_id: lock._id });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
