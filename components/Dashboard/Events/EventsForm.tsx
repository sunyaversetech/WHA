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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  CalendarIcon,
  Plus,
  Trash2,
  FileText,
  MapPin,
  Ticket,
  Tag,
  User,
  Settings as SettingsIcon,
  ChevronLeft,
} from "lucide-react";
import { useCreateEvent, useGetSingleForForm } from "@/services/event.service";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import MapPicker from "./LeafLetIntegration";
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
        )
        .refine(
          (file) => !(file instanceof File) || file.size <= 3 * 1024 * 1024,
          "Image must be less than 3MB",
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
    price_category: z.enum(["registration", "paid", "external"]),
    ticket_link: z.string().optional(),
    registration_capacity: z.string().optional().nullable(),
    max_tickets_per_request: z.string().optional().nullable(),
    show_remaining_tickets: z.boolean().optional(),
    options: z
      .array(
        z.object({
          _id: z.string().optional(),
          name: z.string().optional(),
          release_date: z.string().optional().nullable(),
          close_date: z.string().optional().nullable(),
          price: z.string().optional().nullable(),
          capacity: z.string().optional().nullable(),
        }),
      )
      .max(5, "You can add up to 5 options")
      .optional(),
    promo_codes: z
      .array(
        z.object({
          _id: z.string().optional(),
          code: z.string().optional(),
          discount_percentage: z.string().optional().nullable(),
          limit: z.string().optional().nullable(),
          applicable_options: z.array(z.string()).optional(),
        }),
      )
      .max(5, "You can add up to 5 promo codes")
      .optional(),
    event_rules: z.string().optional(),
    refund_policy: z.string().optional(),
    host_name: z.string().optional(),
    support_details: z.string().optional(),
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

    if (data.price_category === "external") {
      if (!data.ticket_link || data.ticket_link.trim().length < 3) {
        ctx.addIssue({
          code: "custom",
          message: "Ticket link is required for external ticketing",
          path: ["ticket_link"],
        });
      }
    }
  });

export type EventFormValues = z.infer<typeof eventSchema>;

const EMPTY_OPTION = {
  name: "",
  release_date: "",
  close_date: "",
  price: "",
  capacity: "",
};

const EMPTY_PROMO_CODE = {
  code: "",
  discount_percentage: "",
  limit: "",
  applicable_options: [] as string[],
};

type SectionKey =
  | "basic"
  | "location"
  | "pricing"
  | "promo"
  | "host"
  | "settings";

const SECTIONS: { key: SectionKey; label: string; icon: React.ElementType }[] =
  [
    { key: "basic", label: "Basic Info", icon: FileText },
    { key: "location", label: "Date & Location", icon: MapPin },
    { key: "pricing", label: "Pricing", icon: Ticket },
    { key: "promo", label: "Promo Code", icon: Tag },
    { key: "host", label: "Host Details", icon: User },
    { key: "settings", label: "Settings", icon: SettingsIcon },
  ];

const SECTION_FIELDS: Record<SectionKey, string[]> = {
  basic: [
    "title",
    "image",
    "category",
    "category_name",
    "description",
    "event_rules",
    "refund_policy",
  ],
  location: [
    "dateRange",
    "startTime",
    "endTime",
    "venue",
    "location_tba",
    "location",
    "latitude",
    "longitude",
  ],
  pricing: [
    "price_category",
    "options",
    "registration_capacity",
    "ticket_link",
  ],
  promo: ["promo_codes"],
  host: [
    "email",
    "phone_number",
    "website_link",
    "host_name",
    "support_details",
  ],
  settings: ["max_tickets_per_request", "show_remaining_tickets"],
};

