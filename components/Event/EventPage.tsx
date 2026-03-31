"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import EventCard from "@/components/cards/event-card";
import {
  Loader2,
  Calendar,
  AlertCircle,
  Map,
  Filter,
  Globe,
  MapPin,
} from "lucide-react";
import { useCityFilter } from "@/contexts/city-filter-context";
import { filterByCity } from "@/lib/utils/city-filter";
import { useGetAllEvents } from "@/services/event.service";
import EventHeader from "./EventFilter";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";
import EventMap from "./Event-map";
import EventSearchWithDates from "../ResuableComponents/SearchSectionForEvents";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

const COMMUNITIES = [
  { name: "All Community", value: "All", icon: Globe }, // Replace 'Globe' with your preferred icon component
  { name: "Australian", value: "Australian", icon: MapPin },
  { name: "Nepali", value: "Nepali", icon: MapPin },
];

export default function EventsPageClient() {
  const { selectedCity } = useCityFilter();
  const searchParams = useSearchParams();
  const [currentCommunity, setCurrentCommunity] = useState("All");
  const router = useRouter();

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );
  const view = searchParams.get("view") || "list";
  const handleTabChange = (value: string) => {
    updateQuery({ view: value });
  };

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
    <div className="min-h-screen bg-neutral-50 mx-4 md:mx-6 pb-20">
      <div className={`h-32 w-full flex items-center justify-center relative`}>
        <div
          className={`
          transition-all duration-300 ease-in-out z-[100]
        `}>
          <EventSearchWithDates />
        </div>
      </div>
      <Separator />
      <div className="container-modern py-4 md:py-8  w-auto">
        {/* <EventHeader /> */}
        <div className="flex items-end justify-end ">
          <Dialog>
            {view === "list" && (
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 rounded-md btn-wha-outline h-12 mr-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </DialogTrigger>
            )}
            <DialogContent className="max-w-4xl w-full">
              <DialogTitle className="text-lg font-bold mb-4">
                Filter Events
              </DialogTitle>
              <Tabs
                defaultValue="categories"
                className="w-full overflow-scroll no-scrollbar rounded-lg border bg-white ">
                <TabsList className="w-full border-none ">
                  <TabsTrigger
                    value="categories"
                    className="data-[state=active]:bg-white data-[state=active]:underline text-wha-p 
                    data-[state=active]:text-wha-primary data-[state=active]:underline-offset-8 data-[state=active]:decoration-2 data-[state=active]:shadow-none!">
                    Categories
                  </TabsTrigger>
                  <TabsTrigger
                    className="data-[state=active]:bg-white data-[state=active]:underline text-wha-p 
                    data-[state=active]:text-wha-primary data-[state=active]:underline-offset-8 data-[state=active]:decoration-2 data-[state=active]:shadow-none!"
                    value="communities">
                    Communities
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="categories">
                  <EventHeader />
                </TabsContent>
                <TabsContent
                  value="communities"
                  className="flex flex-wrap gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                  {/* <EventMap events={events} /> */}
                  <div className="flex gap-2 justify-center items-center m-auto">
                    {COMMUNITIES.map((com) => {
                      const Icon = com.icon;
                      const isActive =
                        (currentCommunity ?? "All") === com.value;

                      return (
                        <Button
                          key={com.value}
                          onClick={() => {
                            updateQuery({
                              community: com.value === "All" ? null : com.value,
                            });
                            setCurrentCommunity(com.value);
                          }}
                          className={`flex flex-col items-center justify-center h-15 md:min-w-[80px] py-5 px-3 rounded-md md:rounded-xl transition-all border shrink-0 ${
                            isActive
                              ? "bg-primary border-primary text-white"
                              : "bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}>
                          <Icon
                            className={`h-4 w-4 sm:h-5 sm:w-5 mb-1 ${
                              isActive ? "text-white" : "text-slate-500"
                            }`}
                          />

                          <span className="text-[9px] sm:text-[10px] uppercase font-bold whitespace-nowrap text-center">
                            {com.name}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
              {/* <EventMap events={events} /> */}
            </DialogContent>
          </Dialog>
          <Tabs onValueChange={handleTabChange} value={view}>
            <TabsList className="border-none">
              <TabsTrigger
                value={`${view === "list" ? "map" : "list"}`}
                className=" -mt-5">
                {view === "list" ? (
                  <span className="btn-wha-primary flex items-center gap-1 text-sm mt-2 cursor-pointer transition-wha-slow">
                    Show Map
                    <Map className=" flex justify-end  h-5 w-5 text-wha-light" />
                  </span>
                ) : (
                  <span className="btn-wha-primary flex items-center gap-1 text-sm mt-2 cursor-pointer transition-wha-slow">
                    Show List
                    <Calendar className=" flex justify-end  h-5 w-5 text-wha-light" />
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {isLoading ? (
          <>
            <div className="flex max-md:hidden  items-center gap-2   mt-5">
              <Skeleton className="h-72 w-96 mb-4 animate-pulse rounded-xl" />
              <Skeleton className="h-72 w-96 mb-4 animate-pulse" />
              <Skeleton className="h-72 w-96 mb-4 animate-pulse" />
            </div>
            <div className="flex md:hidden  items-center gap-2   mt-5">
              <Skeleton className="h-72 w-96 mb-4 animate-pulse rounded-xl" />
            </div>
          </>
        ) : events.length !== 0 ? (
          <>
            <Tabs value={view} className="w-full">
              <TabsContent value="list">
                {events.length === 0 ? (
                  <div className="mt-8 p-20 text-center bg-white rounded-3xl border-2 border-dashed border-neutral-200">
                    <Calendar className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                    <h3 className="text-lg font-semibold text-primary">
                      No events to shows
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
              </TabsContent>

              <TabsContent value="map">
                <div className="mt-8 h-[600px] rounded-xl overflow-hidden border">
                  <EventMap businesses={events} />
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="mt-8 grid grid-cols-1  gap-6 px-4">
            <div className="mt-8 p-20 text-center bg-white rounded-3xl border-2 border-dashed border-neutral-200">
              <Calendar className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
              <h3 className="text-lg font-semibold text-primary">
                No events to show
              </h3>
              <p className="text-sm text-neutral-500 mt-1">
                Try selecting `Australia` in the navigation bar and `All` in
                Filter.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
