import { useQuery } from "@tanstack/react-query";
import { Get } from "@/lib/action";
import { ApiResponseType } from "./apitypes";

export const useGetCalendarBookings = (
  startDate?: string,
  endDate?: string,
) => {
  return useQuery<ApiResponseType<any[]>>({
    queryKey: ["calendarBookings", startDate ?? "", endDate ?? ""],
    queryFn: () =>
      Get({
        url: `/api/calendar/bookings?start_date=${startDate}&end_date=${endDate ?? startDate}`,
      }),
    enabled: !!startDate,
    staleTime: 30_000,
  });
};
