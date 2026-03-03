"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useCreateEvent, useGetSingleEvent } from "@/services/event.service";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import MapPicker from "./LeafLetIntegration";
import { ChevronLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

const toggleItemStyles =
  "border! rounded-lg! px-7! py-2! data-[state=on]:bg-primary! min-w-fit data-[state=on]:text-primary-foreground! w-full  flex-1";

export const eventSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(2, "Title is required"),
  image: z.union([
    z.string(),
    z
      .any()
      .refine(
        (file) => file instanceof File,
        "Image must be either a string or a file",
      ),
  ]),
  venue: z.string().min(2, "Venue is required"),
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
  email: z.email().min(1, "Email is required"),
  phone_number: z.number().min(1, "Phone number is required"),
  website_link: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  category: z.string().min(1, "Category is required"),
  category_name: z.string().optional(),
  price_category: z.enum(["free", "paid"]),
  ticket_link: z.string().optional(),
  ticket_price: z.string().optional(),
  community: z.string().min(1, "Community is required"),
  community_name: z.string().optional(),
  city: z.string().min(2, "City is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(2, "Location is required"),
  latitude: z.number(),
  longitude: z.number(),
});

export type EventFormValues = z.infer<typeof eventSchema>;

export function EventForm() {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useCreateEvent();
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const { data: singleEventData } = useGetSingleEvent(id as string);

  const data = singleEventData?.data;

  console.log("singleeventdata", data);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      _id: data ? data?._id : "",
      title: data ? data?.title : "",
      venue: data?.venue ?? "",
      startTime: data?.startTime ?? "",
      endTime: data?.endTime ?? "",
      image: data ? data?.image : "",
      community: data?.community ?? "",
      city: data?.city ?? "",
      description: data?.description ?? "",
      location: data?.location ?? "",
      dateRange: data?.dateRange ?? { from: new Date(), to: new Date() },
      latitude: data?.latitude ?? 0,
      longitude: data?.longitude ?? 0,
      category: data?.category ?? "",
      category_name: data?.category_name ?? "",
      ticket_link: data?.ticket_link ?? "",
      ticket_price: data?.ticket_price ?? "",
      email: data?.email ?? "",
      phone_number: Number(data?.phone_number) ?? undefined,
      website_link: data?.website_link ?? "",
    },
  });

  useEffect(() => {
    if (data) {
      form.setValue("_id", data._id);
      form.setValue("title", data.title);
      form.setValue("venue", data.venue);
      form.setValue("startTime", data.startTime);
      form.setValue("endTime", data.endTime);
      if (data?.dateRange?.from) {
        form.setValue("dateRange.from", data.dateRange.from);
      }
      if (data?.dateRange?.to) {
        form.setValue("dateRange.to", data.dateRange.to);
      }
      form.setValue("community", data.community);
      form.setValue("city", data.city);
      form.setValue("description", data.description);
      form.setValue("location", data.location);
      form.setValue("latitude", data.latitude);
      form.setValue("longitude", data.longitude);
      form.setValue("category", data.category);
      form.setValue("category_name", data.category_name);
      form.setValue("price_category", data.price_category);
      form.setValue("ticket_link", data.ticket_link ?? "");
      form.setValue("ticket_price", data.ticket_price ?? "");
      form.setValue("email", data.email);
      form.setValue("phone_number", Number(data.phone_number));
      form.setValue("website_link", data.website_link);
      form.setValue("image", data.image);
    }
  }, [data, form]);

  const onSubmit = (values: EventFormValues) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key === "dateRange" && value) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value as any);
      }
    });

    mutate(formData as any, {
      onSuccess: () => {
        toast.success(
          formData.get("_id")
            ? "Event updated successfully"
            : "Event created successfully!",
        );
        queryClient.invalidateQueries({ queryKey: ["event"] });
        router.push("/dashboard/events");
        form.reset();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to create event");
      },
    });
  };

  console.log("Form", form.getValues());
  console.log("Form", form.formState.errors);

  return (
    <Form {...form}>
      <div className="px-10">
        <div className="flex items-start justify-start p-4 -ml-4">
          <ChevronLeft
            onClick={() => router.back()}
            className="h-8 w-8 cursor-pointer rounded-md border bg-white p-1.5 
               text-[#ODODOD] 
               transition-all hover:scale-105 active:scale-95"
          />
        </div>
        <h1 className="text-2xl text-[#ODODOD] font-bold mb-4 ">
          {data ? "Edit Event" : "Add New Event"}{" "}
        </h1>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 items-start space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Event Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col">
              <FormField
                control={form.control}
                name="image"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Event Image</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        // Resetting value to empty string allows re-selecting the same file
                        onChange={(e) => onChange(e.target.files?.[0])}
                        {...fieldProps}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("image") && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 border rounded-md bg-transparent border-slate-200 w-fit max-w-[250px]">
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:underline truncate cursor-pointer"
                      onClick={() => {
                        const file = form.getValues("image");
                        const url =
                          typeof file === "string"
                            ? file
                            : URL.createObjectURL(file);
                        window.open(url, "_blank");
                      }}>
                      {typeof form.watch("image") === "string"
                        ? form.watch("image").split("/").pop()
                        : form.watch("image")?.name}
                    </button>

                    <button
                      type="button"
                      onClick={() => form.setValue("image", undefined)}
                      className="flex-shrink-0 ml-1 text-slate-400 hover:text-red-500 transition-colors">
                      <span className="text-lg font-bold leading-none">
                        &times;
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Grand Ballroom" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. hello@gmail.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. +61 234 567 890"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      type="number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website Link</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>From and to Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start border rounded-lg">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value?.from ? (
                          field.value.to ? (
                            `${format(field.value.from, "PP")} - ${format(field.value.to, "PP")}`
                          ) : (
                            format(field.value.from, "PP")
                          )
                        ) : (
                          <span>Pick Dates</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={field.value}
                        onSelect={field.onChange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem className="mt-1 gap-1 flex flex-col">
                  <FormLabel>Time From</FormLabel>
                  <FormControl>
                    <Input type="time" className="rounded-lg" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem className="mt-1 gap-1 flex flex-col">
                  <FormLabel>Time To</FormLabel>
                  <FormControl>
                    <Input type="time" className="rounded-lg" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

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
                    className="flex flex-wrap w-full gap-2">
                    {[
                      "Community",
                      "Festival",
                      "Cultural Event",
                      "Event",
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

          {form.watch("category") === "Others" && (
            <FormField
              control={form.control}
              name="category_name"
              render={({ field }) => (
                <FormItem className="mt-1 gap-1 flex flex-col">
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="price_category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price Category</FormLabel>
                <FormControl>
                  <ToggleGroup
                    type="single"
                    value={field.value}
                    onValueChange={(val) => val && field.onChange(val)}
                    className="flex w-full gap-2">
                    <ToggleGroupItem value="free" className={toggleItemStyles}>
                      Free
                    </ToggleGroupItem>
                    <ToggleGroupItem value="paid" className={toggleItemStyles}>
                      Paid
                    </ToggleGroupItem>
                  </ToggleGroup>
                </FormControl>
              </FormItem>
            )}
          />

          {form.watch("price_category") === "paid" && (
            <div className="grid grid-cols-2  gap-4 animate-in fade-in slide-in-from-top-1">
              <FormField
                name="ticket_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                name="ticket_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticket Link</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}

          <FormField
            control={form.control}
            name="community"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Community</FormLabel>
                <FormControl>
                  <ToggleGroup
                    type="single"
                    value={field.value}
                    onValueChange={(val) => val && field.onChange(val)}
                    className="flex flex-wrap gap-2">
                    {[
                      "Australian",
                      "Nepali",
                      "Indian",
                      "Bhutanese",
                      "European",
                      "Others",
                    ].map((com) => (
                      <ToggleGroupItem
                        key={com}
                        value={com}
                        className={toggleItemStyles}>
                        {com}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </FormControl>
              </FormItem>
            )}
          />

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
                      "Melbourne",
                      "Brisbane",
                      "Adelaide",
                      "Gold Coast",
                      "Perth",
                      "Hobart",
                      "Darwin",
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea className="rounded-lg" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <MapPicker form={form} />

          <Button
            type="submit"
            className="w-full h-12 text-lg rounded-lg"
            disabled={isPending}>
            {isPending
              ? "Saving Event..."
              : data
                ? "Update Event"
                : "Create Event"}
          </Button>
        </form>
      </div>
    </Form>
  );
}
