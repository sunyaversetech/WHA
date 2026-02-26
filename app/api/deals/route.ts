import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDb } from "@/lib/db";
import { uploadToS3 } from "@/server/lib/function";
import { Deal } from "@/server/models/DealSchema.model";

export async function POST(req: NextRequest) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();

    const title = formData.get("title") as string;
    const validTill = formData.get("valid_till") as string;
    const dealsFor = formData.get("deals_for") as string;
    const description = formData.get("description") as string;
    const termsForTheDeal = formData.get("terms_for_the_deal") as string;
    const dealCode = formData.get("deal_code") as string;

    if (
      !validTill ||
      !title ||
      !dealsFor ||
      !description ||
      !termsForTheDeal ||
      !dealCode
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
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const deals = await Deal.find({ user: (session.user as any).id }).sort({
      createdAt: -1,
    });
    return NextResponse.json({ message: "", data: deals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
