import { connectToDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { Redemption } from "@/server/models/CouponCodeRedemtion.model";
import { EventRedemption } from "@/server/models/EventCodeRemtion.model";

export async function GET(req: Request) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const dealTickets = await Redemption.find({
      user: session.user.id,
    }).populate("deal");
    const eventTickets = await EventRedemption.find({
      user: session.user.id,
    }).populate("event");
    const tickets = [...dealTickets, ...eventTickets];
    return NextResponse.json(
      { message: "Tickets fetched successfully", data: tickets },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
