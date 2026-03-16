"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, ExternalLink, Send } from "lucide-react";
import Link from "next/link";
import type { Business } from "@/lib/types";

// Fix leaflet icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

// 📍 Component to locate the user
function LocateUser({
  setUserLocation,
}: {
  setUserLocation: (coords: [number, number]) => void;
}) {
  const map = useMap();

  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        setUserLocation(coords);
        map.setView(coords, 14);
      },
      () => {
        alert("Unable to retrieve your location");
      },
    );
  };

  return (
    <div className="flex gap-2 absolute z-[1000] top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-md text-sm font-medium hover:bg-gray-100">
      <Send />
      <button onClick={handleLocate}>Current Location</button>
    </div>
  );
}

function MapController({ selectedBusiness }: { selectedBusiness: any }) {
  const map = useMap();

  useEffect(() => {
    if (
      selectedBusiness &&
      selectedBusiness.latitude &&
      selectedBusiness.longitude
    ) {
      map.flyTo(
        [Number(selectedBusiness.latitude), Number(selectedBusiness.longitude)],
        15,
        {
          duration: 3.5,
        },
      );
    }
  }, [selectedBusiness, map]);

  return null;
}

export default function EventMap({ businesses }: { businesses: any }) {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null,
  );

  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );

  const center: [number, number] = [-35.2809, 149.13];

  return (
    <div className="bg-white rounded-lg shadow-md h-full  border border-gray-200">
      <div className="relative h-[480px] bg-gray-100">
        <MapContainer
          center={center}
          zoom={12}
          style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <MapController selectedBusiness={selectedBusiness} />
          <LocateUser setUserLocation={setUserLocation} />

          {userLocation && (
            <Marker position={userLocation}>
              <Popup>You are here</Popup>
            </Marker>
          )}

          {businesses.map((business: any) =>
            business.latitude && business.longitude ? (
              <Marker
                key={business._id}
                position={[
                  Number(business.latitude),
                  Number(business.longitude),
                ]}
                eventHandlers={{
                  click: () => setSelectedBusiness(business),
                }}>
                <Popup>
                  <div>
                    <h3 className="font-bold text-lg">{business.title}</h3>

                    <p className="text-gray-600 text-sm mb-2">
                      {business.location}
                    </p>

                    <div className="flex space-x-2 mt-2">
                      <Link
                        href={`/businesses/${business.id}`}
                        className="bg-primary px-3 py-1 rounded text-sm font-medium hover:bg-primary/80 text-white">
                        View Details
                      </Link>

                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(
                          `${business.name}, ${business.location}, Canberra, Australia`,
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
            ) : null,
          )}
        </MapContainer>
      </div>

      <div className="p-4 ">
        <h3 className="font-medium text-lg mb-3 ">All Locations</h3>

        <div className="space-y-2 max-h-[300px] flex gap-2 flex-wrap overflow-y-auto">
          {businesses.map((business: any) => (
            <div
              key={business._id}
              className={`p-3 max-w-[200px] h-[50px] overflow-hidden rounded-lg cursor-pointer ${
                selectedBusiness?.id === business.id
                  ? "bg-primary/10 border-primary/30"
                  : "bg-neutral/50 hover:bg-neutral/100 border-neutral/200"
              } border`}
              onClick={() => setSelectedBusiness(business)}>
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-primary mt-0.5 mr-2 flex-shrink-0" />

                <div>
                  <h4 className="font-medium w-[100x] truncate">
                    <span className="inline-block w-[150px] truncate">
                      {business.title}
                    </span>
                  </h4>

                  {/* <p className="text-sm text-gray-600">{business.location}</p> */}

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
