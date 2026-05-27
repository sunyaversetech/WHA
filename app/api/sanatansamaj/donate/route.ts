// app/api/donate/route.ts
import { NextResponse } from "next/server";
// app/api/donate/schema.ts
import { z } from "zod";

export const donationSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  amount: z.coerce.number().positive("Donation amount must be greater than 0"),
  donationType: z.enum([
    "One-time Donation",
    "Monthly Recurring",
    "Annual Donation",
  ]),
  isAnonymous: z.boolean().default(false),
});

export type DonationFormValues = z.infer<typeof donationSchema>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Replace with your production domain URL later
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validationResult = donationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400, headers: corsHeaders },
      );
    }

    const secureData = validationResult.data;

    console.log("Secure Donation payload received:", secureData);

    return NextResponse.json(
      { success: true, message: "Donation entry captured successfully" },
      { status: 201, headers: corsHeaders },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal Server Processing Error" },
      { status: 500, headers: corsHeaders },
    );
  }
}
