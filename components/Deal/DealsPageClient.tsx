"use client";

import DealCard from "@/components/cards/deal-card";
import { Calendar, Filter, Map, SlidersVertical, Tag } from "lucide-react";
import { useGetAllDeals } from "@/services/deal.service";
import DealsHeader from "./DealFilter";
import { Skeleton } from "../ui/skeleton";
import DealsSearchWithDates from "../ResuableComponents/SearchSectionForDeals";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { useSearchParams } from "next/navigation";
import MobileDealsSearchWithDates from "../ResuableComponents/MobileViewSearch/SearchSectionForDeals";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";

export default function DealsPageClient() {
  const { data: deals, isLoading } = useGetAllDeals();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "list";
  const currentDate = new Date();

  const data =
    deals?.data &&
    deals?.data?.filter((deal) => currentDate <= new Date(deal.valid_till));

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* <div className="flex-none h-22 max-md:h-fit border-b flex items-center justify-center">
        <div className="w-full max-md:hidden">
          <DealsSearchWithDates />
        </div>
        <div className="w-full hidden max-md:flex">
          <MobileDealsSearchWithDates />
        </div>
      </div> */}

      <div className="flex-1 overflow-y-auto pt-18 md:pt-42  overscroll-contain no-scrollbar relative">
        <div className="sticky top-0 z-10 bg-gray-100/20 backdrop-blur-md">
          <div className="container-modern px-6 py-4">
            <div className="flex items-end justify-end">
              <Drawer>
                <DrawerTrigger asChild className="hidden max-md:flex">
                  <Button variant="outline" size="sm">
                    <SlidersVertical className="h-4 w-4" />
                    Filters
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="max-w-4xl w-full z-[9999] min-h-[40vh] p-4">
                  <DrawerTitle className="text-lg font-bold mb-4">
                    Filter Deals
                  </DrawerTitle>
                  <DealsHeader />
                </DrawerContent>
              </Drawer>

              <Dialog>
                {view === "list" && (
                  <DialogTrigger asChild className="flex max-md:hidden">
                    <Button variant="outline" size="sm">
                      <SlidersVertical className="h-4 w-4" />
                      Filters
                    </Button>
                  </DialogTrigger>
                )}
                <DialogContent className="max-w-4xl w-full">
                  <DialogTitle className="text-lg font-bold mb-4">
                    Filter Deals
                  </DialogTitle>
                  <DealsHeader />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="container-modern pb-20 px-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  className="h-72 w-full animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : data && data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {data.map((deal) => (
                <DealCard key={deal._id} deal={deal} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 card-lg">
              <div className="p-8">
                <Tag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No deals found
                </h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your search or filters
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
