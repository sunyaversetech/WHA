import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDb } from "@/lib/db";
import crypto from "crypto";
import Stripe from "stripe";
import Event from "@/server/models/Event.model";
import { EventTicketPurchase } from "@/server/models/EventTicketPurchase.model";
import { TicketHold } from "@/server/models/TicketHold.model";
import { sendMultiTierEventTicketEmail } from "@/lib/mail";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const SERVICE_FEE_PER_TICKET = 2.0;
const SURCHARGE_PERCENT = 0.025;

function toTicketResponse(purchase: any) {
  return {
    success: true,
    invoiceNumber: purchase.invoiceNumber,
    items: purchase.items.map((i: any) => ({
      optionName: i.optionName,
      codes: i.uniqueKeys,
    })),
  };
}

export async function POST(req: Request) {
  let paymentIntentId: string | undefined;

  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { eventId } = body;
    paymentIntentId = body.paymentIntentId;

    if (!eventId || !paymentIntentId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Idempotency: if this payment was already finalized, return the same tickets.
    const existingPurchase = await EventTicketPurchase.findOne({
      paymentIntentId,
    });
    if (existingPurchase) {
      return NextResponse.json(toTicketResponse(existingPurchase));
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
              user: session.user.id,
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
      session.user.email!,
      event.title,
      createdPurchase.items.map((i: any) => ({
        optionName: i.optionName,
        codes: i.uniqueKeys,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      session.user.name!,
      {
        ticketTotal: createdPurchase.ticketTotal,
        serviceFee: createdPurchase.serviceFee,
        surcharge: createdPurchase.surcharge,
        totalAmount: createdPurchase.totalAmount,
        promoCode: createdPurchase.promoCode,
        invoiceNumber: createdPurchase.invoiceNumber,
      },
    );

    return NextResponse.json(toTicketResponse(createdPurchase));
  } catch (error: any) {
    if (error.code === 11000 && paymentIntentId) {
      const existing = await EventTicketPurchase.findOne({ paymentIntentId });
      if (existing) {
        return NextResponse.json(toTicketResponse(existing));
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
