import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { Deal } from "@/server/models/DealSchema.model";
import { uploadToS3, deleteFromS3 } from "@/server/lib/function";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// Expanded schema to include all potential deal fields
export const dealSchema = z.object({
  title: z.string().min(2, "Title is too short"),
  valid_till: z.coerce.date(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  terms_for_the_deal: z.string().min(1, "Terms are required"),
  category: z.string().optional(),
  city: z.string().optional(),
  max_redemptions: z.coerce.number().optional(),
  price: z.coerce.number().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: dealId } = await params;
    const userId = (session.user as any).id;

    const formData = await req.formData();
    const rawData: Record<string, any> = {};

    formData.forEach((value, key) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          try {
            rawData[key] = JSON.parse(trimmed);
          } catch {
            rawData[key] = value;
          }
        } else if (trimmed === "undefined") {
          rawData[key] = undefined;
        } else {
          rawData[key] = value;
        }
      } else {
        rawData[key] = value;
      }
    });

    const deal = await Deal.findById(dealId);

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    if (deal.user.toString() !== userId) {
      return NextResponse.json(
        { error: "You can only edit your own deals" },
        { status: 403 },
      );
    }

    const imageField = formData.get("image");
    let finalImageUrl = deal.image;

    if (imageField instanceof File && imageField.size > 0) {
      if (deal.image) {
        try {
          await deleteFromS3(deal.image);
        } catch (e) {
          console.error("S3 Cleanup failed, moving on:", e);
        }
      }

      const buffer = Buffer.from(await imageField.arrayBuffer());
      const s3Response = await uploadToS3(
        buffer,
        imageField.name,
        imageField.type,
      );
      finalImageUrl = s3Response.Location;
    } else if (typeof imageField === "string" && imageField.length > 0) {
      finalImageUrl = imageField;
    }

    const validatedData = dealSchema.partial().parse(rawData);

    const updatePayload = {
      ...validatedData,
      image: finalImageUrl,
    };

    const updatedDeal = await Deal.findByIdAndUpdate(
      dealId,
      { $set: updatePayload },
      { new: true, runValidators: true },
    );

    return NextResponse.json({
      message: "Deal updated successfully",
      data: updatedDeal,
    });
  } catch (error: any) {
    console.error("PATCH Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
