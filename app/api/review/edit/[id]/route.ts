import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDb } from "@/lib/db";
import { Review } from "@/server/models/Review.model";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { reviewSchema } from "../../route";
import z from "zod";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reviewId } = await params;
    const userId = (session.user as any).id;
    const body = await req.json();

    const validatedData = reviewSchema.partial().parse(body);

    const review = await Review.findById(reviewId);

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.user.toString() !== userId) {
      return NextResponse.json(
        { error: "You can only edit your own reviews" },
        { status: 403 },
      );
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { $set: validatedData },
      { new: true, runValidators: true },
    );

    return NextResponse.json({
      message: "Review updated successfully",
      data: updatedReview,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
