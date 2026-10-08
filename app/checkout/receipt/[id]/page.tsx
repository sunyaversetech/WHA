import GuestTicketReceiptPage from "@/components/Dashboard/Ticket/GuestTicketReceiptPage";

export const metadata = {
  title: "Your Receipt",
  description: "View your ticket QR code, invoice and event details.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <GuestTicketReceiptPage />;
}
