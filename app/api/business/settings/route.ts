import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { uploadToS3, deleteFromS3 } from "@/server/lib/function";

export async function PATCH(req: NextRequest) {
  try {
    await connectToDb();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const updateData: Record<string, any> = {};

    // Fetch current doc once — needed for S3 cleanup
    const currentUser = await User.findById(session.user.id)
      .select("image venue_images portfolio_images")
      .lean<{ image?: string; venue_images?: string[]; portfolio_images?: string[] }>();
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // ── Profile ────────────────────────────────────────────────────
    const phone_number = formData.get("phone_number");
    if (phone_number !== null) updateData.phone_number = (phone_number as string).trim();

    const business_category = formData.get("business_category");
    if (business_category) updateData.business_category = (business_category as string).trim();

    const communityRaw = formData.get("community");
    if (communityRaw !== null) {
      try {
        updateData.community = JSON.parse(communityRaw as string);
      } catch {
        return NextResponse.json({ message: "Invalid community data" }, { status: 400 });
      }
    }

    // Profile image — delete old S3 object before uploading new one
    const imageFile = formData.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      if (currentUser.image) await deleteFromS3(currentUser.image);
      const buf = Buffer.from(await imageFile.arrayBuffer());
      const result = await uploadToS3(buf, imageFile.name, imageFile.type);
      if (result?.Location) updateData.image = result.Location;
    }

    // ── Schedule ───────────────────────────────────────────────────
    const is24_7Raw = formData.get("is24_7");
    if (is24_7Raw !== null) updateData.is24_7 = is24_7Raw === "true";

    const scheduleRaw = formData.get("schedule");
    if (scheduleRaw !== null) {
      try {
        updateData.schedule = JSON.parse(scheduleRaw as string);
      } catch {
        return NextResponse.json({ message: "Invalid schedule data" }, { status: 400 });
      }
    }

    // ── Location ───────────────────────────────────────────────────
    const location = formData.get("location");
    if (location !== null) updateData.location = (location as string).trim();

    const latRaw = formData.get("latitude");
    const lngRaw = formData.get("longitude");
    if (latRaw !== null) updateData.latitude = Number(latRaw);
    if (lngRaw !== null) updateData.longitude = Number(lngRaw);
    // findByIdAndUpdate skips pre-save hooks so we set geo manually
    if (latRaw !== null && lngRaw !== null) {
      updateData.geo = {
        type: "Point",
        coordinates: [Number(lngRaw), Number(latRaw)],
      };
    }

    // ── Venue images ───────────────────────────────────────────────
    const existingImagesRaw = formData.get("existing_images");
    if (existingImagesRaw !== null) {
      let keptUrls: string[] = [];
      try {
        keptUrls = JSON.parse(existingImagesRaw as string);
      } catch {
        return NextResponse.json({ message: "Invalid venue image data" }, { status: 400 });
      }

      // Delete S3 objects for images the user removed
      const current = currentUser.venue_images ?? [];
      const removed = current.filter((url) => !keptUrls.includes(url));
      await Promise.all(removed.map((url) => deleteFromS3(url)));

      // Upload newly added images
      const newUrls: string[] = [];
      for (let i = 0; i < 10; i++) {
        const file = formData.get(`venue_image_${i}`) as File | null;
        if (!file || file.size === 0) break;
        try {
          const buf = Buffer.from(await file.arrayBuffer());
          const result = await uploadToS3(buf, file.name, file.type);
          if (result?.Location) newUrls.push(result.Location);
        } catch {
          // Skip individual upload failures — don't abort the whole request
        }
      }

      updateData.venue_images = [...keptUrls, ...newUrls];
    }

    // ── Portfolio images ───────────────────────────────────────────
    const existingPortfolioRaw = formData.get("existing_portfolio");
    if (existingPortfolioRaw !== null) {
      let keptUrls: string[] = [];
      try {
        keptUrls = JSON.parse(existingPortfolioRaw as string);
      } catch {
        return NextResponse.json({ message: "Invalid portfolio image data" }, { status: 400 });
      }

      const current = currentUser.portfolio_images ?? [];
      const removed = current.filter((url) => !keptUrls.includes(url));
      await Promise.all(removed.map((url) => deleteFromS3(url)));

      const newUrls: string[] = [];
      for (let i = 0; i < 20; i++) {
        const file = formData.get(`portfolio_image_${i}`) as File | null;
        if (!file || file.size === 0) break;
        try {
          const buf = Buffer.from(await file.arrayBuffer());
          const result = await uploadToS3(buf, file.name, file.type);
          if (result?.Location) newUrls.push(result.Location);
        } catch {
          // skip individual upload failures
        }
      }

      updateData.portfolio_images = [...keptUrls, ...newUrls];
    }

    // ── Business info ──────────────────────────────────────────────
    const abn_number = formData.get("abn_number");
    if (abn_number !== null) updateData.abn_number = (abn_number as string).trim();

    const business_type = formData.get("business_type");
    if (business_type !== null) updateData.business_type = (business_type as string).trim();

    // ── Guard ──────────────────────────────────────────────────────
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No fields provided to update" },
        { status: 400 },
      );
    }

    const updated = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-password -token -resetPasswordToken -resetPasswordExpire -verificationTokenExpire");

    if (!updated) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Settings updated successfully", data: updated },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
