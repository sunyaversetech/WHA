// Single source of truth for turning an event's stored dateRange
// value + startTime/endTime into a date (JSON-LD, the event detail page,
// and cards all use this) - fixes the "2026-04-13T14:00:00.000ZT13:00:00"
// bug from naively string-concatenating dateRange.from with startTime.
//
// Real inputs, confirmed against production data: a clean "YYYY-MM-DD"
// string (current/go-forward events), a genuine BSON Date object, or a
// full ISO timestamp string (legacy events, from before dateRange was
// saved as a plain date) - Mongoose casts a stored Date to its
// String-typed schema field via .toString() only when something coerces
// it to a string directly (that's literally how the old bug's garbled
// ".toString() GMT+0000..." output happened) - that form is a bug
// artifact, never real stored/cached data, so it's not something this
// needs to parse as input.
//
// Legacy timestamps are local midnight (in whatever timezone the
// creator's browser was in - Sydney, going by nepalinewyear/
// trnfest2026secondshow, the only two confirmed real examples) that got
// serialized to UTC. Recovering the calendar date means undoing that in
// Sydney time specifically, not the venue's own timezone - this only
// recovers which day was meant, nothing about time-of-day, which always
// comes from the separate startTime/endTime fields.
const RECOVERY_TZ = "Australia/Sydney";

function isValidTime(t: unknown): t is string {
  return typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}

// Recovers the YYYY-MM-DD calendar date a stored dateRange.from/to value
// represents. Returns null for a value that can't be parsed as a date at
// all (missing, or a genuinely invalid value).
export function getEventCalendarDate(dateVal: unknown): string | null {
  if (dateVal == null || dateVal === "") return null;

  if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    // Already clean - pass through unchanged. Deliberately not routed
    // through `new Date()` + Intl below: that would parse this as UTC
    // midnight and can shift the day by one when formatted back out in
    // a timezone, which is exactly the bug this function exists to fix,
    // not reintroduce.
    return dateVal;
  }

  const d = dateVal instanceof Date ? dateVal : new Date(dateVal as string);
  if (isNaN(d.getTime())) return null;

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: RECOVERY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// JSON-LD-ready startDate/endDate value - date, plus time if startTime/
// endTime is a valid HH:mm, with no UTC offset. Google infers the
// timezone from the venue's own PostalAddress (addressRegion +
// addressCountry), so this deliberately never emits one itself - a
// wrong fixed offset (the Albatross tour alone spans +8 to +11) would be
// worse than none.
export function formatEventJsonLdDateTime(
  dateVal: unknown,
  time?: string | null,
): string | null {
  const date = getEventCalendarDate(dateVal);
  if (!date) return null;
  return isValidTime(time) ? `${date}T${time}:00` : date;
}

// A plain local Date object for the recovered calendar date - safe to
// format with any pattern/library (toLocaleDateString, date-fns format,
// Intl.DateTimeFormat) in any runtime timezone without reintroducing a
// shift, since it's built from the already-recovered Y/M/D components
// (the local-component Date constructor, not a re-parsed string). Every
// display spot (detail page, cards) should format this rather than
// calling new Date(rawValue) directly, so they can never go back to
// disagreeing with the recovered date, even if they want a different
// pattern (e.g. a card showing "Fri, 29 Nov" vs the detail page's
// "29 Nov 2026").
export function getEventLocalDate(dateVal: unknown): Date | null {
  const date = getEventCalendarDate(dateVal);
  if (!date) return null;
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Human-readable date for UI display, e.g. "29 Nov 2026".
export function formatEventDisplayDate(dateVal: unknown): string | null {
  const localDate = getEventLocalDate(dateVal);
  if (!localDate) return null;
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(localDate);
}

// Human-readable time for UI display, e.g. "7:00 pm". Returns null for
// anything that isn't a valid HH:mm (no time set, or a legacy/garbled
// value) rather than showing a misleading fallback.
export function formatEventDisplayTime(time?: string | null): string | null {
  if (!isValidTime(time)) return null;
  const [h, m] = (time as string).split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return new Intl.DateTimeFormat("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}
