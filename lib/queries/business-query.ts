// Single source of truth for the /businesses listing's (rendered on both
// "/" and "/search") React Query key and param defaults - see
// events-query.ts for why this needs to be shared between the client hook
// and the server page.tsx prefetch.
export type BusinessQueryParams = {
  category?: string | null;
  search?: string | null;
  service?: string | null;
  city?: string | null;
  community?: string | null;
  lat?: string | null;
  lng?: string | null;
  radius?: string | null;
  swLat?: string | null;
  swLng?: string | null;
  neLat?: string | null;
  neLng?: string | null;
};

export function normalizeBusinessParams(p: BusinessQueryParams) {
  return {
    category: p.category || "",
    search: p.search || "",
    service: p.service || "",
    city: p.city || "",
    community: p.community || "",
    lat: p.lat || "",
    lng: p.lng || "",
    radius: p.radius || "",
    swLat: p.swLat || "",
    swLng: p.swLng || "",
    neLat: p.neLat || "",
    neLng: p.neLng || "",
  };
}

// Matches useGetBusiness's existing key exactly - note radius is sent to
// the API but deliberately not part of the cache key, same as today.
export function businessQueryKey(p: BusinessQueryParams): string[] {
  const n = normalizeBusinessParams(p);
  return [
    "getbusinesses",
    n.category,
    n.search,
    n.service,
    n.city,
    n.community,
    n.lat,
    n.lng,
    n.swLat,
    n.swLng,
    n.neLat,
    n.neLng,
  ];
}
