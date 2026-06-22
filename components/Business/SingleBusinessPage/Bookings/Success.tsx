"use client";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, CheckCircle2, Calendar, Clock } from "lucide-react";

export default function BookingSuccessPage() {
  const params = useSearchParams();
  const sessionId = params?.get("session_id");

  const { data: appointment, isLoading } = useQuery({
    queryKey: ["booking-verification", sessionId],
    queryFn: async () => {
      const response = await axios.get(
        `/api/bookings/verify?session_id=${sessionId}`,
      );
      return response.data;
    },
    enabled: !!sessionId,
    refetchInterval: (query) => (query.state.data?.verified ? false : 1500),
  });

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#F9F9F9]">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-xl text-center space-y-6">
        {isLoading || !appointment?.verified ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            <p className="text-sm font-semibold text-slate-600">
              Securing your confirmation records...
            </p>
          </div>
        ) : (
          <>
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-50 rounded-full animate-ping opacity-75" />
              <div className="relative w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-9 h-9" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Booking Confirmed!
              </h1>
              <p className="text-sm text-slate-500">
                Your spot is officially secured at Maa Kali Hardware.
              </p>
            </div>
            {/* Rest of your success summary items */}
          </>
        )}
      </div>
    </div>
  );
}
