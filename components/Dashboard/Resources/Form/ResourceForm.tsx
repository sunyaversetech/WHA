"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import {
  resourceSchema,
  ResourceFormValues,
  IResource,
  DURATION_OPTIONS,
  PRICE_TYPES,
  DAYS_OF_WEEK,
  TIME_OPTIONS,
  defaultSchedule,
} from "./schema";
import { useCreateOrUpdateResource } from "@/services/resource.service";
import { useGetCategories } from "@/services/category.service";

// ─── Section nav ─────────────────────────────────────────────────────────────

type Section = "basic" | "availability";

const NAV_ITEMS = [
  { id: "basic" as Section,        label: "Basic details" },
  { id: "availability" as Section, label: "Availability" },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function DayToggle({
  day,
  checked,
  onChange,
}: {
  day: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "w-9 h-9 rounded-full text-xs font-bold border transition-colors shrink-0",
        checked
          ? "bg-[#051e3a] text-white border-[#051e3a]"
          : "bg-white text-gray-400 border-gray-200 hover:border-[#051e3a]",
      )}>
      {day.slice(0, 2)}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ResourceForm({ initialData }: { initialData?: IResource }) {
  const router = useRouter();
  const qc = useQueryClient();

  const { mutate: saveResource, isPending } = useCreateOrUpdateResource();
  const { data: categoriesData } = useGetCategories("resource");
  const categories = categoriesData?.data ?? [];

  const [section, setSection] = useState<Section>("basic");

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema) as any,
    defaultValues: initialData
      ? {
          _id:                     initialData._id,
          name:                    initialData.name,
          description:             initialData.description ?? "",
          category_id:             initialData.category_id ?? "",
          price_type:              initialData.price_type ?? "Fixed",
          base_price:              initialData.base_price ?? 0,
          base_duration:           initialData.base_duration ?? 60,
          buffer_time:             initialData.buffer_time ?? 0,
          availability_type:       initialData.availability_type ?? "always",
          availability_schedule:   initialData.availability_schedule?.length
                                     ? initialData.availability_schedule
                                     : defaultSchedule(),
          allow_multiple_bookings: initialData.allow_multiple_bookings ?? false,
          max_concurrent_bookings: initialData.max_concurrent_bookings ?? 1,
          is_active:               initialData.is_active ?? true,
        }
      : {
          name:                    "",
          description:             "",
          category_id:             "",
          price_type:              "Fixed",
          base_price:              0,
          base_duration:           60,
          buffer_time:             0,
          availability_type:       "always",
          availability_schedule:   defaultSchedule(),
          allow_multiple_bookings: false,
          max_concurrent_bookings: 1,
          is_active:               true,
        },
  });

  const priceType              = useWatch({ control: form.control, name: "price_type" });
  const availabilityType       = useWatch({ control: form.control, name: "availability_type" });
  const allowMultiple          = useWatch({ control: form.control, name: "allow_multiple_bookings" });
  const schedule               = useWatch({ control: form.control, name: "availability_schedule" });

  const onSubmit = (data: ResourceFormValues) => {
    const cat = categories.find((c) => c._id === data.category_id);
    const payload = { ...data, category: cat?.name ?? "" };

    saveResource(payload, {
      onSuccess: (res: any) => {
        if (res?.success) {
          toast.success(initialData ? "Resource updated" : "Resource created");
          qc.invalidateQueries({ queryKey: ["resources"] });
          router.push("/dashboard/resources");
        } else {
          toast.error(res?.error ?? "Failed to save resource");
        }
      },
      onError: (err: any) => toast.error(err?.message ?? "Failed to save resource"),
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 flex items-center justify-end gap-2 px-5 md:px-8 py-3 border-b border-gray-100 bg-white">
        <button
          type="button"
          onClick={() => router.push("/dashboard/resources")}
          className="px-5 py-2 rounded-full border border-gray-200 text-[#051e3a] text-sm font-semibold hover:bg-gray-50 transition-colors">
          Close
        </button>
        <button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          disabled={isPending}
          className="px-5 py-2 rounded-full bg-[#051e3a] text-white text-sm font-bold hover:bg-[#082040] disabled:opacity-60 transition-colors flex items-center gap-1.5">
          {isPending && <Loader2 size={13} className="animate-spin" />}
          Save
        </button>
      </div>

      <div className="flex flex-col md:flex-row flex-1">
        {/* ── Sidebar nav ── */}
        <div className="w-full md:w-64 shrink-0 p-4 md:p-6 border-b md:border-b-0 md:border-r border-gray-100">
          <h1 className="text-2xl font-bold text-[#051e3a] mb-5">
            {initialData ? "Edit resource" : "New resource"}
          </h1>

          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={cn(
                  "w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left",
                  section === item.id
                    ? "bg-[#051e3a] text-white"
                    : "text-[#051e3a] hover:bg-gray-100",
                )}>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 px-5 md:px-10 py-8 max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* ══ Basic details ══ */}
              {section === "basic" && (
                <>
                  {/* Basic info */}
                  <div>
                    <h2 className="text-xl font-bold text-[#051e3a] mb-5">Basic details</h2>

                    {/* Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <FormLabel className="text-sm font-semibold text-[#051e3a]">
                              Resource name
                            </FormLabel>
                            <span className="text-xs text-gray-400">
                              {field.value?.length ?? 0}/255
                            </span>
                          </div>
                          <FormControl>
                            <Input
                              {...field}
                              maxLength={255}
                              placeholder="e.g. Treatment Room 1"
                              className="border-gray-200 focus-visible:ring-0 focus-visible:border-[#051e3a] text-[#051e3a] placeholder:text-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Category */}
                    <div className="mb-4">
                      <FormField
                        control={form.control}
                        name="category_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#051e3a]">
                              Category
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <select
                                  {...field}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#051e3a] outline-none appearance-none focus:border-[#051e3a] transition-colors bg-white">
                                  <option value="">Select category</option>
                                  {categories.map((c) => (
                                    <option key={c._id} value={c._id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown
                                  size={13}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between mb-1.5">
                            <FormLabel className="text-sm font-semibold text-[#051e3a]">
                              Description{" "}
                              <span className="font-normal text-gray-400">(Optional)</span>
                            </FormLabel>
                            <span className="text-xs text-gray-400">
                              {field.value?.length ?? 0}/1000
                            </span>
                          </div>
                          <FormControl>
                            <textarea
                              {...field}
                              rows={4}
                              maxLength={1000}
                              placeholder="Add a short description"
                              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#051e3a] placeholder:text-gray-400 outline-none focus:border-[#051e3a] transition-colors resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Pricing and duration */}
                  <div>
                    <h2 className="text-xl font-bold text-[#051e3a] mb-5">Pricing and duration</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                      {/* Price type */}
                      <FormField
                        control={form.control}
                        name="price_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#051e3a]">
                              Price type
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <select
                                  {...field}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#051e3a] outline-none appearance-none focus:border-[#051e3a] transition-colors bg-white">
                                  {PRICE_TYPES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                                <ChevronDown
                                  size={13}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Price */}
                      {(priceType === "Fixed" || priceType === "From") && (
                        <FormField
                          control={form.control}
                          name="base_price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-[#051e3a]">
                                Price
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                                    NPR
                                  </span>
                                  <Input
                                    {...field}
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    onChange={(e) =>
                                      field.onChange(parseFloat(e.target.value) || 0)
                                    }
                                    className="pl-11 border-gray-200 focus-visible:ring-0 focus-visible:border-[#051e3a] text-[#051e3a]"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Duration */}
                      <FormField
                        control={form.control}
                        name="base_duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#051e3a]">
                              Duration
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <select
                                  value={field.value}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#051e3a] outline-none appearance-none focus:border-[#051e3a] transition-colors bg-white">
                                  {DURATION_OPTIONS.map((d) => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                  ))}
                                </select>
                                <ChevronDown
                                  size={13}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ══ Availability ══ */}
              {section === "availability" && (
                <>
                  {/* Availability type */}
                  <div>
                    <h2 className="text-xl font-bold text-[#051e3a] mb-2">Availability</h2>
                    <p className="text-sm text-gray-400 mb-5">
                      Set when this resource is available for booking
                    </p>

                    <FormField
                      control={form.control}
                      name="availability_type"
                      render={({ field }) => (
                        <FormItem className="mb-6">
                          <div className="space-y-2">
                            {[
                              { value: "always",   label: "Always available",         desc: "This resource can be booked at any time" },
                              { value: "specific",  label: "Only on specific days/times", desc: "Set custom hours for each day of the week" },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => field.onChange(opt.value)}
                                className={cn(
                                  "w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-colors",
                                  field.value === opt.value
                                    ? "border-[#051e3a] bg-[#051e3a]/5"
                                    : "border-gray-200 hover:border-gray-300",
                                )}>
                                <span
                                  className={cn(
                                    "w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center",
                                    field.value === opt.value
                                      ? "border-[#051e3a]"
                                      : "border-gray-300",
                                  )}>
                                  {field.value === opt.value && (
                                    <span className="w-2 h-2 rounded-full bg-[#051e3a]" />
                                  )}
                                </span>
                                <div>
                                  <p className="text-sm font-semibold text-[#051e3a]">{opt.label}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Per-day schedule */}
                    {availabilityType === "specific" && (
                      <div className="border border-gray-200 rounded-2xl overflow-hidden mb-6">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                          <span className="text-sm font-bold text-[#051e3a]">Weekly schedule</span>
                        </div>

                        {DAYS_OF_WEEK.map((day, di) => {
                          const dayEntry = schedule?.[di];
                          const isAvail = dayEntry?.is_available ?? false;
                          return (
                            <div
                              key={day}
                              className={cn(
                                "flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3",
                                di < DAYS_OF_WEEK.length - 1 && "border-b border-gray-100",
                              )}>
                              <div className="flex items-center gap-3 sm:w-44 shrink-0">
                                <DayToggle
                                  day={day}
                                  checked={isAvail}
                                  onChange={(v) => {
                                    const current = form.getValues("availability_schedule");
                                    const updated = [...current];
                                    updated[di] = { ...updated[di], is_available: v };
                                    form.setValue("availability_schedule", updated);
                                  }}
                                />
                                <span
                                  className={cn(
                                    "text-sm font-semibold",
                                    isAvail ? "text-[#051e3a]" : "text-gray-400",
                                  )}>
                                  {day}
                                </span>
                              </div>

                              {isAvail ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <div className="relative flex-1">
                                    <select
                                      value={dayEntry?.start_time ?? "09:00"}
                                      onChange={(e) => {
                                        const current = form.getValues("availability_schedule");
                                        const updated = [...current];
                                        updated[di] = { ...updated[di], start_time: e.target.value };
                                        form.setValue("availability_schedule", updated);
                                      }}
                                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#051e3a] outline-none appearance-none focus:border-[#051e3a] transition-colors bg-white">
                                      {TIME_OPTIONS.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                      ))}
                                    </select>
                                    <ChevronDown
                                      size={11}
                                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                    />
                                  </div>
                                  <span className="text-xs text-gray-400 shrink-0">to</span>
                                  <div className="relative flex-1">
                                    <select
                                      value={dayEntry?.end_time ?? "17:00"}
                                      onChange={(e) => {
                                        const current = form.getValues("availability_schedule");
                                        const updated = [...current];
                                        updated[di] = { ...updated[di], end_time: e.target.value };
                                        form.setValue("availability_schedule", updated);
                                      }}
                                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#051e3a] outline-none appearance-none focus:border-[#051e3a] transition-colors bg-white">
                                      {TIME_OPTIONS.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                      ))}
                                    </select>
                                    <ChevronDown
                                      size={11}
                                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Unavailable</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Capacity */}
                  <div>
                    <h2 className="text-xl font-bold text-[#051e3a] mb-2">Capacity</h2>
                    <p className="text-sm text-gray-400 mb-5">
                      How many bookings can this resource handle at the same time
                    </p>

                    {/* Allow multiple */}
                    <FormField
                      control={form.control}
                      name="allow_multiple_bookings"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between gap-4 p-4 border border-gray-200 rounded-xl mb-3">
                          <div>
                            <FormLabel className="text-sm font-semibold text-[#051e3a]">
                              Allow multiple bookings at once
                            </FormLabel>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Let more than one client use this resource at the same time
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Max concurrent */}
                    {allowMultiple && (
                      <FormField
                        control={form.control}
                        name="max_concurrent_bookings"
                        render={({ field }) => (
                          <FormItem className="mb-3">
                            <FormLabel className="text-sm font-semibold text-[#051e3a]">
                              Maximum concurrent bookings
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min={1}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value, 10) || 1)
                                }
                                className="border-gray-200 focus-visible:ring-0 focus-visible:border-[#051e3a] text-[#051e3a] max-w-[160px]"
                              />
                            </FormControl>
                            <p className="text-xs text-gray-400 mt-1">
                              Maximum number of simultaneous bookings for this resource
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </>
              )}

            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
