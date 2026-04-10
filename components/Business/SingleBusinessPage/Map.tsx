"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

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
  business: any;
}

export default function Map({ latitude, longitude, business }: MapProps) {
  const lat = parseFloat(String(latitude));
  const lng = parseFloat(String(longitude));

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
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={DefaultIcon}>
          <Popup>
            <div>
              <h3 className="font-bold text-lg">{business.business_name}</h3>
              <p className="text-gray-600 text-sm mb-2">{business.location}</p>

              <div className="flex space-x-2 mt-2">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    ` ${business.location}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary px-3 py-1 rounded text-sm font-medium hover:bg-secondary/80 flex items-center text-white">
                  Get Directions
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
