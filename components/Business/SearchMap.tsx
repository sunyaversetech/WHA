"use client";

import LocationMap from "@/components/ResuableComponents/LocationSearch/LocationMap";
import { makeMarkerIcon, BusinessPopup } from "./business-map";
import { makeEventMarkerIcon, EventPopup } from "@/components/Event/Event-map";
import type {
  SearchLocationMode,
  Bounds,
} from "@/components/ResuableComponents/LocationSearch/useSearchLocation";

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
}) {
  const isServices = activeType === "services";
  const items = isServices ? businesses : events;

  return (
    <LocationMap
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
      showLocateButton
      isVisible={isVisible}
    />
  );
}
