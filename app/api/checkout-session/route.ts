import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lock_id, success_url, cancel_url, items } = body;

    if (!lock_id) {
      return NextResponse.json(
        { message: "Missing required temporary lock reference ID." },
        { status: 400 },
      );
    }

    const lineItems = [];
    let calculatedTotalPrice = 0;

    for (const item of items) {
      const basePrice = 50.0;
      const serviceName = "Treatment Block";

      const unitMultiplier = item.multiplier || 1;
      const quantityUnits = item.quantity || 1;
      const computedCalculatedCost = basePrice * unitMultiplier;

      calculatedTotalPrice += computedCalculatedCost * quantityUnits;

      lineItems.push({
        price_data: {
          currency: "aud",
          product_data: {
            name: serviceName,
            description: `${unitMultiplier > 1 ? `Extended Session (×${unitMultiplier} blocks)` : "Standard Session"}`,
          },
          unit_amount: Math.round(computedCalculatedCost * 100), // Stripe processes amounts strictly in cents
        },
        quantity: quantityUnits,
      });
    }

    // 3. Instantiate the secure Stripe checkout gateway session parameters
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: success_url,
      cancel_url: cancel_url,
      // Metadata allows webhooks to confidently save records when checking event logs later
      metadata: {
        lock_id: lock_id,
        items_payload: JSON.stringify(items),
        start_time: body.start_time,
        employee_id: body.employee_id || "",
      },
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (error: any) {
    console.error("Fatal checkout session routing error:", error);
    return NextResponse.json(
      {
        message:
          error.message || "Failed to initialize standard checkout session.",
      },
      { status: 500 },
    );
  }
}
