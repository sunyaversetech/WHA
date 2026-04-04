import { connectToDb } from "@/lib/db";
import { Redemption } from "@/server/models/CouponCodeRedemtion.model";
import { Deal } from "@/server/models/DealSchema.model"; // Ensure you import your Deal model
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDb();
    const { uniqueKey } = await request.json();

    if (!uniqueKey) {
      return NextResponse.json(
        { message: "Code is required" },
        { status: 400 },
      );
    }

    const redemption = await Redemption.findOne({ uniqueKey });

    if (!redemption) {
      return NextResponse.json(
        { message: "Invalid code. No record found." },
        { status: 404 },
      );
    }

    if (redemption.business.toString() !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized: This code belongs to another business." },
        { status: 403 },
      );
    }

    if (redemption.status === "verified") {
      return NextResponse.json(
        { message: "This code has already been verified." },
        { status: 400 },
      );
    }

    redemption.status = "verified";
    redemption.verifiedAt = new Date();
    await redemption.save();

    await Deal.findByIdAndUpdate(redemption.deal);

    return NextResponse.json(
      {
        success: true,
        message: "Deal verified successfully!",
        data: {
          customerName: redemption.userName,
          verifiedAt: redemption.verifiedAt,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
