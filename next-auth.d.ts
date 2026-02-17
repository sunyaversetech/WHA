import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      category: string;
    } & DefaultSession["user"];
  }

  interface User {
    category: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    category?: string;
  }
}
