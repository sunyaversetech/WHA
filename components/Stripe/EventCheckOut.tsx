// components/Stripe/EventCheckOut.tsx
"use client";

import { useEffect, useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  Loader2,
  Plus,
  Minus,
  ShieldCheck,
  Check,
  Info,
  Clock,
  Ticket,
  User,
  CreditCard,
} from "lucide-react";
import {
  getEventTicketPaymentIntent,
  type EventTicketPricing,
} from "@/app/actions/eventTicketStripe";
import { useHoldTickets, useReleaseTicketHold } from "@/services/event.service";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Input } from "../ui/input";

function parseErrorMessage(error: any, fallback: string): string {
  try {
    const parsed = JSON.parse(error?.message);
    return parsed?.error || parsed?.message || fallback;
  } catch {
    return error?.message || fallback;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

type Step = 1 | 2 | 3;

// Guests get a "Details" step to collect their info; logged-in buyers skip
// straight from Tickets to Checkout.
const GUEST_STEPS: { n: Step; label: string; icon: React.ElementType }[] = [
  { n: 1, label: "Tickets", icon: Ticket },
  { n: 2, label: "Details", icon: User },
  { n: 3, label: "Checkout", icon: CreditCard },
];
const AUTH_STEPS: { n: Step; label: string; icon: React.ElementType }[] = [
  { n: 1, label: "Tickets", icon: Ticket },
  { n: 3, label: "Checkout", icon: CreditCard },
];

function StepIndicator({
  step,
  steps,
}: {
  step: Step;
  steps: { n: Step; label: string; icon: React.ElementType }[];
}) {
  return (
    <div className="flex items-center justify-center">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition",
                step === s.n
                  ? "bg-[#051e3a] border-[#051e3a] text-white"
                  : step > s.n
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-white border-gray-300 text-gray-400",
              )}>
              {step > s.n ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <s.icon className="w-3.5 h-3.5" />
              )}
            </div>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wide",
                step === s.n ? "text-[#051e3a]" : "text-gray-400",
              )}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "w-10 sm:w-14 h-0.5 mb-4",
                step > s.n ? "bg-emerald-500" : "bg-gray-200",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export type PurchasableOption = {
  optionId: string;
  name: string;
  price: number;
  remaining: number | null;
};

export type GuestInfo = { name: string; email: string; phone: string };

type EventCheckOutProps = {
  eventId: string;
  eventTitle?: string;
  options: PurchasableOption[];
  maxTicketsPerRequest?: number;
  onSuccess: (
    paymentIntentId: string,
    items: { optionId: string; quantity: number }[],
    guestInfo?: GuestInfo,
  ) => void;
  onClose: () => void;
};

