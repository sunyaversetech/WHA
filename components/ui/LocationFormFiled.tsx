"use client";

import * as React from "react";
import { MapPin, Loader2, X, Navigation } from "lucide-react";
import debounce from "lodash.debounce";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface LocationResult {
  display_name: string;
  place_id: number;
  lat: string;
  lon: string;
}

export function LocationFormField({ form }: { form: any }) {
  const [loading, setLoading] = React.useState(false);
  const [isLocating, setIsLocating] = React.useState(false);
  const [results, setResults] = React.useState<LocationResult[]>([]);
  const [showDropdown, setShowDropdown] = React.useState(false);

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

  const handleSelectLocation = (result: LocationResult) => {
    // Set the display name as the location value
    form.setValue("location", result.display_name);

    // Set latitude and longitude in separate fields
    form.setValue("latitude", parseFloat(result.lat));
    form.setValue("longitude", parseFloat(result.lon));

    // You can also set them as a nested object if preferred
    form.setValue("coordinates", {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    });

    setShowDropdown(false);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;

          // Reverse geocode to get address
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
          console.error("Error getting location details:", error);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLocating(false);
      },
    );
  };

  const handleClearLocation = () => {
    form.setValue("location", "");
    form.setValue("latitude", null);
    form.setValue("longitude", null);
    form.setValue("coordinates", null);
    setResults([]);
  };

  return (
    <FormField
      control={form.control}
      name="location"
      render={({ field }) => (
        <FormItem className="w-full">
          <div className="flex items-end justify-end mb-2">
            {/* <FormLabel>Location</FormLabel> */}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-auto py-1 px-2 text-xs gap-1"
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
                placeholder="Enter your location"
                {...field}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  fetchLocations(e.target.value);
                }}
                className="pr-10 focus-visible:ring-1"
              />
            </FormControl>

            {field.value && (
              <button
                type="button"
                onClick={handleClearLocation}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}

            {showDropdown && field.value?.length >= 3 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[300px] overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin opacity-50" />
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-4 text-sm text-center text-muted-foreground">
                    No addresses found.
                  </div>
                ) : (
                  <div className="p-1">
                    {results.map((result) => (
                      <button
                        key={result.place_id}
                        type="button"
                        onClick={() => handleSelectLocation(result)}
                        className="w-full flex items-start gap-2 rounded-sm px-2 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0 opacity-50" />
                        <span className="truncate">{result.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* {form.watch("latitude") && form.watch("longitude") && (
            <div className="mt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {form.watch("latitude").toFixed(6)},{" "}
                {form.watch("longitude").toFixed(6)}
              </span>
            </div>
          )} */}

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
