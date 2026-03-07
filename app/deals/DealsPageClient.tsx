"use client";

import DealCard from "@/components/cards/deal-card";

import { Tag } from "lucide-react";
import { useGetAllDeals } from "@/services/deal.service";
import DealsHeader from "@/components/DealFilter";

export default function DealsPageClient() {
  const { data: deals } = useGetAllDeals();

  const currentDate = new Date();

  const data = deals?.data.filter(
    (deal) => currentDate <= new Date(deal.valid_till),
  );

  return (
    <div className="min-h-screen bg-gradient-modern relative">
      <div className="relative z-10">
        {/* HEADER */}
        <div className="container-modern py-3 md:py-6">
          <DealsHeader />
        </div>

        {/* DEALS GRID */}
        <div className="container-modern pb-8">
          {data && data.length > 0 ? (
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
