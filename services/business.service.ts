import { useFetcher } from "@/lib/generic.service";
import { ApiResponseType } from "./apitypes";
import { useParams, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Post } from "@/lib/action";
import { OperatingHourPostType } from "@/components/Dashboard/Settings/OperatingHours";
import { BusinessHoursData } from "@/components/Business/SingleBusinessPage/Hours";
import { DealsGetValues } from "./deal.service";
import { EventFormValues } from "@/components/Dashboard/Events/EventsForm";
import { EmployeeType, ServiceType } from "./booking.service";

export type UserBusinessType = {
  _id?: string;
  name: string;
  category: "user" | "business";
  email: string;
  city: string;
  city_name: string;
  services: ServiceType[];
  employees: EmployeeType[];
  hours?: BusinessHoursData;
  location: string;
  community: string[];
  image: string;
  venue_images?: string[];
  longitude?: number;
  latitude?: number;
  geo?: { type: string; coordinates: [number, number] };
  distance?: number; // metres from user when geo query is active
  isblocked: boolean;
  isSponsor: boolean;
  business_name?: string;
  business_category?: string;
  business_type?: "employee_based" | "item_based";
  abn_number?: string;
  verified: boolean;
  is24_7?: boolean;
  schedule?: Record<string, { open: boolean; slots: { from: string; to: string }[] }> | null;
  event: EventFormValues[];
  deal: DealsGetValues[];

  emailVerified?: Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};
export const useGetBusiness = () => {
  const param = useSearchParams();
  const category  = param.get("category")  || "";
  const search    = param.get("search")    || "";
  const service   = param.get("service")   || "";
  const city      = param.get("city")      || "";
  const community = param.get("community") || "";
  const lat       = param.get("lat")       || "";
  const lng       = param.get("lng")       || "";
  const radius    = param.get("radius")    || "";
  const swLat     = param.get("swLat")     || "";
  const swLng     = param.get("swLng")     || "";
  const neLat     = param.get("neLat")     || "";
  const neLng     = param.get("neLng")     || "";
  return useFetcher<ApiResponseType<UserBusinessType[]>>(
    ["getbusinesses", category, search, service, city, community, lat, lng, swLat, swLng, neLat, neLng],
    null,
    `/api/business?category=${category}&search=${search}&service=${service}&city=${city}&community=${community}&lat=${lat}&lng=${lng}&radius=${radius}&swLat=${swLat}&swLng=${swLng}&neLat=${neLat}&neLng=${neLng}`,
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

export const useUpdateBusinessType = () => {
  return useMutation<
    ApiResponseType<{ business_type: string }>,
    any,
    { business_type: string }
  >({
    mutationKey: ["updateOperatingHours"],
    mutationFn: (data: { business_type: string }) =>
      Post<
        { business_type: string },
        ApiResponseType<{ business_type: string }>
      >({
        url: "/api/business/businesstype",
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
