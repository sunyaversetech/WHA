import { useMemo } from "react";

// Pure distance helpers shared by the Business Services and Events map +
// search systems. Deliberately framework-agnostic (no leaflet/react-leaflet
// imports) so it stays in the main bundle rather than the ssr:false map chunk.

export function haversineMetres(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function fmtDistance(metres: number): string {
  return metres < 1000
    ? `${Math.round(metres)} m`
    : `${(metres / 1000).toFixed(1)} km`;
}

// Enriches items with a `.distance` (metres from refLat/refLng), sorts
// nearest-first, and caps results at 1000km once a reference point is set.
// Works identically for businesses and events — both shapes carry plain
// `latitude`/`longitude` fields.
export function useDistanceEnriched<
  T extends { latitude?: any; longitude?: any; distance?: number },
>(items: T[], refLat: number | null, refLng: number | null) {
  return useMemo(() => {
    const withDistance = items.map((item) => {
      if (typeof item.distance === "number") return item;
      if (refLat !== null && refLng !== null && item.latitude && item.longitude) {
        return {
          ...item,
          distance: haversineMetres(
            refLat,
            refLng,
            Number(item.latitude),
            Number(item.longitude),
          ),
        };
      }
      return item;
    });
    const sorted =
      refLat !== null && refLng !== null
        ? [...withDistance].sort((a, b) => {
            const da = typeof a.distance === "number" ? a.distance : Infinity;
            const db = typeof b.distance === "number" ? b.distance : Infinity;
            return da - db;
          })
        : withDistance;
    // Cap at 1000 km when a reference point is present
    if (refLat !== null && refLng !== null) {
      return sorted.filter(
        (item) => typeof item.distance !== "number" || item.distance <= 1000 * 1000,
      );
    }
    return sorted;
  }, [items, refLat, refLng]);
}
