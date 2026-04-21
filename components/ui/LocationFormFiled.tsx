"use client";

import * as React from "react";
import { MapPin, Loader2, X, Navigation } from "lucide-react";
import debounce from "lodash.debounce";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationResult {
  display_name: string;
  place_id: number;
  lat: string;
  lon: string;
}

// Helper component to update map view when coordinates change
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 15);
  return null;
}

export function LocationFormField({ form }: { form: any }) {
  const [loading, setLoading] = React.useState(false);
  const [isLocating, setIsLocating] = React.useState(false);
  const [results, setResults] = React.useState<LocationResult[]>([]);
  const [showDropdown, setShowDropdown] = React.useState(false);

  const lat = form.watch("latitude");
  const lng = form.watch("longitude");

  const fetchLocations = React.useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.length < 3) {
          setResults([]);
          return;
        }
        setLoading(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=6`,
          );
          const data = await response.json();
          setResults(data);
          setShowDropdown(true);
        } catch (error) {
          console.error("Error:", error);
        } finally {
          setLoading(false);
        }
      }, 500),
    [],
  );

  const updateAddressFromCoords = async (
    latitude: number,
    longitude: number,
  ) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      );
      const data = await res.json();
      if (data.display_name) {
        form.setValue("location", data.display_name);
        form.setValue("latitude", latitude);
        form.setValue("longitude", longitude);
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
  };

  const handleSelectLocation = (result: LocationResult) => {
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);

    form.setValue("location", result.display_name);
    form.setValue("latitude", latitude);
    form.setValue("longitude", longitude);
    form.setValue("coordinates", { lat: latitude, lng: longitude });

    setShowDropdown(false);
  };

  const handleMarkerDragEnd = (e: any) => {
    const marker = e.target;
    const position = marker.getLatLng();
    updateAddressFromCoords(position.lat, position.lng);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await updateAddressFromCoords(
          pos.coords.latitude,
          pos.coords.longitude,
        );
        setIsLocating(false);
      },
      () => setIsLocating(false),
    );
  };

  return (
    <FormField
      control={form.control}
      name="location"
      render={({ field }) => (
        <FormItem className="w-full space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Location</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 py-1 px-2 text-xs gap-1"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}>
              {isLocating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Navigation className="h-3 w-3" />
              )}
              Use current location
            </Button>
          </div>

          <div className="relative group">
            <FormControl>
              <Input
                placeholder="Search for an address..."
                {...field}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  fetchLocations(e.target.value);
                }}
                className="pr-10"
              />
            </FormControl>

            {field.value && (
              <button
                type="button"
                onClick={() => {
                  form.setValue("location", "");
                  form.setValue("latitude", null);
                  form.setValue("longitude", null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Results Dropdown */}
            {showDropdown && field.value?.length >= 3 && (
              <div className="absolute top-full left-0 right-0 z-[1000] mt-1 max-h-[200px] overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                {loading ? (
                  <div className="p-4 flex justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-4 text-sm text-center">
                    No addresses found.
                  </div>
                ) : (
                  results.map((result) => (
                    <button
                      key={result.place_id}
                      type="button"
                      onClick={() => handleSelectLocation(result)}
                      className="w-full flex items-start gap-2 px-3 py-2 text-sm text-left hover:bg-accent">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0 opacity-50" />
                      <span className="truncate">{result.display_name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Map Preview */}
          {lat && lng && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <p className="text-xs text-muted-foreground italic">
                Is this correct? Drag the pin to adjust your exact location.
              </p>
              <div className="h-[250px] w-full rounded-md border overflow-hidden z-0">
                <MapContainer
                  center={[lat, lng]}
                  zoom={15}
                  scrollWheelZoom={false}
                  className="h-full w-full">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <ChangeView center={[lat, lng]} />
                  <Marker
                    position={[lat, lng]}
                    draggable={true}
                    eventHandlers={{
                      dragend: handleMarkerDragEnd,
                    }}
                  />
                </MapContainer>
              </div>
            </div>
          )}

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
