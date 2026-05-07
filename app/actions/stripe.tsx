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

    // --- FIX STARTS HERE ---
    // 1. Calculate the actual price after discount
    // If price is 2 and discount is 50%, this becomes 1
    const discount = deal.discount_percentage || 0;
    const pricePerTicket = deal.price * ((100 - discount) / 100);

    // 2. Use that discounted price for the total
    const ticketTotal = pricePerTicket * quantity;
    // --- FIX ENDS HERE ---

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
