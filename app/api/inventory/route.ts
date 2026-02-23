import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDb } from "@/lib/db";
import { Category, Service } from "@/server/models/Service.schema";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import User from "@/server/models/Auth.model";

export async function GET() {
  await connectToDb();
  const session = await getServerSession(authOptions);

  if (!session)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const categories = await Category.find({ user: session.user.id });

    const data = await Promise.all(
      categories.map(async (cat) => {
        const services = await Service.find({ category: cat._id });
        return { ...cat._doc, services };
      }),
    );

    return NextResponse.json({ message: "Success", data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectToDb();
  const session = await getServerSession(authOptions);

  if (!session)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { name } = await req.json();

    const dbUser = await User.findOne({ email: session.user.email });

    if (!dbUser) {
      return NextResponse.json(
        { message: "User not found in database" },
        { status: 404 },
      );
    }

    const newCategory = await Category.create({
      name,
      user: dbUser._id,
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
