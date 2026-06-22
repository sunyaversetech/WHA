import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { BookingLock } from "@/server/models/BookingLock.model";
import Booking from "@/server/models/Booking.model";
// import { Booking } from "@/server/models/Booking.model"; // Import your primary Booking model

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    console.error(`Signature verification failed: ${err.message}`);
    return NextResponse.json(
      { message: "Webhook Signature Rejected" },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const {
      lock_id,
      business_id,
      user_id,
      service_id,
      employee_id,
      start_time,
      end_time,
      items_payload,
    } = session.metadata || {};

    try {
      console.log(
        `Payment confirmed for user ${user_id}. Creating official booking...`,
      );
      await Booking.create({
        stripe_session_id: session.id,
        business_id,
        user_id,
        service_id,
        employee_id: employee_id || null,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        items: items_payload ? JSON.parse(items_payload) : [],
        payment_status: "paid",
        status: "confirmed",
      });

      if (lock_id) {
        await BookingLock.findByIdAndDelete(lock_id);
        console.log(`BookingLock ${lock_id} cleaned up successfully.`);
      }
    } catch (error) {
      console.error(
        "Error committing booking inside webhook execution lifecycle:",
        error,
      );
      return NextResponse.json(
        { message: "Internal DB Error on confirmation" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ received: true });
}
