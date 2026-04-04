"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Filter,
  Globe,
  MapIcon,
  MapPin,
  Search,
  SlidersVertical,
} from "lucide-react";

import BusinessCard from "@/components/cards/business-card";
import BusinessHeader from "./BusinessFilter";
import { useGetBusiness } from "@/services/business.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import BusinessSearchWithDates from "../ResuableComponents/SearchSectionforBusiness";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { useCityFilter } from "@/contexts/city-filter-context"; // Assuming you use this same context
import MobileBusinessSearchWithDates from "../ResuableComponents/MobileViewSearch/SearchSectionforBusiness";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";

const BusinessMap = dynamic(() => import("./business-map"), { ssr: false });

const COMMUNITIES = [
  { name: "All Community", value: "All", icon: Globe },
  { name: "Australian", value: "Australian", icon: MapPin },
  { name: "Nepali", value: "Nepali", icon: MapPin },
];

export default function BusinessesClientPage() {
  const { selectedCity } = useCityFilter();
  const { data: apiResponse, isLoading } = useGetBusiness();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [showMap, setShowMap] = useState(true);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [currentCommunity, setCurrentCommunity] = useState("All");

  const data = apiResponse?.data || [];
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
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex-none h-32 max-sm:h-fit -mt-1 border-b flex items-center justify-center">
        <div className="w-full max-sm:hidden">
          <BusinessSearchWithDates />
        </div>
        <div className="w-full hidden max-sm:block">
          <MobileBusinessSearchWithDates />
        </div>
      </div>

      <div className="flex-none px-6 py-4 flex justify-between items-center   ">
        <div className="text-sm font-medium text-slate-500 pl-5">
          {data.length} businesses in {selectedCity || "Australia"}
        </div>

        <div className="flex gap-2 mr-6">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersVertical className="h-4 w-4" />
                Filters
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-w-4xl w-full z-9999 min-h-[40vh] p-4">
              <DrawerTitle className="text-lg font-bold mb-4 ">
                Filter Businesses
              </DrawerTitle>
              <Tabs
                defaultValue="categories"
                className="w-full rounded-lg border bg-white">
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
                  <BusinessHeader />
                </TabsContent>
                <TabsContent value="communities" className="p-4">
                  <div className="flex gap-2 justify-center flex-wrap">
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
            </DrawerContent>
          </Drawer>

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

      <div className="flex flex-1 overflow-hidden relative pl-5">
        {!isMapExpanded && (
          <div
            className={`transition-all duration-300 overflow-y-auto px-4 pb-6 no-scrollbar ${showMap ? "w-full lg:w-[55%]" : "w-full"}`}>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-xl" />
                ))}
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="text-lg font-semibold">No businesses found</h3>
              </div>
            ) : (
              <div
                className={`grid gap-6  ${showMap ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
                {data.map((business: any) => (
                  <BusinessCard key={business._id} business={business} />
                ))}
              </div>
            )}
          </div>
        )}

        <div
          className={`transition-all duration-500 pr-7.5 max-sm:hidden ${
            isMapExpanded
              ? "w-full"
              : showMap
                ? "w-[45%]"
                : "w-0 border-none opacity-0"
          }`}>
          <BusinessMap
            businesses={data}
            currentCity={searchParams.get("city") || ""}
            isVisible={showMap}
            isExpanded={isMapExpanded}
            onToggleExpand={toggleExpand}
          />
        </div>

        <div
          className={`transition-all flex md:hidden duration-500 pr-7.5  ${
            isMapExpanded ? "w-full" : ""
          }`}>
          <BusinessMap
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
