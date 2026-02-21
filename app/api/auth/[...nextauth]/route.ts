import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectToDb();
        const user = await User.findOne({
          email: credentials.email.toLowerCase(),
        });

        if (!user || !user.password) return null;

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordCorrect) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          category: user.category,
          emailVerified: user.emailVerified,
          business_category: user.business_category,
          business_name: user.business_name,
          image: user.image,
        };
      },
    }),
  ],
  secret: process.env.NEXT_AUTH_SECRET!,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.category = (user as any).category;
        token.business_category = (user as any).business_category;
        token.business_name = (user as any).business_name;
        token.emailVerified = (user as any).emailVerified;
      }

      if (!token.category || token.category === "none") {
        await connectToDb();
        const dbUser = await User.findOne({ email: token.email }).lean();
        if (dbUser) {
          token.category = dbUser.category;
          token.business_category = dbUser.business_category;
          token.business_name = dbUser.business_name;
          token.emailVerified = dbUser.emailVerified;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).category = token.category;
        (session.user as any).business_category = token.business_category;
        (session.user as any).business_name = token.business_name;
        (session.user as any).verified = token.emailVerified;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
});

export { handler as GET, handler as POST };
