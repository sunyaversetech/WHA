"use client";

import React, { useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BookingCheckoutProps {
  lockId: string;
  price: number;
  onClose: () => void;
  onSuccess: (paymentIntentId: string) => void;
}

export default function BookingCheckout({
  lockId,
  price,
  onClose,
  onSuccess,
}: BookingCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMockPaymentExecution = async () => {
    setIsProcessing(true);
    try {
      // Replace this mock with your actual Stripe payment intent/elements confirmation method
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const fakePaymentIntentId = `pi_${Math.random().toString(36).substring(2, 15)}`;
      toast.success("Payment authorized successfully!");
      onSuccess(fakePaymentIntentId);
    } catch (err: any) {
      toast.error(err.message || "Payment process failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-100 p-6 shadow-2xl space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-slate-900">
            Secure Appointment Payment
          </h3>
          <p className="text-xs text-slate-500">Lock ID: {lockId}</p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-center">
          <span className="text-sm font-medium text-slate-600">
            Total Amount due:
          </span>
          <span className="text-xl font-black text-slate-900">
            ${price.toFixed(2)} AUD
          </span>
        </div>

        {/* Mount your explicit Stripe Elements or direct pay button actions here */}
        <Button
          onClick={handleMockPaymentExecution}
          disabled={isProcessing}
          className="w-full h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-2">
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing Transaction...</span>
            </>
          ) : (
            <span>Authorize Payment & Confirm Appointment</span>
          )}
        </Button>
      </div>
    </div>
  );
}
