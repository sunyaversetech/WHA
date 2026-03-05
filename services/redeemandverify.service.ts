import { useMutation } from "@tanstack/react-query";
import { ApiResponseType } from "./apitypes";
import { Post } from "@/lib/action";
import { useFetcher } from "@/lib/generic.service";

type RedeemCodeType = {
  dealId: string;
  userId: string;
  business: string;
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
};

export const useRedeemCode = () => {
  return useMutation<RedeemCodeFormResponseType, any, RedeemCodeType>({
    mutationKey: ["getRedeem"],
    mutationFn: (data: RedeemCodeType) =>
      Post<RedeemCodeType, RedeemCodeFormResponseType>({
        url: "/api/deals/redeem",
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
