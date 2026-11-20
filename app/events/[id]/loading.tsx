import EventDetailsSkeleton from "@/components/Event/SingleEventSkeleton";

// Next.js shows this instantly on navigation while the route segment
// loads — with the card's hover prefetch (components/cards/event-card.tsx)
// the segment is usually already fetched, so this paints at 0ms instead of
// after a round trip.
export default function Loading() {
  return <EventDetailsSkeleton />;
}
