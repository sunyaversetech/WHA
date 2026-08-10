"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Maximize2, Minimize2, Navigation } from "lucide-react";
import { AU_CENTRE, AU_ZOOM_DESKTOP, AU_ZOOM_MOBILE, CITY_ZOOM, resolveCityCoords } from "./city-coords";
import type { Bounds, SearchLocationMode } from "./useSearchLocation";

/* ── Blue pulsing user-location dot — shared by every entity type ── */
function makeUserIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:18px;height:18px;">
      <style>@keyframes wha-loc-pulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.6);opacity:0}}</style>
      <div style="position:absolute;inset:-6px;background:rgba(66,133,244,0.22);border-radius:50%;animation:wha-loc-pulse 1.8s ease-out infinite;"></div>
      <div style="position:absolute;inset:0;background:#4285f4;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(66,133,244,0.5);"></div>
    </div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function UserLocationButton({
  programmaticRef,
}: {
  programmaticRef: React.MutableRefObject<boolean>;
}) {
  const map = useMap();
  return (
    <button
      onClick={() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((pos) => {
          programmaticRef.current = true;
          map.once("moveend", () => {
            programmaticRef.current = false;
          });
          map.flyTo([pos.coords.latitude, pos.coords.longitude], 14, {
            duration: 1,
          });
        });
      }}
      style={{
        position: "absolute",
        bottom: 80,
        right: 12,
        zIndex: 1000,
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "#fff",
        border: "1px solid #e2e8ee",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(2,12,26,0.12)",
      }}
      aria-label="Go to my location">
      <Navigation size={17} color="#0f2748" />
    </button>
  );
}

/* ── Fly to the active location, but ONLY while the user hasn't manually
   taken over the map (searchLocationMode !== "mapArea" — both "current" and
   "selectedLocation" still fly). Depends on primitive lat/lng/city/mode
   values — not a freshly-built tuple — so it does NOT re-fire on every
   unrelated re-render (that reference-identity bug is what previously
   caused the map to keep snapping back to GPS after a manual pan). ── */
