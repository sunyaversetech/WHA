import { useFetcher } from "@/lib/generic.service";
import { ApiResponseType } from "./apitypes";
import { useSearchParams } from "next/navigation";

export type UserBusinessType = {
  name: { type: string };
  category: { type: "user" | "business" };
  email: { type: string; unique: true; lowercase: true };
  city: { type: string };
  city_name: { type: string };
  location: { type: string };
  community: { type: string };
  community_name: { type: string };
  image: { type: string };
  business_name: { type: string };
  business_category: { type: string };
  abn_number: { type: string };
  verified: { type: boolean; default: false };
};
export const useGetBusiness = () => {
  const param = useSearchParams();
  const category = param.get("category") || "";
  const search = param.get("search") || "";
  return useFetcher<ApiResponseType<UserBusinessType[]>>(
    ["getbusinesses", category, search],
    null,
    `/api/business?category=${category}&search=${search}`,
  );
};
