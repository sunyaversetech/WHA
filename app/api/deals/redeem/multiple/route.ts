import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import crypto from "crypto";
import Stripe from "stripe";
import { Deal } from "@/server/models/DealSchema.model";
import { Redemption } from "@/server/models/CouponCodeRedemtion.model";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    await connectToDb();
    const { dealId, userId, quantity, paymentIntentId } = await req.json();

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment not verified" },
        { status: 400 },
      );
    }

    const deal = await Deal.findById(dealId);

    if (deal.current_redemptions + quantity > deal.max_redemptions) {
      return NextResponse.json(
        { error: "Not enough tickets left" },
        { status: 400 },
      );
    }

    const updatedDeal = await Deal.findOneAndUpdate(
      {
        _id: dealId,
        current_redemptions: { $lte: deal.max_redemptions - quantity },
      },
      { $inc: { current_redemptions: quantity } },
      { new: true },
    );

    if (!updatedDeal)
      return NextResponse.json(
        { error: "Tickets sold out during payment" },
        { status: 400 },
      );

    const redemptionsData = Array.from({ length: quantity }).map(() => ({
      deal: dealId,
      user: userId,
      business: deal.user,
      uniqueKey: crypto.randomBytes(4).toString("hex").toUpperCase(),
      paymentIntentId,
      status: "pending",
    }));

    const createdRedemptions = await Redemption.insertMany(redemptionsData);

    return NextResponse.json({
      success: true,
      codes: createdRedemptions.map((r) => r.uniqueKey),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
