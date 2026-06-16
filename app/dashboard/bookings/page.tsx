"use client";
import BookingsTable from "@/components/Dashboard/Bookings/BookingsListBusiness";
import { useGetBusinessBookings } from "@/services/booking.service";

export default function ComingSoon() {
  const { data } = useGetBusinessBookings();
  return <BookingsTable bookings={data?.data ?? []} />;
}
