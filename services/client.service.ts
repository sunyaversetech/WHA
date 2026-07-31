import { useFetcher } from "@/lib/generic.service";

export type ClientType = {
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  image?: string;
  bookings_count: number;
  total_spent: number;
  last_booking_at: string;
  first_booking_at: string;
};

export type ClientBooking = {
  _id: string;
  start_time: string;
  status: string;
  total_price: number;
  service_id?: { name: string } | null;
  employee_id?: { full_name: string } | null;
};

export const useGetClients = (q?: string) => {
  return useFetcher<{ data: ClientType[] }>(
    ["clients", q ?? ""],
    null,
    `/api/clients${q ? `?q=${encodeURIComponent(q)}` : ""}`,
  );
};

export const useGetClientDetail = (userId: string | null) => {
  return useFetcher<{
    data: { client: any; bookings: ClientBooking[] };
  }>(["client", userId ?? ""], null, `/api/clients/${userId}`, !!userId);
};
