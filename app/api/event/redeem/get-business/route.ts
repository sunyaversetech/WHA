import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDb } from "@/lib/db";
import { EventRedemption } from "@/server/models/EventCodeRemtion.model";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const redemption = await EventRedemption.find({
      business: session.user.id,
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
