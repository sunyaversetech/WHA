"use client";

import { useState } from "react";
import { MapIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BusinessCard from "@/components/cards/business-card";
import BusinessHeader from "./BusinessFilter";
import FilterPanel from "@/components/ResuableComponents/FilterPanel";
import { useGetBusiness } from "@/services/business.service";
import { useSearchParams } from "next/navigation";

const BusinessMap = dynamic(() => import("./business-map"), { ssr: false });

export default function BusinessesClientPage() {
  const { data: apiResponse, isLoading } = useGetBusiness();
  const searchParams = useSearchParams();
  const [showMap, setShowMap] = useState(true);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const data = apiResponse?.data || [];
  const toggleExpand = () => setIsMapExpanded((v) => !v);
  const cityLabel = searchParams.get("city") ?? "Australia";

  return (
    <div className="flex flex-col min-h-screen pt-20 md:pt-40">

      {/* ── Toolbar ── */}
      <div className="sticky top-[76px] md:top-[156px] z-40 bg-white border-b border-border px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        <p className="text-xs md:text-sm font-medium text-muted-foreground">
          <span className="font-bold text-primary">{data.length}</span>{" "}
          business{data.length !== 1 ? "es" : ""} in {cityLabel}
        </p>

        <div className="flex items-center gap-2">
          <FilterPanel title="Filter Businesses" categoriesContent={<BusinessHeader />} />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMap((v) => !v)}
            className="hidden md:flex rounded-full font-semibold">
            <MapIcon className="h-3.5 w-3.5 mr-1.5" />
            {showMap ? "Hide map" : "Show map"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleExpand}
            className="flex md:hidden rounded-full font-semibold">
            <MapIcon className="h-3.5 w-3.5 mr-1.5" />
            {isMapExpanded ? "Hide map" : "Map"}
          </Button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className={`flex ${isMapExpanded ? "" : "flex-1"} px-4 md:px-6 gap-6 py-4`}>

        {/* Card grid */}
        <div
          className={`transition-all w-full ${
            isMapExpanded ? "hidden" : showMap ? "lg:w-[55%]" : "w-full"
          }`}>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-4xl mb-4" aria-hidden="true">🏪</p>
              <h3 className="text-base font-bold text-primary mb-1">No businesses found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or search a different city.</p>
            </div>
          ) : (
            <div
              className={`grid gap-4 ${
                showMap
                  ? "grid-cols-1 xl:grid-cols-2"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              }`}>
              {data.map((business: any) => (
                <BusinessCard key={business._id} business={business} />
              ))}
            </div>
          )}
        </div>

        {/* Desktop map panel */}
        {!isMapExpanded && (
          <div
            className={`hidden md:block transition-all shrink-0 ${
              showMap ? "w-[45%]" : "w-0 opacity-0 pointer-events-none"
            }`}>
            <div className="sticky top-[225px] h-[calc(90vh-160px)] rounded-xl overflow-hidden border border-border">
              <BusinessMap
                businesses={data}
                currentCity={searchParams.get("city") || ""}
                isVisible={showMap}
                isExpanded={isMapExpanded}
                onToggleExpand={toggleExpand}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile expanded map */}
      {isMapExpanded && (
        <div className="px-4 pb-6">
          <div className="h-[70vh] w-full rounded-xl overflow-hidden border border-border">
            <BusinessMap
              businesses={data}
              currentCity={searchParams.get("city") || ""}
              isVisible
              isExpanded
              onToggleExpand={toggleExpand}
            />
          </div>
        </div>
      )}
    </div>
  );
}
