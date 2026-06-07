import { connectToDb } from "@/lib/db";
import { Employee } from "@/server/models/Employee.model";
import { Service } from "@/server/models/Service.model";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    await connectToDb();

    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business_id = (session.user as any).id;

    const body = await request.json();

    const {
      name,
      category,
      base_price,
      base_duration,
      assigned_employees,
      description,
      require_employee_selection,
      is_active,
    } = body;

    const new_service = await Service.create({
      business_id,
      name,
      category,
      base_price,
      base_duration,
      assigned_employees: assigned_employees || [],
      description: description,
      require_employee_selection: require_employee_selection || false,
      is_active: is_active || false,
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

export async function GET(request: Request) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const services = await Service.find({
      business_id: (session.user as any).id,
    })
      .populate("assigned_employees")
      .lean();

    return NextResponse.json(
      { success: true, data: services },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
