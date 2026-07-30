import mongoose from "mongoose";
import User from "@/server/models/Auth.model";

const slugify = (s: string) => s?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";

/**
 * Review.business_id is historically a slugified business_name, not the
 * business's real User _id (see landing/business search routes, which key
 * reviews off the same slug). Resolves either form back to the real business
 * User document.
 */
export async function resolveBusinessBySlugOrId(businessIdOrSlug: string) {
  if (mongoose.Types.ObjectId.isValid(businessIdOrSlug)) {
    const byId = await User.findById(businessIdOrSlug);
    if (byId) return byId;
  }
  const businesses = await User.find(
    { category: "business" },
    "business_name email",
  );
  return (
    businesses.find((b: any) => slugify(b.business_name) === businessIdOrSlug) ??
    null
  );
}
