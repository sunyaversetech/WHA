"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

// Shared location logic for the search bar — consumed by both the desktop
// (SearchSectionforBusiness.tsx) and mobile (MobileViewSearch/
// SearchSectionforBusiness.tsx) search bars, which otherwise have distinct
// UI shells (inline dropdown vs. stepped drawer) but identical location
// behaviour. Keeps the WHERE pill's text in sync with the URL — the single
// source of truth also read by the /search page (see useSearchLocation.ts)
// — and centralises the "which location goes into the next search" logic.
export function useLocationSearchBar() {
  const searchParams = useSearchParams();

  const [location, setLocation] = useState(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (lat && lng) return "Current location";
    return searchParams.get("city") || "";
  });
  const [geoCoords, setGeoCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (lat && lng) return { lat: Number(lat), lng: Number(lng) };
    return null;
  });
  const [locLoading, setLocLoading] = useState(false);
  const geoLabeledRef = useRef<string | null>(null);
  const justRequestedGeoRef = useRef(false);

  // Mirrors of `location`/`geoCoords`, updated synchronously wherever those
  // are set — NOT via a useEffect, which only runs after the current
  // callback returns. React state setters don't update the value a
  // closure sees until the next render, so code that sets state and then
  // immediately (synchronously) needs the fresh value in the same tick —
  // e.g. requestGeoLocation's onDone firing right after setGeoCoords, which
  // ensureLocationForSearch chains straight into applyLocationParams — would
  // otherwise read the stale pre-update value. Reading from these refs
  // instead makes that always correct regardless of render timing.
  const locationRef = useRef(location);
  const geoCoordsRef = useRef(geoCoords);

  const applyLocation = (next: string) => {
    locationRef.current = next;
    setLocation(next);
  };
  const applyGeoCoords = (next: { lat: number; lng: number } | null) => {
    geoCoordsRef.current = next;
    setGeoCoords(next);
  };

  // Picks up location changes that landed in the URL from elsewhere (e.g.
  // the /search page auto-requesting GPS on a bare visit, or a manual pan
  // setting swLat/etc) and reflects them in this pill's text. Checked in
  // the same precedence order as useSearchLocation's own mode derivation —
  // bounds (a manual pan) always win over a picked city, which itself wins
  // over GPS — so this stays correct regardless of which other params
  // happen to still be sitting in the URL.
  //
  // This is a genuine "synchronize with an external system" effect, not the
  // derived-state antipattern react-hooks/set-state-in-effect otherwise
  // warns about: searchParams changes independently of this component (the
  // /search page's own geolocation request, or a map pan, write to it), and
  // the dedup key lives in a ref, which itself may only be read/written
  // inside an effect or event handler — so this can't be restructured into
  // a render-time state adjustment the way LocationMap's popup-reset was.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (searchParams.get("swLat")) {
      applyLocation("Map Area");
      return;
    }

    const city = searchParams.get("city");
    if (city) return;

    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (!lat || !lng) return;

    const key = `${lat},${lng}`;
    if (geoLabeledRef.current === key) return;
    geoLabeledRef.current = key;

    applyGeoCoords({ lat: Number(lat), lng: Number(lng) });
    applyLocation("Current location");
  }, [searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const requestGeoLocation = (onDone?: () => void, onFail?: () => void) => {
    if (!navigator.geolocation) {
      onFail?.();
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        geoLabeledRef.current = `${latitude},${longitude}`;
        justRequestedGeoRef.current = true;
        applyGeoCoords({ lat: latitude, lng: longitude });
        applyLocation("Current location");
        setLocLoading(false);
        onDone?.();
      },
      () => {
        setLocLoading(false);
        onFail?.();
      },
      { timeout: 8000 },
    );
  };

  const selectCity = (city: string, onDone?: () => void) => {
    applyGeoCoords(null);
    applyLocation(city);
    onDone?.();
  };

  // A clean reset — clears both the display text and the underlying
  // coordinates, so a subsequent search can't silently reuse a stale point
  // that no longer matches what the pill shows.
  const clearLocation = () => {
    applyLocation("");
    applyGeoCoords(null);
  };

  // If the search bar has no active location when the user hits Search,
  // fall back to the user's current GPS position rather than submitting an
  // unconstrained (or stale) search. Proceeds either way once GPS settles —
  // on denial/unavailability there's simply nothing left to fall back to,
  // and the search shouldn't get stuck waiting on it.
  const ensureLocationForSearch = (onReady: () => void) => {
    if (locationRef.current || geoCoordsRef.current) {
      onReady();
      return;
    }
    requestGeoLocation(onReady, onReady);
  };

  // Fills `city` or `lat`/`lng` into the params the caller is building for
  // the next search, and carries the current map-area bounds forward only
  // when the location genuinely hasn't changed — otherwise a stale
  // viewport from before would point at the wrong place. A fresh "Use
  // current location" click always counts as a new location even if the
  // GPS reading happens to match the last one, so re-clicking it reliably
  // drops any leftover map-area bounds and returns the map to the GPS point.
  // Reads from the refs (not the `location`/`geoCoords` closure variables)
  // so this is correct even when called synchronously right after a fresh
  // GPS reading, in the same tick as the state update that produced it.
  const applyLocationParams = (params: URLSearchParams) => {
    const currentLocation = locationRef.current;
    const currentGeoCoords = geoCoordsRef.current;

    // Once the user has manually taken over the map, "Map Area" is a
    // display sentinel, not a real place — submitting it as `city=Map Area`
    // would send an invalid filter, and reconstructing whatever GPS/city
    // point was active before the pan would just undo it. Keep the map
    // exactly where the user put it by carrying the current bounds forward
    // unconditionally instead.
    if (currentLocation === "Map Area") {
      const swLat = searchParams.get("swLat");
      const swLng = searchParams.get("swLng");
      const neLat = searchParams.get("neLat");
      const neLng = searchParams.get("neLng");
      if (swLat && swLng && neLat && neLng) {
        params.set("swLat", swLat);
        params.set("swLng", swLng);
        params.set("neLat", neLat);
        params.set("neLng", neLng);
      }
      justRequestedGeoRef.current = false;
      return;
    }

    let sameLocation = false;
    if (currentGeoCoords) {
      params.set("lat", String(currentGeoCoords.lat));
      params.set("lng", String(currentGeoCoords.lng));
      sameLocation =
        !justRequestedGeoRef.current &&
        searchParams.get("lat") === String(currentGeoCoords.lat) &&
        searchParams.get("lng") === String(currentGeoCoords.lng);
    } else if (currentLocation) {
      params.set("city", currentLocation);
      sameLocation = searchParams.get("city") === currentLocation;
    }
    justRequestedGeoRef.current = false;

    if (sameLocation) {
      const swLat = searchParams.get("swLat");
      const swLng = searchParams.get("swLng");
      const neLat = searchParams.get("neLat");
      const neLng = searchParams.get("neLng");
      if (swLat && swLng && neLat && neLng) {
        params.set("swLat", swLat);
        params.set("swLng", swLng);
        params.set("neLat", neLat);
        params.set("neLng", neLng);
      }
    }
  };

  return {
    location,
    setLocation,
    geoCoords,
    locLoading,
    requestGeoLocation,
    selectCity,
    clearLocation,
    ensureLocationForSearch,
    applyLocationParams,
  };
}
