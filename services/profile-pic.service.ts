import { useMutation } from "@tanstack/react-query";
import { ApiResponseType } from "./apitypes";
import { Post } from "@/lib/action";

export const useCreateProfilePic = () => {
  return useMutation<ApiResponseType<{ url: string }>, any, FormData>({
    mutationKey: ["createProfilePic"],
    mutationFn: (data: FormData) =>
      Post<FormData, ApiResponseType<{ url: string }>>({
        url: "/api/upload-profile-pic",
        data: data,
      }),
  });
};
