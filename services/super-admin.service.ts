import { useFetcher } from "@/lib/generic.service";
import { ApiResponseType } from "./apitypes";
import { UserBusinessType } from "./business.service";
import { EventType } from "./event.service";
import { DealsGetValues } from "./deal.service";
import { useMutation } from "@tanstack/react-query";
import { Post } from "@/lib/action";

export const useSuperAdminGetALLBusiness = () => {
  return useFetcher<ApiResponseType<UserBusinessType[]>>(
    ["getbusinesses"],
    null,
    `/api/super-admin/businesses`,
  );
};

export const useSuperAdminGetALLUsers = () => {
  return useFetcher<ApiResponseType<UserBusinessType[]>>(
    ["getbusinesses"],
    null,
    `/api/super-admin/users`,
  );
};

export const useSuperAdminGetALLEvents = () => {
  return useFetcher<ApiResponseType<EventType[]>>(
    ["getbusinesses"],
    null,
    `/api/super-admin/events`,
  );
};

export const useSuperAdminGetALLDeal = () => {
  return useFetcher<ApiResponseType<DealsGetValues[]>>(
    ["getbusinesses"],
    null,
    `/api/super-admin/deals`,
  );
};

// export const useDeleteBusinessOrUser = () => {
//   return useFetcher<ApiResponseType<UserBusinessType[]>>(
//     ["getbusinesses"],
//     null,
//     `/api/super-admin/businesses/delete`,
//   );
// };

export const useDeleteBusinessOrUser = () => {
  return useMutation<ApiResponseType<{ id: string }>, any, { id: string }>({
    mutationKey: ["deleteBusinessOrUser"],
    mutationFn: (data: { id: string }) =>
      Post<{ id: string }, ApiResponseType<any>>({
        url: `/api/super-admin/businesses/delete/${data.id}`,
        data: data,
      }),
  });
};

export const useVerifyBusiness = () => {
  return useMutation<ApiResponseType<{ id: string }>, any, { id: string }>({
    mutationKey: ["verifyBusiness"],
    mutationFn: (data: { id: string }) =>
      Post<{ id: string }, ApiResponseType<any>>({
        url: `/api/super-admin/businesses/update-verify/${data.id}`,
        data: data,
      }),
  });
};
export const useBlockBusinessOrUser = () => {
  return useMutation<ApiResponseType<{ id: string }>, any, { id: string }>({
    mutationKey: ["blockBusiness"],
    mutationFn: (data: { id: string }) =>
      Post<{ id: string }, ApiResponseType<any>>({
        url: `/api/super-admin/businesses/block/${data.id}`,
        data: data,
      }),
  });
};

export const useSuperAdminDeleteDeal = () => {
  return useMutation<ApiResponseType<{ id: string }>, any, { id: string }>({
    mutationKey: ["deleteSuperAdminDeals"],
    mutationFn: (data: { id: string }) =>
      Post<{ id: string }, ApiResponseType<any>>({
        url: `/api/super-admin/deals/${data.id}`,
        data: data,
      }),
  });
};

export const useSuperAdminDeleteEvent = () => {
  return useMutation<ApiResponseType<{ id: string }>, any, { id: string }>({
    mutationKey: ["deleteSuperAdminDeals"],
    mutationFn: (data: { id: string }) =>
      Post<{ id: string }, ApiResponseType<any>>({
        url: `/api/super-admin/events/${data.id}`,
        data: data,
      }),
  });
};
