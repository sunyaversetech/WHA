import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import Booking from "@/server/models/Booking.model";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get("session_id");

    if (!session_id) {
      return NextResponse.json(
        { error: "Missing required query parameter: session_id" },
        { status: 400 },
      );
    }

    await connectToDb();

    // Find the permanent booking matching the Stripe session ID
    const booking = await Booking.findOne({ stripe_session_id: session_id })
      .populate("service_id", "name price duration")
      .populate("employee_id", "name");

    // If no booking exists yet, return verified: false so frontend keeps polling
    if (!booking) {
      return NextResponse.json({
        verified: false,
        message:
          "Booking records are currently being processed. Still waiting for payment authorization webhook...",
      });
    }

    // Booking found! Return full details to show on the success card
    return NextResponse.json({
      verified: true,
      booking: {
        id: booking._id,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: booking.status,
        payment_status: booking.payment_status,
        service_name: booking.service_id?.name || "Service Appointment",
        employee_name: booking.employee_id?.name || "Any Professional",
      },
    });
  } catch (error: any) {
    console.error("❌ Error verifying stripe checkout session booking:", error);
    return NextResponse.json(
      { error: "Internal server validation pipeline crash." },
      { status: 500 },
    );
  }
}
