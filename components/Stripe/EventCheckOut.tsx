// components/Stripe/EventCheckOut.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2, Plus, Minus, ShieldCheck, Check } from "lucide-react";
import { getEventTicketPaymentIntent } from "@/app/actions/eventTicketStripe";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

const SERVICE_FEE_FLAT = 5.0;
const SURCHARGE_PERCENT = 0.025;

function generateInvoiceNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `INV-${ts}-${rand}`;
}

function computeFees(ticketPrice: number, quantity: number) {
  const ticketTotal = ticketPrice * quantity;
  const serviceFee = SERVICE_FEE_FLAT;
  const orderTotal = ticketTotal + serviceFee;
  const surcharge = orderTotal * SURCHARGE_PERCENT;
  const totalToPay = orderTotal + surcharge;
  return { ticketTotal, serviceFee, surcharge, totalToPay };
}

type Step = 1 | 2 | 3;

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Ticket" },
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

type EventCheckOutProps = {
  eventId: string;
  eventTitle?: string;
  price: number;
  maxQuantity: number | null;
  quantity: number;
  setQuantity: (quantity: number) => void;
  onSuccess: (paymentIntentId: string, quantity: number) => void;
  onClose: () => void;
};

export default function EventCheckOut({
  eventId,
  eventTitle,
  price,
  maxQuantity,
  onSuccess,
  onClose,
  setQuantity,
  quantity,
}: EventCheckOutProps) {
  const [step, setStep] = useState<Step>(1);
  const [clientSecret, setClientSecret] = useState("");
  const [fees, setFees] = useState(() => computeFees(price, quantity));
  const [initializing, setInitializing] = useState(true);
  const [updatingTotal, setUpdatingTotal] = useState(false);
  const [error, setError] = useState("");
  const [invoiceNumber] = useState(() => generateInvoiceNumber());
  const [elementsKey, setElementsKey] = useState(0);

  const elementsMountedRef = useRef(false);

  useEffect(() => {
    async function initIntent() {
      try {
        const res = await getEventTicketPaymentIntent(eventId, quantity);
        setClientSecret(res.clientSecret as string);
        setFees(computeFees(price, quantity));
        elementsMountedRef.current = true;
      } catch (err: any) {
        setError(err.message || "Failed to initialize payment");
      } finally {
        setInitializing(false);
      }
    }
    initIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-only; quantity changes are handled separately by onQuantityChange
  }, []);

  const onQuantityChange = useCallback(
    async (newQty: number) => {
      setUpdatingTotal(true);
      setError("");
      try {
        const res = await getEventTicketPaymentIntent(eventId, newQty);
        setClientSecret(res.clientSecret as string);
        setFees(computeFees(price, newQty));
        setQuantity(newQty);
        setElementsKey((prev) => prev + 1);
      } catch (err: any) {
        setError(err.message || "Failed to update quantity");
      } finally {
        setUpdatingTotal(false);
      }
    },
    [eventId, price, setQuantity],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <h3 className="text-xl font-bold" style={{ color: "#051e3a" }}>
                Secure Checkout
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none">
              ✕
            </button>
          </div>

          <StepIndicator step={step} />
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {initializing ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-400">Setting up payment...</p>
            </div>
          ) : (
            clientSecret && (
              <Elements
                key={`stripe-elements-singleton-${elementsKey}`}
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: { theme: "stripe" },
                }}>
                {step === 1 && (
                  <TicketStep
                    quantity={quantity}
                    maxQuantity={maxQuantity}
                    price={price}
                    updatingTotal={updatingTotal}
                    onQuantityChange={onQuantityChange}
                    onContinue={() => setStep(2)}
                  />
                )}
                {step === 2 && (
                  <DetailsStep
                    fees={fees}
                    quantity={quantity}
                    price={price}
                    eventTitle={eventTitle}
                    invoiceNumber={invoiceNumber}
                    onBack={() => setStep(1)}
                    onContinue={() => setStep(3)}
                  />
                )}
                {step === 3 && (
                  <CheckoutStep
                    fees={fees}
                    quantity={quantity}
                    invoiceNumber={invoiceNumber}
                    onBack={() => setStep(2)}
                    onSuccess={onSuccess}
                  />
                )}
              </Elements>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function TicketStep({
  quantity,
  maxQuantity,
  price,
  updatingTotal,
  onQuantityChange,
  onContinue,
}: {
  quantity: number;
  maxQuantity: number | null;
  price: number;
  updatingTotal: boolean;
  onQuantityChange: (quantity: number) => void;
  onContinue: () => void;
}) {
  const atMax = maxQuantity !== null && quantity >= maxQuantity;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
        <span className="text-sm font-medium text-gray-500 ml-2">
          Number of Tickets
          {maxQuantity !== null && (
            <span className="block text-xs text-gray-400 mt-0.5">
              {Math.max(maxQuantity, 0)} available
            </span>
          )}
        </span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => quantity > 1 && onQuantityChange(quantity - 1)}
            disabled={quantity <= 1 || updatingTotal}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40">
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-lg font-bold w-4 text-center">
            {quantity}
          </span>
          <button
            onClick={() => !atMax && onQuantityChange(quantity + 1)}
            disabled={atMax || updatingTotal}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center px-1 text-sm text-gray-600">
        <span>Price per ticket</span>
        <span className="font-semibold text-gray-900">
          ${price.toFixed(2)}
        </span>
      </div>

      <button
        onClick={onContinue}
        disabled={updatingTotal}
        style={{ backgroundColor: "#051e3a" }}
        className="w-full text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:opacity-95 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2">
        {updatingTotal ? (
          <Loader2 className="animate-spin h-5 w-5" />
        ) : (
          "Continue"
        )}
      </button>
    </div>
  );
}

