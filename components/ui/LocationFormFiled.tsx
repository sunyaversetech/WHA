"use client";

import * as React from "react";
import { MapPin, Loader2, X, Navigation } from "lucide-react";
import debounce from "lodash.debounce";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Using standard Input
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function LocationFormField({ form }: { form: any }) {
  const [loading, setLoading] = React.useState(false);
  const [isLocating, setIsLocating] = React.useState(false);
  const [results, setResults] = React.useState<
    { display_name: string; place_id: number }[]
  >([]);
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

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
        );
        const data = await res.json();
        if (data.display_name) form.setValue("location", data.display_name);
      } finally {
        setIsLocating(false);
      }
    });
  };

  return (
    <FormField
      control={form.control}
      name="location"
      render={({ field }) => (
        <FormItem className="w-full ">
          <div className="flex items-center justify-between mb-2">
            <FormLabel>Location</FormLabel>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs gap-1"
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
                placeholder="Enter your address..."
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
                onClick={() => {
                  field.onChange("");
                  setResults([]);
                }}
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
                        onClick={() => {
                          field.onChange(result.display_name);
                          setShowDropdown(false);
                        }}
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
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
