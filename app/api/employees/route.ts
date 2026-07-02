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

    const getString = (key: string) =>
      (formData.get(key) as string) || undefined;
    const getNumber = (key: string) => {
      const v = formData.get(key);
      return v ? Number(v) : undefined;
    };

    // ── Personal info ──
    const full_name = formData.get("full_name") as string;
    const last_name = getString("last_name");
    const email = getString("email");
    const phone_number = getString("phone_number");
    const additional_phone_number = getString("additional_phone_number");
    const country = getString("country");
    const birthday = getString("birthday");
    const birth_year = getNumber("birth_year");
    const bio = getString("bio");

    // ── Work details ──
    const job_title = getString("job_title");
    const employment_type = getString("employment_type");
    const employment_start_date = getString("employment_start_date");
    const employment_start_year = getNumber("employment_start_year");
    const employment_end_date = getString("employment_end_date");
    const employment_end_year = getNumber("employment_end_year");
    const employee_id = getString("employee_id");

    // ── Calendar ──
    const calendar_color = getString("calendar_color");

    // ── Status ──
    const is_active = formData.get("is_active") === "true";

    // ── Arrays ──
    const availability_schedule = JSON.parse(
      (formData.get("availability_schedule") as string) || "[]",
    );
    const service_overrides = JSON.parse(
      (formData.get("service_overrides") as string) || "[]",
    );
    const addresses = JSON.parse((formData.get("addresses") as string) || "[]");
    const emergency_contacts = JSON.parse(
      (formData.get("emergency_contacts") as string) || "[]",
    );

    // ── Photo upload ──
    const employee_photo = formData.get("employee_photo") as File | null;
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
      // personal
      full_name,
      last_name,
      email,
      phone_number,
      additional_phone_number,
      country,
      birthday,
      birth_year,
      bio,
      // work
      job_title,
      employment_type,
      employment_start_date,
      employment_start_year,
      employment_end_date,
      employment_end_year,
      employee_id,
      // calendar
      calendar_color,
      // status & media
      is_active,
      employee_photo: employee_photo_url,
      // arrays
      availability_schedule,
      service_overrides,
      addresses,
      emergency_contacts,
    });

    // Link services to this employee
    if (service_overrides.length > 0) {
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

export async function GET() {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employees = await Employee.find({
      business_id: session.user.id,
    }).sort({ created_at: -1 });

    return NextResponse.json(
      { success: true, data: employees },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
