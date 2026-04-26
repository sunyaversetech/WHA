"use client";
import {
  Calendar,
  MapPin,
  Share2,
  Mail,
  Ticket,
  Sparkles,
  ChevronLeft,
  ExternalLink,
  Check,
  Share,
  BadgeCheck,
  Loader2,
  Heart,
  Dot,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import FavoriteButton from "@/components/ui/favorite-button";
import { useGetSingleEvent } from "@/services/event.service";
import Image from "next/image";
import { differenceInDays, format } from "date-fns";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import { useState } from "react";
import LoadingPage from "@/components/ResuableComponents/Loading";
import { Button } from "../ui/button";

export default function EventDetailPage() {
  const param = useParams();
  const awaitedParams = param as { id: string };
  const { data: event, isLoading } = useGetSingleEvent(awaitedParams.id);
  const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  const [copied, setCopied] = useState(false);

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

  const formatEventDate = (dateValue?: string | Date | null) => {
    if (!dateValue) return "";
    const date =
      dateValue instanceof Date ? dateValue : new Date(dateValue as string);
    return Number.isNaN(date.getTime())
      ? String(dateValue)
      : date.toLocaleDateString();
  };

  if (isLoading) {
    <LoadingPage />;
  }

  return (
    <div className="container-modern min-h-screen bg-gradient-modern relative">
      {/* Event Header Card */}
      <div className="flex flex-col md:flex-col">
        {/* Event Info */}
        <div className="order-2 md:order-1 mt-4 md:mt-0 mb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                {event?.data?.title}
              </h1>
            </div>

            <div className="hidden flex items-center gap-2 md:flex md:items-center md:gap-2">
              <button className="flex items-center justify-center p-2 border rounded-full hover:bg-primary/10 transition">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-primary transition-all" />
              </button>

              <button
                onClick={handleShare}
                className="flex items-center justify-center p-2 border rounded-full hover:bg-primary/10 transition-all active:scale-90"
                title="Share Event">
                <Share className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </button>
            </div>
          </div>

          {/* Meta Info Row */}
          <div className="mt-3 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1 sm:gap-2">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-medium text-foreground">
                {event?.data?.venue || "Venue TBA"}
              </span>
            </div>

            <Dot className="hidden md:block h-4 w-4" />

            <div className="flex items-center gap-1 sm:gap-2">
              <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
              {/* <span className="font-medium text-foreground">{dateDisplay}</span> */}
            </div>

            <Dot className="hidden md:block h-4 w-4" />
          </div>
        </div>

        {/* Event Image */}
        <div className="order-1 md:order-2">
          <div className="relative h-80 md:h-[60vh] w-full rounded-2xl overflow-hidden">
            <Image
              fill
              src={event?.data?.image || "/placeholder.svg"}
              alt={event?.data?.title || "Event Image"}
              className="w-full h-full object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-10 rounded-2xl"></div>

            {/* Favorite/Share Buttons for Mobile */}
            <div className="absolute inset-0 flex items-start justify-between p-3 md:hidden">
              <div></div>
              <div className="flex gap-2">
                <button className="flex items-center justify-center p-2 border bg-white rounded-full transition-all hover:scale-105 active:scale-95">
                  <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-primary transition-all" />
                </button>

                <button
                  className="flex items-center justify-center p-2 border rounded-full bg-white transition-all hover:scale-105 active:scale-95"
                  onClick={handleShare}>
                  <Share className="h-4 w-4 text-primary" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* event details  */}

      <div className=" py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2">
            <div className="card-lg p-4 md:p-6 mb-6">
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
                        {formatEventDate(event?.data?.dateRange?.from)} -{" "}
                        {formatEventDate(event?.data?.dateRange?.to)}
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
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {event?.data?.description}
                  </p>
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
                    className="w-full">
                    <Ticket className="h-4 w-4" />
                    <span>Get Tickets</span>
                  </Link>
                ) : (
                  // <div className="w-full bg-green-500 text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 shadow-md">
                  //   <Ticket className="h-4 w-4" />
                  //   <span>Free Entry</span>
                  // </div>

                  <Button className="w-full">
                    {" "}
                    <Ticket className="h-4 w-4 mr-2" />
                    Free Entry
                  </Button>
                )}

                <Button className="w-full">
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
                {/* {event.contactPhone && (
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Phone className="h-4 w-4 text-green-600" />
                    </div>
                    <a
                      href={`tel:${event.contactPhone}`}
                      className="text-gray-700 hover:text-green-600 transition-colors">
                      {event.contactPhone}
                    </a>
                  </div>
                )} */}
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
    </div>
  );
}
