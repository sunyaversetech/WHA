"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { getDealById } from "@/lib/data/deals";
import {
  Calendar,
  Check,
  ArrowLeft,
  MapPin,
  Sparkles,
  Tag,
  Heart,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useFavorites } from "@/contexts/favorites-context";
import { useRedeem } from "@/contexts/redeem-context";
import { getBusinessById } from "@/lib/data/businesses";
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

function isPromise<T>(value: any): value is Promise<T> {
  return !!value && typeof value.then === "function";
}

export default function DealDetailPage({ params }: { params: { id: string } }) {
  let unwrappedParams: { id: string };
  if (isPromise(params)) {
    unwrappedParams = use(params) as { id: string };
  } else {
    unwrappedParams = params;
  }
  const { data: deal, isLoading } = useGetSingleDeal(unwrappedParams.id);
  const router = useRouter();
  const { data: session } = useSession();
  const [redemptionResult, setRedemptionResult] = useState<{
    success: boolean;
    message: string;
    code?: string;
  } | null>(null);
  const { mutate, isPending } = useRedeemCode();
  const { data } = useGetRedeem();
  const queryClient = useQueryClient();

  const userRedemption = data?.data?.find(
    (redemption: any) =>
      redemption.user === session?.user?.id &&
      redemption.deal === deal?.data?._id,
  );

  useEffect(() => {
    if (!userRedemption) return;
    setTimeout(
      () =>
        setRedemptionResult({
          success: true,
          message: "success",
          code: userRedemption?.uniqueKey,
        }),
      0,
    );
  }, [userRedemption]);

  const handleRedeem = async () => {
    if (!session?.user) {
      router.push("/auth");
      toast.error("Please login to redeem");
      return;
    }
    mutate(
      {
        dealId: deal?.data?._id ?? "",
        userId: session?.user.id ?? "",
        business: deal?.data?.user?._id ?? "",
      },
      {
        onSuccess: (data) => {
          setRedemptionResult({
            success: true,
            message: "success",
            code: data.uniqueKey,
          });
          queryClient.invalidateQueries({ queryKey: ["redeem"] });
        },
        onError: (error) => {
          setRedemptionResult({
            success: false,
            message: error.message,
          });
          toast.error(error.message);
        },
      },
    );
  };

  if (!deal?.data) return <DealNotFoundPage />;

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-20 left-5 z-30">
        <Link
          href="/deals"
          className="glass text-gray-700 hover:text-blue-600 p-2 rounded-lg shadow-md transition-colors flex items-center justify-center"
          aria-label="Back to events">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="container-modern py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="relative w-full bg-white rounded-xl overflow-hidden shadow-lg">
            <div className="absolute top-1/2 -left-2 w-4 h-4 bg-gray-100 rounded-full transform -translate-y-1/2 z-0"></div>
            <div className="absolute top-1/2 -right-2 w-4 h-4 bg-gray-100 rounded-full transform -translate-y-1/2 z-0"></div>

            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {deal?.data?.title}
                  </h1>
                  <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                    {deal?.data?.description}
                  </p>
                </div>

                {/* <button
                  onClick={handleFavoriteClick}
                  className={`p-2 rounded-lg transition-all duration-200 self-start ${
                    isDealFavorite
                      ? "text-red-500 bg-red-50"
                      : "text-gray-400 bg-gray-100 hover:text-red-500 hover:bg-red-50"
                  }`}>
                  <Heart
                    className={`h-5 w-5 ${isDealFavorite ? "fill-current" : ""}`}
                  />
                </button> */}
              </div>

              {/* Business Information */}
              {deal?.data?.user && (
                <div className="mb-6">
                  <Link
                    href={`/businesses/${deal.data.user._id}`}
                    className="block border border-gray-200 hover:bg-gray-50 rounded-lg p-4 -m-4 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <img
                            src={deal.data.user.image || "/placeholder.svg"}
                            alt={`${deal.data.user.name} logo`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                          {deal.data.user.name}
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {deal.data.user.location || deal.data.user.city}
                          </p>
                        </div>
                        {/* {deal.data.user. && (
                          <p className="text-sm text-gray-500 mt-1">
                            📞 {business.phone}
                          </p>
                        )} */}
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {deal.data.terms_for_the_deal && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Deal Details
                  </h3>
                  <div className="text-gray-600 leading-relaxed">
                    {deal.data.terms_for_the_deal}
                  </div>
                </div>
              )}

              <div className="border-t-2 border-dashed border-gray-200 my-6"></div>
              <div className="text-center">
                {redemptionResult?.success ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex flex-col items-center">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-medium text-lg">
                        Successfully Redeemed!
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-lg shadow-sm mb-4 border border-green-200">
                      <QRCodeCanvas
                        value={redemptionResult.code || ""}
                        size={150}
                      />
                    </div>

                    <p className="text-green-700 text-sm mb-2">
                      Show this code to the business:
                    </p>
                    <div className="bg-white border border-green-300 rounded-lg p-4 mb-3 w-full max-w-xs">
                      <code className="text-xl font-mono text-blue-950 font-bold text-green-800 tracking-widest">
                        {redemptionResult.code}
                      </code>
                    </div>
                    <p className="text-green-700 text-xs">
                      Code expires when deal expires
                    </p>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={handleRedeem}
                      disabled={isPending}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70">
                      {isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        "Redeem Deal"
                      )}
                    </button>
                    <p className="text-gray-500 text-sm mt-3">
                      Click to claim your exclusive offer
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Deal Information
            </h3>

            {deal.data.valid_till && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valid Until</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(deal.data.valid_till, "dd MMM yyyy")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {deal.data.terms_for_the_deal && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-900 mb-3">
                Terms & Conditions
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm leading-relaxed">
                  {deal.data.terms_for_the_deal}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* <div className="container-modern pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-yellow-500/20 rounded-xl flex-shrink-0">
                <Sparkles className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">
                  Platform in Development
                </h3>
                <p className="text-yellow-700 text-sm">
                  Information may be outdated. Please check official business
                  sites for up-to-date details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
}
