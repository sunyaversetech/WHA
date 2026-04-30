"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ExternalLink, Maximize2, Minimize2 } from "lucide-react";
import Link from "next/link";
import { UserLocationButton } from "../Business/business-map";

const WIDE_VIEW: [number, number] = [-34.57, 150.17];
const WIDE_ZOOM = 7;

if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  });
}

function MapRefresher({
  isVisible,
  city,
  isExpanded,
}: {
  isVisible: boolean;
  city: string;
  isExpanded: boolean;
}) {
  const map = useMap();

  // 1. Handle Mobile Resize & Drawer Opening
  useEffect(() => {
    if (!map) return;

    // Trigger immediate refresh
    map.invalidateSize();

    // Trigger delayed refresh to catch the end of CSS transitions/drawer animations
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 500);

    return () => clearTimeout(timer);
  }, [isVisible, isExpanded, map]);

  // 2. Handle City Flying (with NaN protection)
  useEffect(() => {
    if (!map) return;

    let coords: [number, number] = WIDE_VIEW;
    let zoom = WIDE_ZOOM;

    if (city && city !== "All Cities") {
      const lowerCity = city.toLowerCase().trim();
      if (lowerCity === "sydney") {
        coords = [-33.8688, 151.2093];
        zoom = 12;
      } else if (lowerCity === "canberra") {
        coords = [-35.2809, 149.13];
        zoom = 12;
      }
    }

    if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return;

    const timer = setTimeout(() => {
      try {
        const center = map.getCenter();
        if (!center || isNaN(center.lat) || isNaN(center.lng)) {
          map.invalidateSize();
        }
        map.flyTo(coords, zoom, { duration: 1.5 });
      } catch (e) {}
    }, 520);

    return () => clearTimeout(timer);
  }, [city, map]);

  return null;
}

export default function EventMap({
  businesses,
  currentCity,
  isVisible,
  isExpanded,
  onToggleExpand,
}: {
  businesses: any[];
  currentCity: string;
  isVisible: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  return (
    <div className="h-full w-full relative z-0">
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

      <MapContainer
        center={WIDE_VIEW}
        zoom={WIDE_ZOOM}
        zoomControl={false}
        className="h-full w-full rounded-xl "
        style={{ height: "100%", width: "100%", position: "absolute" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <UserLocationButton />

        <MapRefresher
          isVisible={isVisible}
          city={currentCity}
          isExpanded={isExpanded}
        />

        {businesses.map((business: any) => {
          const slug = business.title.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (!business.latitude) return;
          return (
            <Marker
              key={business._id}
              position={[
                Number(business.latitude),
                Number(business.longitude),
              ]}>
              <Popup>
                <div className="p-2 ">
                  <h4 className="font-bold">{business.title}</h4>
                  <div className="flex gap-4">
                    <Link
                      href={`/events/${slug}`}
                      className="text-[#6c47ff] text-xs font-bold underline">
                      View Event
                    </Link>
                    <Link
                      href={`https://www.google.com/maps/?q=${business.latitude},${business.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#6c47ff] text-xs font-bold underline flex">
                      Get Direction <ExternalLink size={15} />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
