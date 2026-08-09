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
    const { uniqueKey: rawUniqueKey, event } = await request.json();

    if (!rawUniqueKey || typeof rawUniqueKey !== "string") {
      return NextResponse.json(
        { message: "Invalid ticket code." },
        { status: 404 },
      );
    }

    // Codes may have been generated with mixed case (from event titles) or
    // typed by staff with auto-uppercasing — match case-insensitively so
    // formatting differences never block a valid ticket.
    const escaped = rawUniqueKey.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const keyRegex = new RegExp(`^${escaped}$`, "i");

    const redemption = await EventRedemption.findOne({ uniqueKey: keyRegex });

    if (redemption) {
      if (redemption.business.toString() !== session.user.id) {
        return NextResponse.json(
          { message: "Unauthorized for this business." },
          { status: 403 },
        );
      }

      if (event && redemption.event.toString() !== event) {
        return NextResponse.json(
          { message: "This ticket is not valid for this event." },
          { status: 400 },
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
      uniqueKeys: keyRegex,
    }).populate("user", "name");

    if (!purchase) {
      return NextResponse.json(
        { message: "Invalid ticket code." },
        { status: 404 },
      );
    }

    if (purchase.business.toString() !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized for this business." },
        { status: 403 },
      );
    }

    if (event && purchase.event.toString() !== event) {
      return NextResponse.json(
        { message: "This ticket is not valid for this event." },
        { status: 400 },
      );
    }

    // Resolve to the exact stored casing so verifiedKeys/items comparisons
    // (which are case-sensitive) stay consistent regardless of how the code
    // was entered.
    const uniqueKey: string =
      purchase.uniqueKeys.find((k: string) => keyRegex.test(k)) ||
      rawUniqueKey;

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
