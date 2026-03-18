"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useFavorites } from "@/contexts/favorites-context";
import { useRedeem } from "@/contexts/redeem-context";
import {
  Heart,
  Check,
  MapPin,
  Calendar,
  QrCode,
  Link2,
  SquareArrowOutUpRight,
} from "lucide-react";
import type { Deal } from "@/lib/types";
import { getBusinessById } from "@/lib/data/businesses";
import {
  useCreateFavroite,
  useGetUserFavroite,
} from "@/services/favroite.service";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DealsGetValues } from "@/services/deal.service";
import { formatDate } from "date-fns";

export default function DealCard({ deal }: { deal: DealsGetValues }) {
  const router = useRouter();
  const { mutate, isPending } = useCreateFavroite();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const handleAddRemoveFavorite = () => {
    if (!session) {
      toast.error("Please login to add to favorites");
      router.push("/auth");
      return;
    }
    mutate(
      { item_id: deal._id, item_type: "Deal" },
      {
        onSuccess: (msg) => {
          router.refresh();
          toast.success(msg.message);
          queryClient.invalidateQueries({ queryKey: ["favroite"] });
        },
        onError: () => {
          toast.error("Failed to add to favorites");
        },
      },
    );
  };

  const { data: userFavorites } = useGetUserFavroite();
  const isDealFavorite = userFavorites?.data?.deals?.some(
    (item: { _id: string }) => item._id.toString() === deal._id?.toString(),
  );
  return (
    <div
      className="block cursor-pointer"
      onClick={() => router.push(`/deals/${deal._id}`)}>
      <div className="relative w-full bg-gray-200 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gray-300 active:scale-95">
        <div className="absolute top-1/2 -left-2 w-4 h-4 bg-white border border-gray-200 rounded-full transform -translate-y-1/2 z-0"></div>
        <div className="absolute top-1/2 -right-2 w-4 h-4 bg-white border border-gray-200 rounded-full transform -translate-y-1/2 z-0"></div>

        <div className="flex px-4 py-2 gap-4">
          <div className="flex-grow">
            <div className="mb-1 md:mb-2 flex justify-between items-center">
              <div>
                <h3 className="text-sm md:text-md font-semibold text-gray-900">
                  {deal.title}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-2">
                  {deal.description}
                </p>
              </div>
              <button
                disabled={isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddRemoveFavorite();
                }}
                className={`self-start p-2  rounded-lg transition-all duration-200 ${
                  isDealFavorite
                    ? "text-red-500 bg-red-50"
                    : "text-gray-400 bg-gray-100 hover:text-red-500 hover:bg-red-50"
                }`}>
                <Heart
                  className={`h-5 w-5 ${isDealFavorite ? "fill-current" : ""}`}
                />
              </button>
            </div>

            {deal.user && (
              <div className="flex items-start gap-3 rounded-lg p-2 -m-2 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <Image
                      width={500}
                      height={500}
                      src={deal?.user?.image || "/placeholder.svg"}
                      className="w-full h-full object-cover cursor-pointer"
                      loading="lazy"
                      alt="WHA"
                      onClick={() => router.push(`/deals/${deal._id}`)}
                    />
                  </div>
                </div>
                <div>
                  <h2 className="text-sm md:text-md font-bold flex items-center gap-2 cursor-pointer text-gray-900 ">
                    {deal?.user?.business_name ?? "Business Name"}
                    <SquareArrowOutUpRight
                      size={15}
                      onClick={() => router.push(`/deals/${deal._id}`)}
                    />
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {deal?.user?.location ?? "Business Location"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3  relative">
              <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
                <div className="border-t-2 border-dashed border-gray-200 w-full"></div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <Calendar className="h-3 w-3 mr-1" /> Expires At :
                  <span className="font-bold">
                    {formatDate(deal?.valid_till, "dd MMM yyyy")}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {/* Claim Button - Now shows state but doesn't handle redemption */}
                  {/* {alreadyRedeemed ? (
                    <div className="px-3 py-1.5 bg-primary/10 rounded-sm text-sm font-medium text-primary flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      Redeemed
                    </div>
                  ) : (
                    <div className="px-2 py-1 bg-secondary/10 rounded-sm text-xs md:text-sm font-medium text-secondary flex items-center gap-1">
                      Claim
                    </div>
                  )} */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
