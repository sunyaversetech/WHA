import { useMutation } from "@tanstack/react-query";
import { ApiResponseType } from "./apitypes";
import { Post } from "@/lib/action";
import { useFetcher } from "@/lib/generic.service";

type RedeemCodeType = {
  dealId: string;
  userId: string;
  business: string;
  paymentIntentId?: string;
  quantity?: number;
};

type RedeemCodeResponseType = {
  deal: string;
  user: string;
  business: string;
  uniqueKey: string;
  status: "pending" | "verified";
  verifiedAt?: Date;
};

type RedeemCodeFormResponseType = {
  success: string;
  uniqueKey: string;
  paymentIntentId?: string;
};

export const useRedeemCode = () => {
  return useMutation<RedeemCodeFormResponseType, any, RedeemCodeType>({
    mutationKey: ["redeemCode"],
    mutationFn: (data: RedeemCodeType) =>
      Post<RedeemCodeType, RedeemCodeFormResponseType>({
        url: "/api/deals/redeem",
        data: data,
      }),
  });
};

export const useRedeemMultipleCode = () => {
  return useMutation<RedeemCodeFormResponseType, any, RedeemCodeType>({
    mutationKey: ["redeemMultiple"],
    mutationFn: (data: RedeemCodeType) =>
      Post<RedeemCodeType, RedeemCodeFormResponseType>({
        url: "/api/deals/redeem/multiple",
        data: data,
      }),
  });
};

export const useGetRedeem = () => {
  return useFetcher<ApiResponseType<RedeemCodeResponseType[]>>(
    "redeem",
    null,
    "/api/deals/redeem",
  );
};
