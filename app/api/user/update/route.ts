import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { NextResponse } from "next/server";
import { getAuthUserDetailed, bearerRejectionResponse } from "@/server/lib/getAuthUser";

export async function PATCH(req: Request) {
  try {
    const authResult = await getAuthUserDetailed(req);
    if (!authResult.user) {
      if (authResult.viaBearer) return bearerRejectionResponse(authResult.reason);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authUser = authResult.user;

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
