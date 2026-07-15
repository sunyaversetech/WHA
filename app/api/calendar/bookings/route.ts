import { connectToDb } from "@/lib/db";
import Booking from "@/server/models/Booking.model";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

/** Convert a local date string (YYYY-MM-DD) + wall-clock time to UTC Date. */
function localToUtc(dateStr: string, time: "start" | "end", timezone: string): Date {
  const timeStr = time === "start" ? "00:00" : "23:59";
  const seconds = time === "start" ? "00" : "59";
  const naive = new Date(`${dateStr}T${timeStr}:${seconds}Z`);
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
  return new Date(naive.getTime() - (inTz.getTime() - naive.getTime()));
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business_id = (session.user as any).id;
  const { searchParams } = new URL(request.url);

  const start_date   = searchParams.get("start_date");
  const end_date     = searchParams.get("end_date");
  const statuses     = searchParams.get("statuses");     // legacy: comma-sep exclude list
  const status_filter = searchParams.get("status_filter"); // new: include exactly this status
  const timezone     = searchParams.get("timezone") || "UTC";
  const page         = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit        = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
  const skip         = (page - 1) * limit;

  await connectToDb();

  // Build the base query (no status or date filter yet — used for counts)
  const base: any = { business_id };

  // Date range
  if (start_date) {
    const utcStart = localToUtc(start_date, "start", timezone);
    const utcEnd   = localToUtc(end_date ?? start_date, "end", timezone);
    base.start_time = { $gte: utcStart, $lte: utcEnd };
  }

  // Status counts aggregation runs against the base query (no status filter)
  // so all tabs always show accurate counts for the current date range.
  const statusCountsAgg = Booking.aggregate([
    { $match: base },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  // Build the data query — add status filter on top of base
  const dataQuery: any = { ...base };

  if (status_filter && status_filter !== "all") {
    // Reservation page: show only bookings with this exact status
    dataQuery.status = status_filter;
  } else {
    // Calendar / default: exclude certain statuses
    // statuses=null (absent) → default exclusions
    // statuses=""  (present but empty) → show everything
    const excludeStatuses =
      statuses === null
        ? ["cancelled", "no_show", "refunded"]
        : statuses
          ? statuses.split(",")
          : [];
    if (excludeStatuses.length) dataQuery.status = { $nin: excludeStatuses };
  }

  try {
    const [bookings, total, countsRaw] = await Promise.all([
      Booking.find(dataQuery)
        .populate("service_id", "name service_type category max_concurrent_bookings base_price")
        .populate("employee_id", "full_name email calendar_color employee_photo job_title")
        .populate("user_id", "name email image")
        .sort({ start_time: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(dataQuery),
      statusCountsAgg,
    ]);

    // Build status_counts map: { all: N, confirmed: N, ... }
    const status_counts: Record<string, number> = { all: 0 };
    (countsRaw as any[]).forEach((item) => {
      status_counts[item._id] = item.count;
      status_counts.all += item.count;
    });

    return NextResponse.json({
      success: true,
      data: bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
      status_counts,
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
