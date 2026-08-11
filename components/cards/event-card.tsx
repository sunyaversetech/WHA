"use client";

import { memo } from "react";
import { MapPin, Heart, Loader2 } from "lucide-react";
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
import { Button } from "../ui/button";
import { formatTime } from "@/components/Dashboard/Ticket/ticket-utils";
import { format, parse } from "date-fns";

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

  return (
    <article
      className="group relative overflow-hidden  cursor-pointer
                 transition-all duration-200 hover:-translate-y-0.5"
      onClick={() => router.push(`/events/${event.slug}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) =>
        e.key === "Enter" && router.push(`/events/${event.slug}`)
      }>
      {/* Image */}
      <div className="relative h-48 md:h-42 w-full overflow-hidden rounded-xl">
        <Image
          fill
          src={event.image || "/placeholder.svg"}
          alt={event.title}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 400px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Favourite button */}
        <button
          disabled={isPending}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleAddRemoveFavorite();
          }}
          aria-label={
            isEventFavorite ? "Remove from favourites" : "Add to favourites"
          }
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
      <div className="pt-4 flex justify-between">
        <div className="space-y-1 min-w-0">
          <span className="text-xs text-muted-foreground">
            {event.dateRange?.from ? (
              <>
                {new Date(event.dateRange.from)
                  .toLocaleDateString("en-US", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                  })
                  .toUpperCase()}
                ,{" "}
                {event?.startTime
                  ? format(
                      parse(event.startTime, "HH:mm", new Date()),
                      "h:mm aa",
                    )
                  : "Time TBA"}
                {event?.endTime &&
                  ` - ${format(parse(event.endTime, "HH:mm", new Date()), "h:mm aa")}`}
              </>
            ) : (
              "TBA"
            )}
          </span>
          <h3 className="text-primary font-bold text-sm md:text-base line-clamp-2 leading-snug">
            {event.title}
          </h3>
          <span className="block truncate text-xs text-muted-foreground">
            {event.venue || "Venue TBA"}
          </span>
          {typeof (event as any).distance === "number" && (
            <div className="flex items-center gap-1.5 text-muted-foreground pt-0.5">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-secondary" />
              <span className="text-xs">
                {(event as any).distance < 1000
                  ? `${Math.round((event as any).distance)} m away`
                  : `${((event as any).distance / 1000).toFixed(1)} km away`}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end items-start">
          {event.price_category === "paid" ? (
            <Button
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/events/${event.slug}`);
              }}
              className="h-auto px-3 py-1.5 border border-primary rounded-full
                         text-primary bg-transparent hover:bg-primary hover:text-white
                         transition-colors duration-150 flex-shrink-0">
              <span className="text-xs font-semibold">GET TICKETS</span>
            </Button>
          ) : event.price_category === "external" ? (
            <span
              className="inline-flex items-center px-3 py-1.5 border border-primary rounded-full
                            text-primary shrink-0">
              <span className="text-xs font-semibold">GET TICKETS</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center px-3 py-1.5 border border-green-600 rounded-full
                            text-green-600 flex-shrink-0">
              <span className="text-xs font-semibold">FREE</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
});

export default EventCard;
