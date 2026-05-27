import { z } from "zod";
// app/api/membership/route.ts
import { NextResponse } from "next/server";
// app/actions/schema.ts

export const membershipFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  telephone: z.string().min(5, "Telephone is required"),
  email: z.string().email("Invalid email address"),

  // Optional Spouse Fields
  spouseName: z.string().optional(),
  spouseTelephone: z.string().optional(),
  spouseEmail: z
    .string()
    .email()
    .optional()
    .or(z.string().or(z.literal(""))),

  otherFamilyMembers: z.string().optional(),
  totalFamilyMembers: z.string().transform((val) => parseInt(val, 10) || 1),
  address: z.string().min(5, "Address is required"),
  specialInterests: z.string().optional(),

  // Membership & Payment
  membershipPlan: z.string(),
  lifeMemberAmount: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : null)),
  paymentMethod: z.enum(["direct_deposit", "cash", "card", "cheque"]), // adjust enums based on your needs
  paymentAmount: z.string().transform((val) => parseFloat(val) || 0),

  // Conditional fields
  directDepositAccountName: z.string().optional(),
  cashReceivedBy: z.string().optional(),

  // Dates
  applicantDate: z.string(),
  spouseDate: z.string().optional(),
});

export type MembershipFormInput = z.infer<typeof membershipFormSchema>;
// 1. Define allowed origins (Replace '*' with specific domains like 'https://yourfrontend.com' for better security)
const ALLOWED_ORIGIN = "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 2. Handle CORS Preflight (OPTIONS) Requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// 3. Your Post Handler with CORS Headers Attached
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body against your defaultValues configuration
    const validatedFields = membershipFormSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { success: false, errors: validatedFields.error.flatten().fieldErrors },
        {
          status: 400,
          headers: corsHeaders, // Ensure CORS headers are sent back on bad requests
        },
      );
    }

    const data = validatedFields.data;

    // TODO: Perform your database insertion here (e.g., MongoDB, Prisma, PostgreSQL)
    console.log("Saving via API Route with CORS allowed:", data);

    return NextResponse.json(
      { success: true, message: "Saved successfully" },
      { status: 201, headers: corsHeaders },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500, headers: corsHeaders },
    );
  }
}
