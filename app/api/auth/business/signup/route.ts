import { NextRequest, NextResponse } from "next/server";
import { createCredentialsAccount } from "@/server/lib/accountCreation";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const result = await createCredentialsAccount("business", formData);

    if (!result.ok) {
      return NextResponse.json(
        { message: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json(
      {
        message: "Business registered successfully",
        success: true,
        userId: result.userId,
      },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
