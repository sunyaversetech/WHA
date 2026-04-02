"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ExternalLink, Maximize2, Minimize2, Navigation } from "lucide-react";
import Link from "next/link";

const WIDE_VIEW: [number, number] = [-34.57, 150.17];
const WIDE_ZOOM = 7;

// Fix for Leaflet marker icons in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  });
}

const CITY_COORDS: Record<string, [number, number]> = {
  sydney: [-33.8688, 151.2093],
  canberra: [-35.2809, 149.13],
  wide: [-34.57, 150.17],
  default: [-35.2809, 149.13],
};

function CityCenterHandler({ city }: { city: string }) {
  const map = useMap();

  useEffect(() => {
    const key = city?.toLowerCase();
    const coords = CITY_COORDS[key] || CITY_COORDS.default;
    map.flyTo(coords, 12, { duration: 1.5 });
  }, [city, map]);

  return null;
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

  useEffect(() => {
    const resizeInterval = setInterval(() => {
      map.invalidateSize();
    }, 100);
    const timer = setTimeout(() => {
      clearInterval(resizeInterval);
      map.invalidateSize();
    }, 600);
    return () => {
      clearInterval(resizeInterval);
      clearTimeout(timer);
    };
  }, [isVisible, map, isExpanded]);

  useEffect(() => {
    if (!city || city === "All Cities") {
      map.flyTo(WIDE_VIEW, WIDE_ZOOM, { duration: 1.5 });
    } else {
      const coords =
        city.toLowerCase() === "sydney"
          ? [-33.8688, 151.2093]
          : [-35.2809, 149.13];
      map.flyTo(coords as [number, number], 12, { duration: 1.5 });
    }
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
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );

  return (
    <div className="h-full w-full relative z-0 ">
      <button
        onClick={onToggleExpand}
        className="absolute top-4 right-4 z-[1000] p-3 bg-white rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
        title={isExpanded ? "Exit Fullscreen" : "Expand Map"}>
        {isExpanded ? (
          <Minimize2 className="h-5 w-5 text-[#6c47ff]" />
        ) : (
          <Maximize2 className="h-5 w-5 text-[#6c47ff]" />
        )}
      </button>
      <MapContainer
        center={WIDE_VIEW}
        zoom={WIDE_ZOOM}
        zoomControl={false}
        className="h-full w-full rounded-xl"
        style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

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
