import { unstable_cache } from "next/cache";
import Event from "@/server/models/Event.model";
import { Review } from "@/server/models/Review.model";
import { releaseExpiredHolds } from "@/server/lib/ticketHold";

// Single source of truth for "fetch one event by slug, with its reviews,
// after reconciling expired ticket holds" — used by both the server
// component (app/events/[id]/page.tsx, wrapped in React's cache() there)
// and the client-facing route handler (app/api/event/single-event/[id]).
// Previously this logic only lived in the route handler, so the server
// page did its own narrower query just for metadata and the full page
// always needed a second, client-side round trip to get this same data.
export async function getSingleEventData(slug: string) {
  // Reconcile any expired ticket holds for this event before computing
  // remaining availability, so the page never shows stale counts.
  const eventRef = await Event.findOne({ slug }).select("_id");
  if (eventRef) {
    await releaseExpiredHolds(eventRef._id.toString());
  }

  const event = await Event.findOne({ slug })
    .select("-options.promo_code -promo_codes")
    .populate("user", "email business_name city location image")
    .lean<any>();

  if (!event) return null;

  const reviews = await Review.find({ business_id: event._id })
    .sort({ createdAt: -1 })
    .lean();

  return { ...event, reviews };
}

// unstable_cache's `tags` are fixed per wrapped function, not per call, so
// this can't tag each event individually (`event:${slug}`) — a single
// "events" tag is invalidated by any event mutation instead (coarser, but
// simple and correct). Ticket availability inside the cached payload can
// be up to 60s stale between purchases; the ticket-hold TTL sweep already
// tolerates that same window, and a real purchase calls revalidateTag
// (see server/lib/eventTicketFinalize.ts) so it doesn't wait on the timer.
export const getCachedSingleEventData = unstable_cache(
  getSingleEventData,
  ["single-event-data"],
  { revalidate: 60, tags: ["events"] },
);
