import { connectToDb } from "@/lib/db";
import User from "../models/Auth.model";

interface GoogleProfile {
  name: string;
  email: string;
  picture: string;
  sub: string; // This is the Google ID
  email_verified: boolean;
}

const handleGoogleSignIn = async (profile: GoogleProfile) => {
  await connectToDb();

  const user = await User.findOneAndUpdate(
    { email: profile.email },
    {
      $set: {
        name: profile.name,
        image: profile.picture,
        googleId: profile.sub,
        provider: "google",
        emailVerified: new Date(),
      },
    },
    { upsert: true, new: true },
  );
  return user;
};
