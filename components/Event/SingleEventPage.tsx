"use client";
import {
  Calendar,
  MapPin,
  ChevronLeft,
  Share,
  Loader2,
  Heart,
  Dot,
  Clock,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useFinalizeEventTicketPurchase,
  useGetEventRedeem,
  useGetSingleEvent,
  useRedeemEventCode,
} from "@/services/event.service";
import EventCheckOut, { PurchasableOption } from "../Stripe/EventCheckOut";
import Image from "next/image";
import { format, formatDate, parse } from "date-fns";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { storeGuestReceipt } from "@/lib/guestReceipt";
import {
  useCreateFavroite,
  useGetUserFavroite,
} from "@/services/favroite.service";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import EventDetailsSkeleton from "./SingleEventSkeleton";
import { useAuthModal } from "../Auth/DialogLogin/use-auth-model";

export default function EventDetailPage() {
  const param = useParams();
  const awaitedParams = param as { id: string };
  const slug = awaitedParams?.id.toLowerCase().replace(/[^a-z0-9]/g, "");
  const { data: session, update: updateSession } = useSession();
  const { mutate, isPending } = useCreateFavroite();
  const router = useRouter();
  const {
    data: event,
    isLoading,
    isFetching,
    refetch: refetchEvent,
  } = useGetSingleEvent(slug);
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
  const { data, isLoading: redeemLoading } = useGetEventRedeem();
  const { onOpen } = useAuthModal();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<{
    success: boolean;
    items?: { optionName: string; codes: string[] }[];
  } | null>(null);
  const { mutate: finalizePurchase, isPending: isFinalizing } =
    useFinalizeEventTicketPurchase();

  // Payment already succeeded (Stripe charged the card) but the finalize
  // call rejected it because the guest's name/email/phone weren't present
  // on the request — e.g. their session silently expired mid-checkout. The
  // money is already taken, so instead of just erroring out we let them
  // re-supply their details and retry against the same paymentIntentId.
  const [pendingFinalize, setPendingFinalize] = useState<{
    paymentIntentId: string;
  } | null>(null);
  const [recoverName, setRecoverName] = useState("");
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverPhone, setRecoverPhone] = useState("");
  const [recoverError, setRecoverError] = useState("");
  const [recovering, setRecovering] = useState(false);
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function parseErrorResponse(error: any): { message: string; code?: string } {
    try {
      const parsed = JSON.parse(error?.message);
      return {
        message: parsed?.error || parsed?.message || "Something went wrong",
        code: parsed?.code,
      };
    } catch {
      return { message: error?.message || "Something went wrong" };
    }
  }

  const EventId = event?.data?._id;

  const today = new Date().toISOString().split("T")[0];

  const optionsWithStatus = (event?.data?.options ?? []).map((opt) => {
    const released = !opt.release_date || opt.release_date <= today;
    const closed = !!opt.close_date && opt.close_date < today;
    const sold = opt.sold ? Number(opt.sold) : 0;
    const held = opt.held ? Number(opt.held) : 0;
    const remaining =
      opt.capacity != null
        ? Math.max(0, Number(opt.capacity) - sold - held)
        : null;
    const soldOut = remaining !== null && remaining <= 0;

    let status: "upcoming" | "closed" | "soldout" | "released" = "released";
    if (!released) status = "upcoming";
    else if (closed) status = "closed";
    else if (soldOut) status = "soldout";

    return {
      optionId: opt._id as string,
      name: opt.name || "Ticket",
      price: opt.price != null ? Number(opt.price) : 0,
      release_date: opt.release_date,
      remaining,
      status,
    };
  });

  const purchasableOptions: PurchasableOption[] = optionsWithStatus
    .filter((opt) => opt.status === "released")
    .map((opt) => ({
      optionId: opt.optionId,
      name: opt.name,
      price: opt.price,
      remaining: opt.remaining,
    }));

  const hasPurchasableOptions = purchasableOptions.length > 0;
  const fromPrice = hasPurchasableOptions
    ? Math.min(...purchasableOptions.map((opt) => opt.price))
    : 0;

  const showRemaining = event?.data?.show_remaining_tickets ?? true;
  const registrationCapacity = event?.data?.registration_capacity ?? null;
  const registrationSold = event?.data?.registration_sold ?? 0;
  const registrationRemaining =
    registrationCapacity != null
      ? Math.max(0, registrationCapacity - registrationSold)
      : null;
  const registrationFull =
    registrationRemaining !== null && registrationRemaining <= 0;

  const averageRating =
    event?.data && event.data.reviews.length > 0
      ? Math.round(
          event.data.reviews.reduce((acc, review) => acc + review.rating, 0) /
            event.data.reviews.length,
        )
      : 0;

  const userRedemption = data?.data?.find(
    (redemption: any) =>
      redemption?.user === session?.user?.id &&
      redemption?.event?._id === event?.data?._id,
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

  const handleBuyTicketsClick = () => {
    // if (!session?.user) {
    //   onOpen();
    //   toast.error("Please login to buy tickets");
    //   return;
    // }
    // Refresh availability right before opening checkout so quantity limits
    // reflect any tickets other buyers currently have on hold.
    refetchEvent();
    setIsCheckoutOpen(true);
  };

  const handleCheckoutClose = () => {
    setIsCheckoutOpen(false);
    refetchEvent();
  };

  const handlePurchaseSuccess = (
    paymentIntentId: string,
    _items: { optionId: string; quantity: number }[],
    guestInfo?: { name: string; email: string; phone: string },
  ) => {
    finalizePurchase(
      {
        eventId: event?.data?._id ?? "",
        paymentIntentId,
        guestInfo,
      },
      {
        onSuccess: (responseData) => {
          setPurchaseResult({
            success: true,
            items: responseData.items,
          });
          queryClient.invalidateQueries({ queryKey: ["singleEvent", slug] });
          toast.success("Payment successful! Your tickets are ready.");
          setIsCheckoutOpen(false);
          if (responseData.signedIn) {
            updateSession();
          }
          if (!session?.user && responseData.receipt && responseData.purchaseId) {
            storeGuestReceipt(responseData.purchaseId, responseData.receipt);
            router.push(`/checkout/receipt/${responseData.purchaseId}`);
          }
        },
        onError: (error: any) => {
          const { message, code } = parseErrorResponse(error);
          if (code === "GUEST_INFO_REQUIRED") {
            // The card was already charged — don't strand that payment.
            // Close the payment modal (nothing left to pay) and collect
            // the missing details so we can retry against the same intent.
            setIsCheckoutOpen(false);
            setRecoverName("");
            setRecoverEmail("");
            setRecoverPhone("");
            setRecoverError("");
            setPendingFinalize({ paymentIntentId });
            toast.error(
              "Your payment went through — please confirm your details to receive your tickets.",
            );
            return;
          }
          toast.error(message);
        },
      },
    );
  };

  const handleRecoverSubmit = () => {
    if (!recoverName.trim() || !recoverPhone.trim()) {
      setRecoverError("Please enter your full name and phone number.");
      return;
    }
    if (!EMAIL_RE.test(recoverEmail.trim())) {
      setRecoverError("Please enter a valid email address.");
      return;
    }
    if (!pendingFinalize) return;
    setRecoverError("");
    setRecovering(true);
    finalizePurchase(
      {
        eventId: event?.data?._id ?? "",
        paymentIntentId: pendingFinalize.paymentIntentId,
        guestInfo: {
          name: recoverName.trim(),
          email: recoverEmail.trim(),
          phone: recoverPhone.trim(),
        },
      },
      {
        onSuccess: (responseData) => {
          setPurchaseResult({ success: true, items: responseData.items });
          queryClient.invalidateQueries({ queryKey: ["singleEvent", slug] });
          toast.success("Payment successful! Your tickets are ready.");
          setPendingFinalize(null);
          setRecovering(false);
          if (responseData.signedIn) {
            updateSession();
          }
          if (!session?.user && responseData.receipt && responseData.purchaseId) {
            storeGuestReceipt(responseData.purchaseId, responseData.receipt);
            router.push(`/checkout/receipt/${responseData.purchaseId}`);
          }
        },
        onError: (error: any) => {
          const { message } = parseErrorResponse(error);
          setRecoverError(message);
          setRecovering(false);
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
        toast.success("Event Copied!");
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

  if (isLoading || redeemLoading || isFetching) {
    <EventDetailsSkeleton />;
  }

  return (
    <div className="relative md:container-modern mx-auto md:p-6 pb-20 md:pb-0 md:mt-20">
      {isLoading ? (
        <EventDetailsSkeleton />
      ) : (
        <>
          {isCheckoutOpen && (
            <EventCheckOut
              eventId={event?.data?._id ?? ""}
              eventTitle={event?.data?.title}
              options={purchasableOptions}
              maxTicketsPerRequest={event?.data?.max_tickets_per_request ?? 10}
              onClose={handleCheckoutClose}
              onSuccess={handlePurchaseSuccess}
              finalizing={isFinalizing}
            />
          )}

          {pendingFinalize && (
            <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5">
                <div>
                  <h3
                    className="text-xl font-bold"
                    style={{ color: "#051e3a" }}>
                    Confirm your details
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Your payment went through successfully — we just need your
                    details to send your tickets.
                  </p>
                </div>

                <div className="space-y-3 p-4 rounded-2xl border border-gray-200 bg-gray-50/50">
                  <Input
                    value={recoverName}
                    onChange={(e) => setRecoverName(e.target.value)}
                    placeholder="Full name"
                    autoComplete="name"
                    className="bg-white outline-none focus-visible:outline-none focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                  />
                  <Input
                    value={recoverEmail}
                    onChange={(e) => setRecoverEmail(e.target.value)}
                    type="email"
                    placeholder="Email address"
                    autoComplete="email"
                    className="bg-white outline-none focus-visible:outline-none focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                  />
                  <Input
                    value={recoverPhone}
                    onChange={(e) => setRecoverPhone(e.target.value)}
                    type="tel"
                    placeholder="Phone number"
                    autoComplete="tel"
                    className="bg-white outline-none focus-visible:outline-none focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                  />
                  {recoverError && (
                    <p className="text-xs font-medium text-red-500">
                      {recoverError}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleRecoverSubmit}
                  disabled={recovering}
                  style={{ backgroundColor: "#051e3a" }}
                  className="w-full text-white py-3.5 rounded-2xl font-bold shadow-lg hover:opacity-95 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2">
                  {recovering ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Get my tickets"
                  )}
                </button>
              </div>
            </div>
          )}
          <div className="flex flex-col md:flex-col">
            <div className=" order-2 md:order-1 mt-4 md:mt-0 mb-4 px-6 md:px-0">
              <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                    {event?.data?.title
                      ?.toLowerCase()
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </h1>
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
                          isEventFavorite
                            ? "text-red-500 scale-110"
                            : "text-neutral-600 hover:text-neutral-900",
                        )}
                        fill={isEventFavorite ? "red" : "none"}
                      />
                    )}
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center p-2 border rounded-full hover:bg-primary/10 transition-all active:scale-90"
                    title="Share Event">
                    <Share className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2 text-base text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1 sm:gap-2">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium text-foreground">
                    {event?.data?.venue || "Venue TBA"}
                  </span>
                </div>

                <Dot className="hidden md:block h-4 w-4" />

                <div className="flex items-center gap-1 sm:gap-2">
                  <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium text-foreground">
                    {event?.data?.dateRange?.from
                      ? `${formatDate(event?.data?.dateRange.from, "dd MMM yyyy")} ${
                          event?.data?.dateRange.from !==
                            event?.data?.dateRange.to &&
                          event?.data?.dateRange.to
                            ? `- ${formatDate(
                                event?.data?.dateRange.to,
                                "dd MMM yyyy",
                              )}`
                            : ""
                        }`
                      : "Date TBA"}
                  </span>
                </div>

                <Dot className="hidden md:block h-4 w-4" />

                <div className="flex items-center gap-1 sm:gap-2">
                  <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                  <p className="font-medium text-gray-800">
                    {event?.data?.startTime
                      ? format(
                          parse(event.data.startTime, "HH:mm", new Date()),
                          "h:mm aa",
                        )
                      : "Time TBA"}

                    {event?.data?.endTime &&
                      ` - ${format(
                        parse(event.data.endTime, "HH:mm", new Date()),
                        "h:mm aa",
                      )}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <div className="relative h-80 md:h-[70vh] w-full md:rounded-xl overflow-hidden">
                <Image
                  fill
                  src={event?.data?.image || "/placeholder.svg"}
                  alt={event?.data?.title || "Event Image"}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-10 md:rounded-2xl"></div>

                <div className="absolute inset-0 z-60 flex items-start justify-between p-3 md:hidden">
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
                            isEventFavorite
                              ? "text-red-500 scale-110"
                              : "text-neutral-600 hover:text-neutral-900",
                          )}
                          fill={isEventFavorite ? "red" : "none"}
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

          <div className="px-6 md:px-0 py-4 md:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-1 order-2 md:order-2">
                <div className="sticky top-30">
                  <div className="card p-5 md:p-6 rounded-md border border-gray-300 shadow-md space-y-4">
                    <h1 className="text-xl font-bold text-gray-800">
                      {event?.data?.title
                        ?.toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </h1>

                    {event?.data?.price_category === "registration" && (
                      <p
                        className="text-sm font-medium text-primary"
                        id="registration-button">
                        Free Event · Registration Required
                      </p>
                    )}

                    {event?.data?.price_category === "external" && (
                      <p
                        className="text-sm font-medium text-primary"
                        id="registration-button">
                        Tickets via external site
                      </p>
                    )}

                    {event?.data?.price_category === "paid" && (
                      <div
                        className="space-y-2 border rounded-xl p-3"
                        id="registration-button">
                        {optionsWithStatus.map((opt) => (
                          <div
                            key={opt.optionId}
                            className="flex items-center justify-between text-sm gap-2">
                            <span className="font-medium text-gray-800 truncate">
                              {opt.name}
                            </span>
                            {opt.status === "released" ? (
                              <span className="font-semibold text-primary shrink-0">
                                ${opt.price.toFixed(2)}
                                {showRemaining && opt.remaining !== null && (
                                  <span className="text-xs text-gray-400 font-normal ml-1">
                                    · {opt.remaining} left
                                  </span>
                                )}
                              </span>
                            ) : opt.status === "upcoming" ? (
                              <span className="text-xs text-gray-400 shrink-0">
                                Coming soon
                                {opt.release_date &&
                                  ` · ${formatDate(opt.release_date, "dd MMM")}`}
                              </span>
                            ) : opt.status === "closed" ? (
                              <span className="text-xs text-gray-400 shrink-0">
                                Closed
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 shrink-0">
                                Sold Out
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {event?.data?.price_category === "paid" ? (
                      <button
                        onClick={handleBuyTicketsClick}
                        disabled={!hasPurchasableOptions}
                        className={cn(
                          "w-full rounded-full py-3 font-semibold transition",
                          !hasPurchasableOptions
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-primary text-white hover:opacity-90",
                        )}>
                        {!hasPurchasableOptions
                          ? "Sold Out"
                          : purchaseResult?.success
                            ? "Buy More Tickets"
                            : "Buy Tickets"}
                      </button>
                    ) : event?.data?.price_category === "external" ? (
                      <a
                        href={event?.data?.ticket_link || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full block text-center rounded-full py-3 font-semibold transition bg-primary text-white hover:opacity-90">
                        Get Tickets
                      </a>
                    ) : (
                      <>
                        <button
                          onClick={handleRedeem}
                          disabled={
                            redeemPending ||
                            redemptionResult?.success ||
                            registrationFull
                          }
                          className={cn(
                            "w-full rounded-full py-3 font-semibold transition",
                            redemptionResult?.success || registrationFull
                              ? "bg-gray-400 text-white cursor-not-allowed"
                              : "bg-primary text-white hover:opacity-90",
                          )}>
                          {redemptionResult?.success
                            ? "Already Registered"
                            : registrationFull
                              ? "Fully Booked"
                              : redeemPending
                                ? "Processing..."
                                : "Register"}
                        </button>
                        {showRemaining && registrationRemaining !== null && (
                          <p className="text-xs text-gray-400 text-center">
                            {registrationRemaining} spot
                            {registrationRemaining === 1 ? "" : "s"} left
                          </p>
                        )}
                      </>
                    )}

                    <div className="border-t pt-4 space-y-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>
                          {event?.data?.dateRange?.from
                            ? `${formatDate(event.data.dateRange.from, "dd MMM yyyy")}`
                            : "Date TBA"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <p className="font-medium text-gray-800">
                          {event?.data?.startTime
                            ? format(
                                parse(
                                  event.data.startTime,
                                  "HH:mm",
                                  new Date(),
                                ),
                                "h:mm aa",
                              )
                            : "Time TBA"}
                          {event?.data?.endTime &&
                            ` - ${format(parse(event.data.endTime, "HH:mm", new Date()), "h:mm aa")}`}
                        </p>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="h-9 w-9 text-primary" />
                        <span>
                          {event?.data?.location || "Venue TBA"}{" "}
                          <div>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                event?.data?.location || "",
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-primary text-sm">
                              Get Directions
                            </a>
                          </div>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-6 order-1 md:order-1">
                <div className="md:card-lg md:p-4 md:p-6 pb-4 md:pb-0">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                    Descriptions
                  </h2>
                  {event?.data?.description && (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: event?.data?.description,
                      }}
                      className="text-gray-600 leading-relaxed"
                    />
                  )}
                </div>

                <div className="md:p-4 md:p-6 mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                    Location
                  </h2>

                  {event?.data?.latitude && event?.data?.longitude && (
                    <div className="h-[200px] md:h-[400px] z-20 w-full rounded-lg overflow-hidden">
                      <MapContainer
                        center={[event.data.latitude, event.data.longitude]}
                        zoom={13}
                        scrollWheelZoom={false}
                        className="h-full w-full z-20">
                        <TileLayer
                          attribution="&copy; OpenStreetMap contributors"
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker
                          position={[
                            event?.data?.latitude,
                            event?.data?.longitude,
                          ]}
                          icon={DefaultIcon}
                          eventHandlers={{
                            click: () => {
                              window.open(
                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  event.data.location,
                                )}`,
                                "_blank",
                              );
                            },
                          }}
                        />
                      </MapContainer>
                    </div>
                  )}

                  <div className="mt-4">
                    <span className="text-sm">{event?.data?.location}</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        event?.data?.location || "",
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-primary text-sm pl-1">
                      Get Directions
                    </a>
                  </div>
                </div>

                <div className="md:p-4 md:p-6 mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                    Host
                  </h2>
                  <div className="flex flex-row  items-center gap-6 border rounded-md p-4">
                    {event?.data?.host_name ? (
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-20 h-20">
                          <Image
                            src={event?.data?.image || "/placeholder.svg"}
                            alt={event?.data?.title || "Host Image"}
                            width={80}
                            height={80}
                            className="rounded-sm h-full object-cover shadow-md"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                            <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">
                              {event?.data?.host_name || "Host Name"}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="flex flex-col gap-1">
                              {event?.data?.phone_number && (
                                <p className="font-medium text-foreground text-sm">
                                  Phone N.O:{" "}
                                  <Link
                                    href={`tel:${event?.data?.phone_number}`}
                                    rel="noopener noreferrer">
                                    {event?.data?.phone_number ?? "N/A"}
                                  </Link>
                                </p>
                              )}
                              {event?.data?.email && (
                                <p className="font-medium text-foreground text-sm">
                                  Email:{" "}
                                  <Link
                                    href={`mailto:${event?.data?.email}`}
                                    rel="noopener noreferrer">
                                    {event?.data?.email ?? "N/A"}
                                  </Link>
                                </p>
                              )}
                              {event?.data?.website_link && (
                                <p className="font-medium text-foreground text-sm">
                                  Website:{" "}
                                  <Link
                                    href={`https://${event?.data?.website_link || "#"}`}
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    {event?.data?.website_link ?? "N/A"}
                                  </Link>
                                </p>
                              )}
                            </div>
                            <span></span>
                          </div>

                          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base mt-3">
                            {event?.data?.user?.city || "Host Description"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <Image
                            src={event?.data?.user.image || "/placeholder.svg"}
                            alt={event?.data?.title || "Host Image"}
                            width={80}
                            height={80}
                            className="rounded-sm h-full object-cover shadow-md"
                          />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                            <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">
                              {event?.data?.user.business_name || "Host Name"}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1 sm:gap-2">
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
                                {event?.data?.reviews &&
                                event?.data?.reviews?.length > 0
                                  ? event?.data?.reviews?.length
                                  : "No Review Yet"}
                                )
                              </span>
                            </div>
                            <div className="flex gap-1"></div>
                            <span></span>
                          </div>

                          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base mt-3">
                            {event?.data?.user?.city || "Host Description"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {event?.data?.support_details && (
                  <div className="md:p-4 md:p-6 -mt-2 md:-mt-10">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                      Support Details
                    </h2>
                    <div className="flex flex-row  items-center gap-6 border rounded-md p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                            <h3 className="text-sm flex flex-col md:text-base font-normal text-gray-800 dark:text-white">
                              {event?.data?.support_details
                                .split("\r\n")
                                .map((line, index) => (
                                  <span key={index}>{line}</span>
                                ))}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {event?.data?.event_rules && (
                  <div className="md:p-4 md:p-6 -mt-2 md:-mt-10">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                      Event Rules
                    </h2>
                    <div className="flex flex-row  items-center gap-6 border rounded-md p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                            <h3 className="text-sm flex flex-col md:text-base font-normal text-gray-800 dark:text-white">
                              {event?.data?.event_rules
                                .split("\r\n")
                                .map((line, index) => (
                                  <span key={index}>{line}</span>
                                ))}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {event?.data?.refund_policy && (
                  <div className="md:p-4 md:p-6 -mt-2 md:-mt-10">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                      Refund Policy
                    </h2>
                    <div className="flex flex-row  items-center gap-6 border rounded-md p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                            <h3 className="text-sm flex flex-col  md:text-base font-normal text-gray-800 dark:text-white">
                              {event?.data?.refund_policy
                                .split("\r\n")
                                .map((line, index) => (
                                  <span key={index}>{line}</span>
                                ))}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t shadow-sm z-60">
            <div className="flex items-center justify-between px-6 py-3">
              <p className="text-gray-600 text-sm">
                {" "}
                {event?.data?.title
                  ?.toLowerCase()
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </p>
              {event?.data?.price_category === "paid" ? (
                <button
                  onClick={handleBuyTicketsClick}
                  disabled={!hasPurchasableOptions}
                  className={cn(
                    "px-4 py-2 rounded-full text-base font-semibold transition flex items-center gap-2",
                    !hasPurchasableOptions
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-primary text-white hover:opacity-90",
                  )}>
                  {!hasPurchasableOptions
                    ? "Sold Out"
                    : purchaseResult?.success
                      ? "Buy More"
                      : `Buy · From $${fromPrice.toFixed(2)}`}
                </button>
              ) : event?.data?.price_category === "external" ? (
                <a
                  href={event?.data?.ticket_link || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full text-base font-semibold transition bg-primary text-white hover:opacity-90">
                  Get Tickets
                </a>
              ) : (
                <button
                  onClick={handleRedeem}
                  disabled={
                    redeemPending ||
                    redemptionResult?.success ||
                    registrationFull
                  }
                  className={cn(
                    "w-full rounded-full py-3 font-semibold transition",
                    redemptionResult?.success || registrationFull
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-primary text-white hover:opacity-90",
                  )}>
                  {redemptionResult?.success
                    ? "Already Registered"
                    : registrationFull
                      ? "Fully Booked"
                      : redeemPending
                        ? "Processing..."
                        : "Register"}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
