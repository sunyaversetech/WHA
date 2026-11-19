"use client";

import { memo } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  useCreateFavroite,
  useGetUserFavroite,
} from "@/services/favroite.service";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { EventFormValues } from "../Dashboard/Events/EventsForm";
import { useAuthModal } from "../Auth/DialogLogin/use-auth-model";
import { format, parse } from "date-fns";

function priceLabel(event: any): string {
  if (event.price_category === "registration") return "Free";
  if (event.price_category === "external") return "Get tickets";
  if (event.ticket_price != null) return `From $${event.ticket_price}`;
  return "";
}

const EventCard = memo(function EventCard({
  event,
}: {
  event: EventFormValues;
}) {
  const router = useRouter();
  const { onOpen } = useAuthModal();
  const { mutate, isPending } = useCreateFavroite();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const eventId = event._id || "";

  const handleAddRemoveFavorite = () => {
    if (!session) {
      onOpen();
      return;
    }
    mutate(
      { item_id: eventId, item_type: "Event" },
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

  const { data: userFavorites } = useGetUserFavroite();
  const isEventFavorite = userFavorites?.data?.events?.some(
    (item) => (item._id ?? "").toString() === eventId?.toString(),
  );

  const dateLabel = event.dateRange?.from
    ? `${new Date(event.dateRange.from)
        .toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" })}${
        event?.startTime
          ? ` • ${format(parse(event.startTime, "HH:mm", new Date()), "h:mm aa")}`
          : ""
      }`
    : "Date TBA";
  const venueLabel = event.venue || "Venue TBA";
  const price = priceLabel(event);

  return (
    <article
      data-ui="result-card"
      className="group cursor-pointer"
      style={{ position: "relative", display: "flex", flexDirection: "column", minWidth: 0 }}
      onClick={() => router.push(`/events/${event.slug}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) =>
        e.key === "Enter" && router.push(`/events/${event.slug}`)
      }>
      <div
        data-ui="result-card-media"
        style={{ position: "relative", aspectRatio: "16 / 9", borderRadius: 16, overflow: "hidden", background: "var(--muted)" }}>
        <Image
          fill
          src={event.image || "/placeholder.svg"}
          alt={event.title}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 400px"
        />

        <button
          data-ui="result-card-favourite"
          disabled={isPending}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleAddRemoveFavorite();
          }}
          aria-label={isEventFavorite ? "Remove from favourites" : "Add to favourites"}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
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
            <Heart size={20} color="#fff" fill={isEventFavorite ? "#fff" : "none"} strokeWidth={1.75} />
          )}
        </button>
      </div>

      <div style={{ paddingTop: 10 }}>
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
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}>
            {event.title}
          </h3>
          {price && (
            <span data-ui="result-card-rating" style={{ flexShrink: 0, fontSize: 14, fontWeight: 600, lineHeight: "20px", color: "var(--foreground)" }}>
              {price}
            </span>
          )}
        </div>

        <p data-ui="result-card-meta" style={{ fontSize: 14, fontWeight: 400, lineHeight: "20px", color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
          {dateLabel}
        </p>
        <p data-ui="result-card-meta" style={{ fontSize: 14, fontWeight: 400, lineHeight: "20px", color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
          {venueLabel}
          {event.category && <><span style={{ margin: "0 4px" }}>•</span>{event.category}</>}
          {typeof (event as any).distance === "number" && (
            <>
              <span style={{ margin: "0 4px" }}>•</span>
              {(event as any).distance < 1000
                ? `${Math.round((event as any).distance)} m away`
                : `${((event as any).distance / 1000).toFixed(1)} km away`}
            </>
          )}
        </p>
      </div>
    </article>
  );
});

export default EventCard;
