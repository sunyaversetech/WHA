"use client";
import {
  Tag,
  ChevronLeft,
  BadgeCheck,
  Star,
  Heart,
  Share2,
  Loader2,
  MapPin,
  ExternalLink,
  CalendarDays,
  Ticket,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useGetSingleBusiness } from "@/services/business.service";
import BusinessReviewSection from "@/components/Business/Comment";
import Map from "./Map";
import { useGetReview } from "@/services/review.service";
import {
  useCreateFavroite,
  useGetUserFavroite,
} from "@/services/favroite.service";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import Loading from "@/app/businesses/loading";
import BusinessHours from "./Hours";
import { useAuthModal } from "@/components/Auth/DialogLogin/use-auth-model";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventCard from "@/components/cards/event-card";
import { EventFormValues } from "@/components/Dashboard/Events/EventsForm";
import DealCard from "@/components/cards/deal-card";
import EventDrawer from "./EventDrawer";
import DealDrawer from "./DealDrawer";

/* ─── Reusable sub-components ─── */

function IconBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition active:scale-95">
      {children}
    </button>
  );
}

function StarRow({
  rating,
  count,
}: {
  rating: number;
  count: number | string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-semibold text-gray-800">
        {typeof rating === "number" ? rating.toFixed(1) : rating}
      </span>
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5",
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200",
            )}
          />
        ))}
      </div>
      <span className="text-xs text-gray-400">({count})</span>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function BusinessPage() {
  const { data, isLoading } = useGetSingleBusiness();
  const { mutate, isPending } = useCreateFavroite();
  const { onOpen } = useAuthModal();
  const slug = data?.data?.business_name
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const { data: reviews } = useGetReview(slug ?? "");
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session } = useSession();
  const businessId = data?.data?._id;

  const averageRating =
    reviews?.data && reviews.data.length > 0
      ? Math.round(
          reviews.data.reduce((acc, review) => acc + review.rating, 0) /
            reviews.data.length,
        )
      : 0;

  const reviewCount =
    reviews?.data && reviews.data.length > 0
      ? reviews.data.length
      : "No reviews yet";

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: data?.data?.business_name || "Check out this business",
          text: `Take a look at ${data?.data?.business_name}!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied!");
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
      { item_id: businessId, item_type: "User" },
      {
        onSuccess: (msg) => {
          router.refresh();
          toast.success(msg.message);
          queryClient.invalidateQueries({ queryKey: ["favroite"] });
        },
        onError: () => {
          toast.error("Failed to update favourites");
        },
      },
    );
  };

  const { data: userFavorites } = useGetUserFavroite();
  const isBusinessFavorite = userFavorites?.data?.business?.some(
    (item) => (item._id ?? "").toString() === businessId?.toString(),
  );

  if (isLoading) return <Loading />;

  const cityLabel =
    data?.data.city === "other" ? data?.data.city_name : data?.data.city;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data?.data?.location || "")}`;

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="relative w-full h-64 sm:h-80 md:h-[60vh]">
        <Image
          fill
          src={data?.data?.image || "/placeholder.svg"}
          alt={data?.data?.business_name || "Business"}
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute inset-0 z-20 flex items-start justify-between p-4 md:hidden">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 shadow-md backdrop-blur-sm transition active:scale-95"
            aria-label="Go back">
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleAddRemoveFavorite}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 shadow-md backdrop-blur-sm transition active:scale-95"
              aria-label="Save to favourites">
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              ) : (
                <Heart
                  className={cn(
                    "h-5 w-5 transition-all",
                    isBusinessFavorite
                      ? "text-red-500 scale-110"
                      : "text-gray-600",
                  )}
                  fill={isBusinessFavorite ? "red" : "none"}
                />
              )}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 shadow-md backdrop-blur-sm transition active:scale-95"
              aria-label="Share business">
              <Share2 className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4 mt-6 mb-6">
          <button
            onClick={() => router.back()}
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition flex-shrink-0 mt-1"
            aria-label="Go back">
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                {data?.data?.business_name}
              </h1>
              <BadgeCheck className="h-6 w-6 fill-blue-500 text-white flex-shrink-0" />
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-3">
              <StarRow rating={averageRating} count={reviewCount} />
              {cityLabel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {cityLabel}
                </span>
              )}
              {data?.data?.business_category && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  {data.data.business_category}
                </span>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 flex-shrink-0 mt-1">
            <IconBtn
              onClick={handleAddRemoveFavorite}
              label="Save to favourites">
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              ) : (
                <Heart
                  className={cn(
                    "h-5 w-5 transition-all",
                    isBusinessFavorite
                      ? "text-red-500 scale-110"
                      : "text-gray-500",
                  )}
                  fill={isBusinessFavorite ? "red" : "none"}
                />
              )}
            </IconBtn>
            <IconBtn onClick={handleShare} label="Share business">
              <Share2 className="h-5 w-5 text-gray-500" />
            </IconBtn>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <Tabs defaultValue="services" className="w-full">
                <TabsList className="w-full rounded-none border-b border-gray-100 bg-gray-50 h-auto p-0">
                  {[
                    {
                      value: "services",
                      label: "Services",
                      icon: <Tag className="h-4 w-4" />,
                    },
                    {
                      value: "event",
                      label: "Events",
                      icon: <CalendarDays className="h-4 w-4" />,
                    },
                    {
                      value: "deal",
                      label: "Deals",
                      icon: <Ticket className="h-4 w-4" />,
                    },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex-1 flex items-center justify-center gap-1.5 py-4 rounded-none text-sm font-medium text-gray-500
                        data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-b-primary
                        data-[state=active]:bg-gray-100 data-[state=active]:shadow-none! transition">
                      {tab.icon} {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="p-6">
                  <TabsContent value="services" className="mt-0">
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Tag className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        {data?.data?.business_category || "General Services"}
                      </span>
                    </div>
                  </TabsContent>

                  <TabsContent value="event" className="mt-0">
                    {data?.data?.event && data.data.event.length > 0 ? (
                      <>
                        <div
                          className={`grid gap-4 ${data.data.event.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
                          {data.data.event
                            .slice(0, 2)
                            .map((item: EventFormValues) => (
                              <EventCard key={item._id} event={item} />
                            ))}
                        </div>
                        {data.data.event.length > 2 && (
                          <div className="mt-4 flex justify-center">
                            <EventDrawer
                              event={data.data.event}
                              user={data.data.business_name}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <EmptyState message="No events from this business yet." />
                    )}
                  </TabsContent>

                  <TabsContent value="deal" className="mt-0">
                    {data?.data?.deal && data.data.deal.length > 0 ? (
                      <>
                        <div
                          className={`grid gap-4 ${data.data.deal.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
                          {data.data.deal.slice(0, 2).map((item) => (
                            <DealCard key={item._id} deal={item} />
                          ))}
                        </div>
                        {data.data.deal.length > 2 && (
                          <div className="mt-4 flex justify-center">
                            <DealDrawer
                              deal={data.data.deal}
                              user={data.data.business_name ?? ""}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <EmptyState message="No deals from this business yet." />
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            <SectionCard title="Customer Reviews">
              <BusinessReviewSection reviews={reviews?.data || []} />
            </SectionCard>

            <SectionCard title="Our Location">
              {data?.data?.latitude && data?.data?.longitude ? (
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  <Map
                    latitude={data.data.latitude}
                    longitude={data.data.longitude}
                    business={data.data}
                  />
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm text-gray-400">
                  No map location available
                </div>
              )}
              {data?.data?.location && (
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">
                      {data.data.location}
                    </span>
                  </div>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm font-semibold text-primary whitespace-nowrap hover:underline">
                    Get Directions <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </SectionCard>

            <div className="lg:hidden">
              <SectionCard title="Business Hours">
                <BusinessHours hours={data?.data?.hours} open={true} />
              </SectionCard>
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <div>
                  <h2 className="text-base font-bold text-gray-900 leading-snug capitalize">
                    {data?.data?.business_name}
                  </h2>
                  {data?.data?.business_category && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {data.data.business_category}
                    </p>
                  )}
                </div>

                <StarRow rating={averageRating} count={reviewCount} />

                <button className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:opacity-90 transition active:scale-[0.98]">
                  Book Now
                </button>

                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <h3 className="text-sm font-bold text-gray-900">
                    Business Hours
                  </h3>
                  <BusinessHours hours={data?.data?.hours} />
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-700 leading-snug">
                        {data?.data?.location || "Location TBA"}
                      </p>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline mt-1">
                        Get Directions <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <Tag className="h-5 w-5 text-gray-300" />
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
