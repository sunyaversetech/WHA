"use client";

import Image from "next/image";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
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
  serviceSchema,
  ServiceFormValues,
  IService,
  DURATION_OPTIONS,
  TREATMENT_TYPES,
  PRICE_TYPES,
  DAYS_OF_WEEK,
  TIME_OPTIONS,
  defaultSchedule,
} from "./schema";
import { useCreateOrUpdateService } from "@/services/services.service";
import { useGetCategories } from "@/services/category.service";
import { useGetEmployees } from "@/services/employee.service";

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_BG = [
  "bg-teal-600", "bg-purple-600", "bg-blue-600", "bg-rose-600",
  "bg-amber-600", "bg-emerald-600", "bg-pink-600", "bg-indigo-600",
];

function empInitials(name: string) {
  return name.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function EmpAvatar({ emp, idx }: { emp: any; idx: number }) {
  if (emp.employee_photo) {
    return (
      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
        <Image src={emp.employee_photo} alt={emp.full_name} width={36} height={36} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold", AVATAR_BG[idx % AVATAR_BG.length])}>
      {empInitials(emp.full_name)}
    </div>
  );
}

// ─── Day toggle ───────────────────────────────────────────────────────────────

function DayToggle({ day, checked, onChange }: { day: string; checked: boolean; onChange: (v: boolean) => void }) {
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

// ─── Section types ────────────────────────────────────────────────────────────

type Section = "basic" | "team" | "availability";

// ─── Main Component ───────────────────────────────────────────────────────────

export function ServiceForm({ initialData }: { initialData?: IService }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: session } = useSession();

  const { mutate: saveService, isPending } = useCreateOrUpdateService();
  const { data: categoriesData } = useGetCategories();
  const { data: empData } = useGetEmployees();

  const categories  = categoriesData?.data ?? [];
  const allEmployees = (empData as any)?.data ?? [];

  const [section, setSection] = useState<Section>("basic");

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema) as any,
    defaultValues: initialData
      ? {
          _id:                        initialData._id,
          name:                       initialData.name,
          description:                initialData.description ?? "",
          category_id:                initialData.category_id ?? "",
          price_type:                 (initialData as any).price_type ?? "Fixed",
          base_price:                 initialData.base_price ?? 0,
          base_duration:              initialData.base_duration ?? 60,
          buffer_time:                initialData.buffer_time ?? 0,
          service_type:               (initialData as any).service_type ?? "employee_based",
          require_employee_selection: initialData.require_employee_selection ?? false,
          assigned_employees:         (initialData.assigned_employees ?? []).map(
            (e: any) => (typeof e === "string" ? e : e._id),
          ),
          allow_multiple_bookings:    (initialData as any).allow_multiple_bookings ?? false,
          max_bookings_per_slot:      (initialData as any).max_bookings_per_slot ?? 1,
          is_one_time_booking:        (initialData as any).is_one_time_booking ?? false,
          availability_type:          (initialData as any).availability_type ?? "always",
          availability_schedule:      (initialData as any).availability_schedule?.length
                                        ? (initialData as any).availability_schedule
                                        : defaultSchedule(),
          max_concurrent_bookings:    (initialData as any).max_concurrent_bookings ?? 1,
          is_active:                  initialData.is_active ?? true,
        }
      : {
          name:                       "",
          description:                "",
          category_id:                "",
          price_type:                 "Fixed",
          base_price:                 0,
          base_duration:              60,
          buffer_time:                0,
          service_type:               "employee_based",
          require_employee_selection: false,
          assigned_employees:         [],
          allow_multiple_bookings:    false,
          max_bookings_per_slot:      1,
          is_one_time_booking:        false,
          availability_type:          "always",
          availability_schedule:      defaultSchedule(),
          max_concurrent_bookings:    1,
          is_active:                  true,
        },
  });

  const priceType           = useWatch({ control: form.control, name: "price_type" });
  const serviceType         = useWatch({ control: form.control, name: "service_type" });
  const allowMultiple        = useWatch({ control: form.control, name: "allow_multiple_bookings" });
  const assignedEmployees    = useWatch({ control: form.control, name: "assigned_employees" });
  const availabilityType     = useWatch({ control: form.control, name: "availability_type" });
  const availabilitySchedule = useWatch({ control: form.control, name: "availability_schedule" });

  const teamCount   = assignedEmployees?.length ?? 0;
  const allSelected = allEmployees.length > 0 && allEmployees.every((e: any) => assignedEmployees?.includes(e._id));

  const toggleEmployee = (id: string) => {
    const current = form.getValues("assigned_employees") ?? [];
    form.setValue("assigned_employees", current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };
  const toggleAll = () => {
    form.setValue("assigned_employees", allSelected ? [] : allEmployees.map((e: any) => e._id));
  };

  // Nav items are dynamic based on service_type
  const navItems: { id: Section; label: string; badge?: number }[] = [
    { id: "basic", label: "Basic details" },
    ...(serviceType === "employee_based"
      ? [{ id: "team" as Section, label: "Team members", badge: teamCount || undefined }]
      : serviceType === "resource_based"
        ? [{ id: "availability" as Section, label: "Availability" }]
        : []),
  ];

  const onSubmit = (data: ServiceFormValues) => {
    const cat = categories.find((c) => c._id === data.category_id);
    const payload = {
      ...data,
      category: cat?.name ?? "",
      business_type: (session?.user as any)?.business_type ?? "employee_based",
    };

    saveService(payload, {
      onSuccess: (res: any) => {
        if (res?.success) {
          toast.success(initialData ? "Service updated" : "Service created");
          qc.invalidateQueries({ queryKey: ["services"] });
          router.push("/dashboard/services");
        } else {
          toast.error(res?.error ?? "Failed to save service");
        }
      },
      onError: (err: any) => toast.error(err?.message ?? "Failed to save service"),
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 flex items-center justify-end gap-2 px-5 md:px-8 py-3 border-b border-gray-100 bg-white">
        <button
          type="button"
          onClick={() => router.push("/dashboard/services")}
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
        {/* ── Sidebar ── */}
        <div className="w-full md:w-64 shrink-0 p-4 md:p-6 border-b md:border-b-0 md:border-r border-gray-100">
          <h1 className="text-2xl font-bold text-[#051e3a] mb-5">
            {initialData ? "Edit service" : "New service"}
          </h1>

          <nav className="space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left",
                  section === item.id
                    ? "bg-[#051e3a] text-white"
                    : "text-[#051e3a] hover:bg-gray-100",
                )}>
                <span>{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className={cn(
                    "text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                    section === item.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500",
                  )}>
                    {item.badge}
                  </span>
                )}
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

                    {/* Service name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <FormLabel className="text-sm font-semibold text-[#051e3a]">Service name</FormLabel>
                            <span className="text-xs text-gray-400">{field.value?.length ?? 0}/255</span>
                          </div>
                          <FormControl>
                            <Input
                              {...field}
                              maxLength={255}
                              placeholder="Add a service name, e.g. Men's Haircut"
                              className="border-gray-200 focus-visible:ring-0 focus-visible:border-[#051e3a] text-[#051e3a] placeholder:text-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Category + Treatment type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <FormField
                        control={form.control}
                        name="category_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#051e3a]">Menu category</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <select
                                  {...field}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#051e3a] outline-none appearance-none focus:border-[#051e3a] transition-colors bg-white">
                                  <option value="">Select category</option>
                                  {categories.map((c) => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                  ))}
                                </select>
                                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                              </div>
                            </FormControl>
                            <p className="text-xs text-gray-400 mt-1">The category displayed to you, and to clients online</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-[#051e3a]">Treatment type</FormLabel>
                        <div className="relative">
                          <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-400 outline-none appearance-none focus:border-[#051e3a] transition-colors bg-white">
                            <option value="">Select treatment type</option>
                            {TREATMENT_TYPES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Used to help clients find your service</p>
                      </FormItem>
                    </div>

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between mb-1.5">
                            <FormLabel className="text-sm font-semibold text-[#051e3a]">
                              Description <span className="font-normal text-gray-400">(Optional)</span>
                            </FormLabel>
                            <span className="text-xs text-gray-400">{field.value?.length ?? 0}/1000</span>
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
                            <FormLabel className="text-sm font-semibold text-[#051e3a]">Price type</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <select
                                  {...field}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#051e3a] outline-none appearance-none focus:border-[#051e3a] transition-colors bg-white">
                                  {PRICE_TYPES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                              <FormLabel className="text-sm font-semibold text-[#051e3a]">Price</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">NPR</span>
                                  <Input
                                    {...field}
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                            <FormLabel className="text-sm font-semibold text-[#051e3a]">Duration</FormLabel>
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
                                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Service type */}
                  <div>
                    <h2 className="text-xl font-bold text-[#051e3a] mb-2">Service type</h2>
                    <p className="text-sm text-gray-400 mb-5">
                      Choose how this service is delivered
                    </p>

                    <FormField
                      control={form.control}
                      name="service_type"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-2">
                            {[
                              {
                                value: "employee_based",
                                label: "Employee based",
                                desc: "This service is performed by a team member — clients book a staff slot",
                              },
                              {
                                value: "resource_based",
                                label: "Resource / Inventory based",
                                desc: "This service uses a physical space, equipment, or item — clients book the resource",
                              },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  field.onChange(opt.value);
                                  setSection("basic");
                                }}
                                className={cn(
                                  "w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-colors",
                                  field.value === opt.value
                                    ? "border-[#051e3a] bg-[#051e3a]/5"
                                    : "border-gray-200 hover:border-gray-300",
                                )}>
                                <span className={cn(
                                  "w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center",
                                  field.value === opt.value ? "border-[#051e3a]" : "border-gray-300",
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Booking capacity — employee-based only */}
                  {serviceType === "employee_based" && (
                    <div>
                      <h2 className="text-xl font-bold text-[#051e3a] mb-5">Booking capacity</h2>

                      <FormField
                        control={form.control}
                        name="allow_multiple_bookings"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between gap-4 p-4 border border-gray-200 rounded-xl mb-3">
                            <div>
                              <FormLabel className="text-sm font-semibold text-[#051e3a]">Allow multiple bookings</FormLabel>
                              <p className="text-xs text-gray-400 mt-0.5">Let more than one client book this service for the same time slot</p>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {allowMultiple && (
                        <FormField
                          control={form.control}
                          name="max_bookings_per_slot"
                          render={({ field }) => (
                            <FormItem className="mb-3">
                              <FormLabel className="text-sm font-semibold text-[#051e3a]">Booking limit per slot</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min={1}
                                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                                  className="border-gray-200 focus-visible:ring-0 focus-visible:border-[#051e3a] text-[#051e3a] max-w-40"
                                />
                              </FormControl>
                              <p className="text-xs text-gray-400 mt-1">How many people can book this service at the same time</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="is_one_time_booking"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between gap-4 p-4 border border-gray-200 rounded-xl">
                            <div>
                              <FormLabel className="text-sm font-semibold text-[#051e3a]">One-time booking</FormLabel>
                              <p className="text-xs text-gray-400 mt-0.5">Once the booking limit is reached, this service is automatically deactivated</p>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </>
              )}

              {/* ══ Team members (employee-based) ══ */}
              {section === "team" && (
                <div>
                  <h2 className="text-xl font-bold text-[#051e3a] mb-1">Team members required</h2>
                  <p className="text-sm text-gray-400 mb-6">Choose which team members will perform this service</p>

                  {allEmployees.length === 0 ? (
                    <p className="text-sm text-gray-400">No team members found.</p>
                  ) : (
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <button
                          type="button"
                          onClick={toggleAll}
                          className={cn(
                            "w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                            allSelected ? "bg-[#051e3a] border-[#051e3a]" : "border-gray-300 hover:border-[#051e3a]",
                          )}>
                          {allSelected && <Check size={10} className="text-white" />}
                        </button>
                        <span className="text-sm font-semibold text-[#051e3a]">All team members</span>
                        <span className="text-xs text-gray-400 ml-1">{allEmployees.length}</span>
                      </label>

                      <div className="border-t border-gray-100 pt-2 space-y-1">
                        {allEmployees.map((emp: any, idx: number) => {
                          const isChecked = assignedEmployees?.includes(emp._id) ?? false;
                          return (
                            <label key={emp._id} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
                              <button
                                type="button"
                                onClick={() => toggleEmployee(emp._id)}
                                className={cn(
                                  "w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                                  isChecked ? "bg-[#051e3a] border-[#051e3a]" : "border-gray-300 hover:border-[#051e3a]",
                                )}>
                                {isChecked && <Check size={10} className="text-white" />}
                              </button>
                              <EmpAvatar emp={emp} idx={idx} />
                              <span className="text-sm font-semibold text-[#051e3a]">{emp.full_name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══ Availability (resource-based) ══ */}
              {section === "availability" && (
                <>
                  {/* Schedule */}
                  <div>
                    <h2 className="text-xl font-bold text-[#051e3a] mb-2">Availability</h2>
                    <p className="text-sm text-gray-400 mb-5">Set when this service / resource is available for booking</p>

                    <FormField
                      control={form.control}
                      name="availability_type"
                      render={({ field }) => (
                        <FormItem className="mb-6">
                          <div className="space-y-2">
                            {[
                              { value: "always",   label: "Always available",            desc: "Can be booked at any time" },
                              { value: "specific", label: "Only on specific days / times", desc: "Set custom hours for each day of the week" },
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
                                <span className={cn(
                                  "w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center",
                                  field.value === opt.value ? "border-[#051e3a]" : "border-gray-300",
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

                    {availabilityType === "specific" && (
                      <div className="border border-gray-200 rounded-2xl overflow-hidden mb-6">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <span className="text-sm font-bold text-[#051e3a]">Weekly schedule</span>
                        </div>

                        {DAYS_OF_WEEK.map((day, di) => {
                          const entry    = availabilitySchedule?.[di];
                          const isAvail  = entry?.is_available ?? false;
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
                                <span className={cn("text-sm font-semibold", isAvail ? "text-[#051e3a]" : "text-gray-400")}>
                                  {day}
                                </span>
                              </div>

                              {isAvail ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <div className="relative flex-1">
                                    <select
                                      value={entry?.start_time ?? "09:00"}
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
                                    <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                  </div>
                                  <span className="text-xs text-gray-400 shrink-0">to</span>
                                  <div className="relative flex-1">
                                    <select
                                      value={entry?.end_time ?? "17:00"}
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
                                    <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                    <p className="text-sm text-gray-400 mb-5">How many bookings can this resource handle at the same time</p>

                    <FormField
                      control={form.control}
                      name="allow_multiple_bookings"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between gap-4 p-4 border border-gray-200 rounded-xl mb-3">
                          <div>
                            <FormLabel className="text-sm font-semibold text-[#051e3a]">Allow multiple bookings at once</FormLabel>
                            <p className="text-xs text-gray-400 mt-0.5">Let more than one client use this resource at the same time</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {allowMultiple && (
                      <FormField
                        control={form.control}
                        name="max_concurrent_bookings"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#051e3a]">Maximum concurrent bookings</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min={1}
                                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                                className="border-gray-200 focus-visible:ring-0 focus-visible:border-[#051e3a] text-[#051e3a] max-w-40"
                              />
                            </FormControl>
                            <p className="text-xs text-gray-400 mt-1">Maximum number of simultaneous bookings for this resource</p>
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
