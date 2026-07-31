import { connectToDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import Booking from "@/server/models/Booking.model";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as any).category !== "business") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const business_id = session.user.id;
  const q = new URL(req.url).searchParams.get("q")?.trim();

  await connectToDb();

  const clients = await Booking.aggregate([
    { $match: { business_id } },
    {
      $group: {
        _id: "$user_id",
        bookings_count: { $sum: 1 },
        total_spent: {
          $sum: {
            $cond: [{ $eq: ["$payment_status", "paid"] }, "$total_price", 0],
          },
        },
        last_booking_at: { $max: "$start_time" },
        first_booking_at: { $min: "$start_time" },
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
    ...(q
      ? [
          {
            $match: {
              $or: [
                { "user.name": { $regex: q, $options: "i" } },
                { "user.email": { $regex: q, $options: "i" } },
              ],
            },
          },
        ]
      : []),
    { $sort: { last_booking_at: -1 } },
    {
      $project: {
        _id: 0,
        user_id: "$_id",
        name: "$user.name",
        email: "$user.email",
        phone: "$user.phone_number",
        image: "$user.image",
        bookings_count: 1,
        total_spent: 1,
        last_booking_at: 1,
        first_booking_at: 1,
      },
    },
  ]);

  return NextResponse.json({ data: clients });
}
