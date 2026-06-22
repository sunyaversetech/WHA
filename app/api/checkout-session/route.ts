import { NextResponse } from "next/server";
import Stripe from "stripe";
import { BookingLock } from "@/server/models/BookingLock.model"; // Ensure path matches your structure

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lock_id, success_url, cancel_url, items } = body;

    if (!lock_id) {
      return NextResponse.json(
        { success: false, message: "Missing required lock ID reference." },
        { status: 400 },
      );
    }

    // Optional: Verify the lock still exists before sending to Stripe
    const existingLock = await BookingLock.findById(lock_id);
    if (!existingLock) {
      return NextResponse.json(
        { success: false, message: "Lock session has already expired." },
        { status: 410 },
      );
    }

    const lineItems = [];
    for (const item of items) {
      const basePrice = 50.0; // Replace with your service db price logic if dynamic
      const unitMultiplier = item.multiplier || 1;
      const quantityUnits = item.quantity || 1;
      const computedCost = basePrice * unitMultiplier;

      lineItems.push({
        price_data: {
          currency: "aud",
          product_data: {
            name: "Treatment Block",
            description:
              unitMultiplier > 1
                ? `Extended Session (×${unitMultiplier})`
                : "Standard Session",
          },
          unit_amount: Math.round(computedCost * 100), // Stripe takes integer cents
        },
        quantity: quantityUnits,
      });
    }

    // Pack details into metadata to send to the Webhook later
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url,
      cancel_url,
      metadata: {
        lock_id: lock_id,
        business_id: existingLock.business_id,
        user_id: existingLock.user_id,
        service_id: existingLock.service_id.toString(),
        employee_id: existingLock.employee_id
          ? existingLock.employee_id.toString()
          : "",
        start_time: existingLock.start_time.toISOString(),
        end_time: existingLock.end_time.toISOString(),
        items_payload: JSON.stringify(items),
      },
    });

    return NextResponse.json({
      success: true,
      data: { success: true, url: session.url },
    });
  } catch (error: any) {
    console.error("Checkout Session API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
