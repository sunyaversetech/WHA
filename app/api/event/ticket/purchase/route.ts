import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDb } from "@/lib/db";
import crypto from "crypto";
import Stripe from "stripe";
import Event from "@/server/models/Event.model";
import User from "@/server/models/Auth.model";
import { EventTicketPurchase } from "@/server/models/EventTicketPurchase.model";
import { TicketHold } from "@/server/models/TicketHold.model";
import { sendMultiTierEventTicketEmail } from "@/lib/mail";
import { attachAutoLoginCookie } from "@/server/lib/guestAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const SERVICE_FEE_PER_TICKET = 2.0;
const SURCHARGE_PERCENT = 0.025;

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
    const session = await getServerSession(authOptions);

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
    // session, once the purchase already exists.
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

    if (session?.user) {
      buyer = {
        _id: session.user.id,
        email: session.user.email,
        name: session.user.name,
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

      const existingUser = await User.findOne({ email: guestEmail });
      if (existingUser) {
        buyer = existingUser;
        canAutoSignIn = !existingUser.password;
        if (!existingUser.phone_number) {
          existingUser.phone_number = guestPhone;
          await existingUser.save();
        }
      } else {
        buyer = await User.create({
          name: guestName,
          email: guestEmail,
          phone_number: guestPhone,
          category: "user",
          provider: "guest",
        });
        canAutoSignIn = true;
      }
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment not verified" },
        { status: 400 },
      );
    }

    if (paymentIntent.metadata.eventId !== eventId) {
      return NextResponse.json({ error: "Event mismatch" }, { status: 400 });
    }

    let cartItems: { optionId: string; quantity: number }[] = [];
    try {
      cartItems = JSON.parse(paymentIntent.metadata.items || "[]");
    } catch {
      cartItems = [];
    }
    if (!cartItems.length) {
      return NextResponse.json(
        { error: "No tickets found on this payment" },
        { status: 400 },
      );
    }
    const promoCode = paymentIntent.metadata.promoCode || "";
    const invoiceNumber = paymentIntent.metadata.invoiceNumber;
    if (!invoiceNumber) {
      return NextResponse.json(
        { error: "Missing invoice reference on this payment" },
        { status: 400 },
      );
    }

    const event = await Event.findById(eventId).populate("user");
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 400 });
    }

    const totalQuantity = cartItems.reduce((sum, c) => sum + c.quantity, 0);
    const maxPerRequest = event.max_tickets_per_request || 10;
    if (totalQuantity > maxPerRequest) {
      return NextResponse.json(
        {
          error: `You can book a maximum of ${maxPerRequest} tickets per request`,
        },
        { status: 400 },
      );
    }

    const eventNameSlug = (event.title || "event")
      .trim()
      .replace(/\s+/g, "-")
      .toUpperCase();

    // Re-derive pricing server-side from the current event/options data —
    // never trust client-supplied amounts.
    let matchedPromo: any = null;
    if (promoCode) {
      matchedPromo = (event.promo_codes || []).find(
        (p: any) => p.code && p.code.trim().toLowerCase() === promoCode,
      );
      if (!matchedPromo) {
        return NextResponse.json(
          { error: "Promo code is not valid" },
          { status: 400 },
        );
      }
      if (
        matchedPromo.limit != null &&
        (matchedPromo.used || 0) >= matchedPromo.limit
      ) {
        return NextResponse.json(
          { error: "Promo code usage limit has been reached" },
          { status: 400 },
        );
      }
    }
    const promoEntered = !!matchedPromo;
    const discountPercent = matchedPromo?.discount_percentage || 0;

    const pricedItems = cartItems.map(({ optionId, quantity }) => {
      const option = event.options?.id(optionId);
      if (!option) throw new Error("Ticket option not found");

      // A promo code with no applicable_options discounts every ticket type;
      // otherwise it only discounts the ticket types it was assigned to.
      const appliesHere =
        promoEntered &&
        (!matchedPromo.applicable_options?.length ||
          matchedPromo.applicable_options.includes(option.name));

      const originalPrice = option.price || 0;
      const unitPrice = appliesHere
        ? originalPrice * (1 - discountPercent / 100)
        : originalPrice;

      return { optionId, unitPrice, quantity, discounted: appliesHere };
    });

    // Reflects whether the promo actually discounted something in this cart,
    // not just whether a valid code was entered.
    const promoApplied = pricedItems.some((p) => p.discounted);

    const ticketTotal = pricedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const serviceFee = totalQuantity * SERVICE_FEE_PER_TICKET;
    const orderTotal = ticketTotal + serviceFee;
    const surcharge = orderTotal * SURCHARGE_PERCENT;
    const expectedAmount = Math.round((orderTotal + surcharge) * 100);
    if (paymentIntent.amount !== expectedAmount) {
      return NextResponse.json(
        { error: "Payment amount mismatch" },
        { status: 400 },
      );
    }

    const today = new Date().toISOString().split("T")[0];

    // Reserve per-option stock and create the purchase record atomically, so
    // a failure partway through can never leak inventory or leave an orphan.
    let createdPurchase: any;
    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        const freshEvent = await Event.findById(eventId).session(dbSession);
        // The checkout hold already reserved this capacity — consume it
        // rather than re-checking raw capacity. If it's missing (expired
        // right as payment completed), fall back to a raw capacity check
        // so a successful charge is never left without tickets.
        const hold = await TicketHold.findOne({ paymentIntentId }).session(
          dbSession,
        );
        const itemsForPurchase: any[] = [];
        const allKeys: string[] = [];

        for (const { optionId, quantity } of cartItems) {
          const option = freshEvent.options?.id(optionId);
          if (!option) throw new Error("OPTION_NOT_FOUND");

          if (option.release_date && option.release_date > today) {
            throw new Error("NOT_RELEASED");
          }
          if (option.close_date && option.close_date < today) {
            throw new Error("CLOSED");
          }

          if (hold) {
            option.held = Math.max(0, (option.held || 0) - quantity);
          } else {
            const remaining =
              option.capacity != null
                ? option.capacity - (option.sold || 0)
                : null;
            if (remaining !== null && quantity > remaining) {
              throw new Error("SOLD_OUT");
            }
          }

          option.sold = (option.sold || 0) + quantity;

          const uniqueKeys = Array.from(
            { length: quantity },
            () =>
              `WHA-${eventNameSlug}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
          );
          allKeys.push(...uniqueKeys);

          const priced = pricedItems.find((p) => p.optionId === optionId)!;
          itemsForPurchase.push({
            optionId,
            optionName: option.name,
            quantity,
            unitPrice: priced.unitPrice,
            uniqueKeys,
          });
        }

        if (promoApplied) {
          const freshPromo = freshEvent.promo_codes?.find(
            (p: any) => p.code && p.code.trim().toLowerCase() === promoCode,
          );
          if (!freshPromo) throw new Error("PROMO_NOT_FOUND");
          if (
            freshPromo.limit != null &&
            (freshPromo.used || 0) >= freshPromo.limit
          ) {
            throw new Error("PROMO_LIMIT_REACHED");
          }
          freshPromo.used = (freshPromo.used || 0) + 1;
        }

        await freshEvent.save({ session: dbSession });

        if (hold) {
          await TicketHold.deleteOne({ _id: hold._id }).session(dbSession);
        }

        const created = await EventTicketPurchase.create(
          [
            {
              event: eventId,
              user: buyer._id,
              business: event.user._id,
              items: itemsForPurchase,
              uniqueKeys: allKeys,
              promoCode: promoApplied ? promoCode : undefined,
              invoiceNumber,
              ticketTotal,
              serviceFee,
              surcharge,
              totalAmount: paymentIntent.amount / 100,
              paymentIntentId,
              status: "pending",
            },
          ],
          { session: dbSession },
        );
        createdPurchase = created[0];
      });
    } catch (txError: any) {
      if (
        ["OPTION_NOT_FOUND", "NOT_RELEASED", "CLOSED", "SOLD_OUT"].includes(
          txError.message,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "One or more selected tickets are no longer available. Please contact support for a refund.",
          },
          { status: 400 },
        );
      }
      if (
        ["PROMO_NOT_FOUND", "PROMO_LIMIT_REACHED"].includes(txError.message)
      ) {
        return NextResponse.json(
          {
            error:
              "The promo code is no longer available. Please contact support for a refund.",
          },
          { status: 400 },
        );
      }
      throw txError;
    } finally {
      await dbSession.endSession();
    }

    await sendMultiTierEventTicketEmail(
      buyer.email!,
      event.title,
      createdPurchase.items.map((i: any) => ({
        optionName: i.optionName,
        codes: i.uniqueKeys,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      buyer.name!,
      {
        ticketTotal: createdPurchase.ticketTotal,
        serviceFee: createdPurchase.serviceFee,
        surcharge: createdPurchase.surcharge,
        totalAmount: createdPurchase.totalAmount,
        promoCode: createdPurchase.promoCode,
        invoiceNumber: createdPurchase.invoiceNumber,
      },
    );

    // The purchase is fully committed and the ticket email is already sent
    // at this point — auto-login is a convenience on top, not part of the
    // sale. It must never be allowed to turn an already-successful purchase
    // into an error response, so any failure here is logged and swallowed
    // rather than thrown.
    if (canAutoSignIn) {
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
