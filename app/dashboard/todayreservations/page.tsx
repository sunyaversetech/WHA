import TodayReservations from "@/components/Dashboard/TodayReservations/TodayReservations";

export const metadata = { title: "Today's Reservations" };

export default function TodayReservationsPage() {
  return (
    <div className="p-4 sm:p-6">
      <TodayReservations />
    </div>
  );
}
