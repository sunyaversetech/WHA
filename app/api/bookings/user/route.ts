import { connectToDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import Booking from "@/server/models/Booking.model";
import User from "@/server/models/Auth.model";
import "@/server/models/Service.model";
import "@/server/models/Employee.model";

export async function GET() {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.category !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const bookings = await Booking.find({ user_id: userId })
      .populate("service_id", "name base_price base_duration")
      .populate("employee_id", "name")
      .sort({ start_time: -1 })
      .lean();

    const businessIds = [...new Set(bookings.map((b: any) => b.business_id).filter(Boolean))];
    const businesses = await User.find(
      { _id: { $in: businessIds } },
      "business_name image",
    ).lean();
    const bizMap = Object.fromEntries(
      businesses.map((b: any) => [b._id.toString(), b]),
    );

    const enriched = bookings.map((b: any) => ({
      ...b,
      business: bizMap[b.business_id] ?? null,
    }));

    return NextResponse.json({ data: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
