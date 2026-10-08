import mongoose from "mongoose";
import User from "@/server/models/Auth.model";

const slugify = (s: string) => s?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";

/**
 * Review.business_id is historically a slugified business_name, not the
 * business's real User _id (see landing/business search routes, which key
 * reviews off the same slug). Resolves either form back to the real business
 * User document.
 */
// Selected fields are a superset covering every current caller: review
// notification handlers only need _id, while the business-profile pages
// (app/businesses/[id], app/search/[id]) need the display/SEO/moderation
// fields too. Kept identical across both the by-id and by-slug branches so
// callers get a consistent shape regardless of which form was passed in —
// previously the slug branch only selected "business_name email", silently
// leaving fields like isblocked/deletedAt undefined for slug-based lookups.
const BUSINESS_RESOLVE_FIELDS =
  "business_name slug email city_name location city image business_category " +
  "seo_description seo_keywords verified isblocked deletedAt";

export async function resolveBusinessBySlugOrId(businessIdOrSlug: string) {
  // Persisted slug (set at signup, see server/lib/accountCreation.ts) is the
  // fast, indexed path and covers the vast majority of lookups post-backfill.
  const bySlug = await User.findOne(
    { category: "business", slug: businessIdOrSlug },
    BUSINESS_RESOLVE_FIELDS,
  );
  if (bySlug) return bySlug;

  // Legacy raw-id links (pre-dating the slug field) and ids used internally
  // (e.g. booking.business_id) still need to resolve.
  if (mongoose.Types.ObjectId.isValid(businessIdOrSlug)) {
    const byId = await User.findById(businessIdOrSlug, BUSINESS_RESOLVE_FIELDS);
    if (byId) return byId;
  }

  // Safety net for any business somehow missing a slug (pre-backfill, or a
  // gap in it) — falls back to the original fuzzy name match.
  const businesses = await User.find(
    { category: "business" },
    BUSINESS_RESOLVE_FIELDS,
  );
  return (
    businesses.find((b: any) => slugify(b.business_name) === businessIdOrSlug) ??
    null
  );
}
