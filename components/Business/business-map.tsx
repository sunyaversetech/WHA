"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ExternalLink, Maximize2, Minimize2 } from "lucide-react";
import Link from "next/link";

if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  });
}

const WIDE_VIEW: [number, number] = [-34.57, 150.17];
const WIDE_ZOOM = 7;

function MapRefresher({ isVisible, city, isExpanded }: any) {
  const map = useMap();

  useEffect(() => {
    const resizeInterval = setInterval(() => map.invalidateSize(), 100);
    setTimeout(() => {
      clearInterval(resizeInterval);
      map.invalidateSize();
    }, 600);
    return () => clearInterval(resizeInterval);
  }, [isVisible, isExpanded, map]);

  useEffect(() => {
    if (!city || city === "All Cities") {
      map.flyTo(WIDE_VIEW, WIDE_ZOOM, { duration: 1.5 });
    } else {
      // Add more city coordinates here as needed
      const coords: [number, number] =
        city.toLowerCase() === "sydney"
          ? [-33.8688, 151.2093]
          : [-35.2809, 149.13];
      map.flyTo(coords, 12, { duration: 1.5 });
    }
  }, [city, map]);

  return null;
}

export default function BusinessMap({
  businesses,
  currentCity,
  isVisible,
  isExpanded,
  onToggleExpand,
}: any) {
  return (
    <div className="h-full w-full relative z-0">
      <button
        onClick={onToggleExpand}
        className="absolute top-4 right-4 z-[1000] p-3 bg-white rounded-xl shadow-lg border hover:bg-slate-50 transition-all">
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
        className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap"
        />
        <MapRefresher
          isVisible={isVisible}
          city={currentCity}
          isExpanded={isExpanded}
        />

        {businesses?.map((business: any) => {
          if (!business.latitude || !business.longitude) return null;
          return (
            <Marker
              key={business._id}
              position={[
                Number(business.latitude),
                Number(business.longitude),
              ]}>
              <Popup>
                <div className="p-1">
                  <h4 className="font-bold">{business.business_name}</h4>
                  <div className="flex gap-3 mt-2">
                    <Link
                      href={`/businesses/${business._id}`}
                      className="text-primary text-xs font-bold underline">
                      View Profile
                    </Link>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`}
                      target="_blank"
                      className="text-primary text-xs font-bold underline flex items-center gap-1">
                      Directions <ExternalLink size={12} />
                    </a>
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
