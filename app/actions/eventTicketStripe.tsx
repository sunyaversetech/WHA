"use server";

import Stripe from "stripe";
import { connectToDb } from "@/lib/db";
import Event from "@/server/models/Event.model";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const SERVICE_FEE_FLAT = 5.0;
const SURCHARGE_PERCENT = 0.025;

export async function getEventTicketPaymentIntent(
  eventId: string,
  quantity: number,
) {
  try {
    await connectToDb();
    const event = await Event.findById(eventId);
    if (!event) throw new Error("Event not found");
    if (event.price_category !== "paid") {
      throw new Error("This event is not a paid event");
    }

    const price = event.ticket_price || 0;
    if (!price) throw new Error("This event has no ticket price set");

    if (quantity < 1) throw new Error("Quantity must be at least 1");

    const remaining = event.max_quantity
      ? event.max_quantity - (event.sold_quantity || 0)
      : null;
    if (remaining !== null && quantity > remaining) {
      throw new Error(`Only ${Math.max(remaining, 0)} ticket(s) remaining`);
    }

    const ticketTotal = price * quantity;
    const orderTotal = ticketTotal + SERVICE_FEE_FLAT;
    const surcharge = orderTotal * SURCHARGE_PERCENT;
    const totalToPay = orderTotal + surcharge;

    const amountInCents = Math.round(totalToPay * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "aud",
      metadata: {
        eventId,
        quantity: quantity.toString(),
        unitPrice: price.toFixed(2),
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      totalAmount: totalToPay,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
}
