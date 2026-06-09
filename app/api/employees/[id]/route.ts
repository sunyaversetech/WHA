import { connectToDb } from "@/lib/db";
import { Employee } from "@/server/models/Employee.model";
import { Service } from "@/server/models/Service.model";
import { EmployeeTimeOff } from "@/server/models/EmployeeTimeOff.model";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { uploadToS3 } from "@/server/lib/function";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDb();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Employee ID" },
        { status: 400 },
      );
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, data: employee },
      { status: 200 },
    );
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
        { success: false, error: "Invalid Employee ID" },
        { status: 400 },
      );
    }

    const formData = await request.formData();

    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 },
      );
    }

    if (formData.has("full_name"))
      employee.full_name = formData.get("full_name") as string;
    if (formData.has("email")) employee.email = formData.get("email") as string;

    if (formData.has("availability_schedule")) {
      employee.availability_schedule = JSON.parse(
        (formData.get("availability_schedule") as string) || "[]",
      );
    }

    const employee_photo = formData.get("employee_photo") as File | null;
    if (
      employee_photo &&
      employee_photo.size > 0 &&
      employee_photo instanceof File
    ) {
      const buffer = Buffer.from(await employee_photo.arrayBuffer());
      const uploadResult = await uploadToS3(
        buffer,
        employee_photo.name,
        employee_photo.type,
      );
      employee.employee_photo = uploadResult.Location;
    }

    if (formData.has("service_overrides")) {
      const service_overrides = JSON.parse(
        (formData.get("service_overrides") as string) || "[]",
      );

      const old_services = employee.service_overrides.map((s: any) =>
        s.service_id.toString(),
      );
      const new_services = service_overrides.map((s: any) =>
        s.service_id.toString(),
      );

      const to_add = new_services.filter(
        (s: string) => !old_services.includes(s),
      );
      const to_remove = old_services.filter(
        (s: string) => !new_services.includes(s),
      );

      employee.service_overrides = service_overrides;

      if (to_add.length > 0) {
        await Service.updateMany(
          { _id: { $in: to_add } },
          { $addToSet: { assigned_employees: id } },
        );
      }
      if (to_remove.length > 0) {
        await Service.updateMany(
          { _id: { $in: to_remove } },
          { $pull: { assigned_employees: id } },
        );
      }
    }

    await employee.save();

    return NextResponse.json(
      { success: true, data: employee },
      { status: 200 },
    );
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
        { success: false, error: "Invalid Employee ID" },
        { status: 400 },
      );
    }

    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 },
      );
    }

    // Remove references in Services
    const service_ids = employee.service_overrides.map(
      (s: any) => s.service_id,
    );
    if (service_ids.length > 0) {
      await Service.updateMany(
        { _id: { $in: service_ids } },
        { $pull: { assigned_employees: id } },
      );
    }

    // Clean up employee time-off records
    await EmployeeTimeOff.deleteMany({ employee_id: id });

    return NextResponse.json(
      { success: true, message: "Employee deleted successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
