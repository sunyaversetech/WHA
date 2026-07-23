import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectToDb } from "@/lib/db";
import Booking from "@/server/models/Booking.model";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  // Accept an optional date param (YYYY-MM-DD) for the client's local date;
  // fall back to today in UTC.
  const dateParam = searchParams.get("date");

  let dayStart: Date;
  let dayEnd: Date;

  if (dateParam) {
    dayStart = new Date(`${dateParam}T00:00:00.000Z`);
    dayEnd   = new Date(`${dateParam}T23:59:59.999Z`);
  } else {
    const now = new Date();
    dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    dayEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  }

  await connectToDb();

  try {
    const bookings = await Booking.find({
      business_id: session.user.id,
      start_time: { $gte: dayStart, $lte: dayEnd },
    })
      .populate("service_id")
      .populate("employee_id")
      .populate("user_id", "name email")
      .sort({ start_time: 1 })
      .lean();

    return NextResponse.json({ success: true, data: bookings });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch" },
      { status: 500 },
    );
  }
}
