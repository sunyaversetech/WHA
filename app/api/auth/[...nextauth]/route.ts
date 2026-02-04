import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ profile, account }) {
      if (account?.provider === "google" && profile) {
        try {
          await connectToDb();

          await User.findOneAndUpdate(
            { email: profile.email },
            {
              $set: {
                name: profile.name,
                image: (profile as any).picture,
                googleId: profile.sub,
                provider: "google",
                emailVerified: new Date(),
              },
            },
            { upsert: true, new: true },
          );
          return true;
        } catch (error) {
          console.error("Error saving Google user:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };
