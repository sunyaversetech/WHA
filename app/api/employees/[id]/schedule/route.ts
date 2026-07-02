import { connectToDb } from "@/lib/db";
import { Employee } from "@/server/models/Employee.model";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Props) {
  try {
    await connectToDb();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Employee ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { availability_schedule } = body;

    if (!Array.isArray(availability_schedule)) {
      return NextResponse.json(
        { success: false, error: "availability_schedule must be an array" },
        { status: 400 },
      );
    }

    const employee = await Employee.findByIdAndUpdate(
      id,
      { $set: { availability_schedule } },
      { new: true },
    );

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
