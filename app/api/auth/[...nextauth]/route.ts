import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import bcrypt from "bcryptjs";

// Export this so you can use it in getServerSession(authOptions)
export const authOptions: NextAuthOptions = {
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
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        await connectToDb();
        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          const newUser = await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            provider: "google",
            googleId: profile?.sub,
            category: "user",
          });
          user.id = newUser._id.toString();
        } else {
          user.id = existingUser._id.toString();
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // On initial sign in, user object contains the data from authorize() or signIn()
      if (user) {
        token.mongodbId = user.id; // The 24-char hex ID
        token.googleId = (user as any).googleId || null;
        token.category = (user as any).category;
        token.business_name = (user as any).business_name;
      }

      // If missing data (e.g. session refresh), fetch from DB
      if (!token.mongodbId) {
        await connectToDb();
        const dbUser = await User.findOne({ email: token.email }).lean();
        if (dbUser) {
          token.mongodbId = (dbUser as any)._id.toString();
          token.googleId = (dbUser as any).googleId;
          token.category = (dbUser as any).category;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.mongodbId; // Always the valid Mongo ObjectId
        (session.user as any).googleId = token.googleId; // The long Google string
        (session.user as any).category = token.category;
        (session.user as any).business_name = token.business_name;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
