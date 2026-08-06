import { connectToDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { EventRedemption } from "@/server/models/EventCodeRemtion.model";
import { EventTicketPurchase } from "@/server/models/EventTicketPurchase.model";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDb();
    const { uniqueKey, event } = await request.json();

    const redemption = await EventRedemption.findOne({ uniqueKey });

    if (redemption) {
      if (
        redemption.business.toString() !== session.user.id &&
        event !== redemption.event
      ) {
        return NextResponse.json(
          { message: "Unauthorized for this business." },
          { status: 403 },
        );
      }

      if (redemption.status === "verified") {
        return NextResponse.json(
          { message: "Ticket already used." },
          { status: 400 },
        );
      }

      redemption.status = "verified";
      redemption.verifiedAt = new Date();
      await redemption.save();

      return NextResponse.json(
        {
          success: true,
          message: "Ticket verified successfully!",
          data: {
            attendee: redemption.userName,
            verifiedAt: redemption.verifiedAt,
          },
        },
        { status: 200 },
      );
    }

    // Not a free-registration code — check paid ticket purchases instead.
    const purchase = await EventTicketPurchase.findOne({
      uniqueKeys: uniqueKey,
    }).populate("user", "name");

    if (!purchase) {
      return NextResponse.json(
        { message: "Invalid ticket code." },
        { status: 404 },
      );
    }

    if (
      purchase.business.toString() !== session.user.id &&
      event !== purchase.event.toString()
    ) {
      return NextResponse.json(
        { message: "Unauthorized for this business." },
        { status: 403 },
      );
    }

    if (purchase.verifiedKeys.includes(uniqueKey)) {
      return NextResponse.json(
        { message: "Ticket already used." },
        { status: 400 },
      );
    }

    const matchedItem = purchase.items.find((item: any) =>
      item.uniqueKeys.includes(uniqueKey),
    );

    purchase.verifiedKeys.push(uniqueKey);
    purchase.verifiedAt = new Date();
    if (purchase.verifiedKeys.length >= purchase.uniqueKeys.length) {
      purchase.status = "verified";
    }
    await purchase.save();

    return NextResponse.json(
      {
        success: true,
        message: "Ticket verified successfully!",
        data: {
          attendee: (purchase.user as any)?.name,
          ticketType: matchedItem?.optionName,
          verifiedAt: purchase.verifiedAt,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
