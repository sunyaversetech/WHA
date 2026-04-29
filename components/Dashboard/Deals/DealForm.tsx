"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, X } from "lucide-react";
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
import Image from "next/image";

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
  image: z
    .any()
    .refine((file) => file?.size <= 3000000, `Max image size is 3MB.`)
    .refine(
      (file) => ["image/jpeg", "image/png", "image/webp"].includes(file?.type),
      "Only .jpg, .png and .webp formats are supported.",
    ),
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
    const formData = new FormData();

    formData.append("title", values.title);
    formData.append("valid_till", values.valid_till.toISOString());
    formData.append("description", values.description);
    formData.append("terms_for_the_deal", values.terms_for_the_deal);
    formData.append("category", values.category);
    formData.append("max_redemptions", values.max_redemptions.toString());
    formData.append("city", values.city);

    if (values.image) {
      formData.append("image", values.image);
    }

    mutate(formData as any, {
      onSuccess: () => {
        form.reset();
        toast.success("Deal created successfully");
        router.push("/dashboard/deals");
      },
      onError: (error: any) => {
        console.error("API Error:", error);
        toast.error(error.response?.data?.error || "Failed to create deal");
      },
    });
  }

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
            name="image"
            render={({ field: { value, onChange, ...fieldProps } }) => (
              <FormItem>
                <FormLabel>Deal Image</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {!value && (
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) onChange(file);
                        }}
                        {...fieldProps}
                      />
                    )}

                    {value && (
                      <div className="relative w-fit group">
                        <div className="relative h-40 w-40 overflow-hidden rounded-lg border">
                          <Image
                            width={1000}
                            height={1000}
                            src={
                              typeof value === "string"
                                ? value
                                : URL.createObjectURL(value)
                            }
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => onChange(null)}
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-md transition-transform hover:scale-110 active:scale-95">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
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
