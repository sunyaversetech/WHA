import { connectToDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/server/lib/getAuthUser";
import { sendEventTicketEmail } from "@/lib/mail";
import crypto from "crypto";
import Event from "@/server/models/Event.model";
import { EventRedemption } from "@/server/models/EventCodeRemtion.model";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDb();
    const { eventId } = await request.json();

    const event = await Event.findById(eventId).populate("user");
    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDb();
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
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
