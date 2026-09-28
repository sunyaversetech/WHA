import User from "@/server/models/Auth.model";
import { revokeAllRefreshTokensForUser } from "./mobileTokens";

/**
 * Anonymize-in-place account deletion (the chosen approach for DELETE /me — see the
 * Phase 1 plan). The User document and its `_id` are kept, since Booking,
 * EventTicketPurchase and Review all reference `user`/`user_id` as an ObjectId with
 * `.populate()` calls throughout the business dashboard — a true hard delete would
 * leave every one of those dangling. Instead: wipe PII, replace the (unique) email
 * with a collision-proof placeholder, remove googleId/appleId/password so the
 * account can never be logged into again by any method, set `deletedAt`, and revoke
 * every outstanding refresh token immediately.
 *
 * `business_name` is deliberately left untouched — it's a unique, non-sparse index,
 * scope here is limited to what was explicitly asked for (email placeholder,
 * unset googleId/appleId) plus the obviously-PII fields "anonymize" implies (name,
 * phone, image, location, city_name), not a broader business-identity cleanup.
 */
export async function anonymizeAndDeleteAccount(userId: string): Promise<boolean> {
  const result = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        name: "Deleted User",
        email: `deleted+${userId}@invalid`,
        phone_number: "",
        image: "",
        location: "",
        city_name: "",
        deletedAt: new Date(),
      },
      $unset: { googleId: "", appleId: "", password: "" },
    },
    { new: true, runValidators: false },
  );

  if (!result) return false;

  await revokeAllRefreshTokensForUser(userId);
  return true;
}
