// components/StripePaymentModal.tsx
"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";

export default function StripePaymentModal({
  amount,
  onSuccess,
  onClose,
}: {
  amount: number;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    // We use confirmPayment but we will handle the success logic manually
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required", // Important: handles it in-page if possible
    });

    if (error) {
      setErrorMessage(error.message || "Payment failed");
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(); // Trigger the backend redemption logic
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <h3 className="text-xl font-bold mb-4" style={{ color: "#051e3a" }}>
          Complete Payment
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Total including processing fees: <strong>${amount.toFixed(2)}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />

          {errorMessage && (
            <p className="text-red-500 text-xs">{errorMessage}</p>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 font-medium">
              Cancel
            </button>
            <button
              disabled={isProcessing || !stripe}
              style={{ backgroundColor: "#051e3a" }}
              className="flex-1 text-white py-2 rounded-xl font-semibold disabled:opacity-50 flex justify-center items-center">
              {isProcessing ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                "Pay Now"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
