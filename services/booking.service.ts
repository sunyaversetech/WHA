import { useMutation, useQuery } from "@tanstack/react-query";
import { ApiResponseType } from "./apitypes";
import { Get, Post } from "@/lib/action";

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface ServiceType {
  _id: string;
  business_id: string;
  name: string;
  description?: string;
  category: string;
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
) => {
  return useQuery<AvailableSlotsResponse>({
    queryKey: ["availableslots", serviceId, date, employeeId, timezone],
    queryFn: () => {
      const url = `/api/bookings/available-slots?service_id=${serviceId}&date=${date}${
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

export const useGetUserBookings = () => {
  return useQuery<{ success: boolean; data: BookingType[] }>({
    queryKey: ["userbookings"],
    queryFn: () => Get({ url: "/api/bookings" }),
  });
};