function FlyToLocation({
  userLat,
  userLng,
  city,
  auZoom,
  searchLocationMode,
  programmaticRef,
  isVisible,
  isExpanded,
}: {
  userLat?: number;
  userLng?: number;
  city: string;
  auZoom: number;
  searchLocationMode: SearchLocationMode;
  programmaticRef: React.MutableRefObject<boolean>;
  isVisible: boolean;
  isExpanded: boolean;
}) {
  const map = useMap();

  // Re-checks the map's size whenever a panel it lives in resizes via a CSS
  // transition (show/hide, expand/collapse) rather than unmount/remount —
  // Leaflet doesn't pick that up on its own.
  useEffect(() => {
    map.invalidateSize();
    const t = setTimeout(() => map.invalidateSize(), 400);
    return () => clearTimeout(t);
  }, [isVisible, isExpanded, map]);

  useEffect(() => {
    if (searchLocationMode === "mapArea") return;

    const timer = setTimeout(() => {
      const target: [number, number] | null =
        userLat != null && userLng != null ? [userLat, userLng] : null;
      const centre = !target ? resolveCityCoords(city) : null;
      const dest = target ?? centre ?? AU_CENTRE;
      const zoom = target ? 14 : centre ? CITY_ZOOM : auZoom;

      programmaticRef.current = true;
      map.once("moveend", () => {
        programmaticRef.current = false;
      });
      try {
        map.flyTo(dest, zoom, { duration: 1 });
      } catch {
        programmaticRef.current = false;
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [userLat, userLng, city, auZoom, searchLocationMode, map, programmaticRef]);

  return null;
}

/* ── Fire onBoundsChange whenever the user genuinely pans or zooms — not
   when the move was our own programmatic flyTo (FlyToLocation flags that
   via programmaticRef so it isn't mistaken for a manual map-area change). ── */
function MapBoundsWatcher({
  onBoundsChange,
  programmaticRef,
}: {
  onBoundsChange: (b: Bounds) => void;
  programmaticRef: React.MutableRefObject<boolean>;
}) {
  const cbRef = useRef(onBoundsChange);
  useEffect(() => {
    cbRef.current = onBoundsChange;
  });

  useMapEvents({
    moveend(e) {
      if (programmaticRef.current) return;
      const b = e.target.getBounds();
      cbRef.current({
        swLat: b.getSouth(),
        swLng: b.getWest(),
        neLat: b.getNorth(),
        neLng: b.getEast(),
      });
    },
    zoomend(e) {
      if (programmaticRef.current) return;
      const b = e.target.getBounds();
      cbRef.current({
        swLat: b.getSouth(),
        swLng: b.getWest(),
        neLat: b.getNorth(),
        neLng: b.getEast(),
      });
    },
  });
  return null;
}

/* ══════════════════════════════════════════════
   SHARED MAP ENGINE

   Owns every generic map/location mechanic (rendering, fly-to, pan/zoom
   detection, the GPS marker, resize handling). Marker icons and popup
   content are supplied by the caller via getPosition/renderMarkerIcon/
   renderPopup, so entity-specific visuals (business rating pill + reviews
   popup vs event pin + date/venue popup) stay in their own thin wrapper
   files instead of duplicating this engine.
══════════════════════════════════════════════ */
export type LocationMapProps<T> = {
  items: T[];
  getId: (item: T) => string;
  getPosition: (item: T) => [number, number] | null;
  renderMarkerIcon: (item: T, selected: boolean) => L.DivIcon;
  renderPopup: (
    item: T,
    ctx: { userLocation: [number, number] | null; onClose: () => void },
  ) => React.ReactNode;
  currentCity: string;
  userLat?: number;
  userLng?: number;
  searchLocationMode?: SearchLocationMode;
  onBoundsChange?: (b: Bounds) => void;
  /** Events-only in-map "go to my location" button. */
  showLocateButton?: boolean;
  /** For the resize/invalidateSize effect — matters for panels that resize
   * via CSS transition rather than unmount/remount (e.g. EventsPageClient's
   * show/hide map panel); a harmless no-op otherwise. */
  isVisible?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
};

export default function LocationMap<T>({
  items,
  getId,
  getPosition,
  renderMarkerIcon,
  renderPopup,
  currentCity,
  userLat,
  userLng,
  searchLocationMode = "current",
  onBoundsChange,
  showLocateButton = false,
  isVisible = true,
  isExpanded = false,
  onToggleExpand,
}: LocationMapProps<T>) {
  const userLocation: [number, number] | null =
    userLat != null && userLng != null ? [userLat, userLng] : null;

  // Flags moves FlyToLocation/UserLocationButton trigger themselves, so
  // MapBoundsWatcher doesn't mistake our own flyTo for a manual pan.
  const programmaticRef = useRef(false);

  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  // Closes a stale popup if its item disappeared from `items` — e.g. the
  // caller swapped datasets entirely (Services ↔ Events on the same
  // persistent map instance) without the map itself remounting.
  useEffect(() => {
    if (selectedItem && !items.some((item) => getId(item) === getId(selectedItem))) {
      setSelectedItem(null);
    }
  }, [items, selectedItem, getId]);

  // Zoomed out further on mobile so the whole of Australia stays visible in
  // the initial no-location view — the same zoom level shows less area on a
  // narrow viewport than on desktop.
  const [auZoom] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 768
      ? AU_ZOOM_MOBILE
      : AU_ZOOM_DESKTOP,
  );

  const userIcon = useMemo(() => makeUserIcon(), []);

  const handleMarkerClick = (item: T) => {
    setSelectedItem((prev) => (prev && getId(prev) === getId(item) ? null : item));
  };

  return (
    <div className="h-full w-full relative z-0">
      {onToggleExpand && (
        <button
          onClick={onToggleExpand}
          className="absolute top-6 right-6 z-[1000] p-3 bg-white rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 transition-all active:scale-95 max-md:hidden"
          title={isExpanded ? "Exit Fullscreen" : "Expand Map"}>
          {isExpanded ? (
            <Minimize2 className="h-5 w-5 text-primary" />
          ) : (
            <Maximize2 className="h-5 w-5 text-primary" />
          )}
        </button>
      )}

      <MapContainer
        center={AU_CENTRE}
        zoom={auZoom}
        zoomControl={false}
        className="h-full w-full"
        style={{ height: "100%", width: "100%", position: "absolute" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {showLocateButton && (
          <UserLocationButton programmaticRef={programmaticRef} />
        )}

        <FlyToLocation
          userLat={userLat}
          userLng={userLng}
          city={currentCity}
          auZoom={auZoom}
          searchLocationMode={searchLocationMode}
          programmaticRef={programmaticRef}
          isVisible={isVisible}
          isExpanded={isExpanded}
        />
        {onBoundsChange && (
          <MapBoundsWatcher
            onBoundsChange={onBoundsChange}
            programmaticRef={programmaticRef}
          />
        )}

        {/* User location blue dot */}
        {userLocation && <Marker position={userLocation} icon={userIcon} />}

        {/* Item markers */}
        {items.map((item) => {
          const position = getPosition(item);
          if (!position) return null;
          const id = getId(item);
          const isSelected = !!selectedItem && getId(selectedItem) === id;

          return (
            <Marker
              key={id}
              position={position}
              icon={renderMarkerIcon(item, isSelected)}
              zIndexOffset={isSelected ? 1000 : 0}
              eventHandlers={{
                click: () => handleMarkerClick(item),
              }}
            />
          );
        })}
      </MapContainer>

      {selectedItem &&
        renderPopup(selectedItem, {
          userLocation,
          onClose: () => setSelectedItem(null),
        })}
    </div>
  );
}
