import { connectToDb } from "@/lib/db";
import { Employee } from "@/server/models/Employee.model";
import { Service } from "@/server/models/Service.model";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDb();
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Service ID" },
        { status: 400 },
      );
    }

    const service = await Service.findById(id).populate("assigned_employees");

    if (session.user.id !== service?.business_id.toString()) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: service }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDb();
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business_id = (session.user as any).id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Service ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const {
      assigned_employees,
      name,
      description,
      category,
      category_id,
      price_type,
      base_price,
      base_duration,
      buffer_time,
      service_type,
      require_employee_selection,
      allow_multiple_bookings,
      max_bookings_per_slot,
      is_one_time_booking,
      availability_type,
      availability_schedule,
      max_concurrent_bookings,
      is_active,
    } = body;

    // Verify ownership
    const existing: any = await Service.findOne({
      _id: id,
      business_id,
    }).select("assigned_employees");
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 },
      );
    }

    // Sync employee→service_override links if the employee list changed
    if (assigned_employees !== undefined) {
      const old_ids = (existing.assigned_employees as any[]).map((e) =>
        e.toString(),
      );
      const new_ids = (assigned_employees as string[]).map((e) => e.toString());
      const to_add = new_ids.filter((e) => !old_ids.includes(e));
      const to_remove = old_ids.filter((e) => !new_ids.includes(e));

      if (to_add.length > 0) {
        await Employee.updateMany(
          { _id: { $in: to_add } },
          { $addToSet: { service_overrides: { service_id: id } } },
        );
      }
      if (to_remove.length > 0) {
        await Employee.updateMany(
          { _id: { $in: to_remove } },
          { $pull: { service_overrides: { service_id: id } } },
        );
      }
    }

    const updated = await Service.findByIdAndUpdate(
      id,
      {
        $set: {
          name,
          description,
          category,
          category_id,
          price_type,
          base_price,
          base_duration,
          buffer_time,
          service_type,
          require_employee_selection,
          allow_multiple_bookings,
          max_bookings_per_slot,
          is_one_time_booking,
          availability_type,
          availability_schedule,
          max_concurrent_bookings,
          is_active,
          ...(assigned_employees !== undefined ? { assigned_employees } : {}),
        },
      },
      { new: true, runValidators: false },
    ).populate("assigned_employees");

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "A service with this name already exists for your business.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDb();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Service ID" },
        { status: 400 },
      );
    }

    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 },
      );
    }

    // Clean up employee references
    await Employee.updateMany(
      { _id: { $in: service.assigned_employees } },
      { $pull: { service_overrides: { service_id: id } } },
    );

    return NextResponse.json(
      { success: true, message: "Service deleted successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
