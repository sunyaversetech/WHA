// components/StripeCheckout.tsx
"use client";

import { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2, Plus, Minus } from "lucide-react";
import { getPaymentIntentForQuantity } from "@/app/actions/stripe";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export default function StripeCheckout({
  dealId,
  price,
  onSuccess,
  onClose,
}: any) {
  const [quantity, setQuantity] = useState(1);
  const [clientSecret, setClientSecret] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function updateIntent() {
      setLoading(true);
      try {
        const res = await getPaymentIntentForQuantity(dealId, quantity);
        setClientSecret(res.clientSecret as string);
        setTotal(res.totalAmount);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    updateIntent();
  }, [quantity, dealId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header & Quantity Selector */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold" style={{ color: "#051e3a" }}>
              Secure Checkout
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-sm font-medium text-gray-500 ml-2">
              Number of Tickets
            </span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-lg font-bold w-4 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-400">Updating total...</p>
            </div>
          ) : (
            clientSecret && (
              <Elements
                key={clientSecret}
                stripe={stripePromise}
                options={{ clientSecret }}>
                <InternalForm
                  total={total}
                  quantity={quantity}
                  onSuccess={onSuccess}
                />
              </Elements>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// Separate internal component to use Stripe hooks
function InternalForm({ total, quantity, onSuccess }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [isPaying, setIsPaying] = useState(false);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsPaying(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        alert(error.message);
        setIsPaying(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        await onSuccess(paymentIntent.id, quantity);
      }
    } catch (err) {
      console.error(err);
      setIsPaying(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-6">
      <PaymentElement options={{ layout: "tabs" }} />

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Processing Fee included</span>
          <span>Total to pay</span>
        </div>
        <button
          disabled={isPaying || !stripe}
          style={{ backgroundColor: "#051e3a" }}
          className="w-full text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:opacity-95 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2">
          {isPaying ? (
            <Loader2 className="animate-spin" />
          ) : (
            `Pay $${total.toFixed(2)}`
          )}
        </button>
      </div>
    </form>
  );
}
