import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDb } from "@/lib/db";
import Event from "@/server/models/Event.model";
import { TicketHold } from "@/server/models/TicketHold.model";
import { releaseExpiredHolds, getHoldDurationMs } from "@/server/lib/ticketHold";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  let paymentIntentId: string | undefined;

  try {
    await connectToDb();
    // Guests (no session) can still hold tickets — identity is only needed
    // to attach the purchase to an account at finalize time.
    const session = await getServerSession(authOptions);

    const body = await req.json();
    const eventId = body.eventId as string;
    const items = body.items as { optionId: string; quantity: number }[];
    paymentIntentId = body.paymentIntentId;

    if (!eventId || !paymentIntentId || !items?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Re-entering the checkout step for the same payment attempt shouldn't
    // create a second hold or reset the timer — just report the existing one.
    const existingHold = await TicketHold.findOne({
      paymentIntentId,
      expiresAt: { $gt: new Date() },
    });
    if (existingHold) {
      return NextResponse.json({
        success: true,
        expiresAt: existingHold.expiresAt,
      });
    }

    await releaseExpiredHolds(eventId);

    const today = new Date().toISOString().split("T")[0];
    const expiresAt = new Date(Date.now() + getHoldDurationMs());

    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        const event = await Event.findById(eventId).session(dbSession);
        if (!event) throw new Error("EVENT_NOT_FOUND");

        for (const { optionId, quantity } of items) {
          const option = event.options?.id(optionId);
          if (!option) throw new Error("OPTION_NOT_FOUND");

          if (option.release_date && option.release_date > today) {
            throw new Error(`${option.name} is not released yet`);
          }
          if (option.close_date && option.close_date < today) {
            throw new Error(`${option.name} is no longer available`);
          }

          const remaining =
            option.capacity != null
              ? option.capacity - (option.sold || 0) - (option.held || 0)
              : null;
          if (remaining !== null && quantity > remaining) {
            throw new Error(
              remaining > 0
                ? `Only ${remaining} ${option.name} ticket(s) available right now`
                : `${option.name} tickets are not available right now`,
            );
          }

          option.held = (option.held || 0) + quantity;
        }

        await event.save({ session: dbSession });

        await TicketHold.create(
          [
            {
              event: eventId,
              user: session?.user?.id,
              items,
              paymentIntentId,
              expiresAt,
            },
          ],
          { session: dbSession },
        );
      });
    } finally {
      await dbSession.endSession();
    }

    return NextResponse.json({ success: true, expiresAt });
  } catch (error: any) {
    if (error.code === 11000 && paymentIntentId) {
      // Duplicate paymentIntentId — a concurrent request already created it.
      const existing = await TicketHold.findOne({ paymentIntentId });
      if (existing) {
        return NextResponse.json({
          success: true,
          expiresAt: existing.expiresAt,
        });
      }
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
