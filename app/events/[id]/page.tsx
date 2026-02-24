import { getEventById } from "@/lib/data/events";
import {
  Calendar,
  MapPin,
  Share2,
  Mail,
  Phone,
  Ticket,
  ArrowLeft,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import FavoriteButton from "@/components/ui/favorite-button";

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const awaitedParams = await params;
  const event = getEventById(awaitedParams.id);

  if (!event) {
    notFound();
  }

  return (
    <div className="container-modern min-h-screen bg-gradient-modern relative">
      {/* Back Button */}
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
            {event.title}
          </h1>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-[30vh] md:h-[60vh] w-full  rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent z-10 rounded-xl"></div>
        <img
          src={event.image || "/placeholder.svg"}
          alt={event.title}
          className="w-full h-full object-cover rounded-xl"
        />
      </div>

      {/* Content Section */}
      <div className="container-modern py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="card-lg p-4 md:p-6 mb-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                  Event Details
                </h2>
                <div className="flex space-x-2">
                  <FavoriteButton type="events" id={event.id} />
                  <button className="p-2 rounded-lg hover:bg-gray-100/50 transition-colors group">
                    <Share2 className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Event Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date & Time</p>
                      <p className="font-medium text-gray-800">{event.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <MapPin className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Venue</p>
                      <p className="font-medium text-gray-800">{event.venue}</p>
                    </div>
                  </div>

                  {event.category && (
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Sparkles className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Category</p>
                        <p className="font-medium text-gray-800">
                          {event.category}
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
                    {event.description}
                  </p>
                  {event.details && (
                    <div
                      dangerouslySetInnerHTML={{ __html: event.details }}
                      className="text-gray-600 leading-relaxed"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                {event.ticketUrl ? (
                  <a
                    href={event.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    <Ticket className="h-4 w-4" />
                    <span>Get Tickets</span>
                  </a>
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

            {/* Contact Information */}
            <div className="card p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Contact Information
              </h3>
              <div className="space-y-3">
                {event.contactEmail && (
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <a
                      href={`mailto:${event.contactEmail}`}
                      className="text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      {event.contactEmail}
                    </a>
                  </div>
                )}
                {event.contactPhone && (
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Phone className="h-4 w-4 text-green-600" />
                    </div>
                    <a
                      href={`tel:${event.contactPhone}`}
                      className="text-gray-700 hover:text-green-600 transition-colors"
                    >
                      {event.contactPhone}
                    </a>
                  </div>
                )}
                {!event.contactEmail && !event.contactPhone && (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">
                      Contact information not available
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Event Info */}
            <div className="card p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Event Info
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{event.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Venue:</span>
                  <span className="font-medium">{event.venue}</span>
                </div>
                {event.category && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{event.category}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tickets:</span>
                  <span className="font-medium">
                    {event.ticketUrl ? "Available" : "Free Entry"}
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
