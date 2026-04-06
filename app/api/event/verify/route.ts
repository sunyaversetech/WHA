import { connectToDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { EventRedemption } from "@/server/models/EventCodeRemtion.model";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDb();
    const { uniqueKey } = await request.json();

    const redemption = await EventRedemption.findOne({ uniqueKey });

    if (!redemption) {
      return NextResponse.json(
        { message: "Invalid ticket code." },
        { status: 404 },
      );
    }

    // Ensure the business verifying it is the one who owns the event
    if (redemption.business.toString() !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized for this business." },
        { status: 403 },
      );
    }

    if (redemption.status === "verified") {
      return NextResponse.json(
        { message: "Ticket already used." },
        { status: 400 },
      );
    }

    redemption.status = "verified";
    redemption.verifiedAt = new Date();
    await redemption.save();

    return NextResponse.json(
      {
        success: true,
        message: "Ticket verified successfully!",
        data: {
          attendee: redemption.userName,
          verifiedAt: redemption.verifiedAt,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
