"use client";

import { useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import { Plus, Minus, Maximize2, Minimize2 } from "lucide-react";
import LocationMap from "@/components/ResuableComponents/LocationSearch/LocationMap";
import { makeMarkerIcon, BusinessPopup } from "./business-map";
import { makeEventMarkerIcon, EventPopup } from "@/components/Event/Event-map";
import type {
  SearchLocationMode,
  Bounds,
} from "@/components/ResuableComponents/LocationSearch/useSearchLocation";

const glassStyle: React.CSSProperties = {
  background: "linear-gradient(rgba(255,255,255,.7), rgba(255,255,255,.7))",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  boxShadow: "var(--shadow-floating)",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--foreground)",
};

// The /search page's map — ONE persistent Leaflet instance shared by the
// Services and Events tabs, rather than two separately-mounted maps. That
// matters: mounting/unmounting a fresh <BusinessMap>/<EventMap> on every tab
// switch would destroy and recreate the Leaflet map each time, which
// resets its position back to the default view whenever the user has
// manually taken over the map (searchLocationMode "mapArea" deliberately
// skips the fly-to-GPS/city effect on mount). Rendering one LocationMap and
// only swapping which dataset/markers/popup it displays keeps the map's
// centre and zoom untouched across tab switches.
export default function SearchMap({
  activeType,
  businesses,
  events,
  currentCity,
  userLat,
  userLng,
  searchLocationMode,
  bounds,
  onBoundsChange,
  isVisible = true,
  hideControls = false,
  isExpanded = false,
  onExpandClick,
}: {
  activeType: "services" | "events";
  businesses: any[];
  events: any[];
  currentCity: string;
  userLat?: number;
  userLng?: number;
  searchLocationMode?: SearchLocationMode;
  /** Raw mapArea viewport rectangle — lets a fresh mount restore the exact
   * previous centre/zoom (e.g. navigating to a detail page and back)
   * instead of resetting to the default view. */
  bounds?: Bounds | null;
  onBoundsChange?: (b: Bounds) => void;
  /** Whether the map's container is currently visible on screen — the
   * container itself must stay mounted even when this is false (CSS-hidden,
   * not unmounted) so position/zoom/selection survive a hide/show toggle;
   * this only tells LocationMap when to re-check its size. */
  isVisible?: boolean;
  /** Hides the glass expand/zoom controls — used in the mobile full-screen
   * map mode, which has its own close/back affordance instead. */
  hideControls?: boolean;
  /** Whether the caller is currently showing this map full-screen — just
   * flips the expand button's icon, the actual full-screen layout is
   * BusinessPage's concern. */
  isExpanded?: boolean;
  onExpandClick?: () => void;
}) {
  const isServices = activeType === "services";
  const items = isServices ? businesses : events;
  const mapRef = useRef<LeafletMap | null>(null);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
    <LocationMap
      onMapReady={(map) => { mapRef.current = map; }}
      items={items}
      getId={(item: any) => item._id}
      getPosition={(item: any) =>
        item.latitude && item.longitude
          ? [Number(item.latitude), Number(item.longitude)]
          : null
      }
      renderMarkerIcon={(item: any, selected) => {
        if (isServices) {
          const avgRating =
            item.reviews?.length > 0
              ? (
                  item.reviews.reduce(
                    (acc: number, r: any) => acc + r.rating,
                    0,
                  ) / item.reviews.length
                ).toFixed(1)
              : null;
          return makeMarkerIcon(avgRating, selected);
        }
        return makeEventMarkerIcon(selected);
      }}
      renderPopup={(item, ctx) =>
        isServices ? (
          <BusinessPopup
            business={item}
            userLocation={ctx.userLocation}
            onClose={ctx.onClose}
          />
        ) : (
          <EventPopup
            event={item}
            userLocation={ctx.userLocation}
            onClose={ctx.onClose}
          />
        )
      }
      currentCity={currentCity}
      userLat={userLat}
      userLng={userLng}
      searchLocationMode={searchLocationMode}
      bounds={bounds}
      onBoundsChange={onBoundsChange}
      isVisible={isVisible}
    />

    {!hideControls && (
      <>
        <button
          data-ui="map-expand-button"
          onClick={onExpandClick}
          aria-label={isExpanded ? "Exit fullscreen" : "Expand map"}
          style={{ ...glassStyle, position: "absolute", top: 20, right: 20, width: 48, height: 48, borderRadius: 9999, zIndex: 1000 }}>
          {isExpanded ? (
            <Minimize2 size={24} strokeWidth={1.75} />
          ) : (
            <Maximize2 size={24} strokeWidth={1.75} />
          )}
        </button>
        <div
          data-ui="map-zoom-group"
          style={{ ...glassStyle, position: "absolute", right: 20, bottom: 20, width: 48, height: 96, borderRadius: 24, flexDirection: "column", zIndex: 1000 }}>
          <button
            onClick={() => mapRef.current?.zoomIn()}
            aria-label="Zoom in"
            style={{ width: 48, height: 48, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "inherit" }}>
            <Plus size={24} strokeWidth={1.75} />
          </button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            aria-label="Zoom out"
            style={{ width: 48, height: 48, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "inherit" }}>
            <Minus size={24} strokeWidth={1.75} />
          </button>
        </div>
      </>
    )}
    </div>
  );
}
