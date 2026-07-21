import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import bcrypt from "bcryptjs";

function buildUserObject(user: any) {
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
    isblocked: user.isblocked,
    location: user.location,
    phone_number: user.phone_number,
    business_type: user.business_type,
    verified: user.verified,
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      id: "user-credentials",
      name: "User Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectToDb();
        const user = await User.findOne({
          email: credentials.email.toLowerCase(),
          category: "user",
        });
        if (!user || !user.password) return null;
        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;
        return buildUserObject(user);
      },
    }),

    CredentialsProvider({
      id: "business-credentials",
      name: "Business Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectToDb();
        const user = await User.findOne({
          email: credentials.email.toLowerCase(),
          category: { $in: ["business", "super-admin"] },
        });
        if (!user || !user.password) return null;
        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;
        return buildUserObject(user);
      },
    }),
  ],

  secret: process.env.NEXT_AUTH_SECRET!,
  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectToDb();
        const existing = await User.findOne({
          email: user.email?.toLowerCase(),
        });

        // Google is login-only — block if account does not already exist
        if (!existing) return false;

        user.id = existing._id.toString();
        (user as any).category = existing.category;
        (user as any).business_name = existing.business_name;
        (user as any).image = existing.image;
        (user as any).city_name = existing.city_name;
        (user as any).community_name = existing.community_name;
        (user as any).isblocked = existing.isblocked;
        (user as any).verified = existing.verified;
        (user as any).location = existing.location;
        (user as any).phone_number = existing.phone_number;
        (user as any).business_type = existing.business_type;

        if (!existing.emailVerified) {
          await User.findByIdAndUpdate(existing._id, {
            emailVerified: new Date(),
          });
          user.emailVerified = new Date();
        }
      }
      return true;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.mongodbId = user.id;
        token.googleId = (user as any).googleId ?? null;
        token.category = (user as any).category;
        token.business_name = (user as any).business_name;
        token.image = (user as any).image;
        token.city_name = (user as any).city_name;
        token.community_name = (user as any).community_name;
        token.emailVerified = (user as any).emailVerified ?? "";
        token.isblocked = (user as any).isblocked ?? false;
        token.verified = (user as any).verified ?? false;
        token.location = (user as any).location ?? "";
        token.phone_number = (user as any).phone_number ?? "";
        token.business_type = (user as any).business_type ?? null;
      }

      if (trigger === "update" && session) {
        return { ...token, ...session };
      }

      // Re-hydrate from DB on token refresh (keeps profile changes live)
      if (!user && token.email) {
        await connectToDb();
        const dbUser = (await User.findOne({
          email: token.email,
        }).lean()) as any;
        if (dbUser) {
          token.mongodbId = dbUser._id.toString();
          token.category = dbUser.category;
          token.business_name = dbUser.business_name;
          token.image = dbUser.image;
          token.city_name = dbUser.city_name;
          token.community_name = dbUser.community_name;
          token.emailVerified = dbUser.emailVerified ?? "";
          token.isblocked = dbUser.isblocked ?? false;
          token.verified = dbUser.verified ?? false;
          token.location = dbUser.location ?? "";
          token.phone_number = dbUser.phone_number ?? "";
          token.business_type = dbUser.business_type ?? null;
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
        (session.user as any).emailVerified = token.emailVerified;
        (session.user as any).isblocked = token.isblocked;
        (session.user as any).verified = token.verified;
        (session.user as any).location = token.location;
        (session.user as any).phone_number = token.phone_number;
        (session.user as any).business_type = token.business_type;
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
