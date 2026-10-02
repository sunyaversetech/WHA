import { connectToDb } from "@/lib/db";
import { Redemption } from "@/server/models/CouponCodeRedemtion.model";
import { Deal } from "@/server/models/DealSchema.model"; // Ensure you import your Deal model
import { NextRequest, NextResponse } from "next/server";
import { requireBusinessUser } from "@/server/lib/businessAuth";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireBusinessUser(request, { messageKey: "message" });
    if (!auth.user) return auth.response;

    await connectToDb();
    const { uniqueKey, deal } = await request.json();

    if (!uniqueKey && !deal) {
      return NextResponse.json(
        { message: "Code is required, deal is required" },
        { status: 400 },
      );
    }

    // Codes are stored in the `uniqueKeys` array (a multi-buy holds several). Match
    // one element exactly, ignoring case and surrounding whitespace — same rule as
    // event ticket verification (scanned values arrive as-is, typed ones uppercased).
    const code = typeof uniqueKey === "string" ? uniqueKey.trim() : "";
    const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const redemption = code
      ? await Redemption.findOne({ uniqueKeys: { $regex: `^${escaped}$`, $options: "i" } })
      : null;

    if (!redemption) {
      return NextResponse.json(
        { message: "Invalid code. No record found." },
        { status: 404 },
      );
    }

    if (redemption.business.toString() !== auth.user.id) {
      return NextResponse.json(
        { message: "Unauthorized: This code belongs to another business." },
        { status: 403 },
      );
    }

    if (redemption.deal.toString() !== deal) {
      return NextResponse.json(
        { message: "Unauthorized: This code does not belong to this deal." },
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
