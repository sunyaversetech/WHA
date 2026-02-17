import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import Business from "@/server/models/BusinessCompletion.model";
export async function POST(req: Request) {
  try {
    await connectToDb();

    const data = await req.json();

    if (!data.business_name || !data.business_service) {
      return NextResponse.json(
        { error: "Business name and services are required." },
        { status: 400 },
      );
    }

    const newBusiness = await Business.create(data);

    return NextResponse.json(
      {
        success: true,
        message: "Business profile created successfully",
        id: newBusiness._id,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Profile Creation Error:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
