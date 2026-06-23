// components/BookingCheckout.tsx
"use client";

import { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2, ShieldCheck, X, Clock, User, Calendar } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getBookingPaymentIntent } from "@/app/actions/bookingstripe";

// ─── Stripe singleton — module level so it's never re-created ────────────────
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

const SURCHARGE_PERCENT = 0.025;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BookingCheckoutProps {
  /** The lock ID returned by the lock API — passed through to confirm booking */
  lockId: string;
  /** Total appointment price in AUD (already computed by the wizard) */
  price: number;
  /** Human-readable summary fields shown in the order card */
  summary: {
    serviceName: string;
    employeeName?: string | null;
    startTime: string; // ISO string
    duration: number; // minutes
  };
  /** Called after Stripe payment succeeds AND the booking API confirms */
  onSuccess: (paymentIntentId: string) => void;
  /** Called when the user closes/cancels the modal */
  onClose: () => void;
  /** True while the parent's bookingMutation is still running */
  isConfirming: boolean;
}

interface Fees {
  baseAmount: number;
  surcharge: number;
  totalToPay: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateInvoiceNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `INV-${ts}-${rand}`;
}

function computeFees(price: number): Fees {
  const surcharge = price * SURCHARGE_PERCENT;
  return {
    baseAmount: price,
    surcharge,
    totalToPay: price + surcharge,
  };
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} mins`;
  if (m === 0) return h === 1 ? "1 hr" : `${h} hrs`;
  return `${h} hr${h > 1 ? "s" : ""} ${m} mins`;
}

function formatSlotTime(iso: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

// ─── Outer shell — fetches client secret, mounts Elements ────────────────────

export default function BookingCheckout({
  lockId,
  price,
  summary,
  onSuccess,
  onClose,
  isConfirming,
}: BookingCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [paymentIntentId, setPaymentIntentId] = useState<string>("");
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [elementsKey, setElementsKey] = useState(0);
  const [invoiceNumber] = useState(() => generateInvoiceNumber());
  const fees = computeFees(price);

  // Create a PaymentIntent as soon as the modal mounts
  useEffect(() => {
    let cancelled = false;

    async function initIntent() {
      setInitializing(true);
      setInitError(null);
      try {
        const res = await getBookingPaymentIntent(
          lockId,
          Math.round(fees.totalToPay * 100),
        );
        if (!cancelled) {
          setClientSecret(res.clientSecret);
          setPaymentIntentId(res.paymentIntentId);
          setElementsKey((k) => k + 1);
        }
      } catch (err: any) {
        if (!cancelled) {
          setInitError(
            err?.message ?? "Failed to initialise payment. Please try again.",
          );
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    initIntent();
    return () => {
      cancelled = true;
    };
  }, [lockId, fees.totalToPay]);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
        style={{ maxHeight: "92vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/60">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Secure Checkout
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isConfirming}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition disabled:opacity-40">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Appointment Summary Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2.5 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Appointment Details
            </p>
            <div className="space-y-1.5 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <span className="text-sm">{summary.serviceName}</span>
              </div>
              {summary.employeeName && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <User className="w-3.5 h-3.5" />
                  <span>{summary.employeeName}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatSlotTime(summary.startTime)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDuration(summary.duration)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {initializing ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              <p className="text-sm text-slate-400">Setting up payment...</p>
            </div>
          ) : initError ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-red-500 font-medium">{initError}</p>
              <button
                type="button"
                onClick={() => setInitializing(true)}
                className="text-xs text-slate-500 underline">
                Try again
              </button>
            </div>
          ) : clientSecret ? (
            <Elements
              key={`booking-elements-${elementsKey}`}
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#0f172a",
                    borderRadius: "12px",
                  },
                },
              }}>
              <BookingPaymentForm
                fees={fees}
                invoiceNumber={invoiceNumber}
                onSuccess={onSuccess}
                isConfirming={isConfirming}
              />
            </Elements>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Inner form — has access to Stripe/Elements context ──────────────────────

interface BookingPaymentFormProps {
  fees: Fees;
  invoiceNumber: string;
  onSuccess: (paymentIntentId: string) => void;
  isConfirming: boolean;
}

function BookingPaymentForm({
  fees,
  invoiceNumber,
  onSuccess,
  isConfirming,
}: BookingPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { data: session } = useSession();
  const [isPaying, setIsPaying] = useState(false);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || isPaying || isConfirming) return;

    setIsPaying(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: session?.user?.name ?? "Guest",
              email: session?.user?.email ?? undefined,
            },
          },
        },
      });

      if (error) {
        // Surface Stripe's own user-friendly error message
        toast.error(error.message ?? "Payment failed. Please try again.");
        setIsPaying(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        // Hand the confirmed payment intent ID back to the parent which will
        // then hit the booking confirmation API
        onSuccess(paymentIntent.id);
        // Note: do NOT setIsPaying(false) here — isConfirming takes over the
        // loading state while the booking API call completes.
      } else {
        toast.error("Payment was not completed. Please try again.");
        setIsPaying(false);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "An unexpected error occurred.");
      setIsPaying(false);
    }
  };

  const isLoading = isPaying || isConfirming;

  return (
    <form onSubmit={handlePay} className="space-y-6">
      <PaymentElement
        options={{
          layout: "tabs",
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

      {/* Order Summary */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden text-sm">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900">
          <span className="font-semibold text-white tracking-wide">
            Order Summary
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {invoiceNumber}
          </span>
        </div>

        <div className="bg-slate-50 divide-y divide-slate-100">
          <div className="flex justify-between items-center px-4 py-3 text-slate-700">
            <span>Appointment</span>
            <span className="font-medium">
              AUD {fees.baseAmount.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center px-4 py-2.5 text-slate-500">
            <span className="flex items-center gap-1">
              Card processing surcharge
              <span className="text-xs text-slate-400">(2.5%)</span>
            </span>
            <span>AUD {fees.surcharge.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center px-4 py-3.5 font-bold text-white text-base bg-slate-900">
            <span>Total to Pay</span>
            <span>AUD {fees.totalToPay.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Pay Button */}
      <button
        type="submit"
        disabled={isLoading || !stripe}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-4 rounded-2xl font-bold text-base shadow-lg transition-all active:scale-[0.98] flex justify-center items-center gap-2">
        {isLoading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5" />
            <span>
              {isConfirming ? "Confirming booking..." : "Processing payment..."}
            </span>
          </>
        ) : (
          `Pay AUD ${fees.totalToPay.toFixed(2)}`
        )}
      </button>

      <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        Secured by Stripe · End-to-end encrypted
      </p>
    </form>
  );
}
