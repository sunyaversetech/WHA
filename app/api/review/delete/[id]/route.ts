import { connectToDb } from "@/lib/db";
import { Review } from "@/server/models/Review.model";
import { getAuthUserDetailed, bearerRejectionResponse } from "@/server/lib/getAuthUser";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    await connectToDb();

    const authResult = await getAuthUserDetailed(req);
    if (!authResult.user) {
      if (authResult.viaBearer) return bearerRejectionResponse(authResult.reason);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authUser = authResult.user;

    const { id: reviewId } = await params;
    const currentUserId = authUser.id;
    const review = await Review.findById(reviewId);

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (
      review.user.toString() !== currentUserId &&
      authUser.category !== "super-admin"
    ) {
      return NextResponse.json(
        { error: "You are not authorized to delete this review" },
        { status: 403 },
      );
    }

    await Review.findByIdAndDelete(reviewId);

    return NextResponse.json({ message: "Review deleted successfully" });
  } catch (error: any) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
