"use client";

import type React from "react";

import { Heart, MapPin, Calendar } from "lucide-react";
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
import { useAuthModal } from "../Auth/DialogLogin/use-auth-model";

export default function DealCard({ deal }: { deal: DealsGetValues }) {
  const router = useRouter();
  const { mutate, isPending } = useCreateFavroite();
  const { data: session } = useSession();
  const { onOpen } = useAuthModal();
  const queryClient = useQueryClient();
  const handleAddRemoveFavorite = () => {
    if (!session) {
      onOpen();
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
      <div className="relative bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-lg active:scale-[0.98]">
        <div className="absolute top-1/2 -left-2 w-4 h-4 bg-white border border-gray-200 rounded-full -translate-y-1/2" />
        <div className="absolute top-1/2 -right-2 w-4 h-4 bg-white border border-gray-200 rounded-full -translate-y-1/2" />

        <div className="flex  justify-between grid grid-cols-12 xl:h-50 max-xl:h-60">
          <div className="relative h-full w-full col-span-4 ">
            {/* <div className="relative z-49"></div> */}
            <Image
              src={deal.image || "/placeholder.svg"}
              alt="Deal Banner"
              fill
              className="object-cover "
            />
          </div>
          <div className="p-4 space-y-3 col-span-8">
            <div className="">
              <h3 className="text-base flex justify-between md:text-lg font-bold text-gray-900 leading-snug line-clamp-1">
                {deal.title}

                <button
                  disabled={isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddRemoveFavorite();
                  }}
                  className={`p-2 rounded-full transition ${
                    isDealFavorite
                      ? "text-red-500 bg-red-50"
                      : "text-gray-400 bg-gray-100"
                  }`}>
                  <Heart
                    className={`h-5 w-5 ${isDealFavorite ? "fill-current" : ""}`}
                  />
                </button>
              </h3>
            </div>

            {deal.user && (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-md overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                  <Image
                    width={1000}
                    height={1000}
                    src={deal?.user?.image || "/placeholder.svg"}
                    className="w-full h-full object-cover"
                    alt="Business"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">
                    {deal?.user?.business_name ?? "Business Name"}
                  </p>

                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1 text-wha-primary">
                      {deal?.user?.location
                        ?.split(",")
                        .slice(0, 2)
                        .join(", ") || "Business Location"}
                    </span>
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-200 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Expires:</span>
                <span className="font-medium text-gray-700">
                  {formatDate(deal?.valid_till, "dd MMM yyyy")}
                </span>
              </div>

              <div className="">
                <h2 className="text-2xl flex flex-wrap justify-between items-start sm:text-3xl font-bold text-gray-900 leading-tight mb-2">
                  <div className="flex flex-col items-end max-xl:items-center">
                    <div className="flex max-xl:flex-col items-center gap-2">
                      {deal.discount_percentage > 0 ? (
                        <div className="flex max-xl:flex-col gap-2 items-center">
                          <span className="text-gray-400 max-md:text-xs line-through text-lg font-medium">
                            ${deal.price}
                          </span>
                          <span className="text-blue-600 max-md:text-sm">
                            $
                            {(
                              deal.price -
                              (deal.price * deal.discount_percentage) / 100
                            ).toFixed(2)}{" "}
                          </span>
                        </div>
                      ) : (
                        <span>
                          {deal.price && deal.price > 0
                            ? `$${deal.price}`
                            : "Free"}
                        </span>
                      )}
                    </div>

                    {deal.discount_percentage > 0 && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full mt-1 uppercase tracking-wider">
                        {deal.discount_percentage}% OFF
                      </span>
                    )}
                  </div>
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
