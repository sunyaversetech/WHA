import { useFetcher } from "@/lib/generic.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Delete, Post, PATCH } from "@/lib/action";

export interface ICategory {
  _id: string;
  business_id: string;
  name: string;
  color: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export function useGetCategories() {
  return useFetcher<{ success: boolean; data: ICategory[] }>(
    ["categories"],
    null,
    "/api/categories",
  );
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color: string; description?: string }) =>
      Post({ url: "/api/categories", data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      id: string;
      name: string;
      color: string;
      description?: string;
    }) => PATCH({ url: `/api/categories/${data.id}`, data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => Delete({ url: `/api/categories/${id}` }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
