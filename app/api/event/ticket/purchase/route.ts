import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import { EventTicketPurchase } from "@/server/models/EventTicketPurchase.model";
import { attachAutoLoginCookie, findOrCreateGuestUser } from "@/server/lib/guestAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAuthUser } from "@/server/lib/getAuthUser";
import { finalizeEventTicketPurchase } from "@/server/lib/eventTicketFinalize";

// `eventDoc` is the populated Event document (either passed in already-loaded
// during the main flow, or attached via `.populate("event")` on the two
// existing-purchase lookups) — used only to build the `receipt` payload that
// lets a guest's post-payment receipt page render without a second,
// unauthenticated fetch.
function toTicketResponse(
  purchase: any,
  eventDoc?: any,
  signedIn = false,
  holderName?: string,
) {
  return {
    success: true,
    purchaseId: purchase._id.toString(),
    invoiceNumber: purchase.invoiceNumber,
    items: purchase.items.map((i: any) => ({
      optionName: i.optionName,
      codes: i.uniqueKeys,
    })),
    signedIn,
    receipt: eventDoc
      ? {
          holderName: holderName || "Ticket Holder",
          event: {
            title: eventDoc.title,
            image: eventDoc.image,
            venue: eventDoc.venue,
            location: eventDoc.location,
            dateRange: eventDoc.dateRange,
            latitude: eventDoc.latitude,
            longitude: eventDoc.longitude,
            slug: eventDoc.slug,
            startTime: eventDoc.startTime,
            endTime: eventDoc.endTime,
          },
          items: purchase.items.map((i: any) => ({
            optionName: i.optionName,
            uniqueKeys: i.uniqueKeys,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          invoiceNumber: purchase.invoiceNumber,
          ticketTotal: purchase.ticketTotal,
          serviceFee: purchase.serviceFee,
          surcharge: purchase.surcharge,
          totalAmount: purchase.totalAmount,
          promoCode: purchase.promoCode,
          createdAt: purchase.createdAt,
        }
      : undefined,
  };
}

export async function POST(req: Request) {
  let paymentIntentId: string | undefined;

  try {
    await connectToDb();
    // Web session cookie or mobile bearer token — guests (neither) are still
    // allowed through to the guestInfo branch below.
    const authUser = await getAuthUser(req);
    // A NextAuth session cookie is meaningless to a mobile client and must never
    // be attached to a mobile response — the mobile app has no cookie jar backing
    // it into a session the way a browser does, so setting one here would be
    // pure dead weight at best. Detected via either signal a mobile caller sends:
    // an explicit X-Client header, or (since web never sends one) a bearer token.
    const isMobileClient =
      req.headers.get("x-client")?.toLowerCase() === "mobile" ||
      !!(req.headers.get("authorization") ?? req.headers.get("Authorization"))?.startsWith(
        "Bearer ",
      );

    const body = await req.json();
    const { eventId } = body;
    paymentIntentId = body.paymentIntentId;

    if (!eventId || !paymentIntentId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Idempotency: if this payment was already finalized, return the same
    // tickets. This must run BEFORE we require any identity info — a retry
    // (e.g. after a lost session forced the client to re-collect guest info)
    // must not fail just because that retry no longer has the original
    // session, once the purchase already exists. This also covers the case
    // where the Stripe webhook's payment_intent.succeeded handler already
    // finalized this same purchase (e.g. the browser tab or app closed right
    // after paying) — whichever of the two got there first wins, this just
    // returns its result.
    const existingPurchase = await EventTicketPurchase.findOne({
      paymentIntentId,
    }).populate("event");
    if (existingPurchase) {
      return NextResponse.json(
        toTicketResponse(existingPurchase, existingPurchase.event),
      );
    }

    // Not signed in — check out as a guest. The purchase is attached to an
    // account found/created from their email; we only auto-sign them into
    // it if that account has no password (a genuine guest or Google-only
    // account), never into an existing password-protected account someone
    // else's email might belong to.
    let buyer: any;
    let canAutoSignIn = false;

    if (authUser) {
      buyer = {
        _id: authUser.id,
        email: authUser.email,
        name: authUser.name,
      };
    } else {
      const guestInfo = body.guestInfo as
        | { name?: string; email?: string; phone?: string }
        | undefined;
      const guestName = guestInfo?.name?.trim();
      const guestEmail = guestInfo?.email?.trim().toLowerCase();
      const guestPhone = guestInfo?.phone?.trim();

      if (!guestName || !guestEmail || !guestPhone) {
        return NextResponse.json(
          {
            error:
              "Name, email and phone number are required to check out as a guest",
            code: "GUEST_INFO_REQUIRED",
          },
          { status: 400 },
        );
      }

      const guestResult = await findOrCreateGuestUser({
        name: guestName,
        email: guestEmail,
        phone: guestPhone,
      });
      buyer = guestResult.user;
      canAutoSignIn = guestResult.canAutoSignIn;
    }

    const outcome = await finalizeEventTicketPurchase(eventId, paymentIntentId, buyer);
    if (!outcome.ok) {
      return NextResponse.json(
        { error: outcome.error, ...(outcome.code ? { code: outcome.code } : {}) },
        { status: outcome.status },
      );
    }
    const { purchase: createdPurchase, event } = outcome;

    // The purchase is fully committed and the ticket email is already sent
    // at this point — auto-login is a convenience on top, not part of the
    // sale. It must never be allowed to turn an already-successful purchase
    // into an error response, so any failure here is logged and swallowed
    // rather than thrown. Mobile never gets this cookie — see isMobileClient.
    if (canAutoSignIn && !isMobileClient) {
      try {
        const response = NextResponse.json(
          toTicketResponse(createdPurchase, event, true, buyer.name),
        );
        await attachAutoLoginCookie(response, buyer);
        return response;
      } catch (autoLoginError) {
        console.error("Guest auto-login failed:", autoLoginError);
      }
    }
    return NextResponse.json(
      toTicketResponse(createdPurchase, event, false, buyer.name),
    );
  } catch (error: any) {
    if (error.code === 11000 && paymentIntentId) {
      const existing = await EventTicketPurchase.findOne({
        paymentIntentId,
      }).populate("event");
      if (existing) {
        return NextResponse.json(toTicketResponse(existing, existing.event));
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    const query: Record<string, string> = { business: session.user.id };
    if (eventId) query.event = eventId;

    const purchases = await EventTicketPurchase.find(query)
      .populate("event")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ data: purchases }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
