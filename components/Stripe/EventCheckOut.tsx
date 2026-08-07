// components/Stripe/EventCheckOut.tsx
"use client";

import { useState } from "react";
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
} from "lucide-react";
import {
  getEventTicketPaymentIntent,
  type EventTicketPricing,
} from "@/app/actions/eventTicketStripe";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

type Step = 1 | 2 | 3;

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Tickets" },
  { n: 2, label: "Details" },
  { n: 3, label: "Checkout" },
];

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center">
      {STEPS.map((s, i) => (
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
              {step > s.n ? <Check className="w-3.5 h-3.5" /> : s.n}
            </div>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wide",
                step === s.n ? "text-[#051e3a]" : "text-gray-400",
              )}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
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

type EventCheckOutProps = {
  eventId: string;
  eventTitle?: string;
  options: PurchasableOption[];
  onSuccess: (
    paymentIntentId: string,
    items: { optionId: string; quantity: number }[],
  ) => void;
  onClose: () => void;
};

export default function EventCheckOut({
  eventId,
  eventTitle,
  options,
  onSuccess,
  onClose,
}: EventCheckOutProps) {
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

  const cartItems = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([optionId, quantity]) => ({ optionId, quantity }));

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
      );
      setPricing(res);
      setElementsKey((prev) => prev + 1);
      return res;
    } catch (err: any) {
      setError(err.message || "Failed to price your order");
      throw err;
    } finally {
      setLoadingPricing(false);
    }
  };

  const handleContinueFromTickets = async () => {
    if (cartItems.length === 0) return;
    try {
      await fetchPricing(cartItems, "");
      setStep(2);
    } catch {
      // error already surfaced via `error` state
    }
  };

  const handleApplyPromo = async () => {
    setPromoMessage(null);
    try {
      const res = await fetchPricing(cartItems, promoInput);
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
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none">
              ✕
            </button>
          </div>
          {eventTitle && (
            <p className="text-sm text-gray-500 mb-5">{eventTitle}</p>
          )}

          <StepIndicator step={step} />
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {step === 1 && (
            <TicketsStep
              options={options}
              quantities={quantities}
              setQuantities={setQuantities}
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
              {step === 2 && (
                <DetailsStep
                  pricing={pricing}
                  promoInput={promoInput}
                  setPromoInput={setPromoInput}
                  onApplyPromo={handleApplyPromo}
                  promoMessage={promoMessage}
                  loadingPricing={loadingPricing}
                  onBack={() => setStep(1)}
                  onContinue={() => setStep(3)}
                />
              )}
              {step === 3 && (
                <CheckoutStep
                  pricing={pricing}
                  onBack={() => setStep(2)}
                  onSuccess={(paymentIntentId) =>
                    onSuccess(paymentIntentId, cartItems)
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
  onContinue,
  loading,
}: {
  options: PurchasableOption[];
  quantities: Record<string, number>;
  setQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onContinue: () => void;
  loading: boolean;
}) {
  const setQty = (optionId: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [optionId]: qty }));
  };

  const totalQty = Object.values(quantities).reduce((sum, q) => sum + q, 0);
  const subtotal = options.reduce(
    (sum, opt) => sum + opt.price * (quantities[opt.optionId] ?? 0),
    0,
  );

  return (
    <div className="space-y-4">
      {options.map((opt) => {
        const qty = quantities[opt.optionId] ?? 0;
        const atMax = opt.remaining !== null && qty >= opt.remaining;
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
                {opt.remaining !== null && ` · ${opt.remaining} left`}
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
              <span className="text-base font-bold w-4 text-center">
                {qty}
              </span>
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

      <button
        onClick={onContinue}
        disabled={totalQty === 0 || loading}
        style={{ backgroundColor: "#051e3a" }}
        className="w-full text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:opacity-95 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2">
        {loading ? (
          <Loader2 className="animate-spin h-5 w-5" />
        ) : (
          "Continue"
        )}
      </button>
    </div>
  );
}

function DetailsStep({
  pricing,
  promoInput,
  setPromoInput,
  onApplyPromo,
  promoMessage,
  loadingPricing,
  onBack,
  onContinue,
}: {
  pricing: EventTicketPricing;
  promoInput: string;
  setPromoInput: (val: string) => void;
  onApplyPromo: () => void;
  promoMessage: { type: "success" | "error"; text: string } | null;
  loadingPricing: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const orderTotal = pricing.ticketTotal + pricing.serviceFee;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Promo code
        </label>
        <div className="flex gap-2">
          <input
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            placeholder="Promo code"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm uppercase outline-none focus:border-primary"
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
            {promoMessage.text}
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

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 rounded-2xl font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
          Back
        </button>
        <button
          onClick={onContinue}
          style={{ backgroundColor: "#051e3a" }}
          className="flex-2 text-white py-3.5 rounded-2xl font-bold shadow-lg hover:opacity-95 transition-all active:scale-[0.98]">
          Continue to Payment
        </button>
      </div>
    </div>
  );
}

function CheckoutStep({
  pricing,
  onBack,
  onSuccess,
}: {
  pricing: EventTicketPricing;
  onBack: () => void;
  onSuccess: (paymentIntentId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { data } = useSession();
  const [isPaying, setIsPaying] = useState(false);

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
                name: data?.user?.name ?? "Guest",
                email: data?.user?.email ?? undefined,
                phone: data?.user?.phone_number ?? undefined,
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
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      console.error(err);
      setIsPaying(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-6">
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm">
        <span className="text-gray-500">
          Total to pay{" "}
          <span className="font-mono text-xs text-gray-400">
            ({pricing.invoiceNumber})
          </span>
        </span>
        <span className="font-bold text-lg" style={{ color: "#051e3a" }}>
          ${pricing.totalToPay.toFixed(2)}
        </span>
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
