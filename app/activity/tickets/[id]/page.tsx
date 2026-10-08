import TicketDetailPage from "@/components/Dashboard/Ticket/TicketDetailPage";

export const metadata = {
  title: "Your Ticket",
  description: "View your ticket QR code and event details.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <TicketDetailPage />;
}
