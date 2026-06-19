import {
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import React from "react";
import { useForm } from "react-hook-form";
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

  return (
    <div className="grid grid-cols-1 gap-4">
      <FormField
        control={form.control}
        name="business_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Service Operational Model</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
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
    </div>
  );
};

export default BusinessType;
