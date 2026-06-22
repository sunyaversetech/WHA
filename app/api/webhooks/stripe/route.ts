import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Stripe from "stripe";
import { connectToDb } from "@/lib/db";
import { BookingLock } from "@/server/models/BookingLock.model";
import Booking from "@/server/models/Booking.model";

// Initialize Stripe with your verified version typing
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20", // Matches your general modern structural workspace configurations
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`❌ Webhook Signature Verification Failed: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook Verification Error: ${err.message}` },
      { status: 400 },
    );
  }

  // Handle successful execution pipeline hooks
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const lock_id = session.metadata?.lock_id;

    if (!lock_id) {
      console.error(
        `⚠️ Missing lock_id inside metadata payload for Stripe Session: ${session.id}`,
      );
      return NextResponse.json({ received: true });
    }

    await connectToDb();
    const dbSession = await mongoose.startSession();

    try {
      await dbSession.withTransaction(async () => {
        // 1. Fetch current structural locked parameters
        const lock = await BookingLock.findById(lock_id).session(dbSession);
        if (!lock) {
          console.warn(
            `🔒 Booking lock ${lock_id} not found. Already processed or expired.`,
          );
          return;
        }

        // 2. Insert absolute booking confirmation row details
        await Booking.create(
          [
            {
              user_id: lock.user_id,
              business_id: lock.business_id,
              service_id: lock.service_id,
              employee_id: lock.employee_id,
              start_time: lock.start_time,
              end_time: lock.end_time,
              inventory_quantity: lock.inventory_quantity || 1,
              status: "confirmed",
              payment_status: "paid",
              stripe_session_id: session.id,
              payment_intent_id: session.payment_intent as string,
            },
          ],
          { session: dbSession },
        );

        // 3. Delete temporary resource holding lock block allocation
        await BookingLock.findByIdAndDelete(lock_id).session(dbSession);
        console.log(
          `✅ Lock ${lock_id} successfully promoted to Active Booking.`,
        );
      });
    } catch (txError: any) {
      console.error(
        "❌ Database Transaction Error while executing webhook:",
        txError,
      );
      return NextResponse.json(
        { error: "Booking execution failed" },
        { status: 500 },
      );
    } finally {
      await dbSession.endSession();
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
