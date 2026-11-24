// Single source of truth for the /events listing's React Query key and
// param defaults - used by both the client hook (useGetAllEvents) and the
// server page.tsx prefetch, so a server-prefetched cache entry and the
// client's own query always resolve to the exact same key and hydrate
// instead of refetching.
export type EventsQueryParams = {
  category?: string | null;
  search?: string | null;
  city?: string | null;
  community?: string | null;
  from?: string | null;
  to?: string | null;
  lat?: string | null;
  lng?: string | null;
  radius?: string | null;
};

export function normalizeEventsParams(p: EventsQueryParams) {
  return {
    category: p.category || "",
    search: p.search || "",
    city: p.city || "",
    community: p.community || "",
    from: p.from || "",
    to: p.to || "",
    lat: p.lat || "",
    lng: p.lng || "",
    radius: p.radius || "",
  };
}

export function eventsQueryKey(p: EventsQueryParams): string[] {
  const n = normalizeEventsParams(p);
  return [
    "allEvents",
    n.category,
    n.search,
    n.city,
    n.community,
    n.from,
    n.to,
    n.lat,
    n.lng,
    n.radius,
  ];
}
