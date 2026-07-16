import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { uploadToS3 } from "@/server/lib/function";

export async function PATCH(req: NextRequest) {
  try {
    await connectToDb();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const updateData: Record<string, any> = {};

    const phone_number = formData.get("phone_number") as string | null;
    const business_category = formData.get("business_category") as string | null;
    const communityRaw = formData.get("community") as string | null;

    if (phone_number !== null) updateData.phone_number = phone_number;
    if (business_category) updateData.business_category = business_category;
    if (communityRaw) {
      try {
        updateData.community = JSON.parse(communityRaw);
      } catch {
        return NextResponse.json(
          { message: "Invalid community data" },
          { status: 400 },
        );
      }
    }

    // Handle profile image upload
    const imageFile = formData.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      const buf = Buffer.from(await imageFile.arrayBuffer());
      const result = await uploadToS3(buf, imageFile.name, imageFile.type);
      if (result?.Location) updateData.image = result.Location;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No fields provided to update" },
        { status: 400 },
      );
    }

    const updated = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-password -token -resetPasswordToken");

    if (!updated) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Profile updated successfully", data: updated },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
