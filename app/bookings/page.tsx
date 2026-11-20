import React, { Suspense } from "react";
import BookingsContainer from "@/components/Bookings/BookingsContainer";
import { buildMetadata, SITE_NAME } from "@/lib/seo";

export const metadata = buildMetadata({
  title: `Book Treatments Online | ${SITE_NAME}`,
  description:
    "Securely reserve beauty, wellness, and salon appointments online with local businesses.",
  path: "/bookings",
});

export default function BookingsPage() {
  return (
    <Suspense fallback={null}>
      <BookingsContainer />
    </Suspense>
  );
}
