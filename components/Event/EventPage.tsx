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
import { Filter, Globe, MapIcon, MapPin, SlidersVertical } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import EventHeader from "./EventFilter";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import MobileEventSearchWithDates from "../ResuableComponents/MobileViewSearch/SearchSectionForEvents";

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
    <div className="flex flex-col h-screen  overflow-hidden ">
      <div className="flex-none ">
        <div className="flex-none h-22 max-md:h-fit  border-b  flex items-center justify-center">
          <div className="w-full max-md:hidden">
            <EventSearchWithDates />
          </div>
          <div className="w-full hidden max-md:block">
            <MobileEventSearchWithDates />
          </div>
        </div>
        <div className="flex-none px-6 py-4 flex justify-between items-center">
          <div className="text-sm font-medium text-slate-500 ">
            {apiResponse?.data.length} events in{" "}
            {searchParams.get("city") ?? "australia "}
          </div>
          <div className="flex gap-2">
            <Drawer>
              <DrawerTrigger asChild className="hidden max-md:flex">
                <Button variant="outline" size="sm">
                  <SlidersVertical className="h-4 w-4" />
                  Filters
                </Button>
              </DrawerTrigger>

              <DrawerContent className="max-w-4xl w-full z-9999 min-h-[40vh] p-4">
                <DrawerTitle className="text-lg font-bold mb-4">
                  Filter Events
                </DrawerTitle>

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
                              className={`h-4 w-4 md:h-5 md:w-5 mb-1 ${
                                isActive ? "text-white" : "text-slate-500"
                              }`}
                            />

                            <span className="text-[9px] md:text-[10px] uppercase font-bold whitespace-nowrap text-center">
                              {com.name}
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </TabsContent>
                </Tabs>
              </DrawerContent>
            </Drawer>
            <Dialog>
              <DialogTrigger asChild className="flex max-md:hidden">
                <Button variant="outline" size="sm">
                  <SlidersVertical className="h-4 w-4" />
                  Filters
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-4xl w-full z-50">
                <DrawerTitle className="text-lg font-bold mb-4">
                  Filter Events
                </DrawerTitle>

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
                              className={`h-4 w-4 md:h-5 md:w-5 mb-1 ${
                                isActive ? "text-white" : "text-slate-500"
                              }`}
                            />

                            <span className="text-[9px] md:text-[10px] uppercase font-bold whitespace-nowrap text-center">
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
                variant="outline"
                onClick={() => setShowMap(!showMap)}
                className=" max-md:hidden"
                size="sm">
                <MapIcon className="h-4 w-4" />{" "}
                {showMap ? "Hide map" : "Show map"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className="hidden   max-md:flex"
              size="sm">
              <MapIcon className="h-4 w-4" />{" "}
              {isMapExpanded ? "Hide map" : "Show map"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative px-5 gap-0 md:gap-4">
        {!isMapExpanded && (
          <div
            className={`transition-all duration-300 
            overflow-y-auto overscroll-contain h-full no-scrollbar pb-40
            ${showMap ? "w-full lg:w-[55%]" : "w-full"}`}>
            <div
              className={`grid gap-6 ${showMap ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
              {apiResponse?.data.map((event: any) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          </div>
        )}

        <div
          className={`transition-all duration-500 pb-23 max-md:hidden h-full ${
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

        <div
          className={`transition-all flex md:hidden duration-500 ${
            isMapExpanded ? "w-full" : ""
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
