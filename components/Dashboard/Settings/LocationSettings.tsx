"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, MapPin, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useGetSingleDashboardBusiness } from "@/services/business.service";
import Loading from "@/app/search/loading";

const LocationMap = dynamic(
  () => import("@/components/Auth/LocationMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 rounded-xl bg-gray-100 animate-pulse" />
    ),
  },
);

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function LocationSettings() {
  const { data: session } = useSession();
  const { data: bizData, isLoading } = useGetSingleDashboardBusiness(
    session?.user?.id || "",
  );

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const biz = bizData?.data;
    if (!biz) return;
    setAddress(biz.location ?? "");
    setQuery(biz.location ?? "");
    setLat(biz.latitude ?? null);
    setLng(biz.longitude ?? null);
  }, [bizData]);

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
    setQuery(item.display_name);
    setAddress(item.display_name);
    setLat(Number(item.lat));
    setLng(Number(item.lon));
    setSuggestions([]);
    setIsDirty(true);
  };

  const onDragEnd = async (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    setIsDirty(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await res.json();
      if (data.display_name) {
        setAddress(data.display_name);
        setQuery(data.display_name);
      }
    } catch {}
  };

  const onSave = async () => {
    if (!address || lat === null || lng === null) {
      toast.error("Please select a location from the dropdown first");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/business/location", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: address, latitude: lat, longitude: lng }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Location updated successfully");
      setIsDirty(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update location");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loading />;

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
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                fetchSuggestions(e.target.value);
              }}
              placeholder="Start typing an Australian address…"
              className="pl-9 pr-9"
            />
            {searchLoading ? (
              <Loader2
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
              />
            ) : query ? (
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
                  <MapPin
                    size={14}
                    className="text-gray-400 mt-0.5 shrink-0"
                  />
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
