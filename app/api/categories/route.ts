import { connectToDb } from "@/lib/db";
import Category from "@/server/models/Category.model";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: Request) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const query: Record<string, any> = { business_id: (session.user as any).id };
    if (type === "service" || type === "resource") query.type = type;

    const categories = await Category.find(query).lean();

    return NextResponse.json({ success: true, data: categories }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, color, description, type } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 },
      );
    }

    const category = await Category.create({
      business_id: (session.user as any).id,
      name: name.trim(),
      color: color ?? "Blue",
      description: description ?? "",
      type: type === "resource" ? "resource" : "service",
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "A category with this name already exists." },
        { status: 400 },
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
