"use client";

import { useMemo, useEffect } from "react";
import EventCard from "@/components/cards/event-card";
import { Loader2, Calendar, AlertCircle } from "lucide-react";
import { useCityFilter } from "@/contexts/city-filter-context";
import { filterByCity } from "@/lib/utils/city-filter";
import { useGetAllEvents } from "@/services/event.service";
import EventHeader from "./EventFilter";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventsPageClient() {
  const { selectedCity } = useCityFilter();

  const { data: apiResponse, isLoading, error } = useGetAllEvents();

  const events = useMemo(() => {
    let rawData = [];
    if (Array.isArray(apiResponse)) {
      rawData = apiResponse;
    } else if (apiResponse && typeof apiResponse === "object") {
      rawData = (apiResponse as any).data || (apiResponse as any).events || [];
    }

    if (!selectedCity || selectedCity === "All Cities") {
      return rawData;
    }

    const filtered = filterByCity(rawData, selectedCity);

    return filtered || [];
  }, [apiResponse, selectedCity]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-500">
        <AlertCircle className="h-10 w-10 mb-2" />
        <p>Failed to load events. Please refresh.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <div className="container-modern py-8">
        <EventHeader />
        {isLoading ? (
          <div className="flex  items-center gap-2   mt-5">
            <Skeleton className="h-72 w-96 mb-4 animate-pulse rounded-xl" />
            <Skeleton className="h-72 w-96 mb-4 animate-pulse" />
            <Skeleton className="h-72 w-96 mb-4 animate-pulse" />
          </div>
        ) : events.length === 0 ? (
          <div className=" mt-8 p-20 text-center bg-white rounded-3xl border-2 border-dashed border-neutral-200">
            <Calendar className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
            <h3 className="text-lg font-semibold text-primary">
              No events to show
            </h3>
            <p className="text-sm text-neutral-500 mt-1">
              Try selecting `All Cities` in the navigation bar.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
            {events.map((event: any) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
