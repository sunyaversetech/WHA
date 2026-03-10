"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for missing marker icons
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapProps {
  latitude?: string | number;
  longitude?: string | number;
  businessName: string;
}

export default function Map({ latitude, longitude, businessName }: MapProps) {
  // 1. Convert to numbers and validate
  const lat = parseFloat(String(latitude));
  const lng = parseFloat(String(longitude));

  // 2. Critical Safety Check: If coordinates are NaN or null, don't render the map
  if (isNaN(lat) || isNaN(lng)) {
    return (
      <div className="h-[400px] w-full bg-slate-100 flex items-center justify-center rounded-xl border border-dashed">
        <p className="text-muted-foreground text-sm">
          Location coordinates unavailable
        </p>
      </div>
    );
  }

  const position: [number, number] = [lat, lng];

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden border">
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={false}
        className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={DefaultIcon}>
          <Popup>{businessName}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
