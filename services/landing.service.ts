import { useQuery } from "@tanstack/react-query";
import { ApiResponseType } from "./apitypes";
import { useSearchParams } from "next/navigation";
import { Get } from "@/lib/action";

export const useGetLandingPageData = () => {
  const param = useSearchParams();
  const city = param.get("city") || "";
  return useQuery<ApiResponseType<any>>({
    queryKey: ["landing", city],
    queryFn: () => Get({ url: `/api/landing?city=${encodeURIComponent(city)}` }),
    staleTime: 60_000,
  });
};
