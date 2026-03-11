import { useFetcher } from "@/lib/generic.service";
import { ApiResponseType } from "./apitypes";
import { useParams, useSearchParams } from "next/navigation";

export type UserBusinessType = {
  _id?: string;
  name: string;
  category: "user" | "business";
  email: string;
  city: string;
  city_name: string;
  location: string;
  community: string;
  community_name: string;
  image: string;
  longitude?: number;
  latitude?: number;

  business_name?: string;
  business_category?: string;
  abn_number?: string;
  verified: boolean;

  emailVerified?: Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};
export const useGetBusiness = () => {
  const param = useSearchParams();
  const category = param.get("category") || "";
  const search = param.get("search") || "";
  const city = param.get("city") || "";
  return useFetcher<ApiResponseType<UserBusinessType[]>>(
    ["getbusinesses", category, search, city],
    null,
    `/api/business?category=${category}&search=${search}&city=${city}`,
  );
};

export const useGetALLBusiness = () => {
  return useFetcher<ApiResponseType<UserBusinessType[]>>(
    ["getbusinesses"],
    null,
    `/api/business`,
  );
};

export const useGetSingleBusiness = () => {
  const param = useParams();
  const id = (param.id as string) || "";
  return useFetcher<ApiResponseType<UserBusinessType>>(
    ["getbusiness", id],
    null,
    `/api/business/${id}`,
  );
};
