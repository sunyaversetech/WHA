import { useMutation } from "@tanstack/react-query";
import { ApiResponseType } from "./apitypes";
import { PATCH, Post } from "@/lib/action";
import { useFetcher } from "@/lib/generic.service";

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
  valid_till: Date;
  deals_for: string;
  description: string;
  user: string;
  terms_for_the_deal: string;
  deal_code: string;
};

export const useCreateDeals = () => {
  return useMutation<ApiResponseType<FormData>, any, FormData>({
    mutationKey: ["createDeal"],
    mutationFn: (data: FormData) =>
      data.get("_id")
        ? PATCH<FormData, ApiResponseType<FormData>>({
            url: `/api/deals/edit/${data.get("_id")}`,
            data: data,
          })
        : Post<FormData, ApiResponseType<FormData>>({
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

export const useGetSingleDeal = (id: string) => {
  return useFetcher<ApiResponseType<DealsGetValues>>(
    ["singleDeal", id],
    null,
    `/api/deals/single-deal/${id}`,
  );
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
