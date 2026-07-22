"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useGetSingleDashboardBusiness } from "@/services/business.service";
import { Skeleton } from "@/components/ui/skeleton";

export const serviceSchema = z.object({
  business_type: z.string().min(1, "Please select a booking model"),
});

type BusinessTypeForm = z.infer<typeof serviceSchema>;

const BusinessType = () => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { data: bizData, isLoading } = useGetSingleDashboardBusiness(
    session?.user?.id || "",
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<BusinessTypeForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { business_type: "employee_based" },
  });

  useEffect(() => {
    const bt = (bizData?.data as any)?.business_type;
    if (bt) form.reset({ business_type: bt });
  }, [bizData, form]);

  const onSubmit = async (data: BusinessTypeForm) => {
    setIsUpdating(true);
    try {
      const fd = new FormData();
      fd.append("business_type", data.business_type);
      const res = await fetch("/api/business/settings", {
        method: "PATCH",
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Booking model updated successfully");
      queryClient.invalidateQueries({ queryKey: ["getbusiness", session?.user?.id] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update booking model");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Skeleton className="h-3.5 w-48 rounded" />
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-3 w-72 rounded" />
      </div>
      <Skeleton className="h-9 w-16 rounded-md" />
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="business_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Operational Model</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="max-sm:max-w-60">
                    <SelectValue placeholder="Select how this service is fulfilled" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="employee_based">
                    Staff / Employee Based (e.g., Haircut, Massage, Consulting)
                  </SelectItem>
                  <SelectItem value="item_based">
                    Item / Inventory Based (e.g., Kayak, Boat, Surfboard rentals)
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Determines whether customers reserve human staff time or physical
                stock assets.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={isUpdating || !form.formState.isDirty}
          className="bg-[#051e3a] hover:bg-[#082040] text-white">
          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </form>
    </Form>
  );
};

export default BusinessType;
