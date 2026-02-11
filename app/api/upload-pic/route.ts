import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/server/lib/function";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await uploadToS3(buffer, file.name, file.type);

    return NextResponse.json({ success: true, url: result.Location });
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
