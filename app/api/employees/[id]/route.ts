import { connectToDb } from "@/lib/db";
import { Employee } from "@/server/models/Employee.model";
import { Service } from "@/server/models/Service.model";
import { EmployeeTimeOff } from "@/server/models/EmployeeTimeOff.model";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { uploadToS3 } from "@/server/lib/function";

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
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

    return NextResponse.json({ success: true, data: employee }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: Props) {
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

    const formData = await request.formData();

    const str = (key: string) => formData.get(key) as string;
    const has = (key: string) => formData.has(key);

    // ── Personal info ──
    if (has("full_name")) employee.full_name = str("full_name");
    if (has("last_name")) employee.last_name = str("last_name");
    if (has("email")) employee.email = str("email");
    if (has("phone_number")) employee.phone_number = str("phone_number");
    if (has("additional_phone_number"))
      employee.additional_phone_number = str("additional_phone_number");
    if (has("country")) employee.country = str("country");
    if (has("birthday")) employee.birthday = str("birthday");
    if (has("birth_year")) employee.birth_year = Number(str("birth_year"));
    if (has("bio")) employee.bio = str("bio");

    // ── Work details ──
    if (has("job_title")) employee.job_title = str("job_title");
    if (has("employment_type")) employee.employment_type = str("employment_type");
    if (has("employment_start_date"))
      employee.employment_start_date = str("employment_start_date");
    if (has("employment_start_year"))
      employee.employment_start_year = Number(str("employment_start_year"));
    if (has("employment_end_date"))
      employee.employment_end_date = str("employment_end_date");
    if (has("employment_end_year"))
      employee.employment_end_year = Number(str("employment_end_year"));
    if (has("employee_id")) employee.employee_id = str("employee_id");

    // ── Calendar ──
    if (has("calendar_color")) employee.calendar_color = str("calendar_color");

    // ── Status ──
    if (has("is_active")) employee.is_active = str("is_active") === "true";

    // ── Availability ──
    if (has("availability_schedule")) {
      employee.availability_schedule = JSON.parse(
        str("availability_schedule") || "[]",
      );
    }

    // ── Addresses & emergency contacts ──
    if (has("addresses")) {
      employee.addresses = JSON.parse(str("addresses") || "[]");
    }
    if (has("emergency_contacts")) {
      employee.emergency_contacts = JSON.parse(str("emergency_contacts") || "[]");
    }

    // ── Services (diff old vs new to keep Service.assigned_employees in sync) ──
    if (has("service_overrides")) {
      const service_overrides = JSON.parse(str("service_overrides") || "[]");

      const old_ids = employee.service_overrides.map((s: any) =>
        s.service_id.toString(),
      );
      const new_ids = service_overrides.map((s: any) => s.service_id.toString());

      const to_add = new_ids.filter((s: string) => !old_ids.includes(s));
      const to_remove = old_ids.filter((s: string) => !new_ids.includes(s));

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

    // ── Photo ──
    const employee_photo = formData.get("employee_photo") as File | null;
    if (employee_photo && employee_photo.size > 0 && employee_photo instanceof File) {
      const buffer = Buffer.from(await employee_photo.arrayBuffer());
      const uploadResult = await uploadToS3(
        buffer,
        employee_photo.name,
        employee_photo.type,
      );
      employee.employee_photo = uploadResult.Location;
    }

    await employee.save();

    return NextResponse.json({ success: true, data: employee }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
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

    // Remove from Service.assigned_employees
    const service_ids = employee.service_overrides.map((s: any) => s.service_id);
    if (service_ids.length > 0) {
      await Service.updateMany(
        { _id: { $in: service_ids } },
        { $pull: { assigned_employees: id } },
      );
    }

    // Remove time-off records
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
