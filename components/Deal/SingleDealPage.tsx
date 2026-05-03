"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import {
  Calendar,
  Check,
  ArrowLeft,
  MapPin,
  Loader2,
  Tag,
  ExternalLink,
  AlertCircle,
  Clock,
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
import Image from "next/image";
import { createPaymentIntent } from "../Stripe/stripe";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentModal from "../Stripe/StripePaymentModal";
import { loadStripe } from "@stripe/stripe-js";
import StripeCheckout from "../Stripe/CheckOut";

function isPromise<T>(value: any): value is Promise<T> {
  return !!value && typeof value.then === "function";
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

/* ─── Loading skeleton ─── */
function DealDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 gap-4">
      <Skeleton className="h-80 w-full max-w-2xl rounded-2xl" />
      <Skeleton className="h-32 w-full max-w-2xl rounded-2xl" />
      <Skeleton className="h-24 w-full max-w-2xl rounded-2xl" />
    </div>
  );
}

export default function DealDetailPage({ params }: { params: { id: string } }) {
  let unwrappedParams: { id: string };
  if (isPromise(params)) {
    unwrappedParams = use(params) as { id: string };
  } else {
    unwrappedParams = params;
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);

  const { data: deal, isLoading } = useGetSingleDeal(unwrappedParams.id);
  const router = useRouter();
  const { data: session } = useSession();
  const [redemptionResult, setRedemptionResult] = useState<{
    success: boolean;
    message: string;
    code?: string;
    status: string;
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
          status: userRedemption.status,
        }),
      0,
    );
  }, [userRedemption]);

  const finalizeRedemption = () => {
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
            status: "pending",
          });
          queryClient.invalidateQueries({ queryKey: ["redeem"] });
          toast.success("Payment successful! Your QR code is ready.");
          setIsModalOpen(false);
        },
      },
    );
  };

  const handleRedeemClick = async () => {
    if (!session?.user) return router.push("/auth");

    if (deal?.data.price && deal?.data.price > 0) {
      setIsPreparingPayment(true);
      setIsModalOpen(true);
      setIsPreparingPayment(false);
      return;
    }

    mutate({
      dealId: deal?.data._id ?? "",
      userId: session.user.id,
      business: deal?.data.user._id ?? "",
    });
  };

  if (isLoading) return <DealDetailSkeleton />;
  if (!deal?.data) return <DealNotFoundPage />;

  const slug =
    deal?.data?.user?.business_name &&
    deal.data.user.business_name.toLowerCase().replace(/[^a-z0-9]/g, "");

  const isVerified = redemptionResult?.status === "verified";
  const isClaimed = redemptionResult?.success && !isVerified;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm ">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link
            href="/deals"
            className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition active:scale-95"
            aria-label="Back to deals">
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </Link>
          <h1 className="text-sm font-semibold text-gray-700 truncate">
            {deal.data.title}
          </h1>
        </div>
      </div>

      {isModalOpen && (
        <StripeCheckout
          dealId={deal.data._id}
          price={deal.data.price || 5}
          onClose={() => setIsModalOpen(false)}
          onSuccess={finalizeRedemption}
        />
      )}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4 mt-5">
        <div className="relative bg-white rounded-2xl shadow-md overflow-visible">
          <Image
            src={deal?.data?.image || "/placeholder.png"}
            alt={deal.data.title}
            width={1000}
            height={1000}
            sizes="100vw"
            className="w-full h-80 object-cover rounded-t-2xl mb-5"
          />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gray-50 border border-gray-100 z-10" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full bg-gray-50 border border-gray-100 z-10" />

          <div className="p-6 sm:p-8 md:-mt-7">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-2">
              {deal.data.title}
            </h2>
            <p className="text-gray-500 text-base leading-relaxed mb-6">
              {deal.data.description}
            </p>

            {/* Business card */}
            {/* {deal.data.user && (
              <Link
                href={`/businesses/${slug}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-100 transition group mb-6">
                <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-white">
                  <Image
                    fill
                    src={deal.data.user.image || "/placeholder.svg"}
                    alt={deal.data.user.business_name || "Business"}
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">
                    {deal.data.user.business_name}
                  </p>
                  {(deal.data.user.location || deal.data.user.city) && (
                    <p className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      {deal.data.user.location || deal.data.user.city}
                    </p>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition flex-shrink-0" />
              </Link>
            )} */}

            {/* Dashed divider */}
            <div className="border-t-2 border-dashed border-gray-200 my-6" />

            {/* ── CTA / Redemption area ── */}
            {isVerified ? (
              /* Already verified / used */
              <div className="flex flex-col items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-6 py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-lg font-bold text-green-800">
                  Deal Redeemed!
                </p>
                <p className="text-sm text-green-600 max-w-xs">
                  You have already used this deal. Thanks for visiting!
                </p>
              </div>
            ) : isClaimed ? (
              /* Claimed — show QR */
              <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-inner">
                <p className="text-base font-bold text-gray-900">
                  Show this to the business
                </p>
                <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
                  <QRCodeCanvas
                    value={redemptionResult?.code || ""}
                    size={160}
                  />
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-3 w-full max-w-xs">
                  <code className="text-xl font-mono font-bold tracking-widest text-gray-800">
                    {redemptionResult?.code}
                  </code>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-red-500">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  Code expires when the deal expires
                </div>
              </div>
            ) : (
              /* Not yet claimed */
              <div className="flex flex-col items-center gap-3">
                {/* <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4 border border-gray-100">
                  <span className="font-semibold text-gray-700">Quantity</span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white">
                      -
                    </button>
                    <span
                      className="text-lg font-bold"
                      style={{ color: "#051e3a" }}>
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white">
                      +
                    </button>
                  </div>
                </div> */}
                <button
                  onClick={handleRedeemClick}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 text-base transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-60">
                  {isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" /> Claiming…
                    </>
                  ) : (
                    <>
                      <Tag className="h-5 w-5" /> Redeem This Deal
                    </>
                  )}
                </button>
                <p className="text-gray-400 text-xs">
                  Tap to claim your exclusive offer — free &amp; instant
                </p>
              </div>
            )}
          </div>
        </div>
        {/* ── END MAIN CARD ── */}

        {/* ── DEAL INFO CARD ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-gray-900">
            Deal Information
          </h3>

          {deal.data.valid_till && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  Valid Until
                </p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">
                  {formatDate(deal.data.valid_till, "EEEE, dd MMM yyyy")}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
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

          {deal.data.terms_for_the_deal && (
            <div className="mt-8">
              <h3 className="text-base font-bold text-gray-900 mb-3">
                Terms &amp; Conditions
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {deal.data.terms_for_the_deal}
              </p>
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-4">
          <h3>Business</h3>
          {deal.data.user && (
            <Link
              href={`/businesses/${slug}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-100 transition group mb-6">
              <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-white">
                <Image
                  fill
                  src={deal.data.user.image || "/placeholder.svg"}
                  alt={deal.data.user.business_name || "Business"}
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">
                  {deal.data.user.business_name}
                </p>
                {(deal.data.user.location || deal.data.user.city) && (
                  <p className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    {deal.data.user.location || deal.data.user.city}
                  </p>
                )}
              </div>
              <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition flex-shrink-0" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
