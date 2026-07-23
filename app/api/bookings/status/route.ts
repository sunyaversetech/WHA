import { NextResponse } from "next/server";
import Booking from "@/server/models/Booking.model";
import { connectToDb } from "@/lib/db";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "rescheduled", "cancelled"],
  confirmed: ["arrived", "completed", "rescheduled", "no_show", "cancelled"],
  rescheduled: ["confirmed", "arrived", "cancelled"],
  arrived: ["completed", "no_show", "cancelled"],
  completed: ["refunded"],
  cancelled: [],
  no_show: [],
  refunded: [],
};

export async function PATCH(request: Request) {
  try {
    const { bookingId, newStatus, notes } = await request.json();

    if (!bookingId || !newStatus) {
      return NextResponse.json(
        { error: "Missing required fields: bookingId and newStatus" },
        { status: 400 },
      );
    }

    await connectToDb();

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const currentStatus = booking.status;

    if (currentStatus === newStatus) {
      return NextResponse.json({ success: true, data: booking });
    }

    const allowedNextStates = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedNextStates.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from '${currentStatus}' to '${newStatus}'.`,
        },
        { status: 400 },
      );
    }

    booking.status = newStatus;

    if (notes) {
      booking.notes = booking.notes ? `${booking.notes}\n${notes}` : notes;
    }

    if (newStatus === "refunded") {
      booking.payment_status = "refunded";
    }

    await booking.save();

    return NextResponse.json({
      success: true,
      message: `Booking status updated to ${newStatus}`,
      data: booking,
    });
  } catch (error: any) {
    console.error("Error updating booking status:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
