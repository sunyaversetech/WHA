import { NextRequest, NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import { Service } from "@/server/models/Service.model";
import { Employee } from "@/server/models/Employee.model";

export async function POST(req: NextRequest) {
  try {
    await connectToDb();
    const { serviceId, employeeId } = await req.json();

    if (!serviceId || !employeeId) {
      return NextResponse.json(
        { error: "serviceId and employeeId are required" },
        { status: 400 },
      );
    }

    const updatedService = await Service.findByIdAndUpdate(
      serviceId,
      { $addToSet: { assigned_employees: employeeId } },
      { new: true },
    );

    if (!updatedService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const updatedEmployee = await Employee.findOneAndUpdate(
      {
        _id: employeeId,
        "service_overrides.service_id": { $ne: serviceId },
      },
      {
        $push: {
          service_overrides: { service_id: serviceId },
        },
      },
      { new: true },
    );

    return NextResponse.json({
      success: true,
      message: "Employee assigned to service successfully",
      data: {
        service: updatedService,
        employee: updatedEmployee,
      },
    });
  } catch (error: any) {
    console.error("Assignment Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
