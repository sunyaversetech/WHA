"use client";

import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function EventLocationMap({
  latitude,
  longitude,
  location,
}: {
  latitude: number;
  longitude: number;
  location?: string;
}) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={13}
      scrollWheelZoom={false}
      className="h-full w-full z-20">
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker
        position={[latitude, longitude]}
        icon={DefaultIcon}
        eventHandlers={{
          click: () => {
            window.open(
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                location ?? "",
              )}`,
              "_blank",
            );
          },
        }}
      />
    </MapContainer>
  );
}
