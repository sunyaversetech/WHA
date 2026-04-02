"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Filter, Globe, MapIcon, MapPin, Search } from "lucide-react";

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

  // Map States from Event Page
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
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Search Header */}
      <div className="flex-none border-b z-[100]">
        <BusinessSearchWithDates />
      </div>

      {/* Filter Bar */}
      <div className="flex-none px-6 py-4 flex justify-between items-center z-[90] border-b bg-white">
        <div className="text-sm font-medium text-slate-500">
          {data.length} businesses in {selectedCity || "Australia"}
        </div>

        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 rounded-md h-12">
                <Filter className="h-4 w-4" /> Filter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full z-[110]">
              <DialogTitle className="text-lg font-bold mb-4">
                Filter Businesses
              </DialogTitle>
              <Tabs
                defaultValue="categories"
                className="w-full rounded-lg border bg-white">
                <TabsList className="w-full border-none">
                  <TabsTrigger
                    value="categories"
                    className="data-[state=active]:text-wha-primary">
                    Categories
                  </TabsTrigger>
                  <TabsTrigger
                    value="communities"
                    className="data-[state=active]:text-wha-primary">
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
                      const isActive = currentCommunity === com.value;
                      return (
                        <Button
                          key={com.value}
                          variant={isActive ? "default" : "outline"}
                          onClick={() => {
                            updateQuery({
                              community: com.value === "All" ? null : com.value,
                            });
                            setCurrentCommunity(com.value);
                          }}
                          className="flex flex-col h-20 w-24 gap-1">
                          <Icon className="h-5 w-5" />
                          <span className="text-[10px] uppercase font-bold">
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
              variant="outline"
              className="flex items-center gap-2 rounded-md h-12">
              <MapIcon className="h-4 w-4" />{" "}
              {showMap ? "Hide Map" : "Show Map"}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* List Side */}
        {!isMapExpanded && (
          <div
            className={`transition-all duration-300 overflow-y-auto px-4 py-6 no-scrollbar ${showMap ? "w-full lg:w-[55%]" : "w-full"}`}>
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
                className={`grid gap-6 ${showMap ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
                {data.map((business: any) => (
                  <BusinessCard key={business._id} business={business} />
                ))}
              </div>
            )}
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
          <BusinessMap
            businesses={data}
            currentCity={selectedCity || ""}
            isVisible={showMap}
            isExpanded={isMapExpanded}
            onToggleExpand={toggleExpand}
          />
        </div>
      </div>
    </div>
  );
}
