import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDb } from "@/lib/db";
import { EventRedemption } from "@/server/models/EventCodeRemtion.model";
import { EventTicketPurchase } from "@/server/models/EventTicketPurchase.model";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: any) {
  try {
    await connectToDb();
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const redemptions = await EventRedemption.find({ event: id })
      .populate("user", { _id: 1, name: 1 })
      .lean();

    const purchases = await EventTicketPurchase.find({ event: id })
      .populate("user", { _id: 1, name: 1 })
      .lean();

    const freeRows = redemptions.map((r: any) => ({
      _id: r._id,
      user: r.user,
      uniqueKey: r.uniqueKey,
      ticketType: "General",
      status: r.status,
      verifiedAt: r.verifiedAt || null,
    }));

    const paidRows = (purchases as any[]).flatMap((p) =>
      (p.items || []).flatMap((item: any) =>
        (item.uniqueKeys || []).map((code: string) => {
          const verified = (p.verifiedKeys || []).includes(code);
          // Each ticket has its own recorded check-in time; fall back to the
          // purchase-level verifiedAt only for legacy records saved before
          // per-code timestamps existed.
          const ownTimestamp = (p.verifiedTimestamps || []).find(
            (vt: any) => vt.key === code,
          )?.verifiedAt;
          return {
            _id: `${p._id}-${code}`,
            user: p.user,
            uniqueKey: code,
            ticketType: item.optionName,
            status: verified ? "verified" : "pending",
            verifiedAt: verified ? ownTimestamp || p.verifiedAt || null : null,
          };
        }),
      ),
    );

    const data = [...freeRows, ...paidRows];

    return NextResponse.json({
      message: "Event attendees fetched successfully",
      data,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
