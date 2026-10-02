import { connectToDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAuthUserDetailed, bearerRejectionResponse } from "@/server/lib/getAuthUser";
import { sendEventTicketEmail } from "@/lib/mail";
import crypto from "crypto";
import Event from "@/server/models/Event.model";
import { EventRedemption } from "@/server/models/EventCodeRemtion.model";

export async function POST(request: NextRequest) {
  let eventId: string | undefined;
  let capacityReserved = false;
  let authUserId: string | undefined;

  try {
    const authResult = await getAuthUserDetailed(request);
    if (!authResult.user) {
      if (authResult.viaBearer) {
        return bearerRejectionResponse(authResult.reason, "message");
      }
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const authUser = authResult.user;
    authUserId = authUser.id;

    await connectToDb();
    ({ eventId } = await request.json());

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json({ message: "Invalid event id" }, { status: 400 });
    }

    const event = await Event.findById(eventId).populate("user");
    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    // A paid event must never be registered for free — this route is only for
    // "registration" (free) events. price_category "paid"/"external" events go
    // through the Stripe checkout flow (event/ticket/*), never here.
    if (event.price_category !== "registration") {
      return NextResponse.json(
        { message: "This event requires payment and cannot be registered for free." },
        { status: 400 },
      );
    }

    const existing = await EventRedemption.findOne({
      event: eventId,
      user: authUser.id,
    });

    if (existing) {
      return NextResponse.json(
        {
          message: "You have already claimed a ticket for this event.",
          uniqueKey: existing.uniqueKey,
        },
        { status: 400 },
      );
    }

    if (event.registration_capacity != null) {
      // Atomically reserve a spot only if capacity remains, so concurrent
      // registrations can never oversell the event.
      const reserved = await Event.findOneAndUpdate(
        {
          _id: eventId,
          $expr: {
            $lt: ["$registration_sold", event.registration_capacity],
          },
        },
        { $inc: { registration_sold: 1 } },
      );
      if (!reserved) {
        return NextResponse.json(
          { message: "This event is fully booked." },
          { status: 400 },
        );
      }
      capacityReserved = true;
    }

    const uniqueKey = `WHA-EVT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const redemption = await EventRedemption.create({
      event: eventId,
      user: authUser.id,
      userName: authUser.name,
      business: event.user._id,
      uniqueKey,
      status: "pending",
    });

    await sendEventTicketEmail(
      authUser.email!,
      event.title,
      uniqueKey,
      authUser.name!,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Ticket generated! Check your email.",
        uniqueKey: redemption.uniqueKey,
      },
      { status: 201 },
    );
  } catch (error: any) {
    if (error.code === 11000) {
      // Lost a race against a concurrent request for the same user+event — the
      // other request's redemption already exists. Release the capacity slot
      // this request reserved (if any) so registration_sold isn't left
      // permanently inflated by the loser of the race, then return the
      // winner's existing code exactly like the pre-create check does.
      if (capacityReserved && eventId) {
        await Event.updateOne(
          { _id: eventId },
          { $inc: { registration_sold: -1 } },
        );
      }
      if (eventId && authUserId) {
        const existing = await EventRedemption.findOne({
          event: eventId,
          user: authUserId,
        });
        if (existing) {
          return NextResponse.json(
            {
              message: "You have already claimed a ticket for this event.",
              uniqueKey: existing.uniqueKey,
            },
            { status: 400 },
          );
        }
      }
      return NextResponse.json(
        { message: "You have already claimed a ticket for this event." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDb();
    const authResult = await getAuthUserDetailed(request);
    if (!authResult.user) {
      if (authResult.viaBearer) {
        return bearerRejectionResponse(authResult.reason, "message");
      }
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const authUser = authResult.user;
    const redemption = await EventRedemption.find({
      user: authUser.id,
    }).populate("event");
    if (!redemption) {
      return NextResponse.json({ redeemed: false }, { status: 200 });
    }
    return NextResponse.json(
      {
        data: redemption,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
