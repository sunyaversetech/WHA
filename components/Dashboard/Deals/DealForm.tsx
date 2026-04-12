"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft } from "lucide-react";
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
import { useRouter } from "next/navigation";

const toggleItemStyles =
  "border! rounded-lg! px-7! py-2! data-[state=on]:bg-primary! min-w-fit data-[state=on]:text-primary-foreground! w-full  flex-1";

export const dealSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(2, "Title is too short"),
  valid_till: z.date().min(1, "Date must be in the future"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  terms_for_the_deal: z.string().min(1, "Terms are required"),
  max_redemptions: z.number().min(1, "Max redemptions is required"),
  category: z.string().min(1, "Category is required"),
  city: z.string().min(1, "City is required"),
});

export type DealFormValues = z.infer<typeof dealSchema>;

export default function DealForm() {
  const router = useRouter();
  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: "",
      description: "",
      terms_for_the_deal: "",
      category: "",
      city: "",
    },
  });

  const { mutate, isPending } = useCreateDeals();
  function onSubmit(values: DealFormValues) {
    mutate(values as any, {
      onSuccess: () => {
        form.reset();
        toast("Deal created successfully");
        router.push("/dashboard/deals");
      },
      onError: (error: any) => {
        console.error("API Error Details:", error);
        toast.error(error.response?.data?.message || "Failed to create deal");
      },
    });
  }

  console.log(form.formState.errors);

  return (
    <Form {...form}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-start justify-start">
          <ChevronLeft
            onClick={() => router.back()}
            className="h-10 w-10 cursor-pointer rounded-full  p-1 -ml-2
               text-[#ODODOD] 
               transition-all hover:scale-105 active:scale-95"
          />
        </div>
        <h1 className="text-2xl my-4">Create New Deal</h1>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 ">
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
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <ToggleGroup
                    type="single"
                    value={field.value}
                    onValueChange={(val) => val && field.onChange(val)}
                    className="flex flex-wrap gap-4">
                    {[
                      "Sydney",
                      "Canberra",
                      // "Melbourne",
                      // "Brisbane",
                      // "Adelaide",
                      // "Gold Coast",
                      // "Perth",
                      // "Hobart",
                      // "Darwin",
                      "others",
                    ].map((cat) => (
                      <ToggleGroupItem
                        key={cat}
                        value={cat}
                        className={toggleItemStyles}>
                        {cat}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <ToggleGroup
                    type="single"
                    value={field.value}
                    onValueChange={(val) => val && field.onChange(val)}
                    className="flex flex-wrap gap-4">
                    {[
                      "Groceries",
                      "Shopping",
                      "Restaurant",
                      "Fashion",
                      "Events",
                      "Others",
                    ].map((cat) => (
                      <ToggleGroupItem
                        key={cat}
                        value={cat}
                        className={toggleItemStyles}>
                        {cat}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_redemptions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>MAX Redemption</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="How Many People can redeem it?"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
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

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Submitting..." : "Create Deal"}
          </Button>
        </form>
      </div>
    </Form>
  );
}
