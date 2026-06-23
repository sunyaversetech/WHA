"use server";

import Stripe from "stripe";
import { connectToDb } from "@/lib/db";
import { BookingLock } from "@/server/models/BookingLock.model";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function getBookingPaymentIntent(
  lockId: string,
  amountInCents: number,
) {
  try {
    await connectToDb();

    // Verify that a valid, unexpired holding lock exists before capturing charges
    const activeLock = await BookingLock.findOne({
      _id: lockId,
      expires_at: { $gt: new Date() },
    });

    if (!activeLock) {
      throw new Error(
        "Reservation window expired or invalid. Please select another slot.",
      );
    }

    // Initialize Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "aud",
      metadata: {
        lock_id: lockId,
        user_id: activeLock.user_id?.toString() || "",
        service_id: activeLock.service_id?.toString() || "",
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error: any) {
    console.error("Stripe Booking Intent Generation Error:", error);
    throw new Error(
      error.message || "Failed to initialize payment gateway parameters.",
    );
  }
}
