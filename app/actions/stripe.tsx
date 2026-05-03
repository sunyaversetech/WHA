// app/actions/stripe.ts
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

    // Calculate total
    const basePrice = deal.price * quantity;
    const stripeFeePercentage = 0.029;
    const fixedFee = 0.3;
    const totalWithFees = (basePrice + fixedFee) / (1 - stripeFeePercentage);

    const amountInCents = Math.round(totalWithFees * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "aud",
      metadata: { dealId, quantity: quantity.toString() },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      totalAmount: totalWithFees,
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
}
