import ActivityPage from "@/components/Activity/ActivityPage";

export const metadata = {
  title: "Your Activity",
  description: "View your bookings and tickets in one place.",
  robots: { index: false, follow: false },
};

export default function Activity() {
  return <ActivityPage />;
}
