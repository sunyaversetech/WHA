"use client";

import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Navigation, Search, Loader2, MapPin } from "lucide-react";

// --- Fix for Leaflet Default Icon ---
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// --- Helper: Move Map Camera ---
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13);
  }, [center, map]);
  return null;
}

// --- Helper: Handle Map Clicks ---
function MapEventsHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapPickerProps {
  form: UseFormReturn<any>;
}

export default function MapPicker({ form }: MapPickerProps) {
  const lat = form.watch("latitude");
  const lng = form.watch("longitude");
  const locationName = form.watch("location");

  const [searchQuery, setSearchQuery] = useState(locationName || "");
  const [results, setResults] = useState<
    { display_name: string; lat: string; lon: string }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  const defaultCenter: [number, number] = [-33.8688, 151.2093]; // Sydney

  // 1. Search Logic
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      );
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // 2. Selection Logic
  const handleSelectLocation = (
    display_name: string,
    latStr: string,
    lonStr: string,
  ) => {
    const newLat = parseFloat(latStr);
    const newLon = parseFloat(lonStr);

    form.setValue("location", display_name);
    form.setValue("latitude", newLat);
    form.setValue("longitude", newLon);

    setSearchQuery(display_name);
    setResults([]);
  };

  // 3. Current Location Logic
  const handleGeolocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      form.setValue("latitude", latitude);
      form.setValue("longitude", longitude);

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        );
        const data = await res.json();
        const addr = data.display_name || "Current Location";
        form.setValue("location", addr);
        setSearchQuery(addr);
      } catch (e) {
        form.setValue("location", "Selected Location");
      }
    });
  };

  // 4. Map Click Logic
  const handleMapClick = async (clickedLat: number, clickedLng: number) => {
    form.setValue("latitude", clickedLat);
    form.setValue("longitude", clickedLng);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${clickedLat}&lon=${clickedLng}`,
      );
      const data = await res.json();
      const addr = data.display_name || "Custom Point";
      form.setValue("location", addr);
      setSearchQuery(addr);
    } catch (e) {
      form.setValue("location", "Custom Point");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search Header */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pr-10"
          />
          <div className="absolute right-3 top-2.5 text-muted-foreground">
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </div>

          {/* Results Dropdown */}
          {results.length > 0 && (
            <div className="absolute z-[1001] w-full bg-white border rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
              {results.map((res, i) => (
                <button
                  key={i}
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 transition-colors border-b last:border-0"
                  onClick={() =>
                    handleSelectLocation(res.display_name, res.lat, res.lon)
                  }>
                  <p className="font-medium truncate">{res.display_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={handleGeolocation}
          className="shrink-0">
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Map Display */}
      <div className="h-[300px] w-full rounded-xl border-2 border-slate-100 overflow-hidden relative z-0">
        <MapContainer
          center={[lat || defaultCenter[0], lng || defaultCenter[1]]}
          zoom={12}
          scrollWheelZoom={true}
          className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapEventsHandler onLocationSelect={handleMapClick} />
          <ChangeView
            center={[lat || defaultCenter[0], lng || defaultCenter[1]]}
          />

          {lat && lng && <Marker position={[lat, lng]} icon={icon} />}
        </MapContainer>
      </div>

      {/* <div className="flex justify-between px-1">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
          <MapPin className="h-3 w-3" />
          {lat?.toFixed(4)}, {lng?.toFixed(4)}
        </div>
      </div> */}
    </div>
  );
}
