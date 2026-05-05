import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDb } from "@/lib/db";
import { sendEventTicketEmail } from "@/lib/mail";
import { Redemption } from "@/server/models/CouponCodeRedemtion.model";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

type Props = { params: Promise<{ id: string }> };
export async function GET(req: NextRequest, { params }: Props) {
  try {
    await connectToDb();

    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

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
