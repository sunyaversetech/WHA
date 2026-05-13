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
      name,
      category,
      base_price,
      base_duration,
      assigned_employees,
    } = body;

    const new_service = await Service.create({
      business_id,
      name,
      category,
      base_price,
      base_duration,
      assigned_employees: assigned_employees || [],
    });

    if (assigned_employees?.length > 0) {
      await Employee.updateMany(
        { _id: { $in: assigned_employees } },
        { $push: { service_overrides: { service_id: new_service._id } } },
      );
    }

    return NextResponse.json(
      { success: true, data: new_service },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
