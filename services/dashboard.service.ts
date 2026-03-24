import { useFetcher } from "@/lib/generic.service";
import { ApiResponseType } from "./apitypes";

export const useGetDashboardData = () => {
  return useFetcher<ApiResponseType<{ favorite?: any[]; deals?: any[] }>>(
    ["dashboard"],
    null,
    `/api/dashboard`,
  );
};
