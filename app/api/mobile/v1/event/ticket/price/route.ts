import { NextRequest } from "next/server";
import { priceEventTickets } from "@/server/lib/eventTicketPricing";
import { getAuthUser } from "@/server/lib/getAuthUser";
import { mobileOk, mobileError } from "@/server/lib/mobileResponse";
import { checkTicketPriceLimit } from "@/server/lib/mobileRateLimit";

/**
 * Mobile equivalent of the getEventTicketPaymentIntent Server Action (web) — same
 * underlying priceEventTickets logic, so pricing is byte-identical between web and
 * mobile. Guests are explicitly allowed (pricing itself is buyer-agnostic — identity
 * is only attached later at POST /api/event/ticket/purchase, which already handles
 * both web sessions and mobile bearer tokens). getAuthUser is called here mainly so
 * the rate limiter can key by user id when known, same principle proxy.ts uses.
 * The server always re-derives every price from the event's live data — nothing
 * priced here is ever taken from the client's own numbers.
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);

    const allowed = await checkTicketPriceLimit(req, authUser?.id ?? null);
    if (!allowed) {
      return mobileError("Too many requests. Please slow down.", 429);
    }

    const body = await req.json().catch(() => null);
    const { eventId, items, promoCode, previousPaymentIntentId } = body ?? {};

    if (!eventId || !Array.isArray(items) || items.length === 0) {
      return mobileError("eventId and at least one item are required", 400);
    }

    const pricing = await priceEventTickets(
      eventId,
      items,
      promoCode,
      undefined,
      previousPaymentIntentId,
    );

    return mobileOk(pricing);
  } catch (error: any) {
    return mobileError(error.message || "Internal Server Error", 400);
  }
}
