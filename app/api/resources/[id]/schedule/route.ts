import { connectToDb } from "@/lib/db";
import { Service } from "@/server/models/Service.model";
import { NextResponse } from "next/server";
import { requireBusinessUser } from "@/server/lib/businessAuth";
import mongoose from "mongoose";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDb();
    const auth = await requireBusinessUser(request);
    if (!auth.user) return auth.response;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ success: false, error: "Invalid service ID" }, { status: 400 });

    const business_id = auth.user.id;
    const existing = await Service.findOne({ _id: id, business_id }).select("_id");
    if (!existing)
      return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 });

    const body = await request.json();
    const { availability_type, availability_schedule, max_concurrent_bookings, group_schedule } = body;

    const $set: Record<string, any> = {};
    if (availability_type !== undefined) $set.availability_type = availability_type;
    if (availability_schedule !== undefined) $set.availability_schedule = availability_schedule;
    if (max_concurrent_bookings !== undefined) $set.max_concurrent_bookings = max_concurrent_bookings;
    if (group_schedule !== undefined) $set.group_schedule = group_schedule;

    const updated = await Service.findByIdAndUpdate(id, { $set }, { new: true, runValidators: false });
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
