import { connectToDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { sendEventTicketEmail } from "@/lib/mail";
import crypto from "crypto";
import Event from "@/server/models/Event.model";
import { EventRedemption } from "@/server/models/EventCodeRemtion.model";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
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
      user: session.user.id,
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

    const uniqueKey = `WHA-EVT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const redemption = await EventRedemption.create({
      event: eventId,
      user: session.user.id,
      userName: session.user.name,
      business: event.user._id,
      uniqueKey,
      status: "pending",
    });

    await sendEventTicketEmail(
      session.user.email!,
      event.title,
      uniqueKey,
      session.user.name!,
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

export async function GET(req: Request) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const redemption = await EventRedemption.find({
      user: session.user.id,
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
