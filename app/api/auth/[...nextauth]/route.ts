import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import bcrypt from "bcryptjs";

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
          city_name: user.city_name,
          community_name: user.community_name,
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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.mongodbId = user.id;
        token.googleId = (user as any).googleId || null;
        token.category = (user as any).category;
        token.business_name = (user as any).business_name;
        token.image = (user as any).image;
        token.city_name = (user as any).city_name;
        token.community_name = (user as any).community_name;
      }

      if (trigger === "update" && session) {
        return { ...token, ...session };
      }

      if (!user && token.email) {
        await connectToDb();
        const dbUser = await User.findOne({ email: token.email }).lean();
        if (dbUser) {
          token.mongodbId = (dbUser as any)._id.toString();
          token.category = (dbUser as any).category;
          token.business_name = (dbUser as any).business_name;
          token.image = (dbUser as any).image;
          token.city_name = (dbUser as any).city_name;
          token.community_name = (dbUser as any).community_name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.mongodbId;
        (session.user as any).googleId = token.googleId;
        (session.user as any).category = token.category;
        (session.user as any).business_name = token.business_name;
        (session.user as any).image = token.image;
        (session.user as any).city_name = token.city_name;
        (session.user as any).community_name = token.community_name;
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
