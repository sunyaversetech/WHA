"use client";
import {
  Calendar,
  MapPin,
  ChevronLeft,
  Share2,
  Loader2,
  Heart,
  Clock,
  Star,
  Ticket,
  ExternalLink,
  CheckCircle2,
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
import { MapContainer, Marker, TileLayer } from "react-leaflet";
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

  const averageRating =
    event?.data && event.data.reviews.length > 0
      ? Math.round(
          event.data.reviews.reduce((acc, review) => acc + review.rating, 0) /
            event.data.reviews.length,
        )
      : 0;

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
        toast.success("Link copied!");
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

  const titleCase = (str?: string) =>
    str?.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) ?? "";

  if (isLoading) return <EventDetailsSkeleton />;

  return (
    /* ─── Page wrapper ─── */
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
      {/* ─── HERO IMAGE ─── */}
      <div className="relative w-full h-64 sm:h-80 md:h-[60vh]">
        <Image
          fill
          src={event?.data?.image || "/placeholder.svg"}
          alt={event?.data?.title || "Event"}
          className="object-cover"
          priority
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Mobile top nav (back + actions) */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between md:hidden z-20">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 shadow-md backdrop-blur-sm transition active:scale-95"
            aria-label="Go back">
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddRemoveFavorite}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 shadow-md backdrop-blur-sm transition active:scale-95"
              aria-label={
                isEventFavorite ? "Remove from favourites" : "Add to favourites"
              }>
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              ) : (
                <Heart
                  className={cn(
                    "h-5 w-5 transition-all",
                    isEventFavorite
                      ? "text-red-500 scale-110"
                      : "text-gray-600",
                  )}
                  fill={isEventFavorite ? "red" : "none"}
                />
              )}
            </button>

            <button
              onClick={handleShare}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 shadow-md backdrop-blur-sm transition active:scale-95"
              aria-label="Share event">
              <Share2 className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
      {/* ─── END HERO ─── */}

      {/* ─── MAIN CONTENT ─── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Title + Desktop actions strip ─── */}
        <div className="flex items-start justify-between gap-4 mt-6 mb-6">
          {/* Desktop back arrow */}
          <button
            onClick={() => router.back()}
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition flex-shrink-0 mt-1"
            aria-label="Go back">
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              {titleCase(event?.data?.title)}
            </h1>

            {/* Meta pills */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <MetaPill
                icon={<MapPin className="h-4 w-4" />}
                label={event?.data?.venue || "Venue TBA"}
              />
              <MetaPill
                icon={<Calendar className="h-4 w-4" />}
                label={
                  event?.data?.dateRange?.from
                    ? `${formatDate(event.data.dateRange.from, "dd MMM yyyy")}${event.data.dateRange.to && event.data.dateRange.from !== event.data.dateRange.to ? ` – ${formatDate(event.data.dateRange.to, "dd MMM yyyy")}` : ""}`
                    : "Date TBA"
                }
              />
              <MetaPill
                icon={<Clock className="h-4 w-4" />}
                label={
                  event?.data?.startTime
                    ? `${format(parse(event.data.startTime, "HH:mm", new Date()), "h:mm aa")}${event.data.endTime ? ` – ${format(parse(event.data.endTime, "HH:mm", new Date()), "h:mm aa")}` : ""}`
                    : "Time TBA"
                }
              />
            </div>
          </div>

          {/* Desktop favourite + share */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0 mt-1">
            <button
              onClick={handleAddRemoveFavorite}
              className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition"
              aria-label={
                isEventFavorite
                  ? "Remove from favourites"
                  : "Save to favourites"
              }>
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              ) : (
                <Heart
                  className={cn(
                    "h-5 w-5 transition-all",
                    isEventFavorite
                      ? "text-red-500 scale-110"
                      : "text-gray-500",
                  )}
                  fill={isEventFavorite ? "red" : "none"}
                />
              )}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition"
              aria-label="Share event">
              <Share2 className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
        {/* ─── END TITLE STRIP ─── */}

        {/* ─── TWO-COLUMN LAYOUT ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* ── LEFT / MAIN COLUMN ── */}
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            {/* About */}
            <Section title="About this Event">
              {event?.data?.description ? (
                <div
                  dangerouslySetInnerHTML={{ __html: event.data.description }}
                  className="prose prose-sm max-w-none text-gray-600 leading-relaxed"
                />
              ) : (
                <p className="text-gray-400 italic">No description provided.</p>
              )}
            </Section>

            {/* Location */}
            <Section title="Location">
              {event?.data?.latitude && event?.data?.longitude ? (
                <div className="rounded-xl overflow-hidden border border-gray-100 h-52 md:h-80">
                  <MapContainer
                    center={[event.data.latitude, event.data.longitude]}
                    zoom={14}
                    scrollWheelZoom={false}
                    className="h-full w-full">
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker
                      position={[event.data.latitude, event.data.longitude]}
                      icon={DefaultIcon}
                      eventHandlers={{
                        click: () =>
                          window.open(
                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.data.location)}`,
                            "_blank",
                          ),
                      }}
                    />
                  </MapContainer>
                </div>
              ) : null}

              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    {event?.data?.location || "Venue TBA"}
                  </span>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event?.data?.location || "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm font-semibold text-primary whitespace-nowrap hover:underline">
                  Get Directions <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </Section>

            {/* Host */}
            <Section title="Hosted by">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-100">
                  <Image
                    src={event?.data?.user?.image || "/placeholder.svg"}
                    alt={event?.data?.user?.business_name || "Host"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-900 truncate">
                    {event?.data?.user?.business_name || "Host"}
                  </p>
                  {event?.data?.user?.city && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {event.data.user.city}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-sm font-medium text-gray-700">
                      {averageRating.toFixed(1)}
                    </span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3.5 w-3.5",
                            i < averageRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-200",
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">
                      (
                      {event?.data?.reviews && event?.data?.reviews?.length > 0
                        ? event.data.reviews.length
                        : "No reviews yet"}
                      )
                    </span>
                  </div>
                </div>
              </div>
            </Section>
          </div>
          {/* ── END LEFT COLUMN ── */}

          {/* ── RIGHT / SIDEBAR ── */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="sticky top-24">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                {/* Ticket type badge */}
                <div className="bg-primary/5 border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">
                      {event?.data?.ticket_link
                        ? "Paid Event"
                        : event?.data?.price_category === "free"
                          ? "Free — No ticket needed"
                          : "Free — Registration required"}
                    </span>
                  </div>
                </div>

                <div className="px-6 py-5 space-y-5">
                  {/* Event title */}
                  <h2 className="text-lg font-bold text-gray-900 leading-snug">
                    {titleCase(event?.data?.title)}
                  </h2>

                  {/* Date / Time / Location details */}
                  <div className="space-y-3">
                    <DetailRow
                      icon={<Calendar className="h-4 w-4 text-primary" />}
                      label="Date"
                      value={
                        event?.data?.dateRange?.from
                          ? formatDate(
                              event.data.dateRange.from,
                              "EEEE, dd MMM yyyy",
                            )
                          : "Date TBA"
                      }
                    />
                    <DetailRow
                      icon={<Clock className="h-4 w-4 text-primary" />}
                      label="Time"
                      value={
                        event?.data?.startTime
                          ? `${format(parse(event.data.startTime, "HH:mm", new Date()), "h:mm aa")}${event.data.endTime ? ` – ${format(parse(event.data.endTime, "HH:mm", new Date()), "h:mm aa")}` : ""}`
                          : "Time TBA"
                      }
                    />
                    <DetailRow
                      icon={<MapPin className="h-4 w-4 text-primary" />}
                      label="Venue"
                      value={event?.data?.location || "Venue TBA"}
                      extra={
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event?.data?.location || "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5 mt-0.5">
                          Get Directions <ExternalLink className="h-3 w-3" />
                        </a>
                      }
                    />
                  </div>

                  {/* CTA Button */}
                  {event?.data?.ticket_link ? (
                    <Link
                      href={event.data.ticket_link}
                      target="_blank"
                      className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white hover:opacity-90 transition">
                      <Ticket className="h-4 w-4" /> Get Tickets
                    </Link>
                  ) : event?.data?.price_category === "free" ? (
                    <div className="flex items-center justify-center gap-2 w-full rounded-xl bg-gray-100 py-3.5 text-sm font-semibold text-gray-500 cursor-default">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      No Ticket Required
                    </div>
                  ) : (
                    <button
                      onClick={handleRedeem}
                      disabled={redeemPending || !!redemptionResult?.success}
                      className={cn(
                        "flex items-center justify-center gap-2 w-full rounded-xl py-3.5 text-sm font-semibold transition",
                        redemptionResult?.success
                          ? "bg-green-50 text-green-700 border border-green-200 cursor-not-allowed"
                          : "bg-primary text-white hover:opacity-90",
                      )}>
                      {redemptionResult?.success ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" /> You&apos;re
                          Registered
                        </>
                      ) : redeemPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />{" "}
                          Processing…
                        </>
                      ) : (
                        <>
                          <Ticket className="h-4 w-4" /> Register for Free
                        </>
                      )}
                    </button>
                  )}

                  {/* QR code ticket */}
                  {!event?.data?.ticket_link && redemptionResult?.success && (
                    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5 flex flex-col items-center gap-3 text-center">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Your Ticket
                      </p>
                      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                        <QRCodeCanvas
                          value={redemptionResult.code || ""}
                          size={128}
                        />
                      </div>
                      <code className="text-base font-mono font-bold tracking-widest text-gray-800">
                        {redemptionResult.code}
                      </code>
                      <p className="text-xs text-gray-400">
                        Show this QR code at the event entrance
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* ── END SIDEBAR ── */}
        </div>
        {/* ─── END TWO-COLUMN ─── */}
      </div>
      {/* ─── END MAIN CONTENT ─── */}

      {/* ─── MOBILE STICKY FOOTER CTA ─── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 shadow-xl">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 truncate">
              {titleCase(event?.data?.title)}
            </p>
          </div>

          {event?.data?.ticket_link ? (
            <Link
              href={event.data.ticket_link}
              target="_blank"
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white whitespace-nowrap hover:opacity-90 transition active:scale-95">
              <Ticket className="h-4 w-4" /> Get Tickets
            </Link>
          ) : event?.data?.price_category === "free" ? (
            <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-500">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> Free Entry
            </div>
          ) : (
            <Link
              href="#registration-button"
              className={cn(
                "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition active:scale-95",
                redemptionResult?.success
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-primary text-white hover:opacity-90",
              )}>
              {redemptionResult?.success ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Registered
                </>
              ) : (
                <>
                  <Ticket className="h-4 w-4" /> Register
                </>
              )}
            </Link>
          )}
        </div>
      </div>
      {/* ─── END MOBILE FOOTER ─── */}
    </div>
  );
}

/* ─── Small reusable sub-components ─── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function MetaPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
      <span className="text-primary">{icon}</span>
      {label}
    </span>
  );
}

function DetailRow({
  icon,
  label,
  value,
  extra,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm text-gray-800 font-medium mt-0.5 leading-snug">
          {value}
        </p>
        {extra}
      </div>
    </div>
  );
}
