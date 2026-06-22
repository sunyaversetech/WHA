"use client";
import React, { use } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

export default function BookingSuccessPage() {
  const params = useSearchParams();
  const sessionId = params?.get("session_id");

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#F9F9F9]">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 bg-emerald-50 rounded-full animate-ping opacity-75 duration-1000" />
          <div className="relative w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md shadow-emerald-200">
            <CheckCircle2 className="w-9 h-9" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
            Payment Confirmed{" "}
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Your payment went through safely, and your booking has been
            officially secured in our system pipeline.
          </p>
        </div>

        {/* Transaction Reference & Information Card */}
        {sessionId && (
          <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-left space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Booking Summary Details</span>
            </div>

            <div className="space-y-2 text-xs border-t border-slate-200/60 pt-2.5">
              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Date:
                </span>
                <span className="font-extrabold text-slate-900">
                  Scheduled on Checkout
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Status:
                </span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                  Paid & Confirmed
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Receipt Reference Token
              </span>
              <span className="text-[10px] font-mono text-slate-500 break-all select-all bg-white px-2 py-1 rounded border border-slate-200/80">
                {sessionId}
              </span>
            </div>
          </div>
        )}

        {/* Helpful User Prompt */}
        <p className="text-xs text-slate-400">
          A confirmation email alongside complete location metrics and checkout
          receipts has been dispatched to your email address.
        </p>

        {/* Action Directives */}
        <div className="pt-2 space-y-2">
          <Button
            asChild
            className="w-full font-bold h-11 rounded-xl bg-black hover:bg-slate-900 text-white shadow-md">
            <Link
              href="/dashboard/bookings"
              className="flex items-center justify-center gap-1">
              View Scheduled Appointments <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            className="w-full font-semibold text-xs h-11 text-slate-500 hover:text-slate-800">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
