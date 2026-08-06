"use server";

import Stripe from "stripe";
import { connectToDb } from "@/lib/db";
import Event from "@/server/models/Event.model";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const SERVICE_FEE_FLAT = 5.0;
const SURCHARGE_PERCENT = 0.025;

type CartItemInput = { optionId: string; quantity: number };

export type PricedItem = {
  optionId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  discounted: boolean;
};

export type EventTicketPricing = {
  clientSecret: string;
  paymentIntentId: string;
  items: PricedItem[];
  ticketTotal: number;
  serviceFee: number;
  surcharge: number;
  totalToPay: number;
  promoApplied: boolean;
};

export async function getEventTicketPaymentIntent(
  eventId: string,
  cartItems: CartItemInput[],
  promoCode?: string,
): Promise<EventTicketPricing> {
  try {
    await connectToDb();
    const event = await Event.findById(eventId);
    if (!event) throw new Error("Event not found");
    if (event.price_category !== "paid") {
      throw new Error("This event is not a paid event");
    }
    if (!cartItems || cartItems.length === 0) {
      throw new Error("Select at least one ticket");
    }

    const today = new Date().toISOString().split("T")[0];
    const normalizedPromo = promoCode?.trim().toLowerCase() || "";

    let promoApplied = false;
    const items: PricedItem[] = cartItems.map(({ optionId, quantity }) => {
      if (quantity < 1) throw new Error("Quantity must be at least 1");

      const option = event.options?.id(optionId);
      if (!option) throw new Error("Ticket option not found");

      if (option.release_date && option.release_date > today) {
        throw new Error(`${option.name} is not released yet`);
      }
      if (option.close_date && option.close_date < today) {
        throw new Error(`${option.name} is no longer available`);
      }

      const remaining =
        option.capacity != null ? option.capacity - (option.sold || 0) : null;
      if (remaining !== null && quantity > remaining) {
        throw new Error(
          `Only ${Math.max(remaining, 0)} ${option.name} ticket(s) remaining`,
        );
      }

      const originalPrice = option.price || 0;
      const codeMatches =
        !!normalizedPromo &&
        !!option.promo_code &&
        option.promo_code.trim().toLowerCase() === normalizedPromo;
      const unitPrice = codeMatches
        ? originalPrice * (1 - (option.discount_percentage || 0) / 100)
        : originalPrice;
      if (codeMatches) promoApplied = true;

      return {
        optionId,
        name: option.name,
        quantity,
        unitPrice,
        originalPrice,
        discounted: codeMatches,
      };
    });

    if (normalizedPromo && !promoApplied) {
      throw new Error("Promo code is not valid for the selected tickets");
    }

    const ticketTotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const orderTotal = ticketTotal + SERVICE_FEE_FLAT;
    const surcharge = orderTotal * SURCHARGE_PERCENT;
    const totalToPay = orderTotal + surcharge;
    const amountInCents = Math.round(totalToPay * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "aud",
      metadata: {
        eventId,
        items: JSON.stringify(
          items.map((i) => ({ optionId: i.optionId, quantity: i.quantity })),
        ),
        promoCode: normalizedPromo,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret as string,
      paymentIntentId: paymentIntent.id,
      items,
      ticketTotal,
      serviceFee: SERVICE_FEE_FLAT,
      surcharge,
      totalToPay,
      promoApplied,
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
}
