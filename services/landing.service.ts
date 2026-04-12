import { useFetcher } from "@/lib/generic.service";
import { ApiResponseType } from "./apitypes";
import { useSearchParams } from "next/navigation";

export const useGetLandingPageData = () => {
  const param = useSearchParams();
  const city = param.get("city") || "";
  return useFetcher<ApiResponseType<any>>(
    ["landing", city],
    null,
    `/api/landing?city=${city}`,
  );
};
