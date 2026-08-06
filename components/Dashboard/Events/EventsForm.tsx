"use client";

import * as z from "zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { CalendarIcon, Plus, Trash2, Check } from "lucide-react";
import { useCreateEvent, useGetSingleForForm } from "@/services/event.service";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import MapPicker from "./LeafLetIntegration";
import { ChevronLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const toggleItemStyles =
  "border! rounded-lg! px-7! py-2! data-[state=on]:bg-primary! min-w-fit data-[state=on]:text-primary-foreground! w-full  flex-1";

export const eventSchema = z
  .object({
    _id: z.string().optional(),
    title: z
      .string()
      .min(2, "Title is required")
      .regex(/^[a-zA-Z0-9\s]+$/, "Special characters are not allowed"),
    image: z.union([
      z.string().min(1, "Event image is required"),
      z
        .any()
        .refine(
          (file) => file instanceof File,
          "Image must be either a string or a file",
        ),
    ]),
    venue: z.string().optional(),
    dateRange: z.object({
      from: z.date().optional(),
      to: z.date().optional(),
    }),
    email: z.email("Invalid email address").optional().or(z.literal("")),
    phone_number: z.string().optional().or(z.literal("")),
    website_link: z.union([z.string(), z.literal("")]).optional(),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().optional(),
    category: z.string().min(1, "Category is required"),
    category_name: z.string().optional(),
    price_category: z.enum(["free", "paid", "registration"]),
    ticket_link: z.string().optional(),
    options: z
      .array(
        z.object({
          _id: z.string().optional(),
          name: z.string().optional(),
          release_date: z.string().optional().nullable(),
          price: z.string().optional().nullable(),
          capacity: z.string().optional().nullable(),
          promo_code: z.string().optional().nullable(),
          discount_percentage: z.string().optional().nullable(),
        }),
      )
      .max(3, "You can add up to 3 options")
      .optional(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    location_tba: z.boolean().optional(),
    location: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    slug: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.location_tba) {
      if (!data.location || data.location.trim().length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Location is required",
          path: ["location"],
        });
      }
      if (!data.venue || data.venue.trim().length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Venue is required",
          path: ["venue"],
        });
      }
    }

    if (data.price_category === "paid") {
      const hasCompleteOption = (data.options ?? []).some(
        (opt) => opt.name && opt.release_date && opt.price && opt.capacity,
      );
      if (!hasCompleteOption) {
        ctx.addIssue({
          code: "custom",
          message:
            "Add at least one complete ticket option (name, release date, price, capacity)",
          path: ["options"],
        });
      }
    }
  });

export type EventFormValues = z.infer<typeof eventSchema>;

const EMPTY_OPTION = {
  name: "",
  release_date: "",
  price: "",
  capacity: "",
  promo_code: "",
  discount_percentage: "",
};

const STEPS: { n: 1 | 2 | 3 | 4; label: string }[] = [
  { n: 1, label: "Basic Info" },
  { n: 2, label: "Date & Location" },
  { n: 3, label: "Host Details" },
  { n: 4, label: "Pricing" },
];

