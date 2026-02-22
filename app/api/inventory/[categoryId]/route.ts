import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDb } from "@/lib/db";
import { Service } from "@/server/models/Service.schema";

type RouteContext = {
  params: Promise<{ categoryId: string }>;
};
export async function POST(req: Request, { params }: RouteContext) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { categoryId } = await params;
    const body = await req.json();

    const newService = await Service.create({
      ...body,
      category: categoryId,
      user: (session.user as any).id,
    });

    return NextResponse.json(
      { message: "Service created", data: newService },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Service Creation Error:", error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { categoryId: string } },
) {
  try {
    await connectToDb();
    const services = await Service.find({ category: params.categoryId });
    return NextResponse.json(
      {
        message: "Success",
        data: services,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
