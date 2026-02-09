// app/api/auth/signup/route.ts
import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, category } = body;

    // 1. Validate Input
    if (!name || !email || !password || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await connectToDb();

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      category,
      provider: "credentials",
    });

    return NextResponse.json(
      { message: "User created successfully", userId: newUser._id },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("SIGNUP_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
