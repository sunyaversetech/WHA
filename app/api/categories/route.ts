import { connectToDb } from "@/lib/db";
import Category from "@/server/models/Category.model";
import { NextResponse } from "next/server";
import { requireBusinessUser } from "@/server/lib/businessAuth";

export async function GET(request: Request) {
  try {
    await connectToDb();
    const auth = await requireBusinessUser(request);
    if (!auth.user) return auth.response;

    const categories = await Category.find({
      business_id: auth.user.id,
    }).lean();

    return NextResponse.json(
      { success: true, data: categories },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDb();
    const auth = await requireBusinessUser(request);
    if (!auth.user) return auth.response;

    const body = await request.json();
    const { name, color, description } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 },
      );
    }

    const category = await Category.create({
      business_id: auth.user.id,
      name: name.trim(),
      color: color ?? "Blue",
      description: description ?? "",
    });

    return NextResponse.json(
      { success: true, data: category },
      { status: 201 },
    );
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "A category with this name already exists." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
