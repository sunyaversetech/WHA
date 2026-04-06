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
      router.push("/auth");
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
      toast.error("Please login to add to favorites");
      router.push("/auth");
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
            <div className="order-2 md:order-1 mt-4 md:mt-0 mb-4 px-6 md:px-0">
              <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  <h1 className="text-3xl md:text-5xl font-bold text-gray-800">
                    {event?.data?.title
                      ?.toLowerCase()
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </h1>
                </div>

                <div className="hidden flex items-center gap-2 md:flex md:items-center md:gap-2">
                  <button
                    onClick={handleAddRemoveFavorite}
                    className="flex items-center justify-center p-2 border rounded-full hover:bg-primary/10 transition">
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
                    title="Share Event">
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
                  <span className="font-medium text-foreground">
                    {event?.data?.startTime || "Time TBA"} -{" "}
                    {event?.data?.endTime || "Time TBA"}
                  </span>
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <div className="relative h-80 md:h-[60vh] w-full md:rounded-2xl overflow-hidden">
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
                    onClick={() => router.back()}>
                    <ChevronLeft
                      className="h-9 w-9 cursor-pointer rounded-full border  p-1.5 
                 text-primary bg-white transition-all hover:scale-105 active:scale-95"
                    />{" "}
                  </Button>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddRemoveFavorite}
                      className="flex items-center justify-center bg-white p-2 border rounded-full transition-all hover:scale-105 active:scale-95">
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
                      onClick={handleShare}>
                      <Share className="h-5 w-5 text-primary" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 md:px-0 py-4 md:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-2">
                <div className="md:card-lg md:p-4 md:p-6 mb-6">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                      Event Details
                    </h2>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Date & Time</p>
                          <p className="font-medium text-gray-800">
                            {" "}
                            {event?.data?.dateRange?.from &&
                              formatDate(
                                event?.data?.dateRange?.from,
                                "dd MMM yyyy",
                              )}{" "}
                            {event?.data?.dateRange?.from !==
                              event?.data?.dateRange?.to &&
                            event?.data?.dateRange?.to
                              ? `- ${formatDate(
                                  event?.data?.dateRange?.to,
                                  "dd MMM yyyy",
                                )}`
                              : ""}
                          </p>
                          <p className="font-medium text-gray-800">
                            {" "}
                            {event?.data?.startTime &&
                              format(
                                parse(
                                  event.data.startTime,
                                  "HH:mm",
                                  new Date(),
                                ),
                                "h:mm aa",
                              )}{" "}
                            {event?.data?.endTime &&
                              `- ${format(
                                parse(event.data.endTime, "HH:mm", new Date()),
                                "h:mm aa",
                              )}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <MapPin className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Venue</p>
                          <p className="font-medium text-gray-800">
                            {event?.data?.venue}
                          </p>
                        </div>
                      </div>

                      {event?.data?.category && (
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Sparkles className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Category</p>
                            <p className="font-medium text-gray-800">
                              {event.data?.category}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        About This Event
                      </h3>
                      {event?.data?.description && (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: event.data?.description,
                          }}
                          className="text-gray-600 leading-relaxed"
                        />
                      )}
                    </div>
                  </div>
                </div>
                {event?.data?.latitude && event?.data?.longitude && (
                  <div
                    style={{
                      height: "400px",
                      width: "100%",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}>
                    <MapContainer
                      center={[event.data.latitude, event.data.longitude]}
                      zoom={13}
                      scrollWheelZoom={false}
                      style={{ height: "100%", width: "100%" }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker
                        position={[event.data.latitude, event.data.longitude]}
                        icon={DefaultIcon}>
                        <Popup>
                          <div>
                            <h3 className="font-bold text-lg">
                              {event.data.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2">
                              {event.data.user.business_name}
                            </p>
                            <div className="flex space-x-2 mt-2">
                              <Link
                                href={`/businesses/${event.data.user._id}`}
                                className="bg-primary !text-base px-3 py-1 rounded text-sm font-medium hover:bg-primary/80">
                                View Details
                              </Link>
                              <a
                                href={`https://www.google.com/maps?q=${event.data.latitude},${event.data.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-secondary !text-base px-3 py-1 rounded text-sm font-medium hover:bg-secondary/80 flex items-center">
                                Get Directions
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                      ;
                    </MapContainer>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="card p-4 md:p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    {event?.data?.ticket_link ? (
                      <Link
                        href={event.data?.ticket_link}
                        target="_blank"
                        className="w-full bg-[#041e3a] flex text-white rounded-full text-center items-center justify-center space-x-2 px-4 py-1.5 font-medium">
                        <Ticket className="h-4 w-4 " />
                        <span>Get Tickets</span>
                      </Link>
                    ) : (
                      <div className="text-center">
                        {redemptionResult?.status === "verified" ? (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex flex-col items-center">
                            <div className="flex items-center justify-center space-x-2 mb-4">
                              <Check className="h-5 w-5 text-green-600" />
                              <span className="text-green-800 font-medium text-lg">
                                Ticket Verified!
                              </span>
                            </div>
                            <p className="text-green-700 text-sm mb-2">
                              You have successfully used this ticket at the
                              event.
                            </p>
                          </div>
                        ) : redemptionResult?.success ? (
                          <div className="border rounded-lg p-6 flex flex-col items-center">
                            <div className="flex items-center justify-center space-x-2 mb-4">
                              <span className="font-medium text-lg">
                                Show this Ticket QR at the entrance
                              </span>
                            </div>

                            <div className="bg-white p-3 rounded-lg shadow-sm mb-4 border">
                              <QRCodeCanvas
                                value={redemptionResult.code || ""}
                                size={150}
                              />
                            </div>

                            <p className="text-sm mb-2">Ticket Code:</p>
                            <div className="bg-white border rounded-lg p-4 mb-3 w-full max-w-xs">
                              <code className="text-xl font-mono font-bold tracking-widest">
                                {redemptionResult.code}
                              </code>
                            </div>
                            <p className="text-red-500 text-xs">
                              Valid only for this event session
                            </p>
                          </div>
                        ) : (
                          <div>
                            <button
                              onClick={handleRedeem}
                              disabled={redeemPending}
                              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70">
                              {redeemPending ? (
                                <>
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                "Get Event Ticket"
                              )}
                            </button>
                            <p className="text-gray-500 text-sm mt-3">
                              Claim your spot for this event
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <Button className="w-full" onClick={handleShare}>
                      <Share className="h-4 w-4  mr-2" />
                      Share
                    </Button>
                  </div>
                </div>

                <div className="card p-4 md:p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    {event?.data?.user.email && (
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Mail className="h-4 w-4 text-blue-600" />
                        </div>
                        <a
                          href={`mailto:${event?.data?.user.email}`}
                          className="text-gray-700 hover:text-blue-600 transition-colors">
                          {event?.data?.user.email}
                        </a>
                      </div>
                    )}
                    {event?.data.phone_number && (
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Phone className="h-4 w-4 text-green-600" />
                        </div>
                        <a
                          href={`tel:${event.data.phone_number}`}
                          className="text-gray-700 hover:text-green-600 transition-colors">
                          {event.data.phone_number}
                        </a>
                      </div>
                    )}
                    {/* {!event.contactEmail && !event.contactPhone && (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">
                      Contact information not available
                    </p>
                  </div>
                )} */}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Fixed  */}
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
                  className="bg-primary text-white px-4 py-2 rounded-full text-base font-semibold hover:opacity-90 transition flex items-center gap-2">
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
