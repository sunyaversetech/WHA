import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/server/lib/function";

export async function POST(req: NextRequest) {
  try {
    await connectToDb();

    const formData = await req.formData();
    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const accepted = formData.get("accpetalltermsandcondition") === "true";

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email and password are required" },
        { status: 400 },
      );
    }

    const exists = await User.findOne({ email, category: "user" });
    if (exists) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const coverFile = formData.get("image") as File | null;
    let imageUrl = "";
    if (coverFile && coverFile.size > 0) {
      const buf = Buffer.from(await coverFile.arrayBuffer());
      const res = await uploadToS3(buf, coverFile.name, coverFile.type);
      imageUrl = res?.Location ?? "";
    }

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      category: "user",
      image: imageUrl || undefined,
      accpetalltermsandcondition: accepted,
      provider: "credentials",
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        success: true,
        userId: newUser._id,
      },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
