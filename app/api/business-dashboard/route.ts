import { connectToDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import Booking from "@/server/models/Booking.model";

export async function GET() {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.category !== "business") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const businessId = (session.user as any).id;

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const sevenDaysAhead = new Date(now);
    sevenDaysAhead.setDate(now.getDate() + 7);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [recentBookings, upcomingBookings, todayBookings] = await Promise.all(
      [
        Booking.find({
          business_id: businessId,
          start_time: { $gte: sevenDaysAgo, $lte: now },
        })
          .populate("service_id", "name base_price")
          .populate("user_id", "name email")
          .sort({ start_time: -1 })
          .lean(),
        Booking.find({
          business_id: businessId,
          start_time: { $gte: now, $lte: sevenDaysAhead },
          status: { $in: ["pending", "confirmed"] },
        })
          .populate("service_id", "name base_duration base_price")
          .populate("user_id", "name email")
          .sort({ start_time: 1 })
          .limit(10)
          .lean(),
        Booking.find({
          business_id: businessId,
          start_time: { $gte: todayStart, $lte: todayEnd },
          status: { $in: ["pending", "confirmed"] },
        })
          .populate("service_id", "name base_duration base_price")
          .populate("user_id", "name email")
          .sort({ start_time: 1 })
          .lean(),
      ],
    );

    // Build daily totals for the last 7 days
    const dailyMap: Record<string, { appointments: number; sales: number }> =
      {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = { appointments: 0, sales: 0 };
    }
    for (const b of recentBookings as any[]) {
      const key = new Date(b.start_time).toISOString().slice(0, 10);
      if (dailyMap[key]) {
        dailyMap[key].appointments += 1;
        if (b.payment_status === "paid") {
          dailyMap[key].sales += b.total_price ?? 0;
        }
      }
    }
    const dailyStats = Object.entries(dailyMap).map(([date, v]) => ({
      date,
      ...v,
    }));

    const totalAppointments = recentBookings.length;
    const totalSales = (recentBookings as any[])
      .filter((b: any) => b.payment_status === "paid")
      .reduce((s: number, b: any) => s + (b.total_price ?? 0), 0);

    return NextResponse.json({
      data: {
        dailyStats,
        totalAppointments,
        totalSales,
        recentBookings: recentBookings.slice(0, 10),
        upcomingBookings,
        todayBookings,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
