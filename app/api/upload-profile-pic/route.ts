import { NextRequest, NextResponse } from "next/server";
import { deleteFromS3, uploadToS3 } from "@/server/lib/function";
import User from "@/server/models/Auth.model";
import { connectToDb } from "@/lib/db";
import { getAuthUser } from "@/server/lib/getAuthUser";

export async function POST(req: NextRequest) {
  try {
    await connectToDb();
    const authUser = await getAuthUser(req);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const user = await User.findById(authUser.id);

    if (user?.image && user.image.includes("amazonaws.com")) {
      await deleteFromS3(user.image);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToS3(buffer, file.name, file.type);

    await User.findByIdAndUpdate(
      authUser.id,
      { image: result.Location },
      { new: true },
    );

    return NextResponse.json({
      message: "Profile picture updated successfully",
      success: true,
      data: {
        url: result.Location,
      },
    });
  } catch (error: any) {
    console.error("Upload process error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
