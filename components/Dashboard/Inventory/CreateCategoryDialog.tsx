"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateCategory } from "@/services/inventory.service";

const categorySchema = z.object({
  name: z.string().min(2, "Category name is too short"),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

interface CreateCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateCategoryDialog = ({
  isOpen,
  onOpenChange,
}: CreateCategoryDialogProps) => {
  const queryClient = useQueryClient();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  });

  const { mutate, isPending } = useCreateCategory();

  const onSubmit = (values: CategoryFormValues) => {
    mutate(values, {
      onSuccess: () => {
        toast.success("Category created successfully");
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        form.reset();
        onOpenChange(false);
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to create category",
        );
      },
    });
  };

  //   const { mutate, isPending } = useMutation({
  //     mutationFn: async (values: CategoryFormValues) => {
  //       const res = await fetch("/api/services", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify(values),
  //       });
  //       if (!res.ok) {
  //         const error = await res.json();
  //         throw new Error(error.message || "Failed to create category");
  //       }
  //       return res.json();
  //     },
  //     onSuccess: () => {
  //       toast.success("Category created successfully");
  //       queryClient.invalidateQueries({ queryKey: ["categories"] });
  //       form.reset();
  //       onOpenChange(false);
  //     },
  //     onError: (error: Error) => {
  //       toast.error(error.message);
  //     },
  //   });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Home Cleaning"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Category"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCategoryDialog;
