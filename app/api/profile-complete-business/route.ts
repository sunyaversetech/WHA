import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import Business from "@/server/models/BusinessCompletion.model";
import User from "@/server/models/Auth.model";
export async function POST(req: Request) {
  try {
    await connectToDb();
    const data = await req.json();

    const { owner, business_name, business_service } = data;

    if (!owner || !business_name || !business_service) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const existingProfile = await Business.findOne({ owner });
    if (existingProfile) {
      return NextResponse.json(
        { error: "Business profile already exists" },
        { status: 409 },
      );
    }

    const newBusiness = await Business.create(data);

    await User.findByIdAndUpdate(owner, { category: "business" });

    return NextResponse.json(
      { success: true, id: newBusiness._id },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("PROFILE_COMPLETE_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await connectToDb();

    const body = await req.json();
    const { ownerId, ...updateData } = body;

    if (!ownerId) {
      return NextResponse.json(
        { error: "Owner ID is required" },
        { status: 400 },
      );
    }

    const updatedBusiness = await Business.findOneAndUpdate(
      { owner: ownerId },
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedBusiness) {
      return NextResponse.json(
        { error: "Business profile not found for this user." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedBusiness,
    });
  } catch (error: any) {
    console.error("Update Error:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
