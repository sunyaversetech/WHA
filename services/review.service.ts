import { useMutation } from "@tanstack/react-query";
import { ApiResponseType } from "./apitypes";
import { PATCH, Post } from "@/lib/action";
import { Reviews } from "@/components/Business/Comment";
import { useFetcher } from "@/lib/generic.service";

export type ReviewType = {
  _id: string;
  business_id: string;
  user: {
    accpetalltermsandcondition: boolean;
    _id: string;
    name: string;
    category: string;
    email: string;
    emailVerified: Date | null;
    provider: string;
    business_name: string;
    business_category: string;
    abn_number: string;
    verified: boolean;
    createdAt: Date;
    updatedAt: Date;
    image: string;
  };
  rating: number;
  comment: string;
  created_at: Date;
  updated_at: Date;
};

export const useCreateReview = () => {
  return useMutation<ApiResponseType<Reviews>, any, Reviews>({
    mutationKey: ["createReview"],
    mutationFn: (data: Reviews) =>
      data.review_id
        ? PATCH<Reviews, ApiResponseType<Reviews>>({
            url: `/api/review/edit/${data.review_id}`,
            data: data,
          })
        : Post<Reviews, ApiResponseType<Reviews>>({
            url: "/api/review",
            data: data,
          }),
  });
};

export const useDeleteReview = () => {
  return useMutation<ApiResponseType<{ id: string }>, any, { id: string }>({
    mutationKey: ["deleteReview"],
    mutationFn: (data: { id: string }) =>
      Post<{ id: string }, ApiResponseType<any>>({
        url: `/api/review/delete/${data.id}`,
        data: data,
      }),
  });
};
// export const useGetReview = (business_id: string) => {
//   return useMutation<ApiResponseType<any>, any, FormData>({
//     mutationKey: ["review"],
//     mutationFn: (data: FormData) =>
//       Post<FormData, ApiResponseType<any>>({
//         url: `/api/review?business_id=${business_id}`,
//         data: data,
//       }),
//   });
// };

export const useGetReview = (business_id: string) => {
  return useFetcher<ApiResponseType<ReviewType[]>>(
    ["review"],
    null,
    `/api/review?business_id=${business_id}`,
  );
};
