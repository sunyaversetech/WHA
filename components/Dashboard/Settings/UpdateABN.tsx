"use client";

import { z } from "zod";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

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

import {
  useGetSingleDashboardBusiness,
  useUpadteABN,
} from "@/services/business.service";
import Loading from "@/app/businesses/loading";

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
  const { data: businessData, isLoading: isFetching } =
    useGetSingleDashboardBusiness(session?.user?.id || "");
  const { mutate: updateABN, isPending: isUpdating } = useUpadteABN();

  const form = useForm<ABNFormType>({
    resolver: zodResolver(abnFormSchema),
    defaultValues: {
      abn_number: "",
    },
  });

  useEffect(() => {
    if (businessData?.data?.abn_number) {
      form.reset({
        abn_number: businessData.data.abn_number,
      });
    }
  }, [businessData, form]);

  function onSubmit(values: ABNFormType) {
    updateABN(
      {
        abn_number: values.abn_number,
      },
      {
        onSuccess: () => {
          toast.success("ABN updated successfully");
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to update ABN");
        },
      },
    );
  }

  if (isFetching) return <Loading />;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-md p-6 border rounded-lg bg-card">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Business Identification</h3>
          <p className="text-sm text-muted-foreground">
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-blue-950 hover:bg-blue-900"
          disabled={isUpdating || !form.formState.isDirty}>
          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update ABN
        </Button>
      </form>
    </Form>
  );
}
