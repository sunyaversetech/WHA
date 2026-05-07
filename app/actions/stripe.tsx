"use server";

import Stripe from "stripe";
import { connectToDb } from "@/lib/db";
import { Deal } from "@/server/models/DealSchema.model";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function getPaymentIntentForQuantity(
  dealId: string,
  quantity: number,
) {
  try {
    await connectToDb();
    const deal = await Deal.findById(dealId);
    if (!deal) throw new Error("Deal not found");

    const ticketTotal = deal.price * quantity;
    const serviceFee = 0;
    const orderTotal = ticketTotal + serviceFee;
    const surcharge = orderTotal * 0.025;
    const totalToPay = orderTotal + surcharge;

    const amountInCents = Math.round(totalToPay * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "aud",
      metadata: { dealId, quantity: quantity.toString() },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      totalAmount: totalToPay,
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
}
