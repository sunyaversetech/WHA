import { connectToDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import Booking from "@/server/models/Booking.model";

const RESULT_LIMIT = 5;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as any).category !== "business") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const business_id = session.user.id;
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();

  await connectToDb();

  // ── Clients: name / email / mobile ────────────────────────────────────────
  const clientPipeline: any[] = [
    { $match: { business_id } },
    {
      $group: {
        _id: "$user_id",
        bookings_count: { $sum: 1 },
        last_booking_at: { $max: "$start_time" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
  ];
  if (q) {
    clientPipeline.push({
      $match: {
        $or: [
          { "user.name": { $regex: q, $options: "i" } },
          { "user.email": { $regex: q, $options: "i" } },
          { "user.phone_number": { $regex: q, $options: "i" } },
        ],
      },
    });
  }
  clientPipeline.push(
    { $sort: { last_booking_at: -1 } },
    { $limit: RESULT_LIMIT },
    {
      $project: {
        _id: 0,
        user_id: "$_id",
        name: "$user.name",
        email: "$user.email",
        phone: "$user.phone_number",
        image: "$user.image",
      },
    },
  );

  // ── Upcoming appointments: client name / mobile / email / booking reference ─
  const [upcoming, clients] = await Promise.all([
    Booking.find({
      business_id,
      start_time: { $gte: new Date() },
      status: { $nin: ["cancelled", "no_show", "refunded", "completed"] },
    })
      .populate("user_id", "name email phone_number")
      .populate("service_id", "name")
      .sort({ start_time: 1 })
      .limit(50)
      .lean(),
    Booking.aggregate(clientPipeline),
  ]);

  let appointments = upcoming;
  if (q) {
    const needle = q.toLowerCase();
    appointments = upcoming.filter((b: any) => {
      const user = b.user_id;
      return (
        b._id.toString().toLowerCase().includes(needle) ||
        user?.name?.toLowerCase().includes(needle) ||
        user?.email?.toLowerCase().includes(needle) ||
        user?.phone_number?.toLowerCase().includes(needle) ||
        b.service_id?.name?.toLowerCase().includes(needle)
      );
    });
  }

  return NextResponse.json({
    data: {
      appointments: appointments.slice(0, RESULT_LIMIT),
      clients,
    },
  });
}
