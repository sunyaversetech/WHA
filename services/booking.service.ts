import { useMutation, useQuery } from "@tanstack/react-query";
import { ApiResponseType } from "./apitypes";
import { Get, PATCH, Post } from "@/lib/action";
import { Booking } from "@/components/Dashboard/Bookings/BookingsListBusiness";

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface ServiceType {
  _id: string;
  business_id: any;
  name: string;
  description?: string;
  category: string;
  inventory: number;
  base_price: number;
  base_duration: number;
  require_employee_selection: boolean;
  assigned_employees: EmployeeType[];
  is_active: boolean;
  buffer_time?: number;
}

export interface EmployeeType {
  _id: string;
  business_id: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  bio?: string;
  is_active: boolean;
  employee_photo?: string;
}

export interface BookingType {
  _id: string;
  business_id: string;
  user_id: string;
  service_id: ServiceType | null | any;
  employee_id: EmployeeType | null | any;
  start_time: string;
  end_time: string;
  duration: number;
  total_price: number;
  currency: string;
  payment_status: "unpaid" | "pending" | "paid" | "refunded" | "failed";
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingLockPayload {
  service_id: string;
  employee_id?: string | null;
  start_time: string;
  timezone: string;
}

export interface BookingLockResponse {
  success: boolean;
  lock_id: string;
  employee_id: string;
}

export interface BookingPayload {
  service_id: string;
  employee_id?: string | null;
  start_time: string;
  lock_id: string;
  idempotency_key?: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  data: BookingType;
}

export interface AvailableSlotsResponse {
  success: boolean;
  count: number;
  available_slots: string[];
}

// ─── Queries & Mutations ────────────────────────────────────────────────────

export const useGetServices = (businessId?: string) => {
  return useQuery<{ success: boolean; data: ServiceType[] }>({
    queryKey: ["getservices", businessId],
    queryFn: () =>
      Get({
        url: `/api/services${businessId ? `?business_id=${businessId}` : ""}`,
      }),
  });
};

export const useGetAvailableSlots = (
  serviceId: string,
  date: string,
  employeeId?: string | null,
  timezone: string = "UTC",
  businessId?: string,
  duration_minutes?: number,
) => {
  return useQuery<AvailableSlotsResponse>({
    queryKey: [
      "availableslots",
      serviceId,
      date,
      employeeId,
      timezone,
      businessId,
      duration_minutes,
    ],
    queryFn: () => {
      const url = `/api/bookings/available-slots?service_id=${serviceId}&date=${date}${businessId ? `&business_id=${businessId}` : ""}${`&duration_minutes=${duration_minutes}`}${
        employeeId && employeeId !== "any" ? `&employee_id=${employeeId}` : ""
      }&timezone=${encodeURIComponent(timezone)}`;
      return Get({ url });
    },
    enabled: !!serviceId && !!date,
  });
};

export const useCreateBookingLock = () => {
  return useMutation<BookingLockResponse, Error, BookingLockPayload>({
    mutationKey: ["createBookingLock"],
    mutationFn: (data: BookingLockPayload) =>
      Post<BookingLockPayload, BookingLockResponse>({
        url: "/api/bookings/lock",
        data,
      }),
  });
};

export interface CheckoutSessionPayload {
  lock_id: string;
  service_id: string;
  employee_id: string | null | undefined;
  start_time: string;
  items: {
    service_id: string;
    quantity: number;
    multiplier: number;
  }[];
  success_url: string;
  cancel_url: string;
}

export interface CheckoutSessionResponse {
  success: boolean;
  url: string;
}

export const useCreateCheckoutSession = () => {
  return useMutation<
    ApiResponseType<CheckoutSessionResponse>,
    Error,
    CheckoutSessionPayload
  >({
    mutationKey: ["createCheckoutSession"],
    mutationFn: (data: CheckoutSessionPayload) =>
      Post<CheckoutSessionPayload, ApiResponseType<CheckoutSessionResponse>>({
        url: "/api/checkout-session",
        data,
      }),
  });
};

export const useUpdateBookingStatus = () => {
  return useMutation<
    { bookingId: string; newStatus: string; notes: string },
    Error,
    { bookingId: string; newStatus: string; notes: string }
  >({
    mutationKey: ["createBookingLock"],
    mutationFn: (data: {
      bookingId: string;
      newStatus: string;
      notes: string;
    }) =>
      PATCH<
        { bookingId: string; newStatus: string; notes: string },
        { bookingId: string; newStatus: string; notes: string }
      >({
        url: "/api/bookings/status",
        data,
      }),
  });
};

export const useCreateBooking = () => {
  return useMutation<BookingResponse, Error, BookingPayload>({
    mutationKey: ["createBooking"],
    mutationFn: (data: BookingPayload) =>
      Post<BookingPayload, BookingResponse>({
        url: "/api/bookings",
        data,
      }),
  });
};

export const useGetBusinessBookings = () => {
  return useQuery<{ success: boolean; data: Booking[] }>({
    queryKey: ["businessbookings"],
    queryFn: () => Get({ url: "/api/bookings" }),
  });
};
