import { connectToDb } from "@/lib/db";
import Booking from "@/server/models/Booking.model";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

/** Convert a local date string (YYYY-MM-DD) + wall-clock time to UTC Date. */
function localToUtc(dateStr: string, time: "start" | "end", timezone: string): Date {
  const timeStr = time === "start" ? "00:00" : "23:59";
  const seconds = time === "start" ? "00" : "59";
  // Treat the wall-clock time as UTC temporarily
  const naive = new Date(`${dateStr}T${timeStr}:${seconds}Z`);
  // Find what that UTC instant shows in the target timezone
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(naive);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const inTz = new Date(
    `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}Z`,
  );
  // Offset = inTz - naive; actual UTC = naive - offset
  return new Date(naive.getTime() - (inTz.getTime() - naive.getTime()));
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business_id = (session.user as any).id;
  const { searchParams } = new URL(request.url);
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");
  const statuses = searchParams.get("statuses");
  const timezone = searchParams.get("timezone") || "UTC";

  await connectToDb();

  const excludeStatuses = statuses
    ? statuses.split(",")
    : ["cancelled", "no_show", "refunded"];

  const query: any = {
    business_id,
    status: { $nin: excludeStatuses },
  };

  if (start_date) {
    const start = localToUtc(start_date, "start", timezone);
    const end = localToUtc(end_date ?? start_date, "end", timezone);
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
