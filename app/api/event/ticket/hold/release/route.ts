import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import { TicketHold } from "@/server/models/TicketHold.model";
import { releaseHoldByPaymentIntent } from "@/server/lib/ticketHold";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    await connectToDb();
    // Guests (no session) can release their own hold too — the
    // paymentIntentId itself is effectively a bearer secret only the
    // checkout session that created it knows.
    const session = await getServerSession(authOptions);

    const { paymentIntentId } = await req.json();
    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Missing paymentIntentId" },
        { status: 400 },
      );
    }

    const hold = await TicketHold.findOne({ paymentIntentId });
    if (!hold) {
      // Already released, expired, or never existed — nothing to do.
      return NextResponse.json({ success: true });
    }

    if (hold.user && hold.user.toString() !== session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await releaseHoldByPaymentIntent(paymentIntentId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