export function EventForm() {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useCreateEvent();
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const { data: singleEventData } = useGetSingleForForm(id as string);

  const data = singleEventData?.data;

  const [section, setSection] = useState<SectionKey>("basic");

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
      event_rules: (data as any)?.event_rules ?? "",
      refund_policy: (data as any)?.refund_policy ?? "",
      host_name: (data as any)?.host_name ?? "",
      support_details: (data as any)?.support_details ?? "",
      location_tba: data?.location_tba ?? false,
      location: data?.location ?? "",
      latitude: data?.latitude ?? 0,
      longitude: data?.longitude ?? 0,
      category: data?.category ?? "",
      category_name: data?.category_name ?? "",
      price_category: (data?.price_category as any) ?? "paid",
      ticket_link: data?.ticket_link ?? "",
      registration_capacity:
        data?.registration_capacity != null
          ? String(data.registration_capacity)
          : "",
      max_tickets_per_request:
        data?.max_tickets_per_request != null
          ? String(data.max_tickets_per_request)
          : "10",
      show_remaining_tickets: data?.show_remaining_tickets ?? true,
      options:
        data?.options && data.options.length > 0
          ? data.options.map((opt: any) => ({
              _id: opt._id,
              name: opt.name ?? "",
              release_date: opt.release_date
                ? String(opt.release_date).split("T")[0]
                : "",
              close_date: opt.close_date
                ? String(opt.close_date).split("T")[0]
                : "",
              price: opt.price != null ? String(opt.price) : "",
              capacity: opt.capacity != null ? String(opt.capacity) : "",
            }))
          : [EMPTY_OPTION],
      promo_codes:
        (data as any)?.promo_codes && (data as any).promo_codes.length > 0
          ? (data as any).promo_codes.map((promo: any) => ({
              _id: promo._id,
              code: promo.code ?? "",
              discount_percentage:
                promo.discount_percentage != null
                  ? String(promo.discount_percentage)
                  : "",
              limit: promo.limit != null ? String(promo.limit) : "",
              applicable_options: promo.applicable_options ?? [],
            }))
          : [],
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

  const {
    fields: promoFields,
    append: appendPromo,
    remove: removePromo,
  } = useFieldArray({
    control: form.control,
    name: "promo_codes",
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
      form.setValue("event_rules", (data as any).event_rules ?? "");
      form.setValue("refund_policy", (data as any).refund_policy ?? "");
      form.setValue("host_name", (data as any).host_name ?? "");
      form.setValue("support_details", (data as any).support_details ?? "");
      form.setValue("location_tba", (data as any).location_tba ?? false);
      form.setValue("location", data.location);
      form.setValue("latitude", data.latitude);
      form.setValue("longitude", data.longitude);
      form.setValue("category", data.category);
      form.setValue("category_name", data.category_name);
      form.setValue("price_category", data.price_category as any);
      form.setValue("ticket_link", data.ticket_link ?? "");
      form.setValue(
        "registration_capacity",
        data.registration_capacity != null
          ? String(data.registration_capacity)
          : "",
      );
      form.setValue(
        "max_tickets_per_request",
        data.max_tickets_per_request != null
          ? String(data.max_tickets_per_request)
          : "10",
      );
      form.setValue(
        "show_remaining_tickets",
        data.show_remaining_tickets ?? true,
      );
      if (data?.options && data.options.length > 0) {
        form.setValue(
          "options",
          data.options.map((opt: any) => ({
            _id: opt._id,
            name: opt.name ?? "",
            release_date: opt.release_date
              ? String(opt.release_date).split("T")[0]
              : "",
            close_date: opt.close_date
              ? String(opt.close_date).split("T")[0]
              : "",
            price: opt.price != null ? String(opt.price) : "",
            capacity: opt.capacity != null ? String(opt.capacity) : "",
          })),
        );
      }
      if ((data as any)?.promo_codes && (data as any).promo_codes.length > 0) {
        form.setValue(
          "promo_codes",
          (data as any).promo_codes.map((promo: any) => ({
            _id: promo._id,
            code: promo.code ?? "",
            discount_percentage:
              promo.discount_percentage != null
                ? String(promo.discount_percentage)
                : "",
            limit: promo.limit != null ? String(promo.limit) : "",
            applicable_options: promo.applicable_options ?? [],
          })),
        );
      }
      if (data?.email) form.setValue("email", data.email);
      if (data?.phone_number) form.setValue("phone_number", data.phone_number);
      if (data?.website_link) form.setValue("website_link", data.website_link);
      form.setValue("image", data.image);
    }
  }, [data, form]);

  const onSubmit = (values: EventFormValues) => {
    if (data?.dateRange?.to && values.dateRange?.to) {
      const newTo =
        values.dateRange.to instanceof Date
          ? values.dateRange.to
          : new Date(values.dateRange.to);
      const currentTo = new Date(data.dateRange.to);
      if (
        !isNaN(newTo.getTime()) &&
        !isNaN(currentTo.getTime()) &&
        newTo.getTime() < currentTo.getTime()
      ) {
        const message =
          "End date cannot be earlier than the event's current end date.";
        form.setError("dateRange", { type: "manual", message });
        setSection("location");
        toast.error(message);
        return;
      }
    }

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
            opt.release_date ||
            opt.close_date,
        );
        formData.append(key, JSON.stringify(cleanedOptions));
      } else if (key === "promo_codes" && Array.isArray(value)) {
        const cleanedPromoCodes = value.filter(
          (promo: any) =>
            promo.code || promo.discount_percentage || promo.limit,
        );
        formData.append(key, JSON.stringify(cleanedPromoCodes));
      } else if (key === "show_remaining_tickets") {
        formData.append(key, value ? "true" : "false");
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

  const onInvalid = (errors: any) => {
    const erroredFields = Object.keys(errors);
    const firstSection = SECTIONS.find((s) =>
      SECTION_FIELDS[s.key].some((f) => erroredFields.includes(f)),
    );
    if (firstSection) setSection(firstSection.key);
    toast.error("Please fix the highlighted errors before saving.");
  };

  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form's watch() isn't safely memoizable by the React Compiler
  const watchedPriceCategory = form.watch("price_category");
  const watchedOptions = form.watch("options");
  const namedOptions = (watchedOptions ?? []).filter((opt) => opt?.name);
  const hasCompleteTicketOption =
    watchedPriceCategory !== "paid" ||
    (watchedOptions ?? []).some(
      (opt) => opt?.name && opt?.release_date && opt?.price && opt?.capacity,
    );

  return (
    <div className="flex-1 h-auto overflow-y-auto mb-20">
      <Form {...form}>
        <div className="max-w-6xl mx-auto h-full space-y-6">
          <div className="flex items-center gap-3">
            <ChevronLeft
              onClick={() => router.back()}
              className="h-10 w-10 cursor-pointer rounded-full p-1 -ml-2 text-[#0D0D0D] transition-all hover:scale-105 active:scale-95"
            />
            <h1 className="text-2xl text-[#0D0D0D] font-bold">
              {data ? "Edit event" : "Add new event"}
            </h1>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className="flex flex-col lg:flex-row gap-5">
            {/* ── Sidebar nav ── */}
            <aside className="lg:w-64 shrink-0">
              <div className="lg:sticky lg:top-6 bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <nav className="p-2 space-y-1">
                  {SECTIONS.map((s) => {
                    const hasError = SECTION_FIELDS[s.key].some(
                      (f) => !!(form.formState.errors as any)[f],
                    );
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setSection(s.key)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          section === s.key
                            ? "bg-primary/10 text-primary"
                            : "text-gray-600 hover:bg-gray-50",
                        )}>
                        <s.icon className="h-4 w-4" />
                        <span className="flex-1 text-left">{s.label}</span>
                        {hasError && (
                          <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* ── Main content ── */}
            <div className="flex-1 min-w-0 space-y-6">
              {section === "basic" && (
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
                                    message:
                                      "Special characters are not allowed",
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
                          <div className="flex items-center gap-2 px-3 py-1.5 border rounded-md bg-transparent border-slate-200 w-fit max-w-62.5">
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
                              className="shrink-0 ml-1 text-slate-400 hover:text-red-500 transition-colors">
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

                  <FormField
                    control={form.control}
                    name="event_rules"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Rule & Policy</FormLabel>
                        <FormControl>
                          <Textarea className="rounded-lg" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="refund_policy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Refund</FormLabel>
                        <FormControl>
                          <Textarea className="rounded-lg" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {section === "location" && (
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
                            <PopoverContent
                              className="w-auto p-0"
                              align="start">
                              <Calendar
                                mode="range"
                                selected={field.value as any}
                                onSelect={field.onChange}
                                numberOfMonths={2}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
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
                        <Label
                          className={`mb-2 ${form.formState.errors.location ? "text-red-500" : "text-black"}`}>
                          Pick Location
                        </Label>
                        <MapPicker form={form} />
                        {form.formState.errors.location && (
                          <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.location.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {section === "pricing" && (
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
                              value="registration"
                              className={toggleItemStyles}>
                              Free With Registration
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="paid"
                              className={toggleItemStyles}>
                              Paid
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="external"
                              className={toggleItemStyles}>
                              External Ticket
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {watchedPriceCategory === "registration" && (
                    <FormField
                      control={form.control}
                      name="registration_capacity"
                      render={({ field }) => (
                        <FormItem className="max-w-xs animate-in fade-in slide-in-from-top-1">
                          <FormLabel>Capacity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="Leave blank for unlimited"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  {watchedPriceCategory === "external" && (
                    <FormField
                      control={form.control}
                      name="ticket_link"
                      render={({ field }) => (
                        <FormItem className="animate-in fade-in slide-in-from-top-1">
                          <FormLabel>Ticket Link</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/tickets"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {watchedPriceCategory === "paid" && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center justify-between">
                        <FormLabel>Ticket Options</FormLabel>
                        {optionFields.length < 5 && (
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
                            name={`options.${index}.close_date`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Close Date</FormLabel>
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
                        </div>
                      ))}

                      {form.formState.errors.options && (
                        <p className="text-sm font-medium text-destructive">
                          {(form.formState.errors.options as any)?.message ??
                            (form.formState.errors.options as any)?.root
                              ?.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {section === "promo" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                  {watchedPriceCategory !== "paid" ? (
                    <p className="text-sm text-muted-foreground border rounded-lg p-4">
                      Promo codes are only available for Paid events.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <FormLabel>Promo Codes</FormLabel>
                        {promoFields.length < 5 && (
                          <button
                            type="button"
                            onClick={() => appendPromo(EMPTY_PROMO_CODE)}
                            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                            <Plus className="h-4 w-4" />
                            Add Promo Code
                          </button>
                        )}
                      </div>

                      {promoFields.map((promoField, index) => (
                        <div
                          key={promoField.id}
                          className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 border rounded-lg p-4">
                          <button
                            type="button"
                            onClick={() => removePromo(index)}
                            className="absolute top-3 right-3 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <FormField
                            name={`promo_codes.${index}.code`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Code</FormLabel>
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
                            name={`promo_codes.${index}.discount_percentage`}
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
                          <FormField
                            name={`promo_codes.${index}.limit`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Limit</FormLabel>
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
                            control={form.control}
                            name={`promo_codes.${index}.applicable_options`}
                            render={({ field }) => (
                              <FormItem className="sm:col-span-3">
                                <FormLabel>
                                  Applies to (leave empty for all tickets)
                                </FormLabel>
                                {namedOptions.length > 0 ? (
                                  <div className="flex flex-wrap gap-3 pt-1">
                                    {namedOptions.map((opt) => {
                                      const name = opt?.name as string;
                                      const checked = (
                                        field.value ?? []
                                      ).includes(name);
                                      return (
                                        <label
                                          key={name}
                                          className="flex items-center gap-2 text-sm cursor-pointer">
                                          <Checkbox
                                            checked={checked}
                                            onCheckedChange={(isChecked) => {
                                              const current = field.value ?? [];
                                              field.onChange(
                                                isChecked
                                                  ? [...current, name]
                                                  : current.filter(
                                                      (n: string) => n !== name,
                                                    ),
                                              );
                                            }}
                                          />
                                          {name}
                                        </label>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    Add ticket options in the Pricing tab first.
                                  </p>
                                )}
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {section === "host" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                  <h2 className="text-lg font-bold text-[#0D0D0D]">
                    Host Details
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 items-start space-y-4">
                    <FormField
                      control={form.control}
                      name="host_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Host name" {...field} />
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

                  <FormField
                    control={form.control}
                    name="support_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Support</FormLabel>
                        <FormControl>
                          <Textarea className="rounded-lg" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {section === "settings" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                  <FormField
                    control={form.control}
                    name="max_tickets_per_request"
                    render={({ field }) => (
                      <FormItem className="max-w-xs">
                        <FormLabel>
                          Maximum tickets per booking request
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="show_remaining_tickets"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between border rounded-lg p-4 max-w-md">
                        <div>
                          <FormLabel>Show remaining tickets</FormLabel>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Display how many tickets are left to buyers.
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
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
              </div>
            </div>
          </form>
        </div>
      </Form>
    </div>
  );
}
