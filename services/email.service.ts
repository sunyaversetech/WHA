import { useMutation } from "@tanstack/react-query";
import { ApiResponseType } from "./apitypes";
import { Post } from "@/lib/action";
import { useFetcher } from "@/lib/generic.service";

export const useSendVerificationEmail = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["verify-email"],
    mutationFn: (data: any) =>
      Post<any, ApiResponseType<any>>({
        url: `/api/send-email-verification`,
        data: data,
      }),
  });
};

export const useGetVerifyEmail = (token: string) => {
  return useFetcher<ApiResponseType<any>>(
    ["email"],
    null,
    `/api/verify-email?token=${token}`,
  );
};
