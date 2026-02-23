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
    const expiryDate = formData.get("expiryDate") as string;
    const file = formData.get("image") as File;

    if (!file || !title || !expiryDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadToS3(buffer, file.name, file.type);

    const newDeal = await Deal.create({
      title,
      expiryDate: new Date(expiryDate),
      image: uploadResult.Location,
      user: (session.user as any).id,
      business_name: (session.user as any).business_name,
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
    return NextResponse.json(deals);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
