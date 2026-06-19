import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      category?: string;
      business_category?: string;
      business_name?: string;
      emailVerified?: Date | string;
      verified?: Date | string;
      isblocked?: boolean;
      location?: string;
      phone_number?: string;
      business_type?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    category?: string;
    business_category?: string;
    business_name?: string;
    emailVerified?: Date | string;
    isblocked?: boolean;
    location?: string;
    phone_number?: string;
    business_type?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    category?: string;
    business_category?: string;
    business_name?: string;
    emailVerified?: Date | string;
    location?: string;
    phone_number?: string;
    business_type?: string | null;
  }
}
