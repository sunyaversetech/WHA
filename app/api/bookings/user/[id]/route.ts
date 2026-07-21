import { connectToDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../auth/[...nextauth]/route";
import Booking from "@/server/models/Booking.model";

const CANCELLABLE = ["pending", "confirmed", "rescheduled"];
const RESCHEDULABLE = ["pending", "confirmed", "rescheduled"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.category !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const booking = await Booking.findOne({ _id: params.id, user_id: userId });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "cancel") {
      if (!CANCELLABLE.includes(booking.status)) {
        return NextResponse.json(
          { error: "This booking cannot be cancelled" },
          { status: 400 },
        );
      }
      booking.status = "cancelled";
      await booking.save();
      return NextResponse.json({ data: booking });
    }

    if (action === "reschedule") {
      const { start_time, end_time, duration } = body;
      if (!start_time || !end_time || !duration) {
        return NextResponse.json(
          { error: "start_time, end_time and duration are required" },
          { status: 400 },
        );
      }
      if (!RESCHEDULABLE.includes(booking.status)) {
        return NextResponse.json(
          { error: "This booking cannot be rescheduled" },
          { status: 400 },
        );
      }
      const newStart = new Date(start_time);
      if (newStart <= new Date()) {
        return NextResponse.json(
          { error: "New time must be in the future" },
          { status: 400 },
        );
      }
      booking.start_time = newStart;
      booking.end_time = new Date(end_time);
      booking.duration = duration;
      booking.status = "rescheduled";
      await booking.save();
      return NextResponse.json({ data: booking });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
