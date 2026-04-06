"use client";

import * as React from "react";
import { MapPin, Loader2, X, Navigation } from "lucide-react";
import debounce from "lodash.debounce";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LocationResult {
  display_name: string;
  place_id: number;
  lat: string;
  lon: string;
}

export function ProfileLocationFormField() {
  const { control, setValue, watch } = useFormContext();

  const [loading, setLoading] = React.useState(false);
  const [isLocating, setIsLocating] = React.useState(false);
  const [results, setResults] = React.useState<LocationResult[]>([]);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchLocations = React.useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.length < 3) {
          setResults([]);
          setShowDropdown(false);
          return;
        }
        setLoading(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6`,
          );
          const data = await response.json();
          setResults(data);
          setShowDropdown(true);
        } catch (error) {
          console.error("Search Error:", error);
        } finally {
          setLoading(false);
        }
      }, 500),
    [],
  );

  // Cleanup debounce on unmount
  React.useEffect(() => {
    return () => fetchLocations.cancel();
  }, [fetchLocations]);

  const handleSelectLocation = (result: LocationResult) => {
    setValue("location", result.display_name, { shouldDirty: true });
    setValue("latitude", parseFloat(result.lat));
    setValue("longitude", parseFloat(result.lon));
    setShowDropdown(false);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          const data = await res.json();
          if (data.display_name) {
            setValue("location", data.display_name, { shouldDirty: true });
            setValue("latitude", latitude);
            setValue("longitude", longitude);
          }
        } catch (error) {
          console.error("Reverse Geocode Error:", error);
        } finally {
          setIsLocating(false);
        }
      },
      () => setIsLocating(false),
    );
  };

  return (
    <FormField
      control={control}
      name="location"
      render={({ field }) => (
        <FormItem className="w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Address
            </span>
            <Button
              type="button"
              variant="ghost"
              className="h-6 text-[10px] gap-1 px-1 text-[#7C3AED] hover:text-[#7C3AED] hover:bg-[#7C3AED]/10"
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

          <div className="relative" ref={dropdownRef}>
            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  placeholder="Search for address..."
                  className="pr-8 bg-white border-gray-100 focus-visible:ring-[#7C3AED]"
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    fetchLocations(e.target.value);
                  }}
                  onFocus={() => {
                    if (results.length > 0) setShowDropdown(true);
                  }}
                />
                {field.value && (
                  <button
                    type="button"
                    onClick={() => {
                      setValue("location", "");
                      setValue("latitude", null);
                      setValue("longitude", null);
                      setResults([]);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </FormControl>

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 z-[100] mt-1 max-h-[240px] overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl">
                {loading ? (
                  <div className="flex items-center justify-center p-6">
                    <Loader2 className="h-5 w-5 animate-spin text-[#7C3AED]" />
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-4 text-sm text-center text-muted-foreground">
                    No results found.
                  </div>
                ) : (
                  <div className="p-1">
                    {results.map((result) => (
                      <button
                        key={result.place_id}
                        type="button"
                        onClick={() => handleSelectLocation(result)}
                        className="w-full flex items-start gap-3 rounded-lg px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors group">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-400 group-hover:text-[#7C3AED]" />
                        <span className="line-clamp-2">
                          {result.display_name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
