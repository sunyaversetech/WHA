import { connectToDb } from "@/lib/db";
import { Resource } from "@/server/models/Resource.model";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDb();
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ success: false, error: "Invalid Resource ID" }, { status: 400 });

    const resource = await Resource.findById(id).lean();
    if (!resource)
      return NextResponse.json({ success: false, error: "Resource not found" }, { status: 404 });

    if ((resource as any).business_id !== (session.user as any).id)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

    return NextResponse.json({ success: true, data: resource }, { status: 200 });
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
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ success: false, error: "Invalid Resource ID" }, { status: 400 });

    const body = await request.json();
    const resource = await Resource.findById(id);
    if (!resource)
      return NextResponse.json({ success: false, error: "Resource not found" }, { status: 404 });

    if (resource.business_id !== (session.user as any).id)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

    Object.assign(resource, body);
    await resource.save();

    return NextResponse.json({ success: true, data: resource }, { status: 200 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "A resource with this name already exists for your business." },
        { status: 400 },
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDb();
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ success: false, error: "Invalid Resource ID" }, { status: 400 });

    const resource = await Resource.findById(id);
    if (!resource)
      return NextResponse.json({ success: false, error: "Resource not found" }, { status: 404 });

    if (resource.business_id !== (session.user as any).id)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

    await resource.deleteOne();

    return NextResponse.json({ success: true, message: "Resource deleted" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
