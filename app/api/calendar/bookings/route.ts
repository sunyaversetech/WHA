import { connectToDb } from "@/lib/db";
import Booking from "@/server/models/Booking.model";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business_id = (session.user as any).id;
  const { searchParams } = new URL(request.url);
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");
  const statuses = searchParams.get("statuses"); // comma-separated, default excludes cancelled etc

  await connectToDb();

  const excludeStatuses = statuses
    ? statuses.split(",")
    : ["cancelled", "no_show", "refunded"];

  const query: any = {
    business_id,
    status: { $nin: excludeStatuses },
  };

  if (start_date) {
    const start = new Date(start_date);
    start.setHours(0, 0, 0, 0);
    const end = end_date ? new Date(end_date) : new Date(start_date);
    end.setHours(23, 59, 59, 999);
    query.start_time = { $gte: start, $lte: end };
  }

  try {
    const bookings = await Booking.find(query)
      .populate("service_id", "name service_type category max_concurrent_bookings base_price")
      .populate("employee_id", "full_name email calendar_color employee_photo job_title")
      .populate("user_id", "name email image")
      .sort({ start_time: 1 })
      .lean();

    return NextResponse.json({ success: true, data: bookings }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
