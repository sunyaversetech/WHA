"use client";
import {
  Calendar,
  MapPin,
  Mail,
  Ticket,
  Sparkles,
  ChevronLeft,
  ExternalLink,
  Share,
  Loader2,
  Heart,
  Dot,
  Phone,
  Clock,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useGetEventRedeem,
  useGetSingleEvent,
  useRedeemEventCode,
} from "@/services/event.service";
import Image from "next/image";
import { format, formatDate, parse } from "date-fns";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  useCreateFavroite,
  useGetUserFavroite,
} from "@/services/favroite.service";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import EventDetailsSkeleton from "./SingleEventSkeleton";
import { QRCodeCanvas } from "qrcode.react";
import { useAuthModal } from "../Auth/DialogLogin/use-auth-model";

export default function EventDetailPage() {
  const param = useParams();
  const awaitedParams = param as { id: string };
  const slug = awaitedParams?.id.toLowerCase().replace(/[^a-z0-9]/g, "");
  const { data: session } = useSession();
  const { mutate, isPending } = useCreateFavroite();
  const router = useRouter();
  const { data: event, isLoading } = useGetSingleEvent(slug);
  const queryClient = useQueryClient();
  const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  const [redemptionResult, setRedemptionResult] = useState<{
    success: boolean;
    message: string;
    code?: string;
    status: string;
  } | null>(null);

  const { mutate: redeem, isPending: redeemPending } = useRedeemEventCode();
  const { data } = useGetEventRedeem();
  const { onOpen } = useAuthModal();

  const [copied, setCopied] = useState(false);
  const EventId = event?.data?._id;

  const userRedemption = data?.data?.find(
    (redemption: any) =>
      redemption.user === session?.user?.id &&
      redemption.event._id === event?.data?._id,
  );

  useEffect(() => {
    if (!userRedemption) return;
    setTimeout(() => {
      setRedemptionResult({
        success: true,
        message: "success",
        code: userRedemption?.uniqueKey,
        status: userRedemption.status,
      });
    }, 0);
  }, [userRedemption]);

  const handleRedeem = async () => {
    if (!session?.user) {
      onOpen();
      toast.error("Please login to get your ticket");
      return;
    }

    redeem(
      {
        eventId: event?.data?._id ?? "",
        userId: session?.user.id ?? "",
        business: event?.data?.user?._id ?? "",
      },
      {
        onSuccess: (responseData: any) => {
          setRedemptionResult({
            success: true,
            message: "success",
            code: responseData.uniqueKey,
            status: "pending",
          });
          queryClient.invalidateQueries({ queryKey: ["redeem"] });
          toast.success("Ticket claimed successfully!");
        },
        onError: (error: any) => {
          setRedemptionResult({
            success: false,
            message: error.message,
            status: "error",
          });
          toast.error(error.message);
        },
      },
    );
  };

  const handleShare = async () => {
    const shareData = {
      title: "Check out this event!",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast.success("Event Copied!");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const handleAddRemoveFavorite = () => {
    if (!session) {
      onOpen();
      return;
    }
    mutate(
      { item_id: EventId, item_type: "User" },
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

  const isEventFavorite = userFavorites?.data?.events?.some(
    (item) => (item._id ?? "").toString() === EventId?.toString(),
  );

  if (isLoading) {
    <EventDetailsSkeleton />;
  }

  return (
    <div className="relative md:container-modern mx-auto md:p-6 pb-20 md:pb-0">
      {isLoading ? (
        <EventDetailsSkeleton />
      ) : (
        <>
          <div className="flex flex-col md:flex-col">
            <div className=" order-2 md:order-1 mt-4 md:mt-0 mb-4 px-6 md:px-0">
              <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                    {event?.data?.title
                      ?.toLowerCase()
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </h1>
                </div>

                <div className="hidden flex items-center gap-2 md:flex md:items-center md:gap-2">
                  <button
                    onClick={handleAddRemoveFavorite}
                    className="flex items-center justify-center p-2 border rounded-full hover:bg-primary/10 transition"
                  >
                    {isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                    ) : (
                      <Heart
                        className={cn(
                          "h-5 w-5 sm:h-6 sm:w-6 text-primary transition-all",
                          isEventFavorite
                            ? "text-red-500 scale-110"
                            : "text-neutral-600 hover:text-neutral-900",
                        )}
                        fill={isEventFavorite ? "red" : "none"}
                      />
                    )}
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center p-2 border rounded-full hover:bg-primary/10 transition-all active:scale-90"
                    title="Share Event"
                  >
                    <Share className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2 text-base text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1 sm:gap-2">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium text-foreground">
                    {event?.data?.venue || "Venue TBA"}
                  </span>
                </div>

                <Dot className="hidden md:block h-4 w-4" />

                <div className="flex items-center gap-1 sm:gap-2">
                  <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium text-foreground">
                    {event?.data.dateRange?.from
                      ? `${formatDate(event?.data?.dateRange.from, "dd MMM yyyy")} ${
                          event?.data?.dateRange.from !==
                            event?.data?.dateRange.to &&
                          event?.data?.dateRange.to
                            ? `- ${formatDate(
                                event?.data.dateRange.to,
                                "dd MMM yyyy",
                              )}`
                            : ""
                        }`
                      : "Date TBA"}
                  </span>
                </div>

                <Dot className="hidden md:block h-4 w-4" />

                <div className="flex items-center gap-1 sm:gap-2">
                  <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                  <p className="font-medium text-gray-800">
                    {event?.data?.startTime
                      ? format(
                          parse(event.data.startTime, "HH:mm", new Date()),
                          "h:mm aa",
                        )
                      : "Time TBA"}

                    {event?.data?.endTime &&
                      ` - ${format(
                        parse(event.data.endTime, "HH:mm", new Date()),
                        "h:mm aa",
                      )}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <div className="relative h-80 md:h-[70vh] w-full md:rounded-xl overflow-hidden">
                <Image
                  fill
                  src={event?.data?.image || "/placeholder.svg"}
                  alt={event?.data?.title || "Event Image"}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-10 md:rounded-2xl"></div>

                <div className="absolute inset-0 z-50 flex items-start justify-between p-3 md:hidden">
                  <Button
                    variant={"ghost"}
                    className="p-0 transition-all hover:scale-105 active:scale-95"
                    onClick={() => router.back()}
                  >
                    <ChevronLeft
                      className="h-9 w-9 cursor-pointer rounded-full border  p-1.5 
                 text-primary bg-white transition-all hover:scale-105 active:scale-95"
                    />{" "}
                  </Button>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddRemoveFavorite}
                      className="flex items-center justify-center bg-white p-2 border rounded-full transition-all hover:scale-105 active:scale-95"
                    >
                      {isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                      ) : (
                        <Heart
                          className={cn(
                            "h-5 w-5 md:h-6 md:w-6 text-primary transition-all",
                            isEventFavorite
                              ? "text-red-500 scale-110"
                              : "text-neutral-600 hover:text-neutral-900",
                          )}
                          fill={isEventFavorite ? "red" : "none"}
                        />
                      )}
                    </button>

                    <button
                      className="flex items-center justify-center p-2 border rounded-full bg-white transition-all hover:scale-105 active:scale-95"
                      onClick={handleShare}
                    >
                      <Share className="h-5 w-5 text-primary" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 md:px-0 py-4 md:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Right Column: Sticky Event Card */}
              <div className="lg:col-span-1 order-2 md:order-2">
                <div className="sticky top-30">
                  <div className="card p-5 md:p-6 rounded-md border border-gray-300 shadow-md space-y-4">
                    {/* Event Title */}
                    <h1 className="text-xl font-bold text-gray-800">
                      {event?.data?.title
                        ?.toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </h1>

                    {/* Category */}
                    <p className="text-sm font-medium text-primary">
                      {event?.data?.ticket_link
                        ? "Ticket Required Event"
                        : event?.data?.price_category === "free"
                          ? "Free Event"
                          : "Free Event  | Registration Required"}
                    </p>

                    {/* CTA Button */}
                    {event?.data?.ticket_link ? (
                      <Link
                        href={event.data.ticket_link}
                        target="_blank"
                        className="w-full block bg-primary text-white rounded-full py-3 text-center font-semibold hover:opacity-90 transition"
                      >
                        Get Tickets
                      </Link>
                    ) : event?.data?.price_category === "free" ? (
                      <div className="w-full bg-primary text-white rounded-full py-3 text-center font-semibold">
                        No Ticket Required
                      </div>
                    ) : (
                      <button
                        onClick={handleRedeem}
                        disabled={redeemPending || redemptionResult?.success}
                        className={cn(
                          "w-full rounded-full py-3 font-semibold transition",
                          redemptionResult?.success
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-primary text-white hover:opacity-90",
                        )}
                      >
                        {redemptionResult?.success
                          ? "Already Registered"
                          : redeemPending
                            ? "Processing..."
                            : "Register"}
                      </button>
                    )}

                    {/* Divider */}
                    <div className="border-t pt-4 space-y-3 text-sm text-gray-700">
                      {/* Date */}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>
                          {event?.data?.dateRange?.from
                            ? `${formatDate(event.data.dateRange.from, "dd MMM yyyy")}`
                            : "Date TBA"}
                        </span>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <p className="font-medium text-gray-800">
                          {event?.data?.startTime
                            ? format(
                                parse(
                                  event.data.startTime,
                                  "HH:mm",
                                  new Date(),
                                ),
                                "h:mm aa",
                              )
                            : "Time TBA"}
                          {event?.data?.endTime &&
                            ` - ${format(parse(event.data.endTime, "HH:mm", new Date()), "h:mm aa")}`}
                        </p>
                      </div>

                      {/* Venue */}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-9 w-9 text-primary" />
                        <span>
                          {event?.data?.location || "Venue TBA"}{" "}
                          <div>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                event?.data.location || "",
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-primary text-sm"
                            >
                              Get Directions
                            </a>
                          </div>
                        </span>
                      </div>
                    </div>

                    {/* Ticket / QR Section */}
                    {!event?.data?.ticket_link && redemptionResult?.success && (
                      <div className="border-t pt-4 flex flex-col items-center text-center">
                        <p className="text-sm text-gray-500 mb-2">
                          Your Ticket
                        </p>

                        <div className="bg-white p-3 rounded-lg border mb-3">
                          <QRCodeCanvas
                            value={redemptionResult.code || ""}
                            size={120}
                          />
                        </div>

                        <code className="text-lg font-mono font-bold tracking-widest text-gray-800">
                          {redemptionResult.code}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Left Column: Main Content */}
              <div className="lg:col-span-2 space-y-6 order-1 md:order-1">
                {/* Description Section */}
                <div className="md:card-lg md:p-4 md:p-6 pb-4 md:pb-0">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                    Descriptions
                  </h2>
                  {event?.data?.description && (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: event.data.description,
                      }}
                      className="text-gray-600 leading-relaxed"
                    />
                  )}
                </div>

                {/* Location Section */}
                <div className="md:p-4 md:p-6 mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                    Location
                  </h2>

                  {event?.data?.latitude && event?.data?.longitude && (
                    <div className="h-[200px] md:h-[400px] w-full rounded-lg overflow-hidden">
                      <MapContainer
                        center={[event.data.latitude, event.data.longitude]}
                        zoom={13}
                        scrollWheelZoom={false}
                        className="h-full w-full"
                      >
                        <TileLayer
                          attribution="&copy; OpenStreetMap contributors"
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker
                          position={[event.data.latitude, event.data.longitude]}
                          icon={DefaultIcon}
                          eventHandlers={{
                            click: () => {
                              window.open(
                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  event.data.location,
                                )}`,
                                "_blank",
                              );
                            },
                          }}
                        />
                      </MapContainer>
                    </div>
                  )}

                  <div className="mt-4">
                    <span className="text-sm">{event?.data.location}</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        event?.data.location || "",
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-primary text-sm pl-1"
                    >
                      Get Directions
                    </a>
                  </div>
                </div>

                {/* Host Section */}
                <div className="md:p-4 md:p-6 mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                    Host
                  </h2>
                  {/* Add Host content here if any */}
                  <div className="flex flex-row  items-center gap-6 border rounded-md p-4">
                    {/* Host Image */}
                    <div className="flex-shrink-0">
                      <Image
                        src={event?.data?.image || "/placeholder.svg"}
                        alt={event?.data?.title || "Host Image"}
                        width={80}
                        height={80}
                        className="rounded-sm object-cover shadow-md"
                      />
                    </div>

                    {/* Host Details */}
                    <div className="flex-1 space-y-2">
                      {/* Name & Followers */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">
                          {event?.data?.title || "Host Name"}
                        </h3>
                      </div>

                      {/* Reviews */}
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="font-medium text-foreground">
                          *****
                        </span>
                        <div className="flex gap-1"></div>
                        <span></span>
                      </div>

                      {/* Host City */}
                      <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base mt-3">
                        Business City
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t shadow-sm z-[9999]">
            <div className="flex items-center justify-between px-6 py-3">
              <p className="text-gray-600 text-sm">
                {" "}
                {event?.data?.title
                  ?.toLowerCase()
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </p>
              {event?.data?.ticket_link ? (
                <Link
                  href={event.data.ticket_link}
                  target="_blank"
                  className="bg-primary text-white px-4 py-2 rounded-full text-base font-semibold hover:opacity-90 transition flex items-center gap-2"
                >
                  Get Tickets
                </Link>
              ) : (
                <button className="bg-primary text-white px-4 py-2 rounded-full text-base font-semibold flex items-center gap-2 hover:opacity-80 transition cursor-default">
                  Free Entry
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
