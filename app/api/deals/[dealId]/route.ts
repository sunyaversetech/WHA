import { NextRequest, NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import { uploadToS3, deleteFromS3 } from "@/server/lib/function";
import { Deal } from "@/server/models/DealSchema.model";

type Props = { params: Promise<{ dealId: string }> };

export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    await connectToDb();
    const { dealId } = await params;
    const formData = await req.formData();

    const updateData: any = {};
    if (formData.has("title")) updateData.title = formData.get("title");
    if (formData.has("expiryDate"))
      updateData.expiryDate = new Date(formData.get("expiryDate") as string);

    const file = formData.get("image") as File | null;
    if (file && typeof file !== "string") {
      const oldDeal = await Deal.findById(dealId);
      if (oldDeal?.image) await deleteFromS3(oldDeal.image);

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadToS3(buffer, file.name, file.type);
      updateData.image = result.Location;
    }

    const updatedDeal = await Deal.findByIdAndUpdate(dealId, updateData, {
      new: true,
      runValidators: true,
    });
    return NextResponse.json(updatedDeal);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: Props) {
  try {
    await connectToDb();
    const { dealId } = await params;
    await Deal.findByIdAndDelete(dealId);
    return NextResponse.json({ message: "Deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
