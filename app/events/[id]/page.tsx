"use client";
import {
  Calendar,
  MapPin,
  Share2,
  Mail,
  Ticket,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import FavoriteButton from "@/components/ui/favorite-button";
import { useGetSingleEvent } from "@/services/event.service";
import Image from "next/image";
import { differenceInDays, format } from "date-fns";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import LoadingPage from "@/components/Loading";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

  if (isLoading) {
    <LoadingPage />;
  }

  return (
    <div className="container-modern min-h-screen bg-gradient-modern relative">
      <div className="flex items-center justify-start gap-2 p-4 -ml-4">
        <Link href="/events" aria-label="Back to events">
          <ChevronLeft
            className="h-8 w-8 cursor-pointer rounded-full border bg-white p-1.5 
               text-slate-600 
               transition-all hover:scale-105 active:scale-95"
          />
        </Link>
        <h3 className="text-lg font-semibold text-gray-800">Events</h3>
      </div>

      <div className="space-y-6 ">
        <div className="flex item-center ">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            {event?.data?.title}
          </h1>
        </div>
      </div>

      <div className="relative h-[30vh] md:h-[60vh] w-full  rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent z-10 rounded-xl"></div>
        <Image
          fill
          src={event?.data?.image || "/placeholder.svg"}
          alt={event?.data?.title || "Event Image"}
          className="object-cover transition-opacity duration-300"
          onLoadingComplete={(img) => img.classList.remove("opacity-0")}
        />
      </div>

      <div className="container-modern py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2">
            <div className="card-lg p-4 md:p-6 mb-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                  Event Details
                </h2>
                <div className="flex space-x-2">
                  <FavoriteButton type="events" id={event?.data._id ?? ""} />
                  <button className="p-2 rounded-lg hover:bg-gray-100/50 transition-colors group">
                    <Share2 className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </button>
                </div>
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
                        {event?.data?.dateRange?.from instanceof Date
                          ? event.data?.dateRange.from.toLocaleDateString()
                          : event?.data?.dateRange?.from}{" "}
                        -{" "}
                        {event?.data?.dateRange?.to instanceof Date
                          ? event.data?.dateRange.to.toLocaleDateString()
                          : event?.data?.dateRange?.to}
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

                {/* Description */}
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
                    <Popup>{event.data.title}</Popup>
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
                    rel="noopener noreferrer"
                    className="w-full btn-primary flex items-center justify-center space-x-2">
                    <Ticket className="h-4 w-4" />
                    <span>Get Tickets</span>
                  </Link>
                ) : (
                  <div className="w-full bg-green-500 text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 shadow-md">
                    <Ticket className="h-4 w-4" />
                    <span>Free Entry</span>
                  </div>
                )}
                <button className="w-full btn-ghost flex items-center justify-center space-x-2">
                  <Share2 className="h-4 w-4" />
                  <span>Share Event</span>
                </button>
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

            {/* Event Info */}
            <div className="card p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Event Info
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="font-medium">
                    {event?.data?.dateRange?.from ? (
                      <>{format(new Date(event.data.dateRange.from), "PPP")}</>
                    ) : event?.data?.date ? (
                      format(new Date(event.data.date), "PPP")
                    ) : (
                      "TBA"
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">End Date:</span>
                  <span className="font-medium">
                    {event?.data?.dateRange?.to ? (
                      <>{format(new Date(event.data.dateRange.to), "PPP")}</>
                    ) : event?.data?.date ? (
                      format(new Date(event.data.date), "PPP")
                    ) : (
                      "TBA"
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Days:</span>
                  <span className="font-medium">
                    {differenceInDays(
                      new Date(event?.data?.dateRange?.to ?? ""),
                      new Date(event?.data?.dateRange?.from ?? ""),
                    ) + 1}{" "}
                    {differenceInDays(
                      new Date(event?.data?.dateRange?.to ?? ""),
                      new Date(event?.data?.dateRange?.from ?? ""),
                    ) +
                      1 >
                    1
                      ? "days"
                      : "day"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Venue:</span>
                  <span className="font-medium">{event?.data?.venue}</span>
                </div>
                {event?.data?.category && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{event.data?.category}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tickets:</span>
                  <span className="font-medium">
                    {event?.data?.ticket_link ? "Available" : "Free Entry"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
