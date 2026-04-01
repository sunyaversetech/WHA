"use client";

import { useState } from "react";
import EventMap from "./Event-map";
import { useCityFilter } from "@/contexts/city-filter-context";
import { useGetAllEvents } from "@/services/event.service";
import EventSearchWithDates from "../ResuableComponents/SearchSectionForEvents";
import { Button } from "../ui/button";
import EventCard from "../cards/event-card";
import { useSearchParams } from "next/navigation";

export default function EventsPageClient() {
  const { selectedCity } = useCityFilter();
  const searchParams = useSearchParams();
  const [showMap, setShowMap] = useState(true);
  const { data: apiResponse } = useGetAllEvents();
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const data = apiResponse?.data ? apiResponse?.data : [];

  const toggleExpand = () => setIsMapExpanded(!isMapExpanded);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <>
        <div className="flex-none h-32 border-b flex items-center justify-center bg-white z-[100]">
          <EventSearchWithDates />
        </div>
        <div className="flex-none px-6 py-4 flex justify-between items-center bg-white border-b z-[90]">
          <div className="text-sm font-medium text-slate-500">
            {apiResponse?.data.length} results in {selectedCity}
          </div>
          <div className="flex gap-2">
            {!isMapExpanded && (
              <Button
                onClick={() => setShowMap(!showMap)}
                className="rounded-full bg-[#6c47ff] hover:bg-[#5b3ce0] text-white">
                {showMap ? "Hide Map" : "Show Map"}
              </Button>
            )}
          </div>
        </div>
      </>

      <div className="flex flex-1 overflow-hidden relative">
        {!isMapExpanded && (
          <div
            className={`transition-all duration-300 overflow-y-auto px-4 py-6 no-scrollbar ${showMap ? "w-full lg:w-[55%]" : "w-full"}`}>
            <div
              className={`grid gap-6 ${showMap ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
              {apiResponse?.data.map((event: any) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          </div>
        )}

        <div
          className={`transition-all duration-500 border-l bg-gray-100 ${
            isMapExpanded
              ? "w-full"
              : showMap
                ? "w-[45%]"
                : "w-0 border-none opacity-0"
          }`}>
          <EventMap
            businesses={data}
            currentCity={searchParams.get("city") || ""}
            isVisible={showMap}
            isExpanded={isMapExpanded}
            onToggleExpand={toggleExpand}
          />
        </div>
      </div>
    </div>
  );
}
