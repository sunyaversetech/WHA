import EventsPageClient from "@/components/Event/EventPage";

export const metadata = {
  title: "Events",
  description:
    "Discover upcoming Nepali community events near you, across Australia.",
  alternates: { canonical: "/events" },
};

export default function EventsPage() {
  return <EventsPageClient />;
}
