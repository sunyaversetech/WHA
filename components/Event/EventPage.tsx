"use client";

import { useCallback, useState } from "react";
import EventMap from "./Event-map";
import { useCityFilter } from "@/contexts/city-filter-context";
import { useGetAllEvents } from "@/services/event.service";
import EventSearchWithDates from "../ResuableComponents/SearchSectionForEvents";
import { Button } from "../ui/button";
import EventCard from "../cards/event-card";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Filter, Globe, MapIcon, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import EventHeader from "./EventFilter";

const COMMUNITIES = [
  { name: "All Community", value: "All", icon: Globe }, // Replace 'Globe' with your preferred icon component

  { name: "Australian", value: "Australian", icon: MapPin },

  { name: "Nepali", value: "Nepali", icon: MapPin },
];

export default function EventsPageClient() {
  const { selectedCity } = useCityFilter();
  const searchParams = useSearchParams();
  const [showMap, setShowMap] = useState(true);
  const { data: apiResponse } = useGetAllEvents();
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const data = apiResponse?.data ? apiResponse?.data : [];
  const [currentCommunity, setCurrentCommunity] = useState("All");
  const router = useRouter();

  const toggleExpand = () => setIsMapExpanded(!isMapExpanded);

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

  return (
    <div className="flex flex-col h-screen overflow-hidden ">
      <>
        <div className="flex-none h-32 -mt-1 border-b flex items-center justify-center">
          <EventSearchWithDates />
        </div>
        <div className="flex-none px-6 py-4 flex justify-between items-center  ">
          <div className="text-sm font-medium text-slate-500 pl-5">
            {apiResponse?.data.length} results in {selectedCity}
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 rounded-md btn-wha-outline h-12 mr-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-4xl w-full z-50">
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
                                community:
                                  com.value === "All" ? null : com.value,
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
              </DialogContent>
            </Dialog>
            {!isMapExpanded && (
              <Button
                onClick={() => setShowMap(!showMap)}
                className="flex items-center gap-2 rounded-md btn-wha-outline h-12 mr-2">
                <MapIcon /> {showMap ? "Hide Map" : "Show Map"}
              </Button>
            )}
          </div>
        </div>
      </>

      <div className="flex flex-1 overflow-hidden relative pl-5">
        {!isMapExpanded && (
          <div
            className={`transition-all duration-300 overflow-y-auto px-4 pb-6 no-scrollbar ${showMap ? "w-full lg:w-[55%]" : "w-full"}`}>
            <div
              className={`grid gap-6 ${showMap ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
              {apiResponse?.data.map((event: any) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          </div>
        )}

        <div
          className={`transition-all duration-500 pr-7.5 ${
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
