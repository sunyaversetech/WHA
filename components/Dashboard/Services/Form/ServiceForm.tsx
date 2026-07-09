"use client";

import Image from "next/image";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  Loader2,
  Users,
  Package,
  CalendarDays,
  Plus,
  X,
  AlertCircle,
} from "lucide-react";
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
  serviceSchema,
  ServiceFormValues,
  IService,
  DURATION_OPTIONS,
  TREATMENT_TYPES,
  PRICE_TYPES,
  DAYS_OF_WEEK,
  TIME_OPTIONS,
  BUFFER_OPTIONS,
  NOTICE_OPTIONS,
  ADVANCE_OPTIONS,
  CANCELLATION_OPTIONS,
  defaultSchedule,
  defaultGroupSchedule,
} from "./schema";
import { useCreateOrUpdateService } from "@/services/services.service";
import { useGetCategories } from "@/services/category.service";
import { useGetEmployees } from "@/services/employee.service";

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_BG = [
  "bg-teal-600",
  "bg-purple-600",
  "bg-blue-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-emerald-600",
  "bg-pink-600",
  "bg-indigo-600",
];

const SERVICE_TYPES = [
  {
    value: "employee_based",
    label: "Team Member",
    sublabel: "Appointment",
    desc: "eg: Barber shop, Massage",
    Icon: Users,
  },
  {
    value: "resource_based",
    label: "Resources",
    sublabel: "Inventory",
    desc: "eg: Kayak, Tennis court",
    Icon: Package,
  },
  {
    value: "group_session",
    label: "Group Session",
    sublabel: "Class",
    desc: "eg: Zumba, Yoga, Education",
    Icon: CalendarDays,
  },
] as const;

type Section =
  | "service_type"
  | "basic"
  | "team"
  | "availability"
  | "schedule"
  | "settings";

// ─── Small helpers ────────────────────────────────────────────────────────────

function empInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function EmpAvatar({ emp, idx }: { emp: any; idx: number }) {
  if (emp.employee_photo) {
    return (
      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
        <Image
          src={emp.employee_photo}
          alt={emp.full_name}
          width={36}
          height={36}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold",
        AVATAR_BG[idx % AVATAR_BG.length],
      )}>
      {empInitials(emp.full_name)}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
  className,
}: {
  value: string | number;
  onChange: (v: any) => void;
  options: { label: string; value: string | number }[];
  className?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => {
          const opt = options.find((o) => String(o.value) === e.target.value);
          onChange(opt ? opt.value : e.target.value);
        }}
        className={cn(
          "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#051e3a] outline-none appearance-none focus:border-[#051e3a] transition-colors bg-white",
          className,
        )}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ServiceForm({ initialData }: { initialData?: IService }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { mutate: saveService, isPending } = useCreateOrUpdateService();
  const { data: categoriesData } = useGetCategories();
  const { data: empData } = useGetEmployees();

  const categories = categoriesData?.data ?? [];
  const allEmployees = (empData as any)?.data ?? [];

  const [section, setSection] = useState<Section>(
    initialData ? "basic" : "service_type",
  );

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema) as any,
    mode: "onTouched",
    defaultValues: initialData
      ? {
          _id: initialData._id,
          name: initialData.name,
          description: initialData.description ?? "",
          category_id: initialData.category_id ?? "",
          price_type: (initialData as any).price_type ?? "Fixed",
          base_price: initialData.base_price ?? 0,
          base_duration: initialData.base_duration ?? 60,
          buffer_time: initialData.buffer_time ?? 0,
          service_type: (initialData as any).service_type ?? "",
          require_employee_selection:
            initialData.require_employee_selection ?? false,
          assigned_employees: (initialData.assigned_employees ?? []).map(
            (e: any) => (typeof e === "string" ? e : e._id),
          ),
          allow_multiple_bookings:
            (initialData as any).allow_multiple_bookings ?? false,
          max_bookings_per_slot:
            (initialData as any).max_bookings_per_slot ?? 1,
          is_one_time_booking:
            (initialData as any).is_one_time_booking ?? false,
          availability_type: (initialData as any).availability_type ?? "always",
          availability_schedule: (initialData as any).availability_schedule
            ?.length
            ? (initialData as any).availability_schedule
            : defaultSchedule(),
          max_concurrent_bookings:
            (initialData as any).max_concurrent_bookings ?? 1,
          group_schedule: (initialData as any).group_schedule?.length
            ? (initialData as any).group_schedule
            : defaultGroupSchedule(),
          waitlist_enabled: (initialData as any).waitlist_enabled ?? false,
          min_notice_hours: (initialData as any).min_notice_hours ?? 0,
          advance_booking_days: (initialData as any).advance_booking_days ?? 30,
          cancellation_policy:
            (initialData as any).cancellation_policy ?? "anytime",
          is_refundable: (initialData as any).is_refundable ?? true,
          is_active: initialData.is_active ?? true,
        }
      : {
          name: "",
          description: "",
          category_id: "",
          price_type: "Fixed",
          base_price: 0,
          base_duration: 60,
          buffer_time: 0,
          service_type: "",
          require_employee_selection: false,
          assigned_employees: [],
          allow_multiple_bookings: false,
          max_bookings_per_slot: 1,
          is_one_time_booking: false,
          availability_type: "always",
          availability_schedule: defaultSchedule(),
          max_concurrent_bookings: 1,
          group_schedule: defaultGroupSchedule(),
          waitlist_enabled: false,
          min_notice_hours: 0,
          advance_booking_days: 30,
          cancellation_policy: "anytime",
          is_refundable: true,
          is_active: true,
        },
  });

  const priceType = useWatch({ control: form.control, name: "price_type" });
  const serviceType = useWatch({ control: form.control, name: "service_type" });
  const assignedEmployees = useWatch({
    control: form.control,
    name: "assigned_employees",
  });
  const availabilityType = useWatch({
    control: form.control,
    name: "availability_type",
  });
  const availabilitySchedule = useWatch({
    control: form.control,
    name: "availability_schedule",
  });
  const groupSchedule = useWatch({
    control: form.control,
    name: "group_schedule",
  });
  const cancellationPolicy = useWatch({
    control: form.control,
    name: "cancellation_policy",
  });
  const isRefundable = useWatch({
    control: form.control,
    name: "is_refundable",
  });

  const teamCount = assignedEmployees?.length ?? 0;
  const allSelected =
    allEmployees.length > 0 &&
    allEmployees.every((e: any) => assignedEmployees?.includes(e._id));

  const { errors } = form.formState;
  const sectionErrors: Record<Section, boolean> = {
    service_type: !!errors.service_type,
    basic: !!(
      errors.name ||
      errors.category_id ||
      errors.price_type ||
      errors.base_price ||
      errors.base_duration
    ),
    team: !!errors.assigned_employees,
    availability: !!(
      errors.availability_type ||
      errors.availability_schedule ||
      errors.max_concurrent_bookings
    ),
    schedule: !!errors.group_schedule,
    settings: !!(
      errors.buffer_time ||
      errors.min_notice_hours ||
      errors.advance_booking_days ||
      errors.cancellation_policy
    ),
  };

  // Label shown next to "Service type" nav item once a type is chosen
  const selectedTypeLabel = SERVICE_TYPES.find(
    (t) => t.value === serviceType,
  )?.label;

  const navItems: {
    id: Section;
    label: string;
    badge?: number;
    sublabel?: string;
  }[] = [
    { id: "basic", label: "Basic details" },
    {
      id: "service_type",
      label: "Service type",
      sublabel: selectedTypeLabel,
    },
    ...(serviceType === "employee_based"
      ? [
          {
            id: "team" as Section,
            label: "Team members",
            badge: teamCount || undefined,
          },
        ]
      : serviceType === "resource_based"
        ? [{ id: "availability" as Section, label: "Availability" }]
        : serviceType === "group_session"
          ? [{ id: "schedule" as Section, label: "Schedule" }]
          : []),

    { id: "settings", label: "Settings" },
  ];

  const toggleEmployee = (id: string) => {
    const current = form.getValues("assigned_employees") ?? [];
    form.setValue(
      "assigned_employees",
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  };
  const toggleAll = () => {
    form.setValue(
      "assigned_employees",
      allSelected ? [] : allEmployees.map((e: any) => e._id),
    );
  };

  // ── Group schedule helpers ────────────────────────────────────────────────
  const updateGroupDay = (
    di: number,
    patch: Partial<(typeof groupSchedule)[0]>,
  ) => {
    const current = form.getValues("group_schedule");
    const updated = [...current];
    updated[di] = { ...updated[di], ...patch };
    form.setValue("group_schedule", updated);
  };

  const addSlot = (di: number) => {
    const current = form.getValues("group_schedule");
    const updated = [...current];
    updated[di] = {
      ...updated[di],
      slots: [
        ...updated[di].slots,
        { start_time: "09:00", end_time: "10:00", capacity: 10 },
      ],
    };
    form.setValue("group_schedule", updated);
  };

  const removeSlot = (di: number, si: number) => {
    const current = form.getValues("group_schedule");
    const updated = [...current];
    updated[di] = {
      ...updated[di],
      slots: updated[di].slots.filter((_, i) => i !== si),
    };
    form.setValue("group_schedule", updated);
  };

  const updateSlot = (
    di: number,
    si: number,
    patch: Partial<{ start_time: string; end_time: string; capacity: number }>,
  ) => {
    const current = form.getValues("group_schedule");
    const updated = [...current];
    const slots = [...updated[di].slots];
    slots[si] = { ...slots[si], ...patch };
    updated[di] = { ...updated[di], slots };
    form.setValue("group_schedule", updated);
  };

  const onSubmit = (data: ServiceFormValues) => {
    const cat = categories.find((c) => c._id === data.category_id);
    const payload = { ...data, category: cat?.name ?? "" };

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
      onError: (err: any) =>
        toast.error(err?.message ?? "Failed to save service"),
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 flex items-center justify-end gap-2 px-5 md:px-8 py-3 border-b border-gray-100 bg-white">
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
            {navItems.map((item) => {
              const isActive = section === item.id;
              const hasError = sectionErrors[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left",
                    isActive
                      ? "bg-[#051e3a] text-white"
                      : "text-[#051e3a] hover:bg-gray-100",
                  )}>
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0">{item.label}</span>
                    {hasError && !isActive && (
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    )}
                    {item.sublabel && !hasError && (
                      <span
                        className={cn(
                          "text-xs font-normal truncate",
                          isActive ? "text-white/70" : "text-gray-400",
                        )}>
                        · {item.sublabel}
                      </span>
                    )}
                  </span>
                  {item.badge != null && item.badge > 0 && (
                    <span
                      className={cn(
                        "text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-500",
                      )}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 px-5 md:px-10 py-8 max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* ══ Service type picker ══ */}

              {/* ══ Basic details ══ */}
              {section === "basic" && (
                <>
                  <div>
                    <h2 className="text-xl font-bold text-[#051e3a] mb-5">
                      Basic details
                    </h2>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <FormLabel className="text-sm font-semibold text-[#051e3a]">
                              Service name{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <span className="text-xs text-gray-400">
                              {field.value?.length ?? 0}/255
                            </span>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <FormField
                        control={form.control}
                        name="category_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#051e3a]">
                              Menu category{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <SelectField
                                value={field.value}
                                onChange={field.onChange}
                                options={[
                                  { label: "Select category", value: "" },
                                  ...categories.map((c) => ({
                                    label: c.name,
                                    value: c._id,
                                  })),
                                ]}
                              />
                            </FormControl>
                            <p className="text-xs text-gray-400 mt-1">
                              The category displayed to clients online
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-[#051e3a]">
                          Treatment type
                        </FormLabel>
                        <SelectField
                          value=""
                          onChange={() => {}}
                          options={[
                            { label: "Select treatment type", value: "" },
                            ...TREATMENT_TYPES.map((t) => ({
                              label: t,
                              value: t,
                            })),
                          ]}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Used to help clients find your service
                        </p>
                      </FormItem>
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between mb-1.5">
                            <FormLabel className="text-sm font-semibold text-[#051e3a]">
                              Description{" "}
                              <span className="font-normal text-gray-400">
                                (Optional)
                              </span>
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
                    <h2 className="text-xl font-bold text-[#051e3a] mb-5">
                      Pricing and duration
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name="price_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#051e3a]">
                              Price type <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <SelectField
                                value={field.value}
                                onChange={field.onChange}
                                options={PRICE_TYPES.map((t) => ({
                                  label: t,
                                  value: t,
                                }))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                                    $
                                  </span>
                                  <Input
                                    {...field}
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    onChange={(e) =>
                                      field.onChange(
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="pl-7 border-gray-200 focus-visible:ring-0 focus-visible:border-[#051e3a] text-[#051e3a]"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="base_duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#051e3a]">
                              Duration <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <SelectField
                                value={field.value}
                                onChange={(v) => field.onChange(Number(v))}
                                options={DURATION_OPTIONS.map((d) => ({
                                  label: d.label,
                                  value: d.value,
                                }))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Prompt to pick type if not yet selected */}
                  {!serviceType && (
                    <div className="p-4 border border-dashed border-gray-300 rounded-xl text-sm text-gray-400 text-center">
                      Select a booking type in the sidebar to continue
                    </div>
                  )}
                </>
              )}

              {section === "service_type" && (
                <div>
                  <h2 className="text-xl font-bold text-[#051e3a] mb-1">
                    Service type
                  </h2>
                  <p className="text-sm text-gray-400 mb-6">
                    What does the customer book?
                  </p>

                  <div className="space-y-3">
                    {SERVICE_TYPES.map(
                      ({ value, label, sublabel, desc, Icon }) => {
                        const isActive = serviceType === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              form.setValue("service_type", value);
                              if (value === "employee_based")
                                setSection("team");
                              else if (value === "resource_based")
                                setSection("availability");
                              else if (value === "group_session")
                                setSection("schedule");
                            }}
                            className={cn(
                              "w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-colors",
                              isActive
                                ? "border-[#051e3a] bg-[#051e3a]/5"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                            )}>
                            <div
                              className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                                isActive
                                  ? "bg-[#051e3a] text-white"
                                  : "bg-gray-100 text-gray-400",
                              )}>
                              <Icon size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  "text-sm font-bold",
                                  isActive ? "text-[#051e3a]" : "text-gray-700",
                                )}>
                                {label}{" "}
                                <span className="font-normal text-gray-400">
                                  ({sublabel})
                                </span>
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {desc}
                              </p>
                            </div>
                            <div
                              className={cn(
                                "w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center",
                                isActive
                                  ? "border-[#051e3a] bg-[#051e3a]"
                                  : "border-gray-300",
                              )}>
                              {isActive && (
                                <Check size={10} className="text-white" />
                              )}
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>

                  {errors.service_type && (
                    <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                      <AlertCircle size={15} />
                      {(errors.service_type as any).message}
                    </div>
                  )}
                </div>
              )}

              {/* ══ Team members (employee_based) ══ */}
              {section === "team" && (
                <div>
                  <h2 className="text-xl font-bold text-[#051e3a] mb-1">
                    Team members
                  </h2>
                  <p className="text-sm text-gray-400 mb-6">
                    Choose which team members perform this service
                  </p>

                  {allEmployees.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      No team members found.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <button
                          type="button"
                          onClick={toggleAll}
                          className={cn(
                            "w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                            allSelected
                              ? "bg-[#051e3a] border-[#051e3a]"
                              : "border-gray-300 hover:border-[#051e3a]",
                          )}>
                          {allSelected && (
                            <Check size={10} className="text-white" />
                          )}
                        </button>
                        <span className="text-sm font-semibold text-[#051e3a]">
                          All team members
                        </span>
                        <span className="text-xs text-gray-400 ml-1">
                          {allEmployees.length}
                        </span>
                      </label>

                      <div className="border-t border-gray-100 pt-2 space-y-1">
                        {allEmployees.map((emp: any, idx: number) => {
                          const isChecked =
                            assignedEmployees?.includes(emp._id) ?? false;
                          return (
                            <label
                              key={emp._id}
                              className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
                              <button
                                type="button"
                                onClick={() => toggleEmployee(emp._id)}
                                className={cn(
                                  "w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                                  isChecked
                                    ? "bg-[#051e3a] border-[#051e3a]"
                                    : "border-gray-300 hover:border-[#051e3a]",
                                )}>
                                {isChecked && (
                                  <Check size={10} className="text-white" />
                                )}
                              </button>
                              <EmpAvatar emp={emp} idx={idx} />
                              <span className="text-sm font-semibold text-[#051e3a]">
                                {emp.full_name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {errors.assigned_employees && (
                    <p className="text-sm font-medium text-red-500 mt-3">
                      {(errors.assigned_employees as any).message ??
                        "At least one team member is required"}
                    </p>
                  )}
                </div>
              )}

              {/* ══ Availability (resource_based) ══ */}
              {section === "availability" && (
                <>
                  <div>
                    <h2 className="text-xl font-bold text-[#051e3a] mb-2">
                      Availability
                    </h2>
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
                              {
                                value: "always",
                                label: "Always available",
                                desc: "Can be booked during opening hours",
                              },
                              {
                                value: "specific",
                                label: "Custom hours",
                                desc: "Set specific hours for each day",
                              },
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
                                  <p className="text-sm font-semibold text-[#051e3a]">
                                    {opt.label}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {opt.desc}
                                  </p>
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
                          <span className="text-sm font-bold text-[#051e3a]">
                            Weekly schedule
                          </span>
                        </div>
                        {DAYS_OF_WEEK.map((day, di) => {
                          const entry = availabilitySchedule?.[di];
                          const isAvail = entry?.is_available ?? false;
                          return (
                            <div
                              key={day}
                              className={cn(
                                "flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3",
                                di < DAYS_OF_WEEK.length - 1 &&
                                  "border-b border-gray-100",
                              )}>
                              <div className="flex items-center gap-3 sm:w-44 shrink-0">
                                <Switch
                                  checked={isAvail}
                                  onCheckedChange={(v) => {
                                    const current = form.getValues(
                                      "availability_schedule",
                                    );
                                    const updated = [...current];
                                    updated[di] = {
                                      ...updated[di],
                                      is_available: v,
                                    };
                                    form.setValue(
                                      "availability_schedule",
                                      updated,
                                    );
                                  }}
                                />
                                <span
                                  className={cn(
                                    "text-sm font-semibold",
                                    isAvail
                                      ? "text-[#051e3a]"
                                      : "text-gray-400",
                                  )}>
                                  {day}
                                </span>
                              </div>
                              {isAvail ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <div className="relative flex-1">
                                    <select
                                      value={entry?.start_time ?? "09:00"}
                                      onChange={(e) => {
                                        const current = form.getValues(
                                          "availability_schedule",
                                        );
                                        const updated = [...current];
                                        updated[di] = {
                                          ...updated[di],
                                          start_time: e.target.value,
                                        };
                                        form.setValue(
                                          "availability_schedule",
                                          updated,
                                        );
                                      }}
                                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#051e3a] outline-none appearance-none focus:border-[#051e3a] bg-white">
                                      {TIME_OPTIONS.map((t) => (
                                        <option key={t.value} value={t.value}>
                                          {t.label}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown
                                      size={11}
                                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                    />
                                  </div>
                                  <span className="text-xs text-gray-400 shrink-0">
                                    to
                                  </span>
                                  <div className="relative flex-1">
                                    <select
                                      value={entry?.end_time ?? "17:00"}
                                      onChange={(e) => {
                                        const current = form.getValues(
                                          "availability_schedule",
                                        );
                                        const updated = [...current];
                                        updated[di] = {
                                          ...updated[di],
                                          end_time: e.target.value,
                                        };
                                        form.setValue(
                                          "availability_schedule",
                                          updated,
                                        );
                                      }}
                                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#051e3a] outline-none appearance-none focus:border-[#051e3a] bg-white">
                                      {TIME_OPTIONS.map((t) => (
                                        <option key={t.value} value={t.value}>
                                          {t.label}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown
                                      size={11}
                                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  Closed
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Resource quantity */}
                  <div>
                    <h2 className="text-xl font-bold text-[#051e3a] mb-2">
                      Quantity
                    </h2>
                    <p className="text-sm text-gray-400 mb-5">
                      How many of this resource can be booked at the same time
                    </p>
                    <FormField
                      control={form.control}
                      name="max_concurrent_bookings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-[#051e3a]">
                            Quantity available
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min={1}
                              onChange={(e) =>
                                field.onChange(
                                  parseInt(e.target.value, 10) || 1,
                                )
                              }
                              className="border-gray-200 focus-visible:ring-0 focus-visible:border-[#051e3a] text-[#051e3a] max-w-40"
                            />
                          </FormControl>
                          <p className="text-xs text-gray-400 mt-1">
                            eg: 10 kayaks, 4 tennis courts
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {/* ══ Schedule (group_session) ══ */}
              {section === "schedule" && (
                <>
                  <div>
                    <h2 className="text-xl font-bold text-[#051e3a] mb-1">
                      Class schedule
                    </h2>
                    <p className="text-sm text-gray-400 mb-6">
                      Set when this class runs each week. Each time slot has its
                      own capacity.
                    </p>

                    {(errors.group_schedule as any)?.message && (
                      <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                        <AlertCircle size={15} />
                        {(errors.group_schedule as any).message}
                      </div>
                    )}

                    <div className="space-y-4">
                      {DAYS_OF_WEEK.map((day, di) => {
                        const dayData = groupSchedule?.[di] ?? {
                          day_of_week: day,
                          is_active: false,
                          slots: [],
                        };
                        return (
                          <div
                            key={day}
                            className="border border-gray-200 rounded-2xl overflow-hidden">
                            {/* Day header */}
                            <div
                              className={cn(
                                "flex items-center justify-between px-4 py-3",
                                dayData.is_active ? "bg-white" : "bg-gray-50",
                              )}>
                              <div className="flex items-center gap-3">
                                <Switch
                                  checked={dayData.is_active}
                                  onCheckedChange={(v) =>
                                    updateGroupDay(di, { is_active: v })
                                  }
                                />
                                <span
                                  className={cn(
                                    "text-sm font-bold",
                                    dayData.is_active
                                      ? "text-[#051e3a]"
                                      : "text-gray-400",
                                  )}>
                                  {day}
                                </span>
                              </div>
                              {!dayData.is_active && (
                                <span className="text-xs text-gray-400">
                                  Off
                                </span>
                              )}
                            </div>

                            {/* Slots */}
                            {dayData.is_active && (
                              <div className="border-t border-gray-100">
                                {dayData.slots.length === 0 && (
                                  <p className="text-xs text-gray-400 px-4 py-3">
                                    No time slots yet. Add one below.
                                  </p>
                                )}
                                {dayData.slots.map((slot, si) => (
                                  <div
                                    key={si}
                                    className={cn(
                                      "flex flex-wrap items-center gap-2 px-4 py-2.5",
                                      si < dayData.slots.length - 1 &&
                                        "border-b border-gray-100",
                                    )}>
                                    {/* Start time */}
                                    <div className="relative w-28">
                                      <select
                                        value={slot.start_time}
                                        onChange={(e) =>
                                          updateSlot(di, si, {
                                            start_time: e.target.value,
                                          })
                                        }
                                        className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-[#051e3a] outline-none appearance-none focus:border-[#051e3a] bg-white">
                                        {TIME_OPTIONS.map((t) => (
                                          <option key={t.value} value={t.value}>
                                            {t.label}
                                          </option>
                                        ))}
                                      </select>
                                      <ChevronDown
                                        size={10}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                      />
                                    </div>

                                    <span className="text-xs text-gray-400">
                                      to
                                    </span>

                                    {/* End time */}
                                    <div className="relative w-28">
                                      <select
                                        value={slot.end_time}
                                        onChange={(e) =>
                                          updateSlot(di, si, {
                                            end_time: e.target.value,
                                          })
                                        }
                                        className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-[#051e3a] outline-none appearance-none focus:border-[#051e3a] bg-white">
                                        {TIME_OPTIONS.map((t) => (
                                          <option key={t.value} value={t.value}>
                                            {t.label}
                                          </option>
                                        ))}
                                      </select>
                                      <ChevronDown
                                        size={10}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                      />
                                    </div>

                                    {/* Capacity */}
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs text-gray-400 shrink-0">
                                        Cap:
                                      </span>
                                      <Input
                                        type="number"
                                        min={1}
                                        value={slot.capacity}
                                        onChange={(e) =>
                                          updateSlot(di, si, {
                                            capacity:
                                              parseInt(e.target.value, 10) || 1,
                                          })
                                        }
                                        className="w-20 h-9 border-gray-200 focus-visible:ring-0 focus-visible:border-[#051e3a] text-[#051e3a] text-sm"
                                      />
                                    </div>

                                    {/* Remove slot */}
                                    <button
                                      type="button"
                                      onClick={() => removeSlot(di, si)}
                                      className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))}

                                {/* Add slot */}
                                <div className="px-4 py-2.5 border-t border-gray-100">
                                  <button
                                    type="button"
                                    onClick={() => addSlot(di)}
                                    className="flex items-center gap-1.5 text-sm font-semibold text-[#051e3a] hover:text-[#0a3060] transition-colors">
                                    <Plus size={14} />
                                    Add Available Time
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Waitlist */}
                  <div>
                    <h2 className="text-xl font-bold text-[#051e3a] mb-4">
                      Waitlist
                    </h2>
                    <FormField
                      control={form.control}
                      name="waitlist_enabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between gap-4 p-4 border border-gray-200 rounded-xl">
                          <div>
                            <FormLabel className="text-sm font-semibold text-[#051e3a]">
                              Enable waitlist
                            </FormLabel>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Allow clients to join a waitlist when a session is
                              full
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
                  </div>
                </>
              )}

              {/* ══ Settings ══ */}
              {section === "settings" && (
                <>
                  <div>
                    <h2 className="text-xl font-bold text-[#051e3a] mb-1">
                      Booking rules
                    </h2>
                    <p className="text-sm text-gray-400 mb-6">
                      Control how and when clients can book this service
                    </p>

                    {/* Buffer time */}
                    <FormField
                      control={form.control}
                      name="buffer_time"
                      render={({ field }) => (
                        <FormItem className="mb-5">
                          <FormLabel className="text-sm font-semibold text-[#051e3a]">
                            Buffer time
                          </FormLabel>
                          <p className="text-xs text-gray-400 mb-2">
                            Time blocked after each booking for cleanup or
                            travel
                          </p>
                          <FormControl>
                            <SelectField
                              value={field.value}
                              onChange={(v) => field.onChange(Number(v))}
                              options={BUFFER_OPTIONS.map((o) => ({
                                label: o.label,
                                value: o.value,
                              }))}
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Minimum notice */}
                    <FormField
                      control={form.control}
                      name="min_notice_hours"
                      render={({ field }) => (
                        <FormItem className="mb-5">
                          <FormLabel className="text-sm font-semibold text-[#051e3a]">
                            Minimum notice period
                          </FormLabel>
                          <p className="text-xs text-gray-400 mb-2">
                            How far in advance a client must book
                          </p>
                          <FormControl>
                            <SelectField
                              value={field.value}
                              onChange={(v) => field.onChange(Number(v))}
                              options={NOTICE_OPTIONS.map((o) => ({
                                label: o.label,
                                value: o.value,
                              }))}
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Advance booking limit */}
                    <FormField
                      control={form.control}
                      name="advance_booking_days"
                      render={({ field }) => (
                        <FormItem className="mb-5">
                          <FormLabel className="text-sm font-semibold text-[#051e3a]">
                            Advance booking limit
                          </FormLabel>
                          <p className="text-xs text-gray-400 mb-2">
                            How far ahead clients can book
                          </p>
                          <FormControl>
                            <SelectField
                              value={field.value}
                              onChange={(v) => field.onChange(Number(v))}
                              options={ADVANCE_OPTIONS.map((o) => ({
                                label: o.label,
                                value: o.value,
                              }))}
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Cancellation policy */}
                  <div>
                    <h2 className="text-xl font-bold text-[#051e3a] mb-1">
                      Cancellation policy
                    </h2>
                    <p className="text-sm text-gray-400 mb-4">
                      Set when clients are allowed to cancel their booking
                    </p>

                    <FormField
                      control={form.control}
                      name="cancellation_policy"
                      render={({ field }) => (
                        <FormItem className="mb-5">
                          <div className="space-y-2">
                            {CANCELLATION_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => field.onChange(opt.value)}
                                className={cn(
                                  "w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors",
                                  field.value === opt.value
                                    ? "border-[#051e3a] bg-[#051e3a]/5"
                                    : "border-gray-200 hover:border-gray-300",
                                )}>
                                <span
                                  className={cn(
                                    "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                                    field.value === opt.value
                                      ? "border-[#051e3a]"
                                      : "border-gray-300",
                                  )}>
                                  {field.value === opt.value && (
                                    <span className="w-2 h-2 rounded-full bg-[#051e3a]" />
                                  )}
                                </span>
                                <span
                                  className={cn(
                                    "text-sm font-semibold",
                                    field.value === opt.value
                                      ? "text-[#051e3a]"
                                      : "text-gray-600",
                                  )}>
                                  {opt.label}
                                </span>
                              </button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Refundable option — only when cancellation is allowed */}
                    {cancellationPolicy !== "non_cancellable" && (
                      <div>
                        <p className="text-sm font-semibold text-[#051e3a] mb-3">
                          Cancellation refund
                        </p>
                        <div className="space-y-2">
                          {[
                            {
                              value: true,
                              label: "Refundable",
                              desc: "Clients receive a refund when they cancel",
                            },
                            {
                              value: false,
                              label: "Non-refundable",
                              desc: "No refund is issued on cancellation",
                            },
                          ].map((opt) => (
                            <button
                              key={String(opt.value)}
                              type="button"
                              onClick={() =>
                                form.setValue("is_refundable", opt.value)
                              }
                              className={cn(
                                "w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-colors",
                                isRefundable === opt.value
                                  ? "border-[#051e3a] bg-[#051e3a]/5"
                                  : "border-gray-200 hover:border-gray-300",
                              )}>
                              <span
                                className={cn(
                                  "w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center",
                                  isRefundable === opt.value
                                    ? "border-[#051e3a]"
                                    : "border-gray-300",
                                )}>
                                {isRefundable === opt.value && (
                                  <span className="w-2 h-2 rounded-full bg-[#051e3a]" />
                                )}
                              </span>
                              <div>
                                <p
                                  className={cn(
                                    "text-sm font-semibold",
                                    isRefundable === opt.value
                                      ? "text-[#051e3a]"
                                      : "text-gray-600",
                                  )}>
                                  {opt.label}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {opt.desc}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
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
