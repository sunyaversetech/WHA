import { useMutation } from "@tanstack/react-query";
import { ApiResponseType } from "./apitypes";
import { Post } from "@/lib/action";
import { useFetcher } from "@/lib/generic.service";

type DealsFormValues = {
  title: string;
  valid_till: Date;
  deals_for: string;
  description: string;
  terms_for_the_deal: string;
  deal_code: string;
};
type DealsGetValues = {
  title: string;
  valid_till: Date;
  deals_for: string;
  description: string;
  user: string;
  terms_for_the_deal: string;
  deal_code: string;
};

export const useCreateDeals = () => {
  return useMutation<ApiResponseType<DealsFormValues>, any, DealsFormValues>({
    mutationKey: ["createDeal"],
    mutationFn: (data: DealsFormValues) =>
      Post<DealsFormValues, ApiResponseType<DealsFormValues>>({
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
