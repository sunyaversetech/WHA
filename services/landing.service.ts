import { useFetcher } from "@/lib/generic.service";
import { ApiResponseType } from "./apitypes";

export const useGetLandingPageData = () => {
  return useFetcher<ApiResponseType<any>>(["landing"], null, `/api/landing`);
};
