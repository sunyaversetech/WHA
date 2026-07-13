"use client";
import { Button } from "@/components/ui/button";
import {
  Form, // <-- 1. Import the Form container component
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
import { useUpdateBusinessType } from "@/services/business.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

interface BusinessType {
  business_type: string;
}

export const serviceSchema = z.object({
  business_type: z.string(),
});

const BusinessType = () => {
  const form = useForm<BusinessType>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { business_type: "employee_based" },
  });

  const { mutate } = useUpdateBusinessType();

  const onSubmit = async (data: BusinessType) => {
    mutate(data, {
      onSuccess: () => {
        window.location.reload();

        toast.success("Business type updated successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to update business type",
        );
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 ">
          <FormField
            control={form.control}
            name="business_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Operational Model</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="max-sm:max-w-60">
                      <SelectValue placeholder="Select how this service is fulfilled" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="employee_based">
                      Staff / Employee Based (e.g., Haircut, Massage,
                      Consulting)
                    </SelectItem>
                    <SelectItem value="item_based">
                      Item / Inventory Based (e.g., Kayak, Boat, Surfboard
                      rentals)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Determines whether customers reserve human staff time or
                  physical stock assets.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit">Save</Button>
      </form>
    </Form>
  );
};

export default BusinessType;
