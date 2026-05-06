import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import crypto from "crypto";
import Stripe from "stripe";
import { Deal } from "@/server/models/DealSchema.model";
import { Redemption } from "@/server/models/CouponCodeRedemtion.model";
import { sendEventMultipleTicketEmail, sendEventTicketEmail } from "@/lib/mail";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    await connectToDb();
    const { dealId, userId, quantity, paymentIntentId } = await req.json();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment not verified" },
        { status: 400 },
      );
    }

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 400 });
    }

    if (deal.current_redemptions + quantity > deal.max_redemptions) {
      return NextResponse.json(
        { error: "Not enough tickets left" },
        { status: 400 },
      );
    }

    const uniqueKeys = Array.from(
      { length: quantity },
      (_, i) =>
        `WHA-DEAL-${crypto.randomBytes(4).toString("hex").toUpperCase()}-${i + 1}of${quantity}`,
    );

    const redemption = await Redemption.create({
      deal: dealId,
      user: userId,
      business: deal.user,
      uniqueKeys,
      paymentIntentId,
      status: "pending",
    });

    const updatedDeal = await Deal.findOneAndUpdate(
      {
        _id: dealId,
        current_redemptions: { $lte: deal.max_redemptions - quantity },
      },
      { $inc: { current_redemptions: quantity } },
      { new: true },
    );

    if (!updatedDeal) {
      return NextResponse.json(
        { error: "Tickets sold out during payment" },
        { status: 400 },
      );
    }

    await sendEventMultipleTicketEmail(
      session.user.email!,
      deal.title,
      uniqueKeys,
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
