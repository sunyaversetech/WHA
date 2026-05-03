import { useMutation } from "@tanstack/react-query";
import { ApiResponseType } from "./apitypes";
import { PATCH, Post } from "@/lib/action";
import { useFetcher } from "@/lib/generic.service";
import { UserBusinessType } from "./business.service";
import { DealFormValues } from "@/components/Dashboard/Deals/DealForm";
import { useSearchParams } from "next/navigation";

type DealsFormValues = {
  deal_id?: string;
  title: string;
  valid_till: Date;
  deals_for: string;
  description: string;
  terms_for_the_deal: string;
  deal_code: string;
};
export type DealsGetValues = {
  _id: string;
  title: string;
  current_redemptions: number;
  max_redemptions: number;
  price: number;
  valid_till: Date;
  deals_for: string;
  category?: string;
  city?: string;
  image?: string;
  description: string;
  user: UserBusinessType;
  terms_for_the_deal: string;
  deal_code: string;
  verifiedRedemptions: number;
};

export const useCreateDeals = () => {
  return useMutation<ApiResponseType<DealFormValues>, any, FormData>({
    mutationKey: ["createDeal"],
    mutationFn: (data: FormData) =>
      data.get("_id")
        ? PATCH<FormData, ApiResponseType<DealFormValues>>({
            url: `/api/deals/edit/${data.get("_id")}`,
            data: data,
          })
        : Post<FormData, ApiResponseType<DealFormValues>>({
            url: "/api/deals",
            data: data,
          }),
  });
};

export const useGetDeals = () => {
  return useFetcher<ApiResponseType<DealsGetValues[]>>(
    "deals",
    null,
    "/api/deals",
  );
};

export const useGetDealsRedemption = (id: string) => {
  return useFetcher<ApiResponseType<any>>(
    ["deals-redemption", id],
    null,
    `/api/deals/redeem/single/${id}`,
  );
};

export const useGetAllDeals = () => {
  const param = useSearchParams();
  const category = param.get("category") || "";
  const search = param.get("search") || "";
  const from = param.get("from") || "";
  const to = param.get("to") || "";
  const city = param.get("city") || "";
  return useFetcher<ApiResponseType<DealsGetValues[]>>(
    ["all-deals", category, search, from, to, city],
    null,
    `/api/deals/get-all?category=${category}&search=${search}&from=${from}&to=${to}&city=${city}`,
  );
};

export const useGetSingleDeal = (id: string) => {
  return useFetcher<ApiResponseType<DealsGetValues>>(
    ["singleDeal", id],
    null,
    `/api/deals/single-deal/${id}`,
  );
};

export const useVerifySingleDeal = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["verify-deal"],
    mutationFn: (data: any) =>
      Post<any, ApiResponseType<any>>({
        url: `/api/deals/verify`,
        data: data,
      }),
  });
};
export const useDeleteDeal = () => {
  return useMutation<ApiResponseType<{ id: string }>, any, { id: string }>({
    mutationKey: ["deleteDeal"],
    mutationFn: (data: { id: string }) =>
      Post<{ id: string }, ApiResponseType<any>>({
        url: `/api/deals/delete/${data.id}`,
        data: data,
      }),
  });
};
