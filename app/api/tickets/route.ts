import { connectToDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { Redemption } from "@/server/models/CouponCodeRedemtion.model";
import { EventRedemption } from "@/server/models/EventCodeRemtion.model";

import "@/server/models/Event.model";
import "@/server/models/DealSchema.model";
import "@/server/models/Auth.model";

export async function GET(req: Request) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const dealRedemptions = await Redemption.find({
      user: session.user.id,
    }).populate("deal");
    const eventRedemptions = await EventRedemption.find({
      user: session.user.id,
    }).populate("event");

    const validDeals = dealRedemptions.filter((r) => r.deal !== null);
    const validEvents = eventRedemptions.filter((r) => r.event !== null);

    const dealIdsToDelete = dealRedemptions
      .filter((r) => r.deal === null)
      .map((r) => r._id);
    const eventIdsToDelete = eventRedemptions
      .filter((r) => r.event === null)
      .map((r) => r._id);

    if (dealIdsToDelete.length > 0) {
      await Redemption.deleteMany({ _id: { $in: dealIdsToDelete } });
    }
    if (eventIdsToDelete.length > 0) {
      await EventRedemption.deleteMany({ _id: { $in: eventIdsToDelete } });
    }

    const tickets = [...validDeals, ...validEvents];

    return NextResponse.json(
      { message: "Tickets fetched successfully", data: tickets },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
