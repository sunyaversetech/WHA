import { NextRequest, NextResponse } from "next/server";
import { deleteFromS3, uploadToS3 } from "@/server/lib/function";
import User from "@/server/models/Auth.model";
import { connectToDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const user = await User.findById((session.user as any).id);

    if (user?.image && user.image.includes("amazonaws.com")) {
      await deleteFromS3(user.image);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToS3(buffer, file.name, file.type);

    const updatedUser = await User.findByIdAndUpdate(
      (session.user as any).id,
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
