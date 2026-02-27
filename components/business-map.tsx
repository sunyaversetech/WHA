"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Business } from "@/lib/types";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

export default function BusinessMap({ businesses }: { businesses: any }) {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null,
  );
  const center: [number, number] = [-35.2809, 149.13];
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="relative h-[500px] bg-gray-100">
        <MapContainer
          center={center}
          zoom={12}
          style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {businesses.map((business: any) =>
            business.latitude && business.longitude ? (
              <Marker
                key={business.id}
                position={
                  [business.latitude, business.longitude] as [number, number]
                }
                eventHandlers={{
                  click: () => setSelectedBusiness(business),
                }}>
                <Popup>
                  <div>
                    <h3 className="font-bold text-lg">{business.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {business.location}
                    </p>
                    <div className="flex space-x-2 mt-2">
                      <Link
                        href={`/businesses/${business.id}`}
                        className="bg-primary !text-base px-3 py-1 rounded text-sm font-medium hover:bg-primary/80">
                        View Details
                      </Link>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(
                          `${business.name}, ${business.location}, Canberra, Australia`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-secondary !text-base px-3 py-1 rounded text-sm font-medium hover:bg-secondary/80 flex items-center">
                        Get Directions
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ) : null,
          )}
        </MapContainer>
      </div>

      {/* Business List */}
      <div className="p-4">
        <h3 className="font-medium text-lg mb-3">All Locations</h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {businesses.map((business: any) => (
            <div
              key={business.id}
              className={`p-3 rounded-lg cursor-pointer ${
                selectedBusiness?.id === business.id
                  ? "bg-primary/10 border-primary/30"
                  : "bg-neutral/50 hover:bg-neutral/100 border-neutral/200"
              } border`}
              onClick={() => setSelectedBusiness(business)}>
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">{business.name}</h4>
                  <p className="text-sm text-gray-600">{business.location}</p>
                  {business.phone && (
                    <p className="text-sm text-gray-600 mt-1">
                      {business.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
