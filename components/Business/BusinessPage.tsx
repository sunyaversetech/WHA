"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Globe, MapIcon, MapPin, SlidersVertical } from "lucide-react";

import BusinessCard from "@/components/cards/business-card";
import BusinessHeader from "./BusinessFilter";
import { useGetBusiness } from "@/services/business.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import BusinessSearchWithDates from "../ResuableComponents/SearchSectionforBusiness";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
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
    <div className="flex flex-col md:h-[92vh] max-sm:h-[74vh] overflow-hidden">
      <div className="flex-none">
        <div className="h-22 max-md:h-fit border-b flex items-center justify-center">
          <div className="w-full max-md:hidden">
            <BusinessSearchWithDates />
          </div>
          <div className="w-full hidden max-md:block">
            <MobileBusinessSearchWithDates />
          </div>
        </div>

        <div className="px-6 py-4 flex justify-between items-center">
          <div className="text-sm font-medium text-slate-500">
            {data.length} businesses in{" "}
            {searchParams.get("city") ?? "Australia "}
          </div>

          <div className="flex gap-2 ">
            <Drawer>
              <DrawerTrigger asChild className="hidden max-md:flex">
                <Button variant="outline" size="sm">
                  <SlidersVertical className="h-4 w-4" />
                  Filters
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-w-4xl w-full z-[9999] min-h-[40vh] p-4">
                <DrawerTitle className="text-lg font-bold mb-4">
                  Filter Businesses
                </DrawerTitle>
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
                            className={`flex flex-col items-center justify-center h-15 py-5 px-3 rounded-md transition-all border shrink-0 ${
                              isActive
                                ? "bg-primary text-white"
                                : "bg-white text-slate-600"
                            }`}>
                            <Icon
                              className={`h-4 w-4 mb-1 ${isActive ? "text-white" : "text-slate-500"}`}
                            />
                            <span className="text-[9px] uppercase font-bold">
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
              <DialogContent className="max-w-4xl w-full z-[9999] p-4">
                <DrawerTitle className="text-lg font-bold mb-4">
                  Filter Businesses
                </DrawerTitle>
                <Tabs
                  defaultValue="categories"
                  className="w-full rounded-lg border bg-white">
                  <TabsList className="w-full border-none">
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="communities">Communities</TabsTrigger>
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
                                community:
                                  com.value === "All" ? null : com.value,
                              });
                              setCurrentCommunity(com.value);
                            }}
                            className={`flex flex-col items-center justify-center h-15 min-w-[80px] py-5 px-3 rounded-xl transition-all border ${
                              isActive ? "bg-primary text-white" : "bg-white"
                            }`}>
                            <Icon className="h-5 w-5 mb-1" />
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
                variant="outline"
                onClick={() => setShowMap(!showMap)}
                className="max-md:hidden"
                size="sm">
                <MapIcon className="h-4 w-4" />{" "}
                {showMap ? "Hide map" : "Show map"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className="hidden max-md:flex"
              size="sm">
              <MapIcon className="h-4 w-4" />{" "}
              {isMapExpanded ? "Hide map" : "Show map"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative w-full">
        {!isMapExpanded && (
          <div
            className={`
              transition-all duration-300 
              overflow-y-auto overscroll-contain h-full 
              px-6 no-scrollbar 
              ${showMap ? "w-full lg:w-[55%]" : "w-full"}
            `}>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
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
                className={`grid gap-6  pb-20 ${
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
        )}

        <div
          className={`transition-all duration-500 max-md:hidden pb-2 h-full ${
            isMapExpanded
              ? "w-full"
              : showMap
                ? "w-[45%]"
                : "w-0 opacity-0 pointer-events-none"
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
          className={`transition-all flex md:hidden duration-500 h-full ${isMapExpanded ? "w-full" : "w-0 overflow-hidden"}`}>
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
