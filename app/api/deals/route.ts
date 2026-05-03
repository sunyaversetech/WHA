import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDb } from "@/lib/db";
import { Deal } from "@/server/models/DealSchema.model";
import { Redemption } from "@/server/models/CouponCodeRedemtion.model";

import { uploadToS3 } from "@/server/lib/function";

export async function POST(req: NextRequest) {
  try {
    await connectToDb();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const title = formData.get("title") as string;
    const valid_till = formData.get("valid_till") as string;
    const description = formData.get("description") as string;
    const terms_for_the_deal = formData.get("terms_for_the_deal") as string;
    const category = formData.get("category") as string;
    const max_redemptions = formData.get("max_redemptions") as string;
    const city = formData.get("city") as string;
    const file = formData.get("image") as File | null;
    const price = formData.get("price") as string;

    if (
      !title ||
      !valid_till ||
      !description ||
      !terms_for_the_deal ||
      !city ||
      !category ||
      !file ||
      !price
    ) {
      return NextResponse.json(
        { error: "Missing required fields or image" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadToS3(buffer, file.name, file.type);

    const newDeal = await Deal.create({
      title,
      valid_till: new Date(valid_till),
      category,
      price,
      user: (session.user as any).id,
      description,
      terms_for_the_deal,
      max_redemptions: max_redemptions ? parseInt(max_redemptions) : undefined,
      city,
      image: uploadResult.Location,
    });

    return NextResponse.json(newDeal, { status: 201 });
  } catch (error: any) {
    console.error("Deal Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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
