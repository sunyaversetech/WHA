import { connectToDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { Redemption } from "@/server/models/CouponCodeRedemtion.model";
import { EventRedemption } from "@/server/models/EventCodeRemtion.model";
import { EventTicketPurchase } from "@/server/models/EventTicketPurchase.model";
import { getAuthUserDetailed, bearerRejectionResponse } from "@/server/lib/getAuthUser";

import "@/server/models/Event.model";
import "@/server/models/DealSchema.model";
import "@/server/models/Auth.model";

export async function GET(req: Request) {
  try {
    await connectToDb();
    const authResult = await getAuthUserDetailed(req);

    if (!authResult.user) {
      if (authResult.viaBearer) {
        return bearerRejectionResponse(authResult.reason, "message");
      }
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const authUser = authResult.user;

    const dealRedemptions = await Redemption.find({
      user: authUser.id,
    }).populate("deal");
    const eventRedemptions = await EventRedemption.find({
      user: authUser.id,
    }).populate("event");
    const eventPurchases = await EventTicketPurchase.find({
      user: authUser.id,
    }).populate("event");

    const validDeals = dealRedemptions.filter((r) => r.deal !== null);
    const validEvents = eventRedemptions.filter((r) => r.event !== null);
    const validPurchases = eventPurchases.filter((r) => r.event !== null);

    const dealIdsToDelete = dealRedemptions
      .filter((r) => r.deal === null)
      .map((r) => r._id);
    const eventIdsToDelete = eventRedemptions
      .filter((r) => r.event === null)
      .map((r) => r._id);
    const purchaseIdsToDelete = eventPurchases
      .filter((r) => r.event === null)
      .map((r) => r._id);

    if (dealIdsToDelete.length > 0) {
      await Redemption.deleteMany({ _id: { $in: dealIdsToDelete } });
    }
    if (eventIdsToDelete.length > 0) {
      await EventRedemption.deleteMany({ _id: { $in: eventIdsToDelete } });
    }
    if (purchaseIdsToDelete.length > 0) {
      await EventTicketPurchase.deleteMany({
        _id: { $in: purchaseIdsToDelete },
      });
    }

    const tickets = [...validDeals, ...validEvents, ...validPurchases];

    return NextResponse.json(
      { message: "Tickets fetched successfully", data: tickets },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
