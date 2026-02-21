import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      category?: string;
      business_category?: string;
      business_name?: string;
      verified?: Date | string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    category?: string;
    business_category?: string;
    business_name?: string;
    emailVerified?: Date | string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    category?: string;
    business_category?: string;
    business_name?: string;
    emailVerified?: Date | string;
  }
}
