import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDb } from "@/lib/db";
import crypto from "crypto";
import Stripe from "stripe";
import Event from "@/server/models/Event.model";
import { EventTicketPurchase } from "@/server/models/EventTicketPurchase.model";
import { sendEventMultipleTicketEmail } from "@/lib/mail";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const SURCHARGE_PERCENT = 0.025;

export async function POST(req: Request) {
  let paymentIntentId: string | undefined;

  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { eventId, quantity } = body;
    paymentIntentId = body.paymentIntentId;

    if (!eventId || !quantity || !paymentIntentId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Idempotency: if this payment was already finalized, return the same codes.
    const existingPurchase = await EventTicketPurchase.findOne({
      paymentIntentId,
    });
    if (existingPurchase) {
      return NextResponse.json({
        success: true,
        codes: existingPurchase.uniqueKeys,
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment not verified" },
        { status: 400 },
      );
    }

    const paidQuantity = parseInt(paymentIntent.metadata.quantity || "0");
    if (paidQuantity !== quantity) {
      return NextResponse.json(
        { error: "Quantity mismatch - payment verification failed" },
        { status: 400 },
      );
    }

    const event = await Event.findById(eventId).populate("user");
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 400 });
    }

    const unitPrice = event.ticket_price || 0;
    const expectedAmount = Math.round(
      (unitPrice * paidQuantity + unitPrice * paidQuantity * SURCHARGE_PERCENT) *
        100,
    );
    if (paymentIntent.amount !== expectedAmount) {
      return NextResponse.json(
        { error: "Payment amount mismatch" },
        { status: 400 },
      );
    }

    const uniqueKeys = Array.from(
      { length: paidQuantity },
      (_, i) =>
        `WHA-EVT-${crypto.randomBytes(4).toString("hex").toUpperCase()}-${i + 1}of${paidQuantity}`,
    );

    // Reserve stock and create the purchase record atomically, so a failure
    // partway through can never leak inventory or leave an orphaned purchase.
    let createdPurchase;
    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        if (event.max_quantity) {
          const updatedEvent = await Event.findOneAndUpdate(
            {
              _id: eventId,
              sold_quantity: { $lte: event.max_quantity - paidQuantity },
            },
            { $inc: { sold_quantity: paidQuantity } },
            { new: true, session: dbSession },
          );
          if (!updatedEvent) {
            throw new Error("SOLD_OUT");
          }
        } else {
          await Event.findByIdAndUpdate(
            eventId,
            { $inc: { sold_quantity: paidQuantity } },
            { session: dbSession },
          );
        }

        const created = await EventTicketPurchase.create(
          [
            {
              event: eventId,
              user: session.user.id,
              business: event.user._id,
              quantity: paidQuantity,
              unitPrice,
              serviceFee: unitPrice * paidQuantity * SURCHARGE_PERCENT,
              totalAmount: paymentIntent.amount / 100,
              uniqueKeys,
              paymentIntentId,
              status: "pending",
            },
          ],
          { session: dbSession },
        );
        createdPurchase = created[0];
      });
    } catch (txError: any) {
      if (txError.message === "SOLD_OUT") {
        return NextResponse.json(
          {
            error:
              "Not enough tickets left. Please contact support for a refund.",
          },
          { status: 400 },
        );
      }
      throw txError;
    } finally {
      await dbSession.endSession();
    }

    await sendEventMultipleTicketEmail(
      session.user.email!,
      event.title,
      uniqueKeys,
      session.user.name!,
    );

    return NextResponse.json({
      success: true,
      codes: createdPurchase!.uniqueKeys,
    });
  } catch (error: any) {
    if (error.code === 11000 && paymentIntentId) {
      const existing = await EventTicketPurchase.findOne({ paymentIntentId });
      if (existing) {
        return NextResponse.json({
          success: true,
          codes: existing.uniqueKeys,
        });
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
