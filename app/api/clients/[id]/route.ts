import { connectToDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireBusinessUser } from "@/server/lib/businessAuth";
import Booking from "@/server/models/Booking.model";
import User from "@/server/models/Auth.model";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const auth = await requireBusinessUser(req, { webNotBusiness: { body: { error: "Unauthorized" }, status: 401 } });
  if (!auth.user) return auth.response;
  const business_id = auth.user.id;
  const { id: user_id } = await params;

  await connectToDb();

  const [client, bookings] = await Promise.all([
    User.findById(user_id, "name email phone_number image"),
    Booking.find({ business_id, user_id })
      .populate("service_id", "name")
      .populate("employee_id", "full_name")
      .sort({ start_time: -1 }),
  ]);

  // Only people who have booked with THIS business are its clients — never expose
  // another user's contact details just because their id is known.
  if (!client || bookings.length === 0) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({ data: { client, bookings } });
}
