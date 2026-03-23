import { useFetcher } from "@/lib/generic.service";
import { ApiResponseType } from "./apitypes";
import { useParams, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Post } from "@/lib/action";
import { OperatingHourPostType } from "@/components/Dashboard/Settings/OperatingHours";
import { BusinessHoursData } from "@/components/Business/SingleBusinessPage/Hours";

export type UserBusinessType = {
  _id?: string;
  name: string;
  category: "user" | "business";
  email: string;
  city: string;
  city_name: string;
  hours?: BusinessHoursData;
  location: string;
  community: string;
  community_name: string;
  image: string;
  longitude?: number;
  latitude?: number;
  isblocked: boolean;
  isSponsor: boolean;
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
  const community = param.get("community") || "";
  return useFetcher<ApiResponseType<UserBusinessType[]>>(
    ["getbusinesses", category, search, city, community],
    null,
    `/api/business?category=${category}&search=${search}&city=${city}&community=${community}`,
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
    `/api/business/single/${id}`,
  );
};
export const useGetSingleDashboardBusiness = (id: string) => {
  return useFetcher<ApiResponseType<UserBusinessType>>(
    ["getbusiness", id],
    null,
    `/api/business/getwithid/${id}`,
  );
};

export const useUpdateOperatingHours = () => {
  return useMutation<
    ApiResponseType<OperatingHourPostType>,
    any,
    OperatingHourPostType
  >({
    mutationKey: ["updateOperatingHours"],
    mutationFn: (data: OperatingHourPostType) =>
      Post<OperatingHourPostType, ApiResponseType<OperatingHourPostType>>({
        url: "/api/business/operating-hours",
        data: data,
      }),
  });
};

export const useGetOperatingHours = () => {
  return useFetcher<ApiResponseType<OperatingHourPostType>>(
    ["getOperatingHours"],
    null,
    `/api/business/operating-hours`,
  );
};

export const useUpadteABN = () => {
  return useMutation<
    ApiResponseType<{ abn_number: string }>,
    any,
    { abn_number: string }
  >({
    mutationKey: ["updateABN"],
    mutationFn: (data: { abn_number: string }) =>
      Post<{ abn_number: string }, ApiResponseType<{ abn_number: string }>>({
        url: "/api/business/abn",
        data: data,
      }),
  });
};

// export const useCreateDeals = () => {
//   return useMutation<ApiResponseType<DealFormValues>, any, DealFormValues>({
//     mutationKey: ["createDeal"],
//     mutationFn: (data: DealFormValues) =>
//       Post<DealFormValues, ApiResponseType<DealFormValues>>({
//         url: "/api/deals",
//         data: data,
//       }),
//   });
// };
