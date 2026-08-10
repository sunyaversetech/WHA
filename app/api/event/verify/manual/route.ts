import { connectToDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { EventRedemption } from "@/server/models/EventCodeRemtion.model";
import { EventTicketPurchase } from "@/server/models/EventTicketPurchase.model";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDb();
    const { uniqueKey, status } = await request.json();

    if (!uniqueKey || !["verified", "pending"].includes(status)) {
      return NextResponse.json(
        { message: "Invalid request" },
        { status: 400 },
      );
    }

    const redemption = await EventRedemption.findOne({ uniqueKey });
    if (redemption) {
      if (redemption.business.toString() !== session.user.id) {
        return NextResponse.json(
          { message: "Unauthorized for this business." },
          { status: 403 },
        );
      }

      redemption.status = status;
      redemption.verifiedAt = status === "verified" ? new Date() : undefined;
      await redemption.save();

      return NextResponse.json({ success: true, status: redemption.status });
    }

    const purchase = await EventTicketPurchase.findOne({
      uniqueKeys: uniqueKey,
    });
    if (!purchase) {
      return NextResponse.json(
        { message: "Ticket code not found." },
        { status: 404 },
      );
    }

    if (purchase.business.toString() !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized for this business." },
        { status: 403 },
      );
    }

    // One-time backfill: any ticket in this order that was verified before
    // per-code timestamps existed has no entry yet, so it's still falling
    // back to the shared (legacy) verifiedAt. Freeze it to that value now so
    // it stops shifting whenever another ticket in the same order changes.
    const knownKeys = new Set(
      (purchase.verifiedTimestamps || []).map((vt: any) => vt.key),
    );
    const backfilled = (purchase.verifiedKeys || [])
      .filter((k: string) => !knownKeys.has(k))
      .map((k: string) => ({
        key: k,
        verifiedAt: purchase.verifiedAt || new Date(),
      }));
    if (backfilled.length) {
      purchase.verifiedTimestamps = [
        ...(purchase.verifiedTimestamps || []),
        ...backfilled,
      ];
    }

    const existingTimestamps = purchase.verifiedTimestamps.filter(
      (vt: any) => vt.key !== uniqueKey,
    );

    if (status === "verified") {
      const verifiedAt = new Date();
      if (!purchase.verifiedKeys.includes(uniqueKey)) {
        purchase.verifiedKeys.push(uniqueKey);
      }
      purchase.verifiedTimestamps = [
        ...existingTimestamps,
        { key: uniqueKey, verifiedAt },
      ];
      purchase.verifiedAt = verifiedAt;
    } else {
      purchase.verifiedKeys = purchase.verifiedKeys.filter(
        (k: string) => k !== uniqueKey,
      );
      // Only this ticket's own timestamp is removed — the other tickets in
      // this order keep their individually recorded check-in times.
      purchase.verifiedTimestamps = existingTimestamps;
    }
    purchase.status =
      purchase.verifiedKeys.length >= purchase.uniqueKeys.length
        ? "verified"
        : "pending";
    await purchase.save();

    return NextResponse.json({ success: true, status: purchase.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
