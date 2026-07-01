import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/server/lib/function";

export async function POST(req: NextRequest) {
  try {
    await connectToDb();

    const formData = await req.formData();

    // ── Common fields ─────────────────────────────────────────────────────────
    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const category = (formData.get("category") as string) || "user";
    const accpetalltermsandcondition =
      formData.get("accpetalltermsandcondition") === "true";

    // ── Basic validation ──────────────────────────────────────────────────────
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email and password are required" },
        { status: 400 },
      );
    }

    // ── Duplicate email check ─────────────────────────────────────────────────
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 400 },
      );
    }

    // ── Password hash ─────────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);

    // ── Cover image upload ────────────────────────────────────────────────────
    const coverFile = formData.get("image") as File | null;
    let imageUrl = "";
    if (coverFile && coverFile.size > 0) {
      const buffer = Buffer.from(await coverFile.arrayBuffer());
      const result = await uploadToS3(buffer, coverFile.name, coverFile.type);
      imageUrl = result?.Location ?? "";
    }

    // ── Business signup ───────────────────────────────────────────────────────
    if (category === "business") {
      const business_name = (formData.get("business_name") as string)?.trim();
      const business_type = formData.get("business_type") as string;
      const business_category = formData.get("business_category") as string;
      const phone_number = (formData.get("phone_number") as string) || "";
      const city = (formData.get("city") as string) || "";
      const location = (formData.get("location") as string) || "";
      const is24_7 = formData.get("is24_7") === "true";

      const latRaw = formData.get("latitude");
      const lngRaw = formData.get("longitude");
      const latitude = latRaw ? Number(latRaw) : undefined;
      const longitude = lngRaw ? Number(lngRaw) : undefined;

      let community: string[] = [];
      const communityRaw = formData.get("community") as string | null;
      if (communityRaw) {
        try {
          community = JSON.parse(communityRaw);
        } catch {
          community = [];
        }
      }

      let schedule: any = null;
      const scheduleRaw = formData.get("schedule") as string | null;
      if (scheduleRaw) {
        try {
          schedule = JSON.parse(scheduleRaw);
        } catch {
          schedule = null;
        }
      }

      if (!business_name) {
        return NextResponse.json(
          { message: "Business name is required" },
          { status: 400 },
        );
      }
      const existingBusiness = await User.findOne({ business_name });
      if (existingBusiness) {
        return NextResponse.json(
          { message: "A business with this name already exists" },
          { status: 400 },
        );
      }

      const venueImageUrls: string[] = [];
      let idx = 0;
      while (idx < 9) {
        const venueFile = formData.get(`venue_image_${idx}`) as File | null;
        if (!venueFile || venueFile.size === 0) break;
        try {
          const buf = Buffer.from(await venueFile.arrayBuffer());
          const res = await uploadToS3(buf, venueFile.name, venueFile.type);
          if (res?.Location) venueImageUrls.push(res.Location);
        } catch {
          // skip individual upload failures — don't abort the whole request
        }
        idx++;
      }

      const newBusiness = await User.create({
        name,
        email,
        password: hashedPassword,
        category: "business",
        business_name,
        business_type,
        business_category,
        phone_number: phone_number || undefined,
        city,
        location,
        latitude,
        longitude,
        is24_7,
        schedule,
        community,
        image: imageUrl || undefined,
        venue_images: venueImageUrls,
        accpetalltermsandcondition,
        provider: "credentials",
      });

      return NextResponse.json(
        {
          message: "Business registered successfully",
          success: true,
          userId: newBusiness._id,
        },
        { status: 201 },
      );
    }

    // ── Regular user signup ───────────────────────────────────────────────────
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      category: "user",
      image: imageUrl || undefined,
      accpetalltermsandcondition,
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
    console.error("SIGNUP_ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
