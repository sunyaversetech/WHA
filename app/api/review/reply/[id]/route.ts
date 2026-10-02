import { connectToDb } from "@/lib/db";
import { Review } from "@/server/models/Review.model";
import { NextRequest, NextResponse } from "next/server";
import { requireBusinessUser } from "@/server/lib/businessAuth";
import * as z from "zod";

const replySchema = z.object({
  reply: z
    .string()
    .min(1, "Reply cannot be empty")
    .max(500, "Reply is too long (max 500 characters)"),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    await connectToDb();
    const auth = await requireBusinessUser(req);
    if (!auth.user) return auth.response;

    const { id } = await params;
    const { reply } = replySchema.parse(await req.json());

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    if (String(review.business_id) !== auth.user.id) {
      return NextResponse.json(
        { error: "You can only reply to reviews of your own business" },
        { status: 403 },
      );
    }

    review.replies.push({
      user: auth.user.id,
      text: reply,
      created_at: new Date(),
    } as any);
    await review.save();

    const updated = await Review.findById(id)
      .populate("user", { password: 0 })
      .populate("replies.user", "name business_name image category");

    return NextResponse.json({
      message: "Reply posted successfully",
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
