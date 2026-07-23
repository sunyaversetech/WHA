"use client";

import { z } from "zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";

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
import { Loader2 } from "lucide-react";

import { useGetSingleDashboardBusiness } from "@/services/business.service";
import { Skeleton } from "@/components/ui/skeleton";

export const abnFormSchema = z.object({
  abn_number: z
    .string()
    .min(11, "ABN must be 11 digits")
    .max(11, "ABN must be 11 digits")
    .regex(/^\d+$/, "ABN must contain only numbers"),
});

export type ABNFormType = z.infer<typeof abnFormSchema>;

export function ABNUpdateForm() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { data: businessData, isLoading: isFetching } =
    useGetSingleDashboardBusiness(session?.user?.id || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<ABNFormType>({
    resolver: zodResolver(abnFormSchema),
    defaultValues: { abn_number: "" },
  });

  useEffect(() => {
    if (businessData?.data?.abn_number) {
      form.reset({ abn_number: businessData.data.abn_number });
    }
  }, [businessData, form]);

  async function onSubmit(values: ABNFormType) {
    setIsUpdating(true);
    try {
      const fd = new FormData();
      fd.append("abn_number", values.abn_number);
      const res = await fetch("/api/business/settings", {
        method: "PATCH",
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("ABN updated successfully");
      queryClient.invalidateQueries({ queryKey: ["getbusiness", session?.user?.id] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update ABN");
    } finally {
      setIsUpdating(false);
    }
  }

  if (isFetching) return (
    <div className="space-y-4 max-w-md p-6 border rounded-2xl bg-white border-gray-200 shadow-sm">
      <div className="space-y-1">
        <Skeleton className="h-4 w-44 rounded" />
        <Skeleton className="h-3 w-64 rounded" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3.5 w-24 rounded" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-md p-6 border rounded-2xl bg-white border-gray-200 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[#051e3a]">
            Business Identification
          </h3>
          <p className="text-sm text-gray-500">
            Update your 11-digit Australian Business Number.
          </p>
        </div>

        <FormField
          control={form.control}
          name="abn_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ABN Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="12345678901"
                  {...field}
                  maxLength={11}
                  disabled={isUpdating}
                  className="border-gray-200 focus-visible:ring-0 focus-visible:border-[#051e3a] text-[#051e3a] placeholder:text-gray-400"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-[#051e3a] hover:bg-[#082040] text-white"
          disabled={isUpdating || !form.formState.isDirty}>
          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update ABN
        </Button>
      </form>
    </Form>
  );
}
