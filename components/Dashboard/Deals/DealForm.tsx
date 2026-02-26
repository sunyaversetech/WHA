"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { z } from "zod";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCreateDeals } from "@/services/deal.service";
import { toast } from "sonner";

export const dealSchema = z.object({
  title: z.string().min(2, "Title is too short"),
  valid_till: z.date().min(1, "Date must be in the future"),
  deals_for: z.string().min(1, "Target audience is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  terms_for_the_deal: z.string().min(1, "Terms are required"),
  deal_code: z.string().toUpperCase().min(3, "Code must be 3+ characters"),
});

export type DealFormValues = z.infer<typeof dealSchema>;

export default function DealForm() {
  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: "",
      deals_for: "",
      description: "",
      terms_for_the_deal: "",
      deal_code: "",
    },
  });

  const { mutate } = useCreateDeals();
  function onSubmit(values: DealFormValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value as any);
    });
    mutate(formData as any, {
      onSuccess: () => {
        form.reset();
        toast("Deal created successfully");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to create deal");
      },
    });
  }

  return (
    <Form {...form}>
      <h1 className="text-2xl my-4">Create New Deal</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mx-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deal Title</FormLabel>
              <FormControl>
                <Input placeholder="Summer Flash Sale" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="deal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Promo Code</FormLabel>
                <FormControl>
                  <Input placeholder="SAVE50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valid_till"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="mb-1">Valid Until</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}>
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="deals_for"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Target Audience</FormLabel>
              <FormControl>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  onValueChange={(value) => {
                    if (value) field.onChange(value);
                  }}
                  value={field.value}
                  className="flex flex-wrap justify-start gap-2">
                  <ToggleGroupItem
                    value={"all"}
                    className={cn(
                      "!rounded-md !border border-input h-10 px-4",
                      "min-w-[100px] transition-all",
                      "hover:bg-accent hover:text-accent-foreground",
                      "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:opacity-100",
                      "first:rounded-md last:rounded-md",
                    )}>
                    All
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value={"to_wha_user"}
                    className={cn(
                      "!rounded-md !border border-input h-10 px-4",
                      "min-w-[100px] transition-all",
                      "hover:bg-accent hover:text-accent-foreground",
                      "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:opacity-100",
                      "first:rounded-md last:rounded-md",
                    )}>
                    To WHA Users
                  </ToggleGroupItem>
                </ToggleGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the deal details..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Terms */}
        <FormField
          control={form.control}
          name="terms_for_the_deal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Terms & Conditions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Usage limits, specific conditions..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Submitting..." : "Create Deal"}
        </Button>
      </form>
    </Form>
  );
}
