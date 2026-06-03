// app/api/services/[id]/route.ts
import { connectToDb } from "@/lib/db";
import { Employee } from "@/server/models/Employee.model";
import { Service } from "@/server/models/Service.model";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(
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

    const service = await Service.findById(id).populate("assigned_employees");
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

export async function PATCH(
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

    const body = await request.json();
    const { assigned_employees, ...otherFields } = body;

    const service = await Service.findById(id);
    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 },
      );
    }

    // Update basic fields
    Object.assign(service, otherFields);

    if (assigned_employees !== undefined) {
      const old_employees = service.assigned_employees.map((e: any) => e.toString());
      const new_employees = assigned_employees.map((e: any) => e.toString());

      // Find employees to add S to
      const to_add = new_employees.filter((e: string) => !old_employees.includes(e));
      // Find employees to remove S from
      const to_remove = old_employees.filter((e: string) => !new_employees.includes(e));

      // Update Service
      service.assigned_employees = assigned_employees;

      // Sync employees
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

    await service.save();

    return NextResponse.json({ success: true, data: service }, { status: 200 });
  } catch (error: any) {
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
