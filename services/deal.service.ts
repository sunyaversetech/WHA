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
  valid_till: Date;
  deals_for: string;
  description: string;
  user: UserBusinessType;
  terms_for_the_deal: string;
  deal_code: string;
  verifiedRedemptions: number;
};

export const useCreateDeals = () => {
  return useMutation<ApiResponseType<DealFormValues>, any, DealFormValues>({
    mutationKey: ["createDeal"],
    mutationFn: (data: DealFormValues) =>
      data._id
        ? PATCH<DealFormValues, ApiResponseType<DealFormValues>>({
            url: `/api/deals/edit/${data._id}`,
            data: data,
          })
        : Post<DealFormValues, ApiResponseType<DealFormValues>>({
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

export const useGetAllDeals = () => {
  const param = useSearchParams();
  const category = param.get("category") || "";
  const search = param.get("search") || "";
  return useFetcher<ApiResponseType<DealsGetValues[]>>(
    ["all-deals", category, search],
    null,
    `/api/deals/get-all?category=${category}&search=${search}`,
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
