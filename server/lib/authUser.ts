// The shape every mobile route (and getAuthUser, for the web-session fallback path)
// returns for "the current user". Field names deliberately mirror what
// `session.user` actually exposes today on the web (verified by reading
// `authOptions.callbacks.session` in app/api/auth/[...nextauth]/route.ts directly,
// not assumed from the Credentials providers' buildUserObject() — the two differ:
// business_category is on buildUserObject's return value but the `jwt` callback
// never copies it onto the token, so `session.user.business_category` is actually
// `undefined` in production today. AuthUser is free to carry it anyway (harmless
// extra field, populated here from a fresh DB read) — the important constraint is
// only that nothing a swapped route *already reads* goes missing.
export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  image?: string;
  category: "user" | "business" | "super-admin";
  business_name?: string;
  business_category?: string;
  business_type?: "employee_based" | "item_based" | null;
  city_name?: string;
  community_name?: string;
  location?: string;
  phone_number?: string;
  emailVerified?: Date | null;
  isblocked: boolean;
  verified: boolean;
  googleId?: string | null;
  appleId?: string | null;
};

export function toAuthUser(dbUser: any): AuthUser {
  return {
    id: dbUser._id.toString(),
    email: dbUser.email,
    name: dbUser.name,
    image: dbUser.image,
    category: dbUser.category,
    business_name: dbUser.business_name,
    business_category: dbUser.business_category,
    business_type: dbUser.business_type ?? null,
    city_name: dbUser.city_name,
    community_name: dbUser.community_name,
    location: dbUser.location,
    phone_number: dbUser.phone_number,
    emailVerified: dbUser.emailVerified ?? null,
    isblocked: dbUser.isblocked ?? false,
    verified: dbUser.verified ?? false,
    googleId: dbUser.googleId ?? null,
    appleId: dbUser.appleId ?? null,
  };
}
