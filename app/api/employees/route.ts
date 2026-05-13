import { connectToDb } from "@/lib/db";
import { Employee } from "@/server/models/Employee.model";
import { Service } from "@/server/models/Service.model";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await connectToDb();
    const body = await request.json();

    const {
      business_id,
      full_name,
      email,
      availability_schedule,
      service_overrides,
    } = body;

    const new_employee = await Employee.create({
      business_id,
      full_name,
      email,
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
