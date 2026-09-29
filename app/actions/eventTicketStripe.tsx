"use server";

import {
  priceEventTickets,
  type CartItemInput,
  type PricedItem,
  type EventTicketPricing,
} from "@/server/lib/eventTicketPricing";

export type { PricedItem, EventTicketPricing };

export async function getEventTicketPaymentIntent(
  eventId: string,
  cartItems: CartItemInput[],
  promoCode?: string,
  existingInvoiceNumber?: string,
  previousPaymentIntentId?: string,
): Promise<EventTicketPricing> {
  return priceEventTickets(
    eventId,
    cartItems,
    promoCode,
    existingInvoiceNumber,
    previousPaymentIntentId,
  );
}