export default function EventCheckOut({
  eventId,
  eventTitle,
  options,
  maxTicketsPerRequest = 10,
  onSuccess,
  onClose,
}: EventCheckOutProps) {
  const { status } = useSession();
  const isGuest = status !== "authenticated";

  const [step, setStep] = useState<Step>(1);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [promoInput, setPromoInput] = useState("");
  const [pricing, setPricing] = useState<EventTicketPricing | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [error, setError] = useState("");
  const [promoMessage, setPromoMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [elementsKey, setElementsKey] = useState(0);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestFieldError, setGuestFieldError] = useState("");
  const { mutate: holdTickets, isPending: holding } = useHoldTickets();
  const { mutate: releaseHold } = useReleaseTicketHold();

  const cartItems = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([optionId, quantity]) => ({ optionId, quantity }));

  const handleClose = () => {
    if (pricing?.paymentIntentId && holdExpiresAt) {
      releaseHold({ paymentIntentId: pricing.paymentIntentId });
    }
    onClose();
  };

  // Counts down the active hold and auto-closes the modal once it expires —
  // the tickets are released server-side (TTL + the release call above), so
  // the user simply has to start the checkout over.
  useEffect(() => {
    if (holdExpiresAt == null) return;
    const tick = () => {
      const secs = Math.max(0, Math.round((holdExpiresAt - Date.now()) / 1000));
      setRemainingSeconds(secs);
      if (secs <= 0) {
        if (pricing?.paymentIntentId) {
          releaseHold({ paymentIntentId: pricing.paymentIntentId });
        }
        toast.error("Your ticket hold has expired. Please try again.");
        onClose();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdExpiresAt]);

  const fetchPricing = async (
    items: { optionId: string; quantity: number }[],
    promo: string,
  ) => {
    setLoadingPricing(true);
    setError("");
    try {
      const res = await getEventTicketPaymentIntent(
        eventId,
        items,
        promo || undefined,
        pricing?.invoiceNumber,
        pricing?.paymentIntentId,
      );
      setPricing(res);
      setElementsKey((prev) => prev + 1);
      // A fresh PaymentIntent means any prior hold (tied to the old one) was
      // just released server-side — reset the local timer too.
      setHoldExpiresAt(null);
      setRemainingSeconds(null);
      return res;
    } catch (err: any) {
      setError(err.message || "Failed to price your order");
      throw err;
    } finally {
      setLoadingPricing(false);
    }
  };

  // Reserves the cart under `paymentIntentId` and moves into Checkout —
  // shared by the logged-in path (straight from Tickets) and the guest path
  // (after their details are collected).
  const goToCheckout = (paymentIntentId: string) => {
    setError("");
    holdTickets(
      { eventId, items: cartItems, paymentIntentId },
      {
        onSuccess: (res) => {
          setHoldExpiresAt(new Date(res.expiresAt).getTime());
          setStep(3);
        },
        onError: (err: any) => {
          setError(
            parseErrorMessage(err, "Those tickets are no longer available"),
          );
          setStep(1);
        },
      },
    );
  };

  const handleContinueFromTickets = async () => {
    if (cartItems.length === 0) return;
    try {
      const res = await fetchPricing(cartItems, "");
      if (isGuest) {
        setStep(2);
      } else {
        goToCheckout(res.paymentIntentId);
      }
    } catch {
      // error already surfaced via `error` state
    }
  };

  const handleContinueFromDetails = () => {
    if (!guestName.trim() || !guestPhone.trim()) {
      setGuestFieldError("Please enter your full name and phone number.");
      return;
    }
    if (!EMAIL_RE.test(guestEmail.trim())) {
      setGuestFieldError("Please enter a valid email address.");
      return;
    }
    setGuestFieldError("");
    if (!pricing) return;
    goToCheckout(pricing.paymentIntentId);
  };

  const handleApplyPromo = async () => {
    setPromoMessage(null);
    try {
      const res = await fetchPricing(cartItems, promoInput);
      // Re-pricing releases the hold tied to the previous PaymentIntent —
      // immediately re-establish it under the new one so nothing is left
      // unprotected while the buyer is still mid-checkout.
      await new Promise<void>((resolve, reject) => {
        holdTickets(
          {
            eventId,
            items: cartItems,
            paymentIntentId: res.paymentIntentId,
          },
          {
            onSuccess: (holdRes) => {
              setHoldExpiresAt(new Date(holdRes.expiresAt).getTime());
              resolve();
            },
            onError: (err) => reject(err),
          },
        );
      });
      setPromoMessage(
        promoInput.trim()
          ? res.promoApplied
            ? { type: "success", text: "Promo code applied!" }
            : null
          : null,
      );
    } catch (err: any) {
      setPromoMessage({
        type: "error",
        text: err.message || "Invalid promo code",
      });
    }
  };

  const guestInfo: GuestInfo | undefined = isGuest
    ? { name: guestName, email: guestEmail, phone: guestPhone }
    : undefined;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-xl font-bold" style={{ color: "#051e3a" }}>
              Complete Payment
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none">
              ✕
            </button>
          </div>
          {eventTitle && (
            <p className="text-sm text-gray-500 mb-5">{eventTitle}</p>
          )}

          <StepIndicator
            step={step}
            steps={isGuest ? GUEST_STEPS : AUTH_STEPS}
          />
        </div>

        <div className="p-6 space-y-6">
          {/* {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </div>
          )} */}

          {step === 1 && (
            <TicketsStep
              options={options}
              quantities={quantities}
              setQuantities={setQuantities}
              maxTicketsPerRequest={maxTicketsPerRequest}
              onContinue={handleContinueFromTickets}
              loading={loadingPricing}
            />
          )}

          {step > 1 && pricing && (
            <Elements
              key={`stripe-elements-singleton-${elementsKey}`}
              stripe={stripePromise}
              options={{
                clientSecret: pricing.clientSecret,
                appearance: { theme: "stripe" },
              }}>
              {step === 2 && isGuest && (
                <GuestDetailsStep
                  name={guestName}
                  setName={setGuestName}
                  email={guestEmail}
                  setEmail={setGuestEmail}
                  phone={guestPhone}
                  setPhone={setGuestPhone}
                  error={guestFieldError}
                  onBack={() => setStep(1)}
                  onContinue={handleContinueFromDetails}
                  holding={holding}
                />
              )}
              {step === 3 && (
                <CheckoutStep
                  pricing={pricing}
                  remainingSeconds={remainingSeconds}
                  promoInput={promoInput}
                  setPromoInput={setPromoInput}
                  onApplyPromo={handleApplyPromo}
                  promoMessage={promoMessage}
                  loadingPricing={loadingPricing}
                  guestInfo={guestInfo}
                  onBack={() => setStep(isGuest ? 2 : 1)}
                  onSuccess={(paymentIntentId, info) =>
                    onSuccess(paymentIntentId, cartItems, info)
                  }
                />
              )}
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketsStep({
  options,
  quantities,
  setQuantities,
  maxTicketsPerRequest,
  onContinue,
  loading,
}: {
  options: PurchasableOption[];
  quantities: Record<string, number>;
  setQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  maxTicketsPerRequest: number;
  onContinue: () => void;
  loading: boolean;
}) {
  const setQty = (optionId: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [optionId]: qty }));
  };

  const totalQty = Object.values(quantities).reduce((sum, q) => sum + q, 0);
  const atRequestCap = totalQty >= maxTicketsPerRequest;
  const subtotal = options.reduce(
    (sum, opt) => sum + opt.price * (quantities[opt.optionId] ?? 0),
    0,
  );

  return (
    <div className="space-y-4">
      {options.map((opt) => {
        const qty = quantities[opt.optionId] ?? 0;
        const atMax =
          (opt.remaining !== null && qty >= opt.remaining) || atRequestCap;
        return (
          <div
            key={opt.optionId}
            className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {opt.name}
              </p>
              <p className="text-xs text-gray-400">
                ${opt.price.toFixed(2)} each
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => qty > 0 && setQty(opt.optionId, qty - 1)}
                disabled={qty <= 0}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40">
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-base font-bold w-4 text-center">{qty}</span>
              <button
                type="button"
                onClick={() => !atMax && setQty(opt.optionId, qty + 1)}
                disabled={atMax}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}

      <div className="flex justify-between items-center px-1 text-sm text-gray-600 pt-2 border-t border-gray-100">
        <span>Subtotal</span>
        <span className="font-semibold text-gray-900">
          ${subtotal.toFixed(2)}
        </span>
      </div>

      <p className="text-xs text-gray-400 px-1">
        Maximum {maxTicketsPerRequest} tickets per booking.
      </p>

      <button
        onClick={onContinue}
        disabled={totalQty === 0 || loading}
        style={{ backgroundColor: "#051e3a" }}
        className="w-full text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:opacity-95 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2">
        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Continue"}
      </button>
    </div>
  );
}

function GuestDetailsStep({
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  error,
  onBack,
  onContinue,
  holding,
}: {
  name: string;
  setName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  error: string;
  onBack: () => void;
  onContinue: () => void;
  holding: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3 p-4 rounded-2xl border border-gray-200 bg-gray-50/50">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Your details
        </p>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          autoComplete="name"
          className="bg-white outline-none focus-visible:outline-none focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
        />
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email address"
          autoComplete="email"
          className="bg-white outline-none focus-visible:outline-none focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
        />
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          placeholder="Phone number"
          autoComplete="tel"
          className="bg-white outline-none focus-visible:outline-none focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
        />
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        <p className="text-[11px] text-gray-400">
          We&apos;ll email your tickets here and use this to keep you signed in
          after checkout.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={holding}
          className="flex-1 py-3.5 rounded-2xl font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={holding}
          style={{ backgroundColor: "#051e3a" }}
          className="flex-2 text-white py-3.5 rounded-2xl font-bold shadow-lg hover:opacity-95 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2">
          {holding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Continue to Payment"
          )}
        </button>
      </div>
    </div>
  );
}

function CheckoutStep({
  pricing,
  remainingSeconds,
  promoInput,
  setPromoInput,
  onApplyPromo,
  promoMessage,
  loadingPricing,
  guestInfo,
  onBack,
  onSuccess,
}: {
  pricing: EventTicketPricing;
  remainingSeconds: number | null;
  promoInput: string;
  setPromoInput: (val: string) => void;
  onApplyPromo: () => void;
  promoMessage: { type: "success" | "error"; text: string } | null;
  loadingPricing: boolean;
  guestInfo?: GuestInfo;
  onBack: () => void;
  onSuccess: (paymentIntentId: string, guestInfo?: GuestInfo) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { data } = useSession();
  const [isPaying, setIsPaying] = useState(false);
  const orderTotal = pricing.ticketTotal + pricing.serviceFee;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsPaying(true);
    try {
      const { error: confirmError, paymentIntent } =
        await stripe.confirmPayment({
          elements,
          redirect: "if_required",
          confirmParams: {
            payment_method_data: {
              billing_details: {
                name: guestInfo?.name ?? data?.user?.name ?? "Guest",
                email: guestInfo?.email ?? data?.user?.email ?? undefined,
                phone:
                  guestInfo?.phone ?? data?.user?.phone_number ?? undefined,
                address: {
                  line1: data?.user?.location ?? "",
                  country: "AU",
                  city: data?.user?.location ?? "Melbourne",
                  state: data?.user?.location ?? "VIC",
                  postal_code: data?.user?.location ?? "3000",
                },
              },
            },
          },
        });

      if (confirmError) {
        alert(confirmError.message);
        setIsPaying(false);
      } else if (paymentIntent?.status === "succeeded") {
        // The charge is done — hand off to the parent to finalize the
        // purchase. Reset here regardless of how that finalize turns out,
        // since this component may stay mounted (and stuck spinning) if it
        // fails instead of closing the modal.
        onSuccess(paymentIntent.id, guestInfo);
        setIsPaying(false);
      }
    } catch (err) {
      console.error(err);
      setIsPaying(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-6">
      {remainingSeconds != null && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            Your tickets are on hold for{" "}
            <span className="font-mono font-bold">
              {String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:
              {String(remainingSeconds % 60).padStart(2, "0")}
            </span>{" "}
            — complete payment before time runs out.
          </span>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Promo code
        </label>
        <div className="flex gap-2">
          <Input
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            placeholder="Promo code"
            className="bg-white outline-none focus-visible:outline-none focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
          />

          <button
            type="button"
            onClick={onApplyPromo}
            disabled={loadingPricing}
            style={{ backgroundColor: "#051e3a" }}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
            {loadingPricing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Apply"
            )}
          </button>
        </div>
        {promoMessage && (
          <p
            className={cn(
              "text-xs font-medium",
              promoMessage.type === "success"
                ? "text-emerald-600"
                : "text-red-500",
            )}>
            {promoMessage.type === "success"
              ? promoMessage.text
              : `invalid promo code`}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 overflow-hidden text-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-bold uppercase tracking-wide text-gray-700 text-xs">
            Order Summary
          </span>
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
            {pricing.invoiceNumber}
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {pricing.items.map((item) => (
            <div
              key={item.optionId}
              className="flex justify-between items-center px-4 py-3 text-gray-700">
              <span>
                {item.name} × {item.quantity}
                {item.discounted && (
                  <span className="text-gray-400 ml-1 text-xs line-through">
                    ${(item.originalPrice * item.quantity).toFixed(2)}
                  </span>
                )}
              </span>
              <span className="font-medium">
                ${(item.unitPrice * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}

          <div className="flex justify-between items-center px-4 py-3 text-gray-700">
            <span>Service fee</span>
            <span className="font-medium">
              ${pricing.serviceFee.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center px-4 py-3 font-bold text-gray-900">
            <span>Order total</span>
            <span>${orderTotal.toFixed(2)}</span>
          </div>

          <div className="px-4 py-2.5 bg-gray-50">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">
              Payment Surcharge
            </p>
            <div className="flex justify-between items-center text-gray-600">
              <span>
                Card processing surcharge
                <span className="text-xs text-gray-400"> (2.5%)</span>
              </span>
              <span>${pricing.surcharge.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between items-start px-4 py-3.5">
            <span className="font-bold text-gray-900">Total to pay</span>
            <div className="text-right">
              <span
                className="font-bold text-lg block"
                style={{ color: "#051e3a" }}>
                ${pricing.totalToPay.toFixed(2)}
              </span>
              <span className="text-[11px] text-gray-400">Incl. GST</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-gray-400">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>Service and processing fees are non-refundable.</span>
      </div>

      <PaymentElement
        options={{
          layout: "tabs",
          business: {
            name: "never",
          },
          fields: {
            billingDetails: {
              name: "auto",
              email: "never",
              phone: "never",
              address: "never",
            },
          },
        }}
      />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isPaying}
          className="flex-1 py-3.5 rounded-2xl font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
          Back
        </button>
        <button
          type="submit"
          disabled={isPaying || !stripe}
          style={{ backgroundColor: "#051e3a" }}
          className="flex-2 text-white py-3.5 rounded-2xl font-bold shadow-lg hover:opacity-95 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2">
          {isPaying ? (
            <Loader2 className="animate-spin" />
          ) : (
            `Pay $${pricing.totalToPay.toFixed(2)}`
          )}
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
        <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
        Secured by Stripe · End-to-end encrypted
      </p>
    </form>
  );
}
