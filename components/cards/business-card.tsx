"use client";

import { Heart, Loader2, MapPin, Star } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthModal } from "../Auth/DialogLogin/use-auth-model";
import {
  useCreateFavroite,
  useGetUserFavroite,
} from "@/services/favroite.service";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORY_LABELS: Record<string, string> = {
  restaurant:   "Restaurant",
  cafe:         "Café",
  "food-truck": "Food Truck",
  grocery:      "Grocery",
  salon:        "Salon",
  consultancy:  "Consultancy",
};

export default function BusinessCard({ business }: { business: any }) {
  const { onOpen }         = useAuthModal();
  const { mutate, isPending } = useCreateFavroite();
  const { data: session }  = useSession();
  const queryClient        = useQueryClient();
  const router             = useRouter();
  const businessId         = business?._id;

  const { data: userFavorites } = useGetUserFavroite();
  const isBusinessFavorite = userFavorites?.data?.business?.some(
    (item) => (item._id ?? "").toString() === businessId?.toString(),
  );

  const avgRating =
    business?.reviews?.length > 0
      ? business.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) /
        business.reviews.length
      : null;
  const totalReviews = business?.reviews?.length ?? 0;

  const slug = business.business_name?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  const categoryLabel =
    CATEGORY_LABELS[business.business_category] ??
    business.business_category ??
    "Business";

  const handleFavourite = () => {
    if (!session) { onOpen(); return; }
    mutate(
      { item_id: businessId, item_type: "User" },
      {
        onSuccess: (msg) => {
          router.refresh();
          toast.success(msg.message);
          queryClient.invalidateQueries({ queryKey: ["favroite"] });
        },
        onError: () => toast.error("Failed to update favourites"),
      },
    );
  };

  return (
    <article
      className="group cursor-pointer"
      onClick={() => router.push(`/businesses/${slug}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/businesses/${slug}`)}>

      {/* Image */}
      <div className="relative w-full h-52 rounded-xl overflow-hidden">
        <Image
          fill
          src={business.image || "/placeholder.svg"}
          alt={business.business_name}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 400px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Category badge */}
        <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1
                         bg-white text-primary text-xs font-semibold rounded-full shadow-sm">
          {categoryLabel}
        </span>

        {/* Favourite button */}
        <button
          disabled={isPending}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleFavourite();
          }}
          aria-label={isBusinessFavorite ? "Remove from favourites" : "Add to favourites"}
          className="absolute top-3 right-3 p-2 bg-black/20 backdrop-blur-md border border-white/30
                     rounded-full transition-all duration-150 hover:bg-black/40 disabled:opacity-60
                     focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <Heart
              className={`h-4 w-4 transition-colors duration-150 ${
                isBusinessFavorite ? "text-red-400 fill-red-400" : "text-white"
              }`}
            />
          )}
        </button>
      </div>

      {/* Info */}
      <div className="pt-3 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-primary font-bold text-sm md:text-base line-clamp-1 leading-snug">
              {business.business_name}
            </h3>
            {business.city && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="capitalize">{business.city}</span>
              </p>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-amber-200 bg-amber-50 flex-shrink-0">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-gray-800">
              {avgRating !== null ? avgRating.toFixed(1) : "—"}
            </span>
            {totalReviews > 0 && (
              <span className="text-xs text-muted-foreground">({totalReviews})</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