function DetailsStep({
  fees,
  quantity,
  price,
  eventTitle,
  invoiceNumber,
  onBack,
  onContinue,
}: {
  fees: ReturnType<typeof computeFees>;
  quantity: number;
  price: number;
  eventTitle?: string;
  invoiceNumber: string;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-6">
      {eventTitle && (
        <div className="text-center">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">
            Purchasing tickets for
          </p>
          <p className="text-base font-bold text-gray-900">{eventTitle}</p>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 overflow-hidden text-sm">
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: "#051e3a" }}>
          <span className="font-semibold text-white tracking-wide">
            Order Summary
          </span>
          <span className="text-xs text-blue-200 font-mono">
            {invoiceNumber}
          </span>
        </div>

        <div className="bg-gray-50 divide-y divide-gray-100">
          <div className="flex justify-between items-center px-4 py-3 text-gray-700">
            <span>
              Ticket × {quantity}
              <span className="text-gray-400 ml-1 text-xs">
                (${price.toFixed(2)} each)
              </span>
            </span>
            <span className="font-medium">${fees.ticketTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center px-4 py-3 text-gray-700">
            <span>Service charge</span>
            <span className="font-medium">${fees.serviceFee.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center px-4 py-2.5 text-gray-500 bg-gray-50">
            <span className="flex items-center gap-1">
              Surcharge
              <span className="text-xs text-gray-400">(2.5%)</span>
            </span>
            <span>${fees.surcharge.toFixed(2)}</span>
          </div>

          <div
            className="flex justify-between items-center px-4 py-3.5 font-bold text-white text-base"
            style={{ backgroundColor: "#051e3a" }}>
            <span>Total to Pay</span>
            <span>${fees.totalToPay.toFixed(2)}</span>
          </div>
        </div>
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
  fees,
  quantity,
  invoiceNumber,
  onBack,
  onSuccess,
}: {
  fees: ReturnType<typeof computeFees>;
  quantity: number;
  invoiceNumber: string;
  onBack: () => void;
  onSuccess: (paymentIntentId: string, quantity: number) => void;
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
        onSuccess(paymentIntent.id, quantity);
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
            ({invoiceNumber})
          </span>
        </span>
        <span className="font-bold text-lg" style={{ color: "#051e3a" }}>
          ${fees.totalToPay.toFixed(2)}
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
            `Pay $${fees.totalToPay.toFixed(2)}`
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
