import { connectToDb } from "@/lib/db";
import { Employee } from "@/server/models/Employee.model";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const business_id = (session.user as any).id;

    await connectToDb();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Employee ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { availability_schedule, repeating_schedule_config } = body;

    if (!Array.isArray(availability_schedule)) {
      return NextResponse.json(
        { success: false, error: "availability_schedule must be an array" },
        { status: 400 },
      );
    }

    const patch: any = { availability_schedule };
    if (repeating_schedule_config) patch.repeating_schedule_config = repeating_schedule_config;

    const employee = await Employee.findOneAndUpdate(
      { _id: id, business_id },
      { $set: patch },
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
