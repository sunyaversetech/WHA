import { Post } from "@/lib/action";
import { useMutation } from "@tanstack/react-query";
import { ApiResponseType } from "../apitypes";

export const useSendSignupCode = () => {
  return useMutation<ApiResponseType<any>, any, { email: string }>({
    mutationKey: ["sendSignupCode"],
    mutationFn: (data: { email: string }) =>
      Post<{ email: string }, ApiResponseType<any>>({
        url: "/api/auth/send-verification-code",
        data,
      }),
  });
};

export const useVerifySignupCode = () => {
  return useMutation<ApiResponseType<any>, any, { email: string; code: string }>({
    mutationKey: ["verifySignupCode"],
    mutationFn: (data: { email: string; code: string }) =>
      Post<{ email: string; code: string }, ApiResponseType<any>>({
        url: "/api/auth/verify-signup-code",
        data,
      }),
  });
};
