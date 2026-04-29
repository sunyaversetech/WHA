"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import {
  Calendar,
  Check,
  ChevronLeft,
  MapPin,
  Loader2,
  Tag,
  Share,
  AlertCircle,
  Clock,
  BadgeCheck,
  Star,
  Heart,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { useSession } from "next-auth/react";
import { useGetSingleDeal } from "@/services/deal.service";
import { formatDate } from "date-fns";
import DealNotFoundPage from "./DealNotFound";
import {
  useGetRedeem,
  useRedeemCode,
} from "@/services/redeemandverify.service";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useGetReview } from "@/services/review.service";
import {
  useCreateFavroite,
  useGetUserFavroite,
} from "@/services/favroite.service";
import { useAuthModal } from "@/components/Auth/DialogLogin/use-auth-model";

function isPromise<T>(value: any): value is Promise<T> {
  return !!value && typeof value.then === "function";
}

function DealDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-14 bg-white border-b border-gray-100" />
      <Skeleton className="h-64 w-full" />
      <div className="container-modern mx-auto px-4 py-4 space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export default function DealDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const unwrappedParams = isPromise(params) ? use(params) : params;

  const { data: deal, isLoading } = useGetSingleDeal(unwrappedParams.id);
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { onOpen } = useAuthModal();

  const [redemptionResult, setRedemptionResult] = useState<{
    success: boolean;
    message: string;
    code?: string;
    status: string;
  } | null>(null);

  const { mutate, isPending } = useRedeemCode();
  const { data: redeemData } = useGetRedeem();
  const { mutate: mutateFav, isPending: isFavPending } = useCreateFavroite();
  const { data: userFavorites } = useGetUserFavroite();

  const d = deal?.data;
  const slug =
    d?.user?.business_name?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";

  const { data: reviews } = useGetReview(slug);
  const averageRating =
    reviews?.data && reviews.data.length > 0
      ? Math.round(
          reviews.data.reduce((acc, r) => acc + r.rating, 0) /
            reviews.data.length,
        )
      : 0;

  const userRedemption = redeemData?.data?.find(
    (r: any) => r.user === session?.user?.id && r.deal === d?._id,
  );

  useEffect(() => {
    if (!userRedemption) return;
    setTimeout(
      () =>
        setRedemptionResult({
          success: true,
          message: "success",
          code: userRedemption.uniqueKey,
          status: userRedemption.status,
        }),
      0,
    );
  }, [userRedemption]);

  const isVerified = redemptionResult?.status === "verified";
  const isClaimed = redemptionResult?.success && !isVerified;

  const isFavorite = userFavorites?.data?.deals?.some(
    (item) => (item._id ?? "").toString() === d?._id?.toString(),
  );

  const handleRedeem = () => {
    if (!session?.user) {
      router.push("/auth");
      toast.error("Please login to redeem");
      return;
    }
    mutate(
      {
        dealId: d?._id ?? "",
        userId: session.user.id ?? "",
        business: d?.user?._id ?? "",
      },
      {
        onSuccess: (data) => {
          setRedemptionResult({
            success: true,
            message: "success",
            code: data.uniqueKey,
            status: "pending",
          });
          queryClient.invalidateQueries({ queryKey: ["redeem"] });
          toast.success("Deal claimed! Show the QR code to the business.");
        },
        onError: (error) => {
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

  const handleFavorite = () => {
    if (!session) {
      onOpen();
      return;
    }
    mutateFav(
      { item_id: d?._id, item_type: "Deal" },
      {
        onSuccess: (msg) => {
          toast.success(msg.message);
          queryClient.invalidateQueries({ queryKey: ["favroite"] });
        },
        onError: () => toast.error("Failed to update favorites"),
      },
    );
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: d?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied!");
      }
    } catch {}
  };

  const redemptionPct = d?.max_redemptions
    ? Math.round(((d.current_redemptions ?? 0) / d.max_redemptions) * 100)
    : 0;

  if (isLoading) return <DealDetailSkeleton />;
  if (!d) return <DealNotFoundPage />;

  return (
    <div className="min-h-screen  md:mt-30">
      <div className="">
        <div className="container-modern mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
          <Link
            href="/deals"
            className="hidden md:flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition active:scale-95">
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </Link>
          <h1 className="hidden md:flex flex-1 text-sm font-semibold text-gray-800 truncate">
            {d.title}
          </h1>
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={handleFavorite}
              className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition active:scale-95">
              {isFavPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              ) : (
                <Heart
                  className={cn(
                    "h-4 w-4 transition-all",
                    isFavorite ? "text-red-500" : "text-gray-500",
                  )}
                  fill={isFavorite ? "red" : "none"}
                />
              )}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition active:scale-95">
              <Share className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
      <div className="container-modern mx-auto md:px-0">
        <div className="relative h-80 md:h-[70vh] w-full max-sm:w-screen max-sm:-ml-4 md:rounded-xl overflow-hidden">
          <Image
            fill
            src={d.image || "/placeholder.svg"}
            alt={d.title}
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />

          <div className="absolute inset-0 z-20 flex items-start justify-between p-3 md:hidden">
            <Button
              variant="ghost"
              className="p-0"
              onClick={() => router.back()}>
              <ChevronLeft className="h-9 w-9 rounded-full border border-white/30 p-1.5 text-white bg-black/30" />
            </Button>
            <div className="flex gap-2">
              <button
                onClick={handleFavorite}
                className="flex items-center justify-center bg-black/30 border border-white/30 p-2 rounded-full backdrop-blur-sm">
                {isFavPending ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <Heart
                    className={cn(
                      "h-5 w-5",
                      isFavorite ? "text-red-400" : "text-white",
                    )}
                    fill={isFavorite ? "#f87171" : "none"}
                  />
                )}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center bg-black/30 border border-white/30 p-2 rounded-full backdrop-blur-sm">
                <Share className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 flex items-end justify-between">
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-full">
              <Tag className="h-3 w-3" /> {d.category}
            </span>
          </div>
        </div>
      </div>
      <div className="container-modern mx-auto px-4 md:px-6 md:mt-6">
        <div className="py-4 border-b border-gray-100">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            {d.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full bg-white border border-gray-100 rounded-xl rounded-b-none p-0 h-auto">
                {(["overview", "whatyouget", "redeem"] as const).map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="flex-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none! data-[state=active]:text-blue-950 data-[state=active]:border-b-2 
                    data-[state=active]:border-b-blue-950 shadow-none rounded-none py-3 text-xs font-semibold uppercase tracking-wider capitalize">
                    {tab === "whatyouget" ? "What you get" : tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent
                value="overview"
                className="bg-white border border-t-0 border-gray-100 rounded-b-xl p-5 space-y-5 mt-0">
                <h3>Deals By:</h3>
                {d.user && (
                  <Link
                    href={`/businesses/${slug}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-100 transition group">
                    <div className="relative w-11 h-11 flex-shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-white">
                      <Image
                        fill
                        src={d.user.image || "/placeholder.svg"}
                        alt={d.user.business_name || ""}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">
                        {d.user.business_name}
                      </p>
                      {(d.user.city_name || d.user.city) && (
                        <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          {d.user.city_name || d.user.city}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-400 flex-shrink-0" />
                  </Link>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto flex items-center gap-3 text-left w-full border-slate-200 p-4 rounded-xl">
                  <Tag className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {d.user?.business_category}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Business category
                    </p>
                  </div>
                </Button>
                <Separator className="border-dashed" />
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                    About this deal
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {d.description}
                  </p>
                </div>
              </TabsContent>

              <TabsContent
                value="whatyouget"
                className="bg-white border border-t-0 border-gray-100 rounded-b-xl p-5 space-y-4 mt-0">
                {d.terms_for_the_deal ? (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                        Terms of this deal
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {d.terms_for_the_deal}
                      </p>
                    </div>
                    {d.valid_till && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                          Valid until
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          {formatDate(d.valid_till, "EEEE, dd MMMM yyyy")}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-6">
                    No terms specified for this deal.
                  </p>
                )}
              </TabsContent>

              <TabsContent
                value="redeem"
                className="bg-white border border-t-0 border-gray-100 rounded-b-xl p-5 mt-0">
                {isVerified ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-7 w-7 text-green-600" />
                    </div>
                    <p className="text-base font-bold text-gray-900">
                      Deal redeemed!
                    </p>
                    <p className="text-sm text-gray-500">
                      You`ve already used this deal. Thanks for visiting!
                    </p>
                  </div>
                ) : isClaimed ? (
                  <div className="flex flex-col items-center gap-4 py-4 text-center">
                    <p className="text-sm font-semibold text-gray-800">
                      Show this to the business
                    </p>
                    <div className="bg-white p-4 rounded-2xl border border-gray-200">
                      <QRCodeCanvas
                        value={redemptionResult?.code || ""}
                        size={152}
                      />
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-2.5 w-full max-w-xs">
                      <code className="text-lg font-mono font-bold tracking-widest text-gray-800">
                        {redemptionResult?.code}
                      </code>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-red-500">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      Code expires when the deal expires
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <p className="text-base font-bold text-gray-900 text-center">
                      Ready to claim?
                    </p>
                    <p className="text-xs text-gray-400 text-center mb-2">
                      Show the QR code at the business to redeem your offer.
                    </p>
                    <Button
                      onClick={handleRedeem}
                      disabled={isPending}
                      className="wha-btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold">
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Claiming…
                        </>
                      ) : (
                        <>
                          <Tag className="h-4 w-4" /> Redeem this deal
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-400">
                      Free &amp; instant — no payment required
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start mb-4">
            <Card className="bg-slate-50 border-none">
              <CardContent className="pt-5 space-y-4">
                <div className="space-y-3">
                  {d.valid_till && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-4 w-4 text-green-700" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                          Valid until
                        </p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">
                          {formatDate(d.valid_till, "dd MMM yyyy")}
                        </p>
                      </div>
                    </div>
                  )}

                  {d.max_redemptions != null && (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                          Redemptions
                        </p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">
                          {d.current_redemptions ?? 0} / {d.max_redemptions}{" "}
                          claimed
                        </p>
                        <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${redemptionPct}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {d.max_redemptions - (d.current_redemptions ?? 0)}{" "}
                          spots remaining
                        </p>
                      </div>
                    </div>
                  )}

                  {(d.user?.location || d.user?.city) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-9 w-9 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-700">
                          {d.user.location || d.user.city}
                        </p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.user.location || d.user.city || "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-blue-600">
                          Get directions
                        </a>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-green-700" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                        Status
                      </p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">
                        {isVerified
                          ? "Used"
                          : isClaimed
                            ? "Claimed — pending verification"
                            : "Available to claim"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {d.terms_for_the_deal && (
              <Card className="border border-gray-100 bg-white">
                <CardContent className="pt-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">
                    Terms &amp; conditions
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {d.terms_for_the_deal}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
