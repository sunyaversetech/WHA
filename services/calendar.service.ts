import { useQuery } from "@tanstack/react-query";
import { Get } from "@/lib/action";
import { ApiResponseType } from "./apitypes";

export const useGetCalendarBookings = (
  startDate?: string,
  endDate?: string,
) => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return useQuery<ApiResponseType<any[]>>({
    queryKey: ["calendarBookings", startDate ?? "", endDate ?? "", timezone],
    queryFn: () =>
      Get({
        url: `/api/calendar/bookings?start_date=${startDate}&end_date=${endDate ?? startDate}&timezone=${encodeURIComponent(timezone)}`,
      }),
    enabled: !!startDate,
    staleTime: 30_000,
  });
};
