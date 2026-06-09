import { connectToDb } from "@/lib/db";
import { Employee } from "@/server/models/Employee.model";
import { Service } from "@/server/models/Service.model";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { uploadToS3 } from "@/server/lib/function";

export async function POST(request: Request) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const full_name = formData.get("full_name") as string;
    const email = formData.get("email") as string;

    const availability_schedule = JSON.parse(
      (formData.get("availability_schedule") as string) || "[]",
    );
    const service_overrides = JSON.parse(
      (formData.get("service_overrides") as string) || "[]",
    );

    const employee_photo = formData.get("employee_photo") as File;

    let employee_photo_url = "";

    if (employee_photo && employee_photo.size > 0) {
      const buffer = Buffer.from(await employee_photo.arrayBuffer());
      const uploadResult = await uploadToS3(
        buffer,
        employee_photo.name,
        employee_photo.type,
      );
      employee_photo_url = uploadResult.Location ?? "";
    }

    const new_employee = await Employee.create({
      business_id: session.user.id,
      full_name,
      email,
      employee_photo: employee_photo_url,
      availability_schedule,
      service_overrides: service_overrides || [],
    });

    if (service_overrides?.length > 0) {
      const service_ids = service_overrides.map((s: any) => s.service_id);
      await Service.updateMany(
        { _id: { $in: service_ids } },
        { $addToSet: { assigned_employees: new_employee._id } },
      );
    }

    return NextResponse.json(
      { success: true, data: new_employee },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await Employee.find({ business_id: session.user.id }).sort(
      { created_at: -1 },
    );
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
