import { useFetcher } from "@/lib/generic.service";
import { ApiResponseType } from "./apitypes";

export const useGetBusinessDashboard = () => {
  return useFetcher<ApiResponseType<{
    dailyStats: { date: string; appointments: number; sales: number }[];
    totalAppointments: number;
    totalSales: number;
    recentBookings: any[];
    upcomingBookings: any[];
    todayBookings: any[];
  }>>(["business-dashboard"], null, `/api/business-dashboard`);
};

export const useGetDashboardData = () => {
  return useFetcher<ApiResponseType<{ favorite?: any[]; deals?: any[] }>>(
    ["dashboard"],
    null,
    `/api/dashboard`,
  );
};

export const useGetTickets = () => {
  return useFetcher<ApiResponseType<any[]>>(
    ["tickets-dashboard"],
    null,
    `/api/tickets`,
  );
};
