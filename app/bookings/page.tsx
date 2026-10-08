import React from "react";
import BookingsContainer from "@/components/Bookings/BookingsContainer";

export const metadata = {
  title: "Book Treatments Online",
  description:
    "Securely reserve beauty, wellness, and salon appointments online with local businesses.",
  alternates: { canonical: "/bookings" },
};

export default function BookingsPage() {
  return <BookingsContainer />;
}
