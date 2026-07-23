"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, MapPin, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useQueryClient } from "@tanstack/react-query";
import { useGetSingleDashboardBusiness } from "@/services/business.service";
import { Skeleton } from "@/components/ui/skeleton";

const LocationMap = dynamic(() => import("@/components/Auth/LocationMap"), {
  ssr: false,
  loading: () => <div className="h-80 rounded-xl bg-gray-100 animate-pulse" />,
});

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

type LocationState = {
  address: string;
  lat: number | null;
  lng: number | null;
};

export default function LocationSettings() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { data: bizData, isLoading } = useGetSingleDashboardBusiness(
    session?.user?.id || "",
  );

  /* Derive server state without an effect */
  const serverState = useMemo<LocationState>(() => {
    const biz = bizData?.data;
    if (!biz) return { address: "", lat: null, lng: null };
    return {
      address: biz.location ?? "",
      lat: biz.latitude ?? null,
      lng: biz.longitude ?? null,
    };
  }, [bizData]);

  /* Local edits — null until user touches anything */
  const [localEdits, setLocalEdits] = useState<LocationState | null>(null);

  /* Search-input text is always locally controlled (not part of saved state) */
  const [query, setQuery] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Active location = local edits if any, otherwise server state */
  const active = localEdits ?? serverState;
  const { address, lat, lng } = active;

  /* Query defaults to the server address until user types */
  const displayQuery = query ?? serverState.address;

  const patch = (next: Partial<LocationState>) =>
    setLocalEdits((prev) => ({ ...(prev ?? serverState), ...next }));

  /* ── Nominatim search ─────────────────────────────────────────────────── */
  const fetchSuggestions = (val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=au&limit=5&q=${encodeURIComponent(val)}`,
          { headers: { "Accept-Language": "en" } },
        );
        setSuggestions(await res.json());
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  const onSelect = (item: NominatimResult) => {
    const next: LocationState = {
      address: item.display_name,
      lat: Number(item.lat),
      lng: Number(item.lon),
    };
    setLocalEdits(next);
    setQuery(item.display_name);
    setSuggestions([]);
  };

  const onDragEnd = async (newLat: number, newLng: number) => {
    patch({ lat: newLat, lng: newLng });
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await res.json();
      if (data.display_name) {
        patch({ lat: newLat, lng: newLng, address: data.display_name });
        setQuery(data.display_name);
      }
    } catch {}
  };

  /* ── Save ─────────────────────────────────────────────────────────────── */
  const onSave = async () => {
    if (!address || lat === null || lng === null) {
      toast.error("Please select a location from the dropdown first");
      return;
    }
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("location", address);
      fd.append("latitude", String(lat));
      fd.append("longitude", String(lng));
      const res = await fetch("/api/business/settings", {
        method: "PATCH",
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Location updated successfully");
      setLocalEdits(null);
      setQuery(null);
      queryClient.invalidateQueries({ queryKey: ["getbusiness", session?.user?.id] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update location");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-3 w-72 rounded" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3.5 w-20 rounded" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
    </div>
  );

  const isDirty = localEdits !== null;

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* ── Address Search ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-[#051e3a]">
            Business Address
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Search and select your address. You must choose from the dropdown —
            free-typed text is not saved.
          </p>
        </div>

        {/* Search input */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">
            Search address
          </Label>
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <Input
              value={displayQuery}
              onChange={(e) => {
                setQuery(e.target.value);
                fetchSuggestions(e.target.value);
              }}
              placeholder="Start typing an Australian address…"
              className="pl-9 pr-9 border-gray-200 focus-visible:ring-0 focus-visible:border-[#051e3a] text-[#051e3a] placeholder:text-gray-400"
            />
            {searchLoading ? (
              <Loader2
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
              />
            ) : displayQuery ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            ) : null}
          </div>

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <div className="border border-gray-200 rounded-xl shadow-lg bg-white overflow-hidden z-10 relative">
              {suggestions.map((item) => (
                <button
                  key={item.place_id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="w-full flex items-start gap-2.5 px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                  <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-700">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lat / Lng readout */}
        {lat !== null && lng !== null && (
          <div className="flex gap-4 flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-500">
                Latitude
              </Label>
              <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-mono text-gray-700 min-w-[130px]">
                {lat.toFixed(6)}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-500">
                Longitude
              </Label>
              <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-mono text-gray-700 min-w-[130px]">
                {lng.toFixed(6)}
              </div>
            </div>
          </div>
        )}

        {/* No location yet */}
        {lat === null && (
          <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-4 py-3">
            No location set yet. Search and select an address above.
          </p>
        )}
      </div>

      {/* ── Map ── */}
      {lat !== null && lng !== null && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
          <div>
            <h3 className="text-base font-semibold text-[#051e3a]">
              Pin Location
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Drag the pin to fine-tune your exact position on the map.
            </p>
          </div>
          <LocationMap lat={lat} lng={lng} onDragEnd={onDragEnd} />
          {address && (
            <div className="flex items-start gap-2 pt-1">
              <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-600 leading-snug">{address}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Save ── */}
      <div className="flex justify-end">
        <Button
          onClick={onSave}
          disabled={isSaving || !isDirty || !address || lat === null}
          className="bg-[#051e3a] hover:bg-[#0a3060] text-white px-8">
          {isSaving && <Loader2 size={14} className="mr-2 animate-spin" />}
          Save Location
        </Button>
      </div>
    </div>
  );
}
