import { connectToDb } from "@/lib/db";
import { Redemption } from "@/server/models/CouponCodeRedemtion.model";
import { NextRequest, NextResponse } from "next/server";

type Props = { params: Promise<{ id: string }> };
export async function GET(req: NextRequest, { params }: Props) {
  try {
    await connectToDb();

    const { id } = await params;

    const redemption = await Redemption.find({ deal: id })
      .populate("user", "name email")
      .populate("deal", "title description");
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
