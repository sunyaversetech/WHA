"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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
  // Needed only so priceEventTickets can verify a previousPaymentIntentId's hold
  // actually belongs to the caller before releasing it — read-only, this never
  // touches app/api/auth/[...nextauth]/route.ts.
  const session = await getServerSession(authOptions);
  return priceEventTickets(
    eventId,
    cartItems,
    promoCode,
    existingInvoiceNumber,
    previousPaymentIntentId,
    (session?.user as any)?.id ?? null,
  );
}
