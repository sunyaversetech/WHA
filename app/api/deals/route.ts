import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDb } from "@/lib/db";
import { Deal } from "@/server/models/DealSchema.model";
import { Redemption } from "@/server/models/CouponCodeRedemtion.model";

export async function POST(req: NextRequest) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      title,
      valid_till,
      deals_for,
      description,
      terms_for_the_deal,
      deal_code,
      max_redemptions,
      city,
    } = await req.json();

    const validTill = valid_till;
    const dealsFor = deals_for;
    const termsForTheDeal = terms_for_the_deal;
    const dealCode = deal_code;

    if (
      !validTill ||
      !title ||
      !dealsFor ||
      !description ||
      !termsForTheDeal ||
      !dealCode ||
      !city
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const newDeal = await Deal.create({
      title,
      valid_till: new Date(validTill),
      user: (session.user as any).id,
      deals_for: dealsFor,
      description,
      terms_for_the_deal: termsForTheDeal,
      deal_code: dealCode,
      max_redemptions,
      city,
    });

    return NextResponse.json(newDeal, { status: 201 });
  } catch (error: any) {
    console.error("Deal Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET() {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deals = await Deal.find({ user: (session.user as any).id })
      .populate({
        path: "user",
        select: "-password -emailVerified -isblocked -updatedAt -verified -_id",
      })
      .sort({ createdAt: -1 })
      .lean();

    const dealsWithCounts = await Promise.all(
      deals.map(async (deal) => {
        const verifiedCount = await Redemption.countDocuments({
          deal: deal._id,
          status: "verified",
        });

        return {
          ...deal,
          verifiedRedemptions: verifiedCount,
        };
      }),
    );

    return NextResponse.json({ message: "", data: dealsWithCounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
