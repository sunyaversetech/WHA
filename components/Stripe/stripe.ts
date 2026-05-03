// app/actions/stripe.ts
"use server";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function createPaymentIntent(
  dealId: string,
  price: number,
  userId: string,
) {
  try {
    const stripeFeePercentage = 0.029;
    const fixedFee = 0.3;
    const totalAmount = (price + fixedFee) / (1 - stripeFeePercentage);

    const amountInCents = Math.round(totalAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "aud",
      automatic_payment_methods: { enabled: true },
      metadata: {
        dealId,
        userId,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      totalToPay: totalAmount,
    };
  } catch (error) {
    console.error("Stripe Error:", error);
    throw new Error("Initialization failed");
  }
}
