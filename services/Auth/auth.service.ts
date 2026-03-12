import { Post } from "@/lib/action";
import { useMutation } from "@tanstack/react-query";
import { ApiResponseType } from "../apitypes";
import { SingUPFormSchema } from "@/components/Auth/BusinessSignupPage";

// export const useCreateActivity = () => {
//   return useMutation<
//     ApiResponseType<ActivityFormValues>,
//     any,
//     ActivityFormValues
//   >({
//     mutationKey: ["createActivity"],
//     mutationFn: (data: ActivityFormValues) =>
//       Post<ActivityFormValues, ApiResponseType<ActivityFormValues>>({
//         url: data._id
//           ? `/client_api/activity/edit/${data._id}`
//           : "/client_api/activity/add",
//         data: data,
//       }),
//   });
// };

// export const useGetActivity = () => {
//   return useFetcher<ApiResponseType<ActivityType[]>>(
//     "activity",
//     null,
//     "/client_api/activity",
//   );
// };

export const useSingup = () => {
  return useMutation<ApiResponseType<SingUPFormSchema>, any, SingUPFormSchema>({
    mutationKey: ["createSignup"],
    mutationFn: (data: SingUPFormSchema) =>
      Post<SingUPFormSchema, ApiResponseType<SingUPFormSchema>>({
        url: "/api/signup",
        data: data,
      }),
  });
};

export const useSendMailRestPassword = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["sendRestPassword"],
    mutationFn: (data: any) =>
      Post<any, ApiResponseType<any>>({
        url: "/api/reset-password",
        data: data,
      }),
  });
};

export const useVerifyCode = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["verifyCode"],
    mutationFn: (data: any) =>
      Post<any, ApiResponseType<any>>({
        url: "/api/auth/verify-code",
        data: data,
      }),
  });
};
