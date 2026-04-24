"use client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tag,
  ChevronLeft,
  BadgeCheck,
  Dot,
  Star,
  Heart,
  Share,
  Loader2,
  MapPin,
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventCard from "@/components/cards/event-card";
import { EventFormValues } from "@/components/Dashboard/Events/EventsForm";
import DealCard from "@/components/cards/deal-card";
import EventDrawer from "./EventDrawer";
import DealDrawer from "./DealDrawer";

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

  const business = {
    business_name: "The Coffee Hub",
    business_category: "Cafe & Restaurant",
    email: "contact@coffeehub.com",
    city_name: "Sydney",
    community_name: "Surry Hills",
    location: "-33.8832, 151.2100",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24",
    verified: true,
    abn_number: "12 345 678 910",
  };

  const averageRating =
    reviews?.data && reviews.data.length > 0
      ? Math.round(
          reviews.data.reduce((acc, review) => acc + review.rating, 0) /
            reviews.data.length,
        )
      : 0;

  const handleShare = async () => {
    const shareData = {
      title: data?.data?.business_name || "Check out this business",
      text: `Take a look at ${data?.data?.business_name} on our platform!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const handleAddRemoveFavorite = () => {
    if (!session) {
      onOpen();
      router.push("/auth");
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
          toast.error("Failed to add to favorites");
        },
      },
    );
  };

  const { data: userFavorites } = useGetUserFavroite();

  const isBusinessFavorite = userFavorites?.data?.business?.some(
    (item) => (item._id ?? "").toString() === businessId?.toString(),
  );

  if (isLoading) return <Loading />;

  return (
    <div className="container-modern mx-auto p-6 md:mt-20">
      <div className="flex flex-col md:flex-col">
        <div className="order-2 md:order-1 mt-4 md:mt-0 mb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                {data?.data.business_name}
              </h1>
              {business.verified ? (
                <BadgeCheck className="text-green h-5 w-5 sm:h-6 sm:w-6 fill-blue-500 text-white" />
              ) : (
                <Button variant={"outline"}>not verified</Button>
              )}
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
                      isBusinessFavorite
                        ? "text-red-500 scale-110"
                        : "text-neutral-600 hover:text-neutral-900",
                    )}
                    fill={isBusinessFavorite ? "red" : "none"}
                  />
                )}
              </button>

              <button
                onClick={handleShare}
                className="flex items-center justify-center p-2 border rounded-full hover:bg-primary/10 transition-all active:scale-90"
                title="Share business">
                <Share className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="font-medium text-foreground">
                {averageRating.toFixed(1)}
              </span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className={`h-4 w-4 ${
                      index < averageRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span>
                (
                {reviews?.data && reviews?.data.length > 0
                  ? reviews?.data.length
                  : "No Review Yet"}
                )
              </span>
            </div>

            <Dot className="hidden md:block h-4 w-4" />

            <div className="capitalize">
              {data?.data.city === "other"
                ? data?.data.city_name
                : data?.data.city}
            </div>
          </div>
        </div>

        <div className="order-1 md:order-2">
          <div className="relative h-80 md:h-[70vh] w-full max-sm:w-screen max-sm:-ml-6 max-sm:-mt-6 md:rounded-xl overflow-hidden">
            <Image
              fill
              src={data?.data?.image || "/placeholder.svg"}
              alt={data?.data?.business_name || "Bussiness Image"}
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
                        isBusinessFavorite
                          ? "text-red-500 scale-110"
                          : "text-neutral-600 hover:text-neutral-900",
                      )}
                      fill={isBusinessFavorite ? "red" : "none"}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="services" className="w-full  ">
            <TabsList className="w-full border-none!  bg-[#fafafa]">
              <TabsTrigger
                value="services"
                className="data-[state=active]:bg-gray-100/10! data-[state=active]:shadow-none! data-[state=active]:text-primary!  
                data-[state=active]:border-b-blue-950/80 rounded-none border-2 py-5">
                Services
              </TabsTrigger>
              <TabsTrigger
                value="event"
                className="data-[state=active]:bg-gray-100/10! data-[state=active]:shadow-none! data-[state=active]:text-primary!  
                data-[state=active]:border-b-blue-950/80 rounded-none border-2 py-5">
                Event
              </TabsTrigger>
              <TabsTrigger
                value="deal"
                className="data-[state=active]:bg-gray-100/10! data-[state=active]:shadow-none! data-[state=active]:text-primary!  
                data-[state=active]:border-b-blue-950/80 rounded-none border-2 py-5">
                Deals
              </TabsTrigger>
            </TabsList>
            <TabsContent value="services" className="w-full mt-2">
              <Button
                type="button"
                variant={"outline"}
                className="h-20  flex flex-col text-left items-start w-full border-slate-400 p-4! rounded-md">
                <p className="font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4" /> {data?.data.business_category}
                </p>
              </Button>
            </TabsContent>
            <TabsContent value="event" className="mt-2">
              <div
                className={`grid grid-cols-1 md:${data?.data?.event && data?.data?.event?.length < 2 ? "grid-cols-1" : "grid-cols-2"} gap-2`}>
                {data?.data.event && data?.data.event.length > 0 ? (
                  data?.data.event.slice(0, 2).map((item: EventFormValues) => {
                    return <EventCard key={item._id} event={item} />;
                  })
                ) : (
                  <p className="text-center">
                    There is no Event Form This Business
                  </p>
                )}
              </div>
              <div
                className={`${data?.data.event && data?.data.event?.length < 3 ? "hidden" : "flex"} w-full m-auto mt-2 justify-center`}>
                <EventDrawer
                  event={data?.data.event}
                  user={data?.data.business_name}
                />
              </div>
            </TabsContent>
            <TabsContent value="deal" className="mt-2">
              <div
                className={`grid grid-cols-1 md:${data?.data?.deal && data?.data?.deal?.length < 2 ? "grid-cols-1" : "grid-cols-2"} gap-2`}>
                {data?.data.deal && data?.data.deal.length > 0 ? (
                  data?.data.deal
                    .splice(0, 2)
                    .map((item) => <DealCard key={item._id} deal={item} />)
                ) : (
                  <p className="text-center">
                    There is no Deal Form This Business
                  </p>
                )}
              </div>
              <div
                className={`${data?.data.deal && data?.data.deal?.length < 3 ? "hidden" : "flex"} w-full m-auto mt-2 justify-center`}>
                <DealDrawer
                  deal={data?.data.deal ?? []}
                  user={data?.data.business_name ?? ""}
                />
              </div>
            </TabsContent>
          </Tabs>

          <BusinessReviewSection reviews={reviews?.data || []} />

          <div className="space-y-4 z-20">
            <h2 className="text-xl font-semibold">Our Location</h2>
            {data?.data?.latitude && data?.data?.longitude ? (
              <Map
                latitude={data.data.latitude}
                longitude={data.data.longitude}
                business={data?.data ?? ""}
              />
            ) : (
              <div className="h-[200px] flex items-center justify-center bg-slate-50 rounded-xl border border-dashed">
                No Map Location available
              </div>
            )}
          </div>
          <BusinessHours hours={data?.data?.hours} open={true} />
        </div>

        <div className="space-y-6 sticky top-32 self-start">
          <Card className="bg-slate-50 border-none">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-xl capitalize">
                {data?.data.business_name} | {data?.data.business_category}
              </h3>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="font-medium text-foreground">
                  {averageRating.toFixed(1)}
                </span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      className={`h-4 w-4 ${
                        index < averageRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span>
                  (
                  {reviews?.data && reviews?.data.length > 0
                    ? reviews?.data.length
                    : "No Review Yet"}
                  )
                </span>
              </div>
              <Button className="wha-btn-primary w-full">Book Now</Button>
              <Separator />
              <h3 className="font-bold mb-2">Business Operating Hours</h3>

              <BusinessHours hours={data?.data?.hours} />
              <div className="flex items-start gap-2">
                <MapPin className="h-9 w-9 text-primary" />
                <span>
                  {data?.data?.location || "Venue TBA"}{" "}
                  <div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        data?.data.location || "",
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-primary text-sm">
                      Get Directions
                    </a>
                  </div>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
