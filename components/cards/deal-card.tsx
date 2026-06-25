"use client";

import { Heart, MapPin, Calendar, Tag } from "lucide-react";
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
  const router        = useRouter();
  const { mutate, isPending } = useCreateFavroite();
  const { data: session }     = useSession();
  const { onOpen }            = useAuthModal();
  const queryClient           = useQueryClient();

  const { data: userFavorites } = useGetUserFavroite();
  const isDealFavorite = userFavorites?.data?.deals?.some(
    (item: { _id: string }) => item._id.toString() === deal._id?.toString(),
  );

  const handleFavourite = () => {
    if (!session) {
      onOpen();
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
        onError: () => toast.error("Failed to update favourites"),
      },
    );
  };

  const discountedPrice =
    deal.discount_percentage > 0
      ? (deal.price - (deal.price * deal.discount_percentage) / 100).toFixed(2)
      : null;

  return (
    <article
      className="relative block cursor-pointer group"
      onClick={() => router.push(`/deals/${deal._id}`)}>

      {/* Discount badge */}
      {deal.discount_percentage > 0 && (
        <div className="absolute -top-1 left-3 z-10">
          <span className="inline-flex items-center gap-1 bg-green-600 text-white text-[10px] font-black
                           px-2 py-1 rounded-md shadow-md border-2 border-white uppercase tracking-wide">
            <Tag className="h-2.5 w-2.5" />
            {deal.discount_percentage}% OFF
          </span>
        </div>
      )}

      {/* Card */}
      <div className="relative bg-white rounded-xl border border-border overflow-hidden
                      transition-all duration-200 hover:shadow-md active:scale-[0.99]"
           style={{ boxShadow: "var(--card-shadow)" }}>

        {/* Ticket punch-holes */}
        <div className="absolute top-1/2 -left-2 w-4 h-4 bg-background border border-border rounded-full -translate-y-1/2 z-10" />
        <div className="absolute top-1/2 -right-2 w-4 h-4 bg-background border border-border rounded-full -translate-y-1/2 z-10" />

        <div className="grid grid-cols-12 h-44 md:h-48">
          {/* Image */}
          <div className="relative col-span-4">
            <Image
              src={deal.image || "/placeholder.svg"}
              alt={deal.title}
              fill
              className="object-cover"
              sizes="160px"
            />
          </div>

          {/* Content */}
          <div className="col-span-8 p-3 md:p-4 flex flex-col justify-between">
            {/* Title + favourite */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm md:text-base font-bold text-primary leading-snug line-clamp-2 flex-1">
                {deal.title}
              </h3>
              <button
                disabled={isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFavourite();
                }}
                aria-label={isDealFavorite ? "Remove from favourites" : "Add to favourites"}
                className={`p-1.5 rounded-full flex-shrink-0 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                  isDealFavorite ? "text-red-500 bg-red-50" : "text-muted-foreground bg-muted"
                }`}>
                <Heart className={`h-4 w-4 ${isDealFavorite ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Business info */}
            {deal.user && (
              <div className="flex items-center gap-2 py-1">
                <div className="w-8 h-8 rounded-md overflow-hidden bg-muted border border-border flex-shrink-0">
                  <Image
                    width={32}
                    height={32}
                    src={deal?.user?.image || "/placeholder.svg"}
                    className="w-full h-full object-cover"
                    alt={deal?.user?.business_name ?? "Business"}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground line-clamp-1">
                    {deal?.user?.business_name ?? "Business"}
                  </p>
                  {deal?.user?.location && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                      <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {deal.user.location.split(",").slice(0, 2).join(", ")}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Footer: expiry + price */}
            <div className="flex items-center justify-between border-t border-dashed border-border pt-2">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Expires {formatDate(deal?.valid_till, "dd MMM yyyy")}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {discountedPrice ? (
                  <>
                    <span className="text-xs text-muted-foreground line-through">${deal.price}</span>
                    <span className="text-sm font-bold text-secondary">${discountedPrice}</span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-primary">
                    {deal.price && deal.price > 0 ? `$${deal.price}` : "Free"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
