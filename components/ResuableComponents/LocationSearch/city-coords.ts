// Shared AU city lat/lng lookup for the map/search system. Matches the city
// list in lib/data/services-catalog.ts's AU_CITIES exactly (same 8 cities),
// so every pickable city resolves coordinates here.
// Framework-agnostic (no leaflet imports) — stays in the main bundle.

export const CITY_COORDS: Record<string, [number, number]> = {
  sydney: [-33.8688, 151.2093],
  melbourne: [-37.8136, 144.9631],
  brisbane: [-27.4698, 153.0251],
  perth: [-31.9505, 115.8605],
  adelaide: [-34.9285, 138.6007],
  canberra: [-35.2809, 149.13],
  hobart: [-42.8821, 147.3272],
  darwin: [-12.4634, 130.8456],
};

export const AU_CENTRE: [number, number] = [-25.27, 133.77];
export const AU_ZOOM_DESKTOP = 5;
export const AU_ZOOM_MOBILE = 4;
// A picked city should read as a city-level view (the whole metro area, its
// suburbs, and nearby results) — not the wide regional/state-level view
// zoom 9 gives. Matches the zoom level this app already used for Sydney/
// Canberra fly-tos prior to the shared map refactor.
export const CITY_ZOOM = 12;

export function resolveCityCoords(
  city?: string | null,
): [number, number] | null {
  if (!city) return null;
  return CITY_COORDS[city.toLowerCase().trim()] ?? null;
}
