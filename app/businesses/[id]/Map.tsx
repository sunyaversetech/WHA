"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapProps {
  location: string;
  businessName: string;
}

export default function BusinessMap({ location, businessName }: MapProps) {
  const coords = location.split(",").map(Number) as [number, number];

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden border">
      <MapContainer
        center={coords}
        zoom={15}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={coords} icon={icon}>
          <Popup>{businessName}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
