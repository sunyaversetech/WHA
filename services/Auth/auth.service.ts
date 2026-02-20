import { Post } from "@/lib/action";
import { useMutation } from "@tanstack/react-query";
import { ApiResponseType } from "../apitypes";
import { SingUPFormSchema } from "@/app/auth/business/page";

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
