import { Suspense } from "react";
import EventsPageClient from "@/components/Event/EventPage";
import { buildMetadata, SITE_NAME } from "@/lib/seo";

export const metadata = buildMetadata({
  title: `Events | ${SITE_NAME}`,
  description:
    "Discover upcoming Nepali community events near you, across Australia.",
  path: "/events",
});

export default function EventsPage() {
  return (
    <Suspense fallback={null}>
      <EventsPageClient />
    </Suspense>
  );
}
