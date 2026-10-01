import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Stripe from "stripe";
import { connectToDb } from "@/lib/db";
import { BookingLock } from "@/server/models/BookingLock.model";
import Booking from "@/server/models/Booking.model";
import { EventTicketPurchase } from "@/server/models/EventTicketPurchase.model";
import { TicketHold } from "@/server/models/TicketHold.model";
import User from "@/server/models/Auth.model";
import { finalizeEventTicketPurchase } from "@/server/lib/eventTicketFinalize";

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

  // Safety net for event ticket purchases: the client normally finalizes the sale
  // itself right after Stripe confirms payment (POST /api/event/ticket/purchase),
  // but if the browser tab or app closes/crashes/loses connectivity in that
  // gap, the charge would otherwise succeed with no tickets ever created.
  // This runs the exact same
  // finalize logic (server/lib/eventTicketFinalize.ts) so whichever of the two
  // paths gets there first wins — EventTicketPurchase.paymentIntentId is unique,
  // so the loser's create() just hits E11000 and is treated as already-done.
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const eventId = paymentIntent.metadata?.eventId;

    // Only metadata shaped like an event-ticket PaymentIntent (set by
    // priceEventTickets, called by both the web Server Action and the mobile
    // price route) is handled here — anything else (deals, bookings) is left
    // alone, exactly as before this handler existed.
    if (eventId) {
      await connectToDb();
      try {
        const already = await EventTicketPurchase.findOne({
          paymentIntentId: paymentIntent.id,
        });
        if (already) {
          return NextResponse.json({ received: true });
        }

        // Buyer identity for this safety net can only come from the ticket hold
        // recorded at checkout time (set for any signed-in buyer, web or
        // mobile — see app/api/event/ticket/hold/route.ts). A guest checkout's
        // name/email/phone is only ever submitted in the /purchase request body
        // itself, which this webhook never receives, so a guest purchase that
        // never reaches /purchase cannot be finalized here — it's logged, not
        // silently dropped, and remains a real (documented, not yet solved)
        // gap for that one case.
        const hold = await TicketHold.findOne({ paymentIntentId: paymentIntent.id });
        if (!hold?.user) {
          console.warn(
            `payment_intent.succeeded ${paymentIntent.id}: no signed-in buyer on record (guest checkout or hold already gone) — cannot finalize via webhook, relying on the client's own /purchase call.`,
          );
          return NextResponse.json({ received: true });
        }

        const user = await User.findById(hold.user);
        if (!user) {
          console.warn(
            `payment_intent.succeeded ${paymentIntent.id}: hold.user ${hold.user} no longer resolves to a user — cannot finalize via webhook.`,
          );
          return NextResponse.json({ received: true });
        }

        const outcome = await finalizeEventTicketPurchase(eventId, paymentIntent.id, {
          _id: user._id.toString(),
          email: user.email,
          name: user.name,
        });
        if (!outcome.ok) {
          console.error(
            `payment_intent.succeeded ${paymentIntent.id}: webhook finalize rejected — ${outcome.error}`,
          );
        } else {
          console.log(
            `payment_intent.succeeded ${paymentIntent.id}: finalized via webhook safety net for user ${user._id}.`,
          );
        }
      } catch (err: any) {
        if (err.code === 11000) {
          // The client's own /purchase call won the race and already created
          // this purchase — nothing to do.
        } else {
          console.error("Webhook event-ticket finalize error:", err);
        }
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
