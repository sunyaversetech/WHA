"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons broken by webpack asset hashing
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const AU_CENTER: [number, number] = [-25.2744, 133.7751];
const AU_BOUNDS: [[number, number], [number, number]] = [
  [-44, 112],
  [-10, 154],
];

interface Props {
  lat: number | null;
  lng: number | null;
  onDragEnd: (lat: number, lng: number) => void;
}

function MapContent({ lat, lng, onDragEnd }: Props) {
  const map = useMap();

  useEffect(() => {
    if (lat !== null && lng !== null) {
      map.setView([lat, lng], Math.max(map.getZoom(), 14), { animate: true });
    }
  }, [lat, lng, map]);

  const pos: [number, number] =
    lat !== null && lng !== null ? [lat, lng] : AU_CENTER;

  return (
    <Marker
      position={pos}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const p = (e.target as L.Marker).getLatLng();
          onDragEnd(p.lat, p.lng);
        },
      }}
    />
  );
}

export default function LocationMap({ lat, lng, onDragEnd }: Props) {
  return (
    <MapContainer
      center={AU_CENTER}
      zoom={4}
      style={{
        width: "100%",
        height: 320,
        borderRadius: 12,
        border: "1.5px solid #e2e8f0",
        zIndex: 1,
      }}
      maxBounds={AU_BOUNDS}
      maxBoundsViscosity={0.9}
      minZoom={3}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <MapContent lat={lat} lng={lng} onDragEnd={onDragEnd} />
    </MapContainer>
  );
}
