import { connectToDb } from "@/lib/db";
import { Review } from "@/server/models/Review.model";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../auth/[...nextauth]/route";
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { reply } = replySchema.parse(await req.json());

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    review.replies.push({
      user: (session.user as any).id,
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
