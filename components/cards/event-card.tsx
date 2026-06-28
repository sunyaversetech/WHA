"use client";

import { memo } from "react";
import { Calendar, MapPin, Heart, Loader2, Ticket } from "lucide-react";
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

const EventCard = memo(function EventCard({ event }: { event: EventFormValues }) {
  const router = useRouter();
  const { onOpen } = useAuthModal();
  const { mutate, isPending } = useCreateFavroite();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const eventId = event._id || "";

  const formatDate = (dateInput: string | Date) => {
    if (!dateInput) return "";
    return new Intl.DateTimeFormat("en-AU", {
      month: "short",
      day: "numeric",
    }).format(typeof dateInput === "string" ? new Date(dateInput) : dateInput);
  };

  let dateDisplay = "TBA";
  if (event.dateRange?.from) {
    const from = formatDate(event.dateRange.from);
    const to =
      event.dateRange.to && event.dateRange.to !== event.dateRange.from
        ? ` – ${formatDate(event.dateRange.to)}`
        : "";
    dateDisplay = `${from}${to}`;
  }

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

  const categoryLabel = event.category
    ? event.category.charAt(0).toUpperCase() + event.category.slice(1)
    : "Event";

  return (
    <article
      className="group relative overflow-hidden rounded-xl bg-white border border-border cursor-pointer
                 transition-all duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: "var(--card-shadow)" }}
      onClick={() => router.push(`/events/${event.slug}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/events/${event.slug}`)}>

      {/* Image */}
      <div className="relative h-48 md:h-52 w-full overflow-hidden">
        <Image
          fill
          src={event.image || "/placeholder.svg"}
          alt={event.title}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 400px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Category badge */}
        <span className="absolute top-3 left-3 bg-white/20 backdrop-blur-md border border-white/30
                         text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          {categoryLabel}
        </span>

        {/* Favourite button */}
        <button
          disabled={isPending}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleAddRemoveFavorite();
          }}
          aria-label={isEventFavorite ? "Remove from favourites" : "Add to favourites"}
          className="absolute top-3 right-3 p-2 bg-black/20 backdrop-blur-md border border-white/30
                     rounded-full transition-all duration-150 hover:bg-black/40 disabled:opacity-60
                     focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <Heart
              className={`h-4 w-4 transition-colors duration-150 ${
                isEventFavorite ? "text-red-400 fill-red-400" : "text-white"
              }`}
            />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-primary font-bold text-sm md:text-base line-clamp-2 mb-3 leading-snug">
          {event.title}
        </h3>

        <div className="flex items-end justify-between gap-2">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-secondary" />
              <span className="truncate text-xs">{event.venue || "Venue TBA"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-secondary" />
              <span className="text-xs">{dateDisplay}</span>
            </div>
            {typeof (event as any).distance === "number" && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-secondary" />
                <span className="text-xs">
                  {(event as any).distance < 1000
                    ? `${Math.round((event as any).distance)} m away`
                    : `${((event as any).distance / 1000).toFixed(1)} km away`}
                </span>
              </div>
            )}
          </div>

          {event.price_category === "paid" ? (
            <a
              href={event.ticket_link || "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-primary rounded-full
                         text-primary hover:bg-primary hover:text-white
                         transition-colors duration-150 flex-shrink-0">
              <Ticket className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">Ticket</span>
            </a>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 border border-green-600 rounded-full
                            text-green-600 flex-shrink-0">
              <Ticket className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">FREE</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
});

export default EventCard;
