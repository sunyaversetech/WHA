import { useFetcher } from "@/lib/generic.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Delete, Post, PATCH } from "@/lib/action";

export interface ICategory {
  _id: string;
  business_id: string;
  name: string;
  color: string;
  description: string;
  type: "service" | "resource";
  created_at: string;
  updated_at: string;
}

export function useGetCategories(type?: "service" | "resource") {
  const url = type ? `/api/categories?type=${type}` : "/api/categories";
  const key = type ? ["categories", type] : ["categories"];
  return useFetcher<{ success: boolean; data: ICategory[] }>(key, null, url);
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color: string; description?: string; type?: "service" | "resource" }) =>
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
