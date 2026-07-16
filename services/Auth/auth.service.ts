import { Post } from "@/lib/action";
import { useMutation } from "@tanstack/react-query";
import { ApiResponseType } from "../apitypes";
import { SingUPFormSchema } from "@/components/Auth/BusinessSignupPage";

export const useUserSignup = () => {
  return useMutation<ApiResponseType<any>, any, FormData>({
    mutationKey: ["userSignup"],
    mutationFn: (data: FormData) =>
      Post<FormData, ApiResponseType<any>>({
        url: "/api/auth/user/signup",
        data,
      }),
  });
};

export const useBusinessSignup = () => {
  return useMutation<ApiResponseType<SingUPFormSchema>, any, FormData>({
    mutationKey: ["businessSignup"],
    mutationFn: (data: FormData) =>
      Post<FormData, ApiResponseType<SingUPFormSchema>>({
        url: "/api/auth/business/signup",
        data,
      }),
  });
};

/** @deprecated Use useUserSignup or useBusinessSignup */
export const useSingup = useBusinessSignup;

export const useSendMailRestPassword = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["sendRestPassword"],
    mutationFn: (data: any) =>
      Post<any, ApiResponseType<any>>({
        url: "/api/reset-password",
        data,
      }),
  });
};

export const useVerifyCode = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["verifyCode"],
    mutationFn: (data: any) =>
      Post<any, ApiResponseType<any>>({
        url: "/api/auth/verify-code",
        data,
      }),
  });
};

export const useDeleteProfile = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["deleteProfile"],
    mutationFn: (data: any) =>
      Post<any, ApiResponseType<any>>({
        url: "/api/delete-profile",
        data,
      }),
  });
};

export const useEditProfile = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["editProfile"],
    mutationFn: (data: any) =>
      Post<any, ApiResponseType<any>>({
        url: "/api/edit-profile",
        data,
      }),
  });
};
