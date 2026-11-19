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
  /** YYYY-MM-DD, for the booking deep link */
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
      onKeyDown={(e) =>
        e.key === "Enter" && router.push(`/businesses/${slug}`)
      }>
      <div
        className="w-full h-35 sm:h-35  lg:h-40 xl:h-45 2xl:h-50"
        style={{
          borderRadius: 18,
          position: "relative",
          overflow: "hidden",
          background: "#e9eef2",
        }}>
        <Image
          height={1000}
          width={1000}
          src={business.image || "/placeholder.svg"}
          alt={displayName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
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
            }}>
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
          }}>
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
          }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              minWidth: 0,
            }}>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#0f172a",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
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
              }}>
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
          }}>
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
          }}>
          {category && <span className="capitalize">{category}</span>}

          {category && totalReviews > 0 && <span>•</span>}

          {totalReviews > 0 && <span>{totalReviews} reviews</span>}
        </div>

        {/* Services + live time slots */}
        {topServices.length > 0 && (
          <div
            style={{
              marginTop: 14,
              borderTop: "1px solid #eef1f5",
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
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: 8,
                    }}>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#0f172a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                      {service.name}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#0f172a",
                        flexShrink: 0,
                      }}>
                      A${service.base_price?.toLocaleString("en-AU")}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 1 }}>
                    {formatDurationLabel(service.base_duration)}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 8,
                      overflowX: "auto",
                      scrollbarWidth: "none" as const,
                    }}
                    className="[&::-webkit-scrollbar]:hidden">
                    {slotsLoading ? (
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>
                        Loading times…
                      </span>
                    ) : slots.length === 0 ? (
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>
                        No availability
                      </span>
                    ) : (
                      slots.slice(0, MAX_SHOWN_SLOTS).map((slot) => (
                        <button
                          key={slot}
                          onClick={(e) => handleSlotClick(e, service._id, slot)}
                          style={{
                            flexShrink: 0,
                            border: "1px solid #d8dfe9",
                            background: "#fff",
                            color: "#0f2748",
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
              <span style={{ fontSize: 13, fontWeight: 600, color: "#3771db" }}>
                View {activeServices.length} matching services
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
