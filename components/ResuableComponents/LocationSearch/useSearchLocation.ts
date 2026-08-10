"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resolveCityCoords } from "./city-coords";

export type SearchLocationMode = "current" | "mapArea" | "selectedLocation";

export type Bounds = {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
};

// Shared page-level location state for any listing page that wants a
// "search near me" experience (GPS auto-request, manual map-area override,
// city selection) — currently consumed by the /search page for both the
// Services and Events tabs. The URL is the single source of truth, which is
// how this stays in sync with the search bar mounted separately in the
// Navbar (see useLocationSearchBar.ts) without any shared React state.
export function useSearchLocation() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const userLat = searchParams.get("lat")
    ? Number(searchParams.get("lat"))
    : null;
  const userLng = searchParams.get("lng")
    ? Number(searchParams.get("lng"))
    : null;

  // Map bounds are only ever written by a genuine user pan/zoom (see
  // MapBoundsWatcher's programmaticRef guard in LocationMap.tsx) — so their
  // mere presence is an honest "the user has taken manual control of the
  // map" signal.
  const swLat = searchParams.get("swLat")
    ? Number(searchParams.get("swLat"))
    : null;
  const swLng = searchParams.get("swLng")
    ? Number(searchParams.get("swLng"))
    : null;
  const neLat = searchParams.get("neLat")
    ? Number(searchParams.get("neLat"))
    : null;
  const neLng = searchParams.get("neLng")
    ? Number(searchParams.get("neLng"))
    : null;
  const hasBounds =
    swLat !== null && swLng !== null && neLat !== null && neLng !== null;

  const currentCity = searchParams.get("city") || "";

  const searchLocationMode: SearchLocationMode = hasBounds
    ? "mapArea"
    : currentCity
      ? "selectedLocation"
      : "current";

  const mapAreaCenter =
    hasBounds && swLat !== null && swLng !== null && neLat !== null && neLng !== null
      ? { lat: (swLat + neLat) / 2, lng: (swLng + neLng) / 2 }
      : null;
  const selectedCityCoords = resolveCityCoords(currentCity);

  // Reference point for distance sort/filter: the visible map area's centre
  // once the user has taken over the map, the picked city's coordinates
  // once one is selected, otherwise the user's GPS position. The GPS marker
  // itself always uses userLat/userLng directly, regardless of mode.
  const refLat =
    searchLocationMode === "mapArea"
      ? mapAreaCenter!.lat
      : searchLocationMode === "selectedLocation"
        ? (selectedCityCoords?.[0] ?? null)
        : userLat;
  const refLng =
    searchLocationMode === "mapArea"
      ? mapAreaCenter!.lng
      : searchLocationMode === "selectedLocation"
        ? (selectedCityCoords?.[1] ?? null)
        : userLng;

  // On a bare page visit (no lat/lng, city, or map bounds yet set), ask the
  // browser for the user's location so results and the map default to
  // "near me" instead of an unfiltered nationwide view.
  const geoRequestedRef = useRef(false);
  const [geoDenied, setGeoDenied] = useState(false);
  useEffect(() => {
    if (geoRequestedRef.current) return;
    const hasLocationContext =
      searchParams.get("lat") ||
      searchParams.get("city") ||
      searchParams.get("swLat");
    if (hasLocationContext) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    geoRequestedRef.current = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", String(pos.coords.latitude));
        params.set("lng", String(pos.coords.longitude));
        router.replace(`/search?${params.toString()}`, { scroll: false });
      },
      () => setGeoDenied(true),
      { timeout: 8000 },
    );
  }, [searchParams, router]);

  const boundsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleBoundsChange = useCallback(
    (bounds: Bounds) => {
      if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current);
      boundsTimerRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        // A manual pan/zoom always supersedes whatever discrete point
        // (a picked city) was previously driving the search — otherwise a
        // stale `city` filter keeps constraining results to the old city
        // even though the visible map area has moved elsewhere, and the
        // search bar can't tell mapArea mode has taken over (see the
        // precedence check in useLocationSearchBar's URL-sync effect).
        params.delete("city");
        params.set("swLat", String(bounds.swLat));
        params.set("swLng", String(bounds.swLng));
        params.set("neLat", String(bounds.neLat));
        params.set("neLng", String(bounds.neLng));
        router.replace(`/search?${params.toString()}`, { scroll: false });
      }, 600);
    },
    [searchParams, router],
  );

  return {
    userLat,
    userLng,
    searchLocationMode,
    refLat,
    refLng,
    geoDenied,
    handleBoundsChange,
    currentCity,
  };
}
