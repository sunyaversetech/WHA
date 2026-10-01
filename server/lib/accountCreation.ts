import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import EmailVerification from "@/server/models/EmailVerification.model";
import bcrypt from "bcryptjs";
import { uploadToS3 } from "@/server/lib/function";

// Extracted verbatim (not re-derived) from the near-identical bodies of the existing
// app/api/auth/user/signup and app/api/auth/business/signup routes, which now both
// call this instead of inlining their own copy. Both those routes are plain custom
// REST handlers — not authOptions/NextAuth config — so refactoring them is in scope.
// Behavior (validation order, error messages, field handling) is intentionally
// unchanged from what was there before; only the mobile register route is new
// *behavior* on top of this shared function.

export type CreateAccountResult =
  | { ok: true; userId: string; user: any }
  | { ok: false; status: number; message: string };

export async function createCredentialsAccount(
  category: "user" | "business",
  formData: FormData,
): Promise<CreateAccountResult> {
  await connectToDb();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const accepted = formData.get("accpetalltermsandcondition") === "true";

  if (category === "user") {
    if (!name || !email || !password) {
      return {
        ok: false,
        status: 400,
        message: "Name, email and password are required",
      };
    }
    const exists = await User.findOne({ email, category: "user" });
    if (exists) {
      return {
        ok: false,
        status: 400,
        message: "An account with this email already exists",
      };
    }
  } else {
    const business_name = (formData.get("business_name") as string)?.trim();
    if (!name || !email || !password || !business_name) {
      return {
        ok: false,
        status: 400,
        message: "Name, email, password and business name are required",
      };
    }
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return {
        ok: false,
        status: 400,
        message: "An account with this email already exists",
      };
    }
    const bizExists = await User.findOne({ business_name });
    if (bizExists) {
      return {
        ok: false,
        status: 400,
        message: "A business with this name already exists",
      };
    }
  }

  const verification = await EmailVerification.findOne({
    email,
    verified: true,
    expires_at: { $gt: new Date() },
  });
  if (!verification) {
    return {
      ok: false,
      status: 400,
      message: "Please verify your email address before signing up",
    };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const coverFile = formData.get("image") as File | null;
  let imageUrl = "";
  if (coverFile && coverFile.size > 0) {
    const buf = Buffer.from(await coverFile.arrayBuffer());
    const res = await uploadToS3(buf, coverFile.name, coverFile.type);
    imageUrl = res?.Location ?? "";
  }

  let newUser: any;

  if (category === "user") {
    newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      category: "user",
      image: imageUrl || undefined,
      accpetalltermsandcondition: accepted,
      provider: "credentials",
      emailVerified: new Date(),
    });
  } else {
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

    const business_name = (formData.get("business_name") as string)?.trim();
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

    newUser = await User.create({
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
      emailVerified: new Date(),
    });
  }

  await EmailVerification.deleteOne({ email });

  return { ok: true, userId: newUser._id.toString(), user: newUser };
}
