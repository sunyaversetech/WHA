"use client";

import { Heart, Loader2, Star, BadgeCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthModal } from "../Auth/DialogLogin/use-auth-model";
import {
  useCreateFavroite,
  useGetUserFavroite,
} from "@/services/favroite.service";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Get } from "@/lib/client-fetch";

type SlotsByServiceId = Record<
  string,
  { available_slots: string[]; slot_remaining?: Record<string, number> }
>;

const MAX_SHOWN_SERVICES = 2;
const MAX_SHOWN_SLOTS = 4;

function formatDurationLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return hours === 1 ? "1hr" : `${hours}hrs`;
  return `${hours}hr ${mins}min`;
}

function formatSlotTime(iso: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(iso))
    .replace(" ", "")
    .toLowerCase();
}

export default function BusinessCard({
  business,
  selectedDate,
  slotsByServiceId,
  slotsLoading,
}: {
  business: any;
  /** YYYY-MM-DD, or "" for "Any day" (no date filter), for the booking deep link */
  selectedDate?: string;
  slotsByServiceId?: SlotsByServiceId;
  slotsLoading?: boolean;
}) {
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

  const activeServices: any[] = (business.services ?? []).filter(
    (s: any) => s.is_active,
  );
  const topServices = [...activeServices]
    .sort((a, b) => (a.base_price ?? 0) - (b.base_price ?? 0))
    .slice(0, MAX_SHOWN_SERVICES);

  const href = `/businesses/${slug}`;
  const prefetch = () => {
    router.prefetch(href);
    queryClient.prefetchQuery({
      queryKey: ["getbusiness", slug],
      queryFn: () => Get({ url: `/api/business/single/${slug}` }),
    });
  };

  const handleSlotClick = (
    e: React.MouseEvent,
    serviceId: string,
    slot: string,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (!session) {
      onOpen();
      return;
    }
    const params = new URLSearchParams({
      book_service: serviceId,
      book_date: selectedDate ?? "",
      book_slot: slot,
    });
    router.push(`/businesses/${slug}?${params.toString()}`);
  };
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
          toast.success(msg.message);
          queryClient.invalidateQueries({ queryKey: ["favroite"] });
        },
        onError: () => toast.error("Failed to update favourites"),
      },
    );
  };

  return (
    <article
      data-ui="result-card"
      className="group cursor-pointer active:scale-[0.98] transition-transform"
      style={{ position: "relative", display: "flex", flexDirection: "column", minWidth: 0 }}>
      <Link
        href={href}
        aria-label={displayName}
        className="absolute inset-0 z-[1]"
        onMouseEnter={prefetch}
        onTouchStart={prefetch}
        onFocus={prefetch}
      />
      <div
        data-ui="result-card-media"
        style={{
          position: "relative",
          aspectRatio: "16 / 9",
          borderRadius: 16,
          overflow: "hidden",
          background: "var(--muted)",
        }}>
        <Image
          fill
          src={business.image || "/placeholder.svg"}
          alt={displayName}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
        />

        {/* Badge */}
        {hasDeal && (
          <span
            data-ui="result-card-badge"
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              height: 24,
              padding: "0 12px",
              borderRadius: 9999,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 13,
              fontWeight: 600,
              lineHeight: "16px",
              color: "var(--foreground)",
              background: "linear-gradient(rgba(255,255,255,.7), rgba(255,255,255,.7))",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              boxShadow: "var(--shadow-floating)",
            }}>
            Deal
          </span>
        )}

        {/* Favourite */}
        <button
          data-ui="result-card-favourite"
          disabled={isPending}
          onClick={handleFav}
          aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 2,
            width: 32,
            height: 32,
            borderRadius: 9999,
            background: "rgba(var(--color-primary-rgb), .33)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}>
          {isPending ? (
            <Loader2 size={16} className="animate-spin" color="#fff" />
          ) : (
            <Heart
              size={20}
              color="#fff"
              fill={isFav ? "#fff" : "none"}
              strokeWidth={1.75}
            />
          )}
        </button>
      </div>

      {/* ── Info ── */}
      <div style={{ paddingTop: 10 }}>
        {/* Name + Rating */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <h3
            data-ui="result-card-title"
            style={{
              flex: "1 1 auto",
              minWidth: 0,
              fontSize: 16,
              fontWeight: 600,
              lineHeight: "22px",
              letterSpacing: "-0.1px",
              color: "var(--foreground)",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</span>
            {isVerified && <BadgeCheck size={16} style={{ color: "var(--secondary)", flexShrink: 0 }} />}
          </h3>

          {avgRating && (
            <div
              data-ui="result-card-rating"
              style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4, fontSize: 14, fontWeight: 600, lineHeight: "20px", color: "var(--foreground)" }}>
              <Star size={16} fill="var(--rating)" color="var(--rating)" strokeWidth={0} />
              {avgRating}
            </div>
          )}
        </div>

        {/* Distance • City */}
        <p
          data-ui="result-card-meta"
          style={{ fontSize: 14, fontWeight: 400, lineHeight: "20px", color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
          {typeof business.distance === "number" && (
            <>
              {business.distance < 1000
                ? `${Math.round(business.distance)} m`
                : `${(business.distance / 1000).toFixed(1)} km`}
              <span style={{ margin: "0 4px" }}>•</span>
            </>
          )}
          {city}
        </p>

        {/* Category • Reviews */}
        <p
          data-ui="result-card-meta"
          style={{ fontSize: 14, fontWeight: 400, lineHeight: "20px", color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
          {category && <span className="capitalize">{category}</span>}
          {category && totalReviews > 0 && <span style={{ margin: "0 4px" }}>•</span>}
          {totalReviews > 0 && `${totalReviews} reviews`}
        </p>

        {/* Services + live time slots (WHA-specific — Fresha's generic
           search card has no equivalent; this is additional content below
           the required title/rating/meta rows, not a replacement for them) */}
        {topServices.length > 0 && (
          <div
            style={{
              marginTop: 14,
              borderTop: "1px solid var(--border)",
              paddingTop: 12,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}>
            {topServices.map((service) => {
              const slotInfo = slotsByServiceId?.[service._id];
              const slots = slotInfo?.available_slots ?? [];
              return (
                <div key={service._id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {service.name}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", flexShrink: 0 }}>
                      A${service.base_price?.toLocaleString("en-AU")}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 1 }}>
                    {formatDurationLabel(service.base_duration)}
                  </div>

                  <div
                    style={{ display: "flex", gap: 8, marginTop: 8, overflowX: "auto", scrollbarWidth: "none" as const }}
                    className="[&::-webkit-scrollbar]:hidden">
                    {!selectedDate ? (
                      <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Pick a day to see times</span>
                    ) : slotsLoading ? (
                      <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Loading times…</span>
                    ) : slots.length === 0 ? (
                      <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>No availability</span>
                    ) : (
                      slots.slice(0, MAX_SHOWN_SLOTS).map((slot) => (
                        <button
                          key={slot}
                          onClick={(e) => handleSlotClick(e, service._id, slot)}
                          style={{
                            position: "relative",
                            zIndex: 2,
                            flexShrink: 0,
                            border: "1px solid var(--border-strong)",
                            background: "var(--background)",
                            color: "var(--foreground)",
                            fontWeight: 600,
                            fontSize: 13,
                            padding: "7px 12px",
                            borderRadius: 10,
                            cursor: "pointer",
                          }}>
                          {formatSlotTime(slot)}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}

            {activeServices.length > topServices.length && (
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--secondary)" }}>
                View {activeServices.length} matching services
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