const STEP_FIELDS: Record<number, (keyof EventFormValues)[]> = {
  1: ["title", "image", "category", "category_name", "description"],
  2: [
    "dateRange",
    "startTime",
    "endTime",
    "venue",
    "location_tba",
    "location",
    "latitude",
    "longitude",
  ],
  3: ["email", "phone_number", "website_link"],
  4: ["price_category", "options"],
};

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center w-full">
      {STEPS.map((s, i) => (
        <div
          key={s.n}
          className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition",
                step === s.n
                  ? "bg-primary border-primary text-primary-foreground"
                  : step > s.n
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-white border-gray-300 text-gray-400",
              )}>
              {step > s.n ? <Check className="w-4 h-4" /> : s.n}
            </div>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap",
                step === s.n ? "text-primary" : "text-gray-400",
              )}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "flex-1 h-0.5 mx-2 mb-4",
                step > s.n ? "bg-emerald-500" : "bg-gray-200",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function EventForm() {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useCreateEvent();
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const { data: singleEventData } = useGetSingleForForm(id as string);

  const data = singleEventData?.data;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      _id: data ? data?._id : "",
      title: data ? data?.title : "",
      venue: data?.venue ?? "",
      startTime: data?.startTime ?? "",
      endTime: data?.endTime ?? "",
      image: data ? data?.image : "",
      description: data?.description ?? "",
      location_tba: data?.location_tba ?? false,
      location: data?.location ?? "",
      latitude: data?.latitude ?? 0,
      longitude: data?.longitude ?? 0,
      category: data?.category ?? "",
      category_name: data?.category_name ?? "",
      ticket_link: data?.ticket_link ?? "",
      options:
        data?.options && data.options.length > 0
          ? data.options.map((opt: any) => ({
              _id: opt._id,
              name: opt.name ?? "",
              release_date: opt.release_date
                ? String(opt.release_date).split("T")[0]
                : "",
              price: opt.price != null ? String(opt.price) : "",
              capacity: opt.capacity != null ? String(opt.capacity) : "",
              promo_code: opt.promo_code ?? "",
              discount_percentage:
                opt.discount_percentage != null
                  ? String(opt.discount_percentage)
                  : "",
            }))
          : [EMPTY_OPTION],
      email: data?.email ?? "",
      phone_number: data?.phone_number ? String(data?.phone_number) : "",
      website_link: data?.website_link ?? "",
    },
  });

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control: form.control,
    name: "options",
  });

  useEffect(() => {
    if (data) {
      form.setValue("_id", data._id);
      form.setValue("title", data.title);
      form.setValue("venue", data.venue);
      form.setValue("startTime", data.startTime);
      form.setValue("endTime", data.endTime);
      if (data?.dateRange?.from || data?.dateRange?.to) {
        form.setValue("dateRange", {
          from: data.dateRange.from ? new Date(data.dateRange.from) : undefined,
          to: data.dateRange.to ? new Date(data.dateRange.to) : undefined,
        });
      }
      form.setValue("description", data.description);
      form.setValue("location_tba", (data as any).location_tba ?? false);
      form.setValue("location", data.location);
      form.setValue("latitude", data.latitude);
      form.setValue("longitude", data.longitude);
      form.setValue("category", data.category);
      form.setValue("category_name", data.category_name);
      form.setValue("price_category", data.price_category);
      form.setValue("ticket_link", data.ticket_link ?? "");
      if (data?.options && data.options.length > 0) {
        form.setValue(
          "options",
          data.options.map((opt: any) => ({
            _id: opt._id,
            name: opt.name ?? "",
            release_date: opt.release_date
              ? String(opt.release_date).split("T")[0]
              : "",
            price: opt.price != null ? String(opt.price) : "",
            capacity: opt.capacity != null ? String(opt.capacity) : "",
            promo_code: opt.promo_code ?? "",
            discount_percentage:
              opt.discount_percentage != null
                ? String(opt.discount_percentage)
                : "",
          })),
        );
      }
      if (data?.email) form.setValue("email", data.email);
      if (data?.phone_number) form.setValue("phone_number", data.phone_number);
      if (data?.website_link) form.setValue("website_link", data.website_link);
      form.setValue("image", data.image);
    }
  }, [data, form]);

  const handleNext = async () => {
    const valid = await form.trigger(STEP_FIELDS[step] as any);
    if (valid) setStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : s));
  };

  const handleBack = () => {
    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s));
  };

  const onSubmit = (values: EventFormValues) => {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) {
        formData.append(key, "");
        return;
      }

      if (key === "dateRange" && value) {
        const cleanedRange = {
          from:
            value.from instanceof Date
              ? format(value.from, "yyyy-MM-dd")
              : value.from.split("T")[0],
          to:
            value.to instanceof Date
              ? format(value.to, "yyyy-MM-dd")
              : value.to.split("T")[0],
        };
        formData.append(key, JSON.stringify(cleanedRange));
      } else if (key === "options" && Array.isArray(value)) {
        const cleanedOptions = value.filter(
          (opt: any) =>
            opt.name ||
            opt.price ||
            opt.capacity ||
            opt.promo_code ||
            opt.release_date ||
            opt.discount_percentage,
        );
        formData.append(key, JSON.stringify(cleanedOptions));
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

  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form's watch() isn't safely memoizable by the React Compiler
  const watchedPriceCategory = form.watch("price_category");
  const watchedOptions = form.watch("options");
  const hasCompleteTicketOption =
    watchedPriceCategory !== "paid" ||
    (watchedOptions ?? []).some(
      (opt) => opt?.name && opt?.release_date && opt?.price && opt?.capacity,
    );

  return (
    <div className="flex-1 h-auto overflow-y-auto mb-20">
      <Form {...form}>
        <div className="space-y-6 max-w-6xl mx-auto h-full ">
          <div className="flex items-start justify-start ">
            <ChevronLeft
              onClick={() => router.back()}
              className="h-10 w-10 cursor-pointer rounded-full  p-1 -ml-2
               text-[#ODODOD]
               transition-all hover:scale-105 active:scale-95"
            />
          </div>
          <h1 className="text-2xl text-[#ODODOD] font-bold mb-4 ">
            {data ? "Edit event" : "Add new event"}{" "}
          </h1>

          <StepIndicator step={step} />

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 py-4">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 items-start space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Event Name"
                            {...field}
                            onChange={(e) => {
                              const rawValue = e.target.value;

                              const hasSpecialChars = /[^a-zA-Z0-9\s]/.test(
                                rawValue,
                              );
                              if (hasSpecialChars) {
                                form.setError("title", {
                                  type: "manual",
                                  message: "Special characters are not allowed",
                                });
                              } else {
                                form.clearErrors("title");
                              }
                              field.onChange(rawValue);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-col">
                    <FormField
                      control={form.control}
                      name="image"
                      render={({
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- value excluded so it isn't spread onto the file input
                        field: { value, onChange, ...fieldProps },
                      }) => (
                        <FormItem>
                          <FormLabel>Event Image</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
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
                            "Concert",
                            "Festival",
                            "Educational Seminar",
                            "Cultural Event",
                            "Food Event",
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
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 items-start space-y-4">
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
                              selected={field.value as any}
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
                          <Input
                            type="time"
                            className="rounded-lg"
                            {...field}
                          />
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
                          <Input
                            type="time"
                            className="rounded-lg"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location_tba"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <ToggleGroup
                          type="single"
                          value={field.value ? "tba" : "set"}
                          onValueChange={(val) =>
                            val && field.onChange(val === "tba")
                          }
                          className="flex w-full gap-2">
                          <ToggleGroupItem
                            value="set"
                            className={toggleItemStyles}>
                            Set Location
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="tba"
                            className={toggleItemStyles}>
                            To Be Announced
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!form.watch("location_tba") && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                    <FormField
                      control={form.control}
                      name="venue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Venue</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Grand Ballroom"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <Label className="mb-2">Pick Location</Label>
                      <MapPicker form={form} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                <h2 className="text-lg font-bold text-[#ODODOD]">
                  Host Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 items-start space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. hello@gmail.com"
                            {...field}
                          />
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
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
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
                          <ToggleGroupItem
                            value="free"
                            className={toggleItemStyles}>
                            Free
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="paid"
                            className={toggleItemStyles}>
                            Paid
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="registration"
                            className={toggleItemStyles}>
                            Free With Registration
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("price_category") === "paid" && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center justify-between">
                      <FormLabel>Ticket Options</FormLabel>
                      {optionFields.length < 3 && (
                        <button
                          type="button"
                          onClick={() => appendOption(EMPTY_OPTION)}
                          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                          <Plus className="h-4 w-4" />
                          Add Option
                        </button>
                      )}
                    </div>

                    {optionFields.map((optionField, index) => (
                      <div
                        key={optionField.id}
                        className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 border rounded-lg p-4">
                        {optionFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="absolute top-3 right-3 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}

                        <FormField
                          name={`options.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Early Bird"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          name={`options.${index}.release_date`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Release Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          name={`options.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          name={`options.${index}.capacity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Capacity</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="1"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          name={`options.${index}.promo_code`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Promo Code</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. EARLYBIRD10"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          name={`options.${index}.discount_percentage`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Discount Percentage</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="1"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}

                    {form.formState.errors.options && (
                      <p className="text-sm font-medium text-destructive">
                        {(form.formState.errors.options as any)?.message ??
                          (form.formState.errors.options as any)?.root?.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-12 text-lg rounded-lg">
                  Back
                </Button>
              )}
              {step < 4 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 h-12 text-lg rounded-lg">
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="flex-1 h-12 text-lg rounded-lg"
                  disabled={
                    isPending ||
                    !form.formState.isDirty ||
                    !hasCompleteTicketOption
                  }>
                  {isPending
                    ? "Saving Event..."
                    : data
                      ? "Update Event"
                      : "Create Event"}
                </Button>
              )}
            </div>
          </form>
        </div>
      </Form>
    </div>
  );
}
