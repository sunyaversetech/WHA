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
    const business_name = (formData.get("business_name") as string)?.trim();

    if (!name || !email || !password || !business_name) {
      return NextResponse.json(
        { message: "Name, email, password and business name are required" },
        { status: 400 },
      );
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 400 },
      );
    }

    const bizExists = await User.findOne({ business_name });
    if (bizExists) {
      return NextResponse.json(
        { message: "A business with this name already exists" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Cover / profile image
    const coverFile = formData.get("image") as File | null;
    let imageUrl = "";
    if (coverFile && coverFile.size > 0) {
      const buf = Buffer.from(await coverFile.arrayBuffer());
      const res = await uploadToS3(buf, coverFile.name, coverFile.type);
      imageUrl = res?.Location ?? "";
    }

    // Venue images (up to 9 extra)
    const venueImageUrls: string[] = [];
    for (let i = 0; i < 9; i++) {
      const file = formData.get(`venue_image_${i}`) as File | null;
      if (!file || file.size === 0) break;
      try {
        const buf = Buffer.from(await file.arrayBuffer());
        const res = await uploadToS3(buf, file.name, file.type);
        if (res?.Location) venueImageUrls.push(res.Location);
      } catch {
        // skip individual failures — don't abort the whole request
      }
    }

    const business_category = formData.get("business_category") as string;
    const business_type = formData.get("business_type") as string | null;
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

    const newBusiness = await User.create({
      name,
      email,
      password: hashedPassword,
      category: "business",
      business_name,
      business_type: business_type || undefined,
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
      accpetalltermsandcondition: accepted,
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
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
