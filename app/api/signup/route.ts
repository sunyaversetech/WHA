import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/server/lib/function"; // Assuming this is where your S3 helper lives

export async function POST(req: NextRequest) {
  try {
    await connectToDb();

    // 1. Parse FormData instead of JSON
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const category = formData.get("category") as string; // 'business'
    const business_name = formData.get("business_name") as string;
    const business_category = formData.get("business_category") as string;
    const phone_number = formData.get("phone_number") as string;
    const city = formData.get("city") as string;
    const city_name = formData.get("city_name") as string;
    const community = formData.get("community") as string;
    const community_name = formData.get("community_name") as string;
    const location = formData.get("location") as string;
    const latitude = Number(formData.get("latitude"));
    const longitude = Number(formData.get("longitude"));
    const accpetalltermsandcondition =
      formData.get("accpetalltermsandcondition") === "true";

    const file = formData.get("image") as File | null;

    if (!name || !email || !password || !business_name) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 },
      );
    }

    let imageUrl = "";
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadResult = await uploadToS3(buffer, file.name, file.type);
      imageUrl = uploadResult?.Location ?? "";
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      category,
      business_name,
      business_category,
      phone_number,
      city,
      city_name: city === "other" ? city_name : city,
      community,
      community_name: community === "others" ? community_name : community,
      location,
      latitude,
      longitude,
      image: imageUrl,
      accpetalltermsandcondition,
      provider: "credentials",
    });

    return NextResponse.json(
      {
        message: "Business registered successfully",
        success: true,
        userId: newUser._id,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("BUSINESS_SIGNUP_ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
