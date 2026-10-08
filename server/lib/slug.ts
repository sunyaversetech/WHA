import mongoose from "mongoose";

// Shared slug convention used across Event, Deal and Business — lowercase,
// alphanumeric only, no separators (matches the pre-existing Event slug
// format and the business-name fuzzy-match formula in lib/resolve-business.ts,
// so URLs stay consistent across all three entity types).
export function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "");
}

// Matches either the new slug or the legacy raw ObjectId, so links/bookmarks
// made before a model had a slug field keep working.
export function slugOrIdFilter(idOrSlug: string) {
  return mongoose.Types.ObjectId.isValid(idOrSlug)
    ? { $or: [{ slug: idOrSlug }, { _id: idOrSlug }] }
    : { slug: idOrSlug };
}
