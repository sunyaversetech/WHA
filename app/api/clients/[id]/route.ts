import { connectToDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import Booking from "@/server/models/Booking.model";
import User from "@/server/models/Auth.model";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as any).category !== "business") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const business_id = session.user.id;
  const { id: user_id } = await params;

  await connectToDb();

  const [client, bookings] = await Promise.all([
    User.findById(user_id, "name email phone_number image"),
    Booking.find({ business_id, user_id })
      .populate("service_id", "name")
      .populate("employee_id", "full_name")
      .sort({ start_time: -1 }),
  ]);

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({ data: { client, bookings } });
}
