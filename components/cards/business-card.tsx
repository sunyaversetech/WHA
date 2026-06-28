"use client";

import { Heart, Loader2, Star, BadgeCheck } from "lucide-react";
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

export default function BusinessCard({ business }: { business: any }) {
  const { onOpen } = useAuthModal();
  const { mutate, isPending } = useCreateFavroite();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const businessId = business?._id;

  const { data: userFavorites } = useGetUserFavroite();
  const isFav = userFavorites?.data?.business?.some(
    (item: any) => (item._id ?? "").toString() === businessId?.toString(),
  );

  const avgRating =
    business?.reviews?.length > 0
      ? (
          business.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) /
          business.reviews.length
        ).toFixed(1)
      : null;
  const totalReviews = business?.reviews?.length ?? 0;

  const displayName = business.business_name ?? business.name ?? "Business";
  const slug = displayName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const category = business.business_category ?? "";
  const city = business.city_name ?? business.city ?? "";
  const hasDeal = (business.deal?.length ?? 0) > 0;
  const isVerified = business.verified ?? business.isSponsor ?? false;

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!session) {
      onOpen();
      return;
    }
    mutate(
      { item_id: businessId, item_type: "User" },
      {
        onSuccess: (msg: any) => {
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
      onKeyDown={(e) => e.key === "Enter" && router.push(`/businesses/${slug}`)}
    >
      {/* ── Image ── */}
      <div
        style={{
          aspectRatio: "16/11",
          borderRadius: 18,
          position: "relative",
          overflow: "hidden",
          background: "#e9eef2",
        }}
      >
        <Image
          fill
          src={business.image || "/placeholder.svg"}
          alt={displayName}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(2,12,26,0.2) 0%, transparent 55%)",
          }}
        />

        {/* Deal badge */}
        {hasDeal && (
          <span
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              background: "#3771db",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 9999,
              letterSpacing: "0.04em",
            }}
          >
            Deal
          </span>
        )}

        {/* Favourite */}
        <button
          disabled={isPending}
          onClick={handleFav}
          aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.92)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          {isPending ? (
            <Loader2 size={16} className="animate-spin" color="#0f2748" />
          ) : (
            <Heart
              size={16}
              color={isFav ? "#e11d48" : "#0f2748"}
              fill={isFav ? "#e11d48" : "none"}
              strokeWidth={2}
            />
          )}
        </button>
      </div>

      {/* ── Info ── */}
      <div style={{ marginTop: 12 }}>
        {/* Name + Rating */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#0f172a",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayName}
            </span>

            {isVerified && (
              <BadgeCheck
                size={18}
                style={{ color: "#3771db", flexShrink: 0 }}
              />
            )}
          </div>

          {avgRating && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 16,
                fontWeight: 700,
                color: "#0f172a",
                flexShrink: 0,
              }}
            >
              <Star size={16} fill="#f5b301" color="#f5b301" />
              {avgRating}
            </div>
          )}
        </div>

        {/* Distance • City */}
        <div
          style={{
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 15,
            color: "#6b7280",
          }}
        >
          {typeof business.distance === "number" && (
            <>
              <span>
                {business.distance < 1000
                  ? `${Math.round(business.distance)} m`
                  : `${(business.distance / 1000).toFixed(1)} km`}
              </span>
              <span>•</span>
            </>
          )}

          {city && <span>{city}</span>}
        </div>

        {/* Category • Reviews */}
        <div
          style={{
            marginTop: 4,
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
            fontSize: 15,
            color: "#6b7280",
          }}
        >
          {category && <span className="capitalize">{category}</span>}

          {category && totalReviews > 0 && <span>•</span>}

          {totalReviews > 0 && <span>{totalReviews} reviews</span>}
        </div>
      </div>
    </article>
  );
}
