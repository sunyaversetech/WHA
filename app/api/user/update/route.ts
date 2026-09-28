import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/server/lib/getAuthUser";

export async function PATCH(req: Request) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, image } = body;

    await connectToDb();

    const updatedUser = await User.findOneAndUpdate(
      { email: authUser.email },
      { $set: { name, image } },
      { new: true, runValidators: true },
    );

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
