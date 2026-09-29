import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { getAuthUser } from "@/server/lib/getAuthUser";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectToDb();
    const authUser = await getAuthUser(req);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { phone_number, location, latitude, longitude } = body;

    const updateData: any = {};
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (location !== undefined) updateData.location = location;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided" },
        { status: 400 },
      );
    }

    const updatedProfile = await User.findByIdAndUpdate(
      authUser.id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedProfile) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { data: updatedProfile, message: "Profile updated successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
