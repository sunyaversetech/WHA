import { NextResponse } from "next/server";
import * as crypto from "crypto";
import { connectToDb } from "@/lib/db";
import { Deal } from "@/server/models/DealSchema.model";
import { Redemption } from "@/server/models/CouponCodeRedemtion.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { sendEventMultipleTicketEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    await connectToDb();
    const { dealId, userId } = await req.json();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const deal = await Deal.findById(dealId);
    if (!deal)
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    if (new Date() > new Date(deal.valid_till)) {
      return NextResponse.json(
        { error: "This deal has expired" },
        { status: 400 },
      );
    }

    if (deal.current_redemptions >= Number(deal.max_redemptions)) {
      return NextResponse.json(
        { error: "Deal limit reached" },
        { status: 400 },
      );
    }

    const alreadyClaimed = await Redemption.findOne({
      deal: dealId,
      user: userId,
    });
    if (alreadyClaimed) {
      return NextResponse.json(
        {
          error: "You already have a code for this",
          codes: alreadyClaimed.uniqueKeys,
        },
        { status: 400 },
      );
    }

    const uniqueKeys = [
      `WHA-DEAL-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    ];

    const redemption = await Redemption.create({
      deal: dealId,
      user: userId,
      business: deal.user,
      uniqueKeys,
    });

    const updatedDeal = await Deal.findOneAndUpdate(
      { _id: dealId, current_redemptions: { $lt: deal.max_redemptions } },
      { $inc: { current_redemptions: 1 } },
      { new: true },
    );

    if (!updatedDeal)
      return NextResponse.json(
        { error: "Deal just sold out" },
        { status: 400 },
      );

    await sendEventMultipleTicketEmail(
      session.user.email!,
      deal.title,
      redemption.uniqueKeys,
      session.user.name!,
    );

    return NextResponse.json({
      success: true,
      codes: redemption.uniqueKeys,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectToDb();

    const redemption = await Redemption.find();
    if (!redemption) {
      return NextResponse.json({ redeemed: false }, { status: 200 });
    }
    return NextResponse.json(
      {
        data: redemption,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
