"use client";

import React, { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuthModal } from "@/components/Auth/DialogLogin/use-auth-model";
import {
  useGetBusinessBookings,
  BookingType,
} from "@/services/booking.service";
import { useGetALLBusiness } from "@/services/business.service";
import {
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";

export default function BookingList() {
  const { data: session } = useSession();
  const router = useRouter();
  const { onOpen: openAuthModal } = useAuthModal();

  const {
    data: bookingsResponse,
    isLoading: loadingBookings,
    refetch,
  } = useGetBusinessBookings();
  const { data: businessesResponse } = useGetALLBusiness();

  // Map business names for fast lookup
  const businessMap = useMemo(() => {
    const map = new Map<string, string>();
    if (businessesResponse?.data) {
      businessesResponse.data.forEach((b) => {
        if (b._id && b.business_name) map.set(b._id, b.business_name);
      });
    }
    return map;
  }, [businessesResponse]);

  // Format date helper
  const formatDateTime = (isoString: string) => {
    if (!isoString) return "";
    const dateObj = new Date(isoString);
    return dateObj.toLocaleString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Helper to render status badge
  const renderStatusBadge = (status: BookingType["status"]) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <HelpCircle className="w-3.5 h-3.5 animate-pulse" /> Pending
          </span>
        );
      case "no_show":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            <XCircle className="w-3.5 h-3.5" /> No Show
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  if (!session) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center max-w-md mx-auto my-10 space-y-6">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-[#3771db]">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-slate-800 font-marcellus">
            Sign in to view bookings
          </h3>
          <p className="text-slate-500 text-sm">
            Access your active reservations, treatment history, and cancel or
            reschedule appointments.
          </p>
        </div>
        <button
          type="button"
          onClick={openAuthModal}
          className="btn-wha-primary w-full">
          Login / Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-normal text-slate-800 font-marcellus">
            My Appointments
          </h2>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Manage your scheduled wellness and beauty reservations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-xs font-semibold text-[#3771db] hover:text-[#2a59b2] transition-colors">
          Refresh List
        </button>
      </div>

      {loadingBookings ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-32 bg-white border rounded-xl animate-pulse p-5 space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-1/3 bg-slate-100 rounded" />
                <div className="h-4 w-20 bg-slate-100 rounded" />
              </div>
              <div className="h-4 w-2/3 bg-slate-100 rounded" />
              <div className="flex gap-4">
                <div className="h-4 w-16 bg-slate-100 rounded" />
                <div className="h-4 w-24 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : bookingsResponse?.data && bookingsResponse.data.length > 0 ? (
        <div className="space-y-4">
          {bookingsResponse.data.map((booking) => {
            const businessName =
              businessMap.get(booking.business_id) || "WHA Salon Partner";
            const serviceName =
              typeof booking.service_id === "object" && booking.service_id
                ? booking.service_id.name
                : "Beauty Treatment";

            const employeeName =
              typeof booking.employee_id === "object" && booking.employee_id
                ? booking.employee_id.full_name
                : "Specialist Team";

            return (
              <div
                key={booking._id}
                className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-base md:text-lg font-montserrat">
                      {serviceName}
                    </h3>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="font-semibold text-slate-600 text-xs md:text-sm">
                      {businessName}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#3771db] shrink-0" />
                      <span>{formatDateTime(booking.start_time)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#3771db] shrink-0" />
                      <span>Duration: {booking.duration} mins</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#3771db] shrink-0" />
                      <span>Specialist: {employeeName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 gap-3">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                      Price Paid
                    </span>
                    <span className="text-lg font-bold text-[#051e3a] font-montserrat">
                      ${booking.total_price.toFixed(2)}
                    </span>
                  </div>

                  <div>{renderStatusBadge(booking.status as any)}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed p-10 text-center text-slate-500 space-y-4">
          <Calendar className="w-12 h-12 mx-auto text-slate-300" />
          <div>
            <h4 className="font-semibold text-slate-700">
              No appointments found
            </h4>
            <p className="text-slate-500 text-xs md:text-sm mt-1">
              You do not have any upcoming or past wellness reservations
              scheduled.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
