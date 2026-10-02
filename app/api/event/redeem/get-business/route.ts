import { requireBusinessUser } from "@/server/lib/businessAuth";
import { connectToDb } from "@/lib/db";
import { EventRedemption } from "@/server/models/EventCodeRemtion.model";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    await connectToDb();
    const auth = await requireBusinessUser(req, { messageKey: "message" });
    if (!auth.user) return auth.response;

    const redemption = await EventRedemption.find({
      business: auth.user.id,
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
