"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Mail,
  Tag,
  ChevronLeft,
  BadgeCheck,
  Dot,
  Star,
  Heart,
  Share,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
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

export default function BusinessPage() {
  const params = useParams();
  const { id } = params;
  const { data } = useGetSingleBusiness();
  const { mutate, isPending } = useCreateFavroite();
  const { data: reviews } = useGetReview(String(id));
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
  console.log(reviews);

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
      toast.error("Please login to add to favorites");
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

  return (
    <div className="container-modern mx-auto p-6">
      <div className="flex flex-col md:flex-col">
        <div className="order-2 md:order-1 mt-4 md:mt-0 mb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                {data?.data.business_name}
              </h1>
              {business.verified && (
                <BadgeCheck className="text-green h-5 w-5 sm:h-6 sm:w-6" />
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

            <div className="font-medium text-red-500">
              Closed - Opens 9:00 am
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
          <div className="relative h-80 md:h-120 w-full rounded-2xl overflow-hidden">
            <Image
              src={data?.data.image || "/placeholder.svg"}
              alt={data?.data.business_name ?? "Business"}
              className="w-full h-full object-cover"
              fill
            />

            <div className="absolute inset-0 flex items-start justify-between p-3 md:hidden">
              <div>
                <ChevronLeft
                  className="h-8 w-8 cursor-pointer rounded-full border  p-1.5 
                 text-primary bg-white transition-all hover:scale-105 active:scale-95"
                />
              </div>

              <div className="flex gap-2 ">
                <button
                  onClick={handleAddRemoveFavorite}
                  className="flex items-center justify-center p-2 border bg-white rounded-full transition-all hover:scale-105 active:scale-95">
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
                  className="flex items-center justify-center p-2 border rounded-full bg-white  transition-all hover:scale-105 active:scale-95"
                  onClick={handleShare}>
                  <Share className="h-4 w-4 text-primary " />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* business details  */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="">
              <h2 className="text-xl font-semibold mb-4">About Business</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium flex items-center gap-2">
                    <Tag className="w-4 h-4" /> {data?.data.business_category}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">ABN Number</p>
                  <p className="font-medium">{data?.data.abn_number}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" /> {data?.data.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Our Location</h2>
            {data?.data?.latitude && data?.data?.longitude ? (
              <Map
                latitude={data.data.latitude}
                longitude={data.data.longitude}
                businessName={data.data.business_name ?? ""}
              />
            ) : (
              <div className="h-[200px] flex items-center justify-center bg-slate-50 rounded-xl border border-dashed">
                No Map Location available
              </div>
            )}
          </div>
          <BusinessReviewSection reviews={reviews?.data || []} />
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-50 border-none">
            <CardContent className="pt-6">
              <h3 className="font-bold mb-2">Business Status</h3>
              <Badge
                className={`${data?.data?.verified ? "bg-green-600" : "bg-red-500"}`}>
                {data?.data?.verified
                  ? "Verified Business"
                  : "Pending Verification"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-4">
                This business is a registered member of the{" "}
                {data?.data?.community_name ?? "WHA"} community.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
