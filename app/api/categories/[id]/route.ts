import { connectToDb } from "@/lib/db";
import Category from "@/server/models/Category.model";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireBusinessUser } from "@/server/lib/businessAuth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDb();
    const { id } = await params;
    const auth = await requireBusinessUser(request);
    if (!auth.user) return auth.response;
    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });

    const category = await Category.findOne({ _id: id, business_id: auth.user.id });
    if (!category)
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: category }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDb();
    const { id } = await params;
    const auth = await requireBusinessUser(request);
    if (!auth.user) return auth.response;
    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });

    const { name, color, description } = await request.json();
    const category = await Category.findOneAndUpdate(
      { _id: id, business_id: auth.user.id },
      { $set: { name, color, description } },
      { new: true },
    );
    if (!category)
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: category }, { status: 200 });
  } catch (error: any) {
    if (error.code === 11000)
      return NextResponse.json(
        { success: false, error: "A category with this name already exists." },
        { status: 400 },
      );
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDb();
    const { id } = await params;
    const auth = await requireBusinessUser(request);
    if (!auth.user) return auth.response;
    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });

    const category = await Category.findOneAndDelete({
      _id: id,
      business_id: auth.user.id,
    });
    if (!category)
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Category deleted" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
