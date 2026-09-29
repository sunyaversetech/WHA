// Shared field whitelists for anything that returns a User document (or a
// document populated from one) to a client. Always whitelist, never blacklist —
// a blacklist silently leaks every new field added to the schema later.
//
// These are used *in addition to* the schema-level `select: false` on
// password/token/resetPasswordToken (server/models/Auth.model.ts) — that's the
// second layer, this is the first. Neither replaces the other: a query with an
// explicit inclusion projection (like these) never needs the schema default at
// all, but the schema default still protects any query anywhere that forgets to
// apply one of these.

// A business's own public profile/listing (business directory, single business
// page). Businesses intentionally publish these fields so customers can find and
// contact them — this is the same field set the previous ad hoc blacklists on
// these routes intended to allow, minus the fields that blacklist missed
// (token, resetPasswordToken, resetPasswordExpire, verificationTokenExpire) and
// minus a few internal-only fields (provider, googleId, isblocked, emailVerified,
// accpetalltermsandcondition) that no public page has a reason to read.
export const PUBLIC_BUSINESS_FIELD_LIST = [
  "_id",
  "name",
  "business_name",
  "business_type",
  "business_category",
  "email",
  "phone_number",
  "city",
  "city_name",
  "location",
  "community",
  "image",
  "venue_images",
  "portfolio_images",
  "is24_7",
  "schedule",
  "abn_number",
  "seo_keywords",
  "seo_description",
  "isSponsor",
  "category",
  "latitude",
  "longitude",
  "geo",
  "createdAt",
] as const;

export const PUBLIC_BUSINESS_FIELDS = PUBLIC_BUSINESS_FIELD_LIST.join(" ");

// A business shown only as the organizer/owner of something else (an event, a
// deal) — narrower than the full public profile. Matches the fields these pages
// were already observed reading (name/business_name/city/location/image) plus
// email so a ticket buyer can contact the organizer, and _id/category for
// linking. No phone_number here — organizer contact for an event/deal is its own
// event/deal-level email/phone field, not the account's.
export const PUBLIC_ORGANIZER_FIELDS =
  "_id name email business_name city location image category";

// The most minimal public identity — used wherever a User doc is embedded as a
// bare reference (e.g. a review's author) and only a display name/avatar is
// needed. No email, no phone, regardless of the account's category.
export const PUBLIC_USER_SUMMARY_FIELDS = "_id name image";

/**
 * Same whitelist as PUBLIC_BUSINESS_FIELDS, applied after the fact — for the one
 * case (Favorite.item_id, a polymorphic refPath across Event/Service/Deal/User)
 * where a single Mongoose `.select()` can't be scoped to only one of the possible
 * referenced models without corrupting the others.
 */
export function pickPublicBusinessFields(doc: any): any {
  if (!doc) return doc;
  const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const picked: any = {};
  for (const key of PUBLIC_BUSINESS_FIELD_LIST) {
    if (obj[key] !== undefined) picked[key] = obj[key];
  }
  return picked;
}
