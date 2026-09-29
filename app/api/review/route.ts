import { connectToDb } from "@/lib/db";
import { Review } from "@/server/models/Review.model";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import * as z from "zod";
import { authOptions } from "../auth/[...nextauth]/route";

import "@/server/models/Auth.model";
import mongoose from "mongoose";
import Notification from "@/server/models/Notification.model";
import { resolveBusinessBySlugOrId } from "@/lib/resolve-business";
import { PUBLIC_USER_SUMMARY_FIELDS } from "@/server/lib/publicUserFields";

export const reviewSchema = z.object({
  business_id: z.string().min(1, "Business ID is required"),
  rating: z
    .number()
    .int()
    .min(1, "Minimum 1 star required")
    .max(5, "Maximum 5 stars allowed"),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters long")
    .max(500, "Comment is too long (max 500 characters)"),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;

export async function POST(req: NextRequest) {
  try {
    await connectToDb();

    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid review data",
          error: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }
    const { business_id, rating, comment } = parsed.data;
    const searchRegex = business_id.split("").join("\\s*");

    const existingReview = await Review.findOne({
      business_id: searchRegex,
      user: new mongoose.Types.ObjectId(userId),
    });

    if (existingReview) {
      return NextResponse.json(
        { message: "You have already reviewed this business." },
        { status: 409 },
      );
    }

    const newReview = await Review.create({
      business_id: business_id,
      user: userId,
      rating,
      comment,
    });

    const business = await resolveBusinessBySlugOrId(business_id);
    if (business) {
      await Notification.create({
        business_id: business._id.toString(),
        type: "review",
        title: "New review",
        body: `${rating}-star review: "${comment.slice(0, 80)}"`,
        related_id: newReview._id,
      });
    }

    return NextResponse.json(
      {
        message: "Review submitted successfully",
        data: newReview,
      },
      { status: 201 },
    );
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "You have already reviewed this business." },
        { status: 409 },
      );
    }

    console.error("Review API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDb();

    const { searchParams } = new URL(req.url);
    const rawBusinessId = searchParams.get("business_id") || "";

    const businessId = rawBusinessId.replace(/\?+$/, "").trim();
    if (!businessId) {
      return NextResponse.json(
        { message: "business_id is required" },
        { status: 400 },
      );
    }

    const reviews = await Review.find({ business_id: businessId })
      .populate("user", PUBLIC_USER_SUMMARY_FIELDS)
      .sort({ created_at: -1 });

    return NextResponse.json({
      message: "Success",
      count: reviews.length,
      data: reviews,
    });
  } catch (error: any) {
    console.error("Review API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 },
    );
  }
}
