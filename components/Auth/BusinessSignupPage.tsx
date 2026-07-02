"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSingup } from "@/services/Auth/auth.service";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Plus,
  X,
  Check,
  ArrowRight,
  Upload,
  Users,
  Package,
  MoveLeft,
} from "lucide-react";
import {
  EMPLOYEE_CATEGORIES,
  ITEM_CATEGORIES,
} from "@/lib/data/business-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { INPUT } from "./LoginPage";

const LocationMap = dynamic(() => import("./LocationMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
      <span className="text-sm text-slate-400">Loading map…</span>
    </div>
  ),
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

type TimeSlot = { from: string; to: string };
type DaySchedule = { open: boolean; slots: TimeSlot[] };
type WeekSchedule = Record<string, DaySchedule>;

// ─── Constants ────────────────────────────────────────────────────────────────

const CITIES = [
  "Sydney",
  "Melbourne",
  "Brisbane",
  "Perth",
  "Adelaide",
  "Hobart",
  "Canberra",
  "Darwin",
];

const COMMUNITIES = [
  "Not Specified",
  "Nepali",
  "Indian",
  "Bhutanese",
  "Chinese",
  "Filipino",
  "Vietnamese",
  "Other Asian",
  "Middle Eastern",
  "African",
  "European",
  "Latin American",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const TIME_OPTS: { value: string; label: string }[] = (() => {
  const opts = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ap = h < 12 ? "AM" : "PM";
      opts.push({
        value: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
        label: `${h12}:${String(m).padStart(2, "0")} ${ap}`,
      });
    }
  }
  return opts;
})();

const DEFAULT_SCHEDULE: WeekSchedule = DAY_KEYS.reduce(
  (acc, k, i) => ({
    ...acc,
    [k]: {
      open: i < 5,
      slots: i < 5 ? [{ from: "09:00", to: "18:00" }] : [],
    },
  }),
  {} as WeekSchedule,
);

const TOTAL_STEPS = 9;

// ─── Schema ───────────────────────────────────────────────────────────────────

export const signupSchema = z
  .object({
    _id: z.string().optional(),
    business_name: z.string().min(2, "Business name is required"),
    phone_number: z
      .string()
      .min(10, "Valid phone number required")
      .max(10, "Valid phone number required"),
    business_type: z.enum(["employee_based", "item_based"], {
      error: "Please select a booking system",
    }),
    business_category: z.string().min(1, "Please select a category"),
    city: z.string().optional(),
    location: z
      .string()
      .min(1, "Please select your business address from the dropdown"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    is24_7: z.boolean().optional(),
    image: z.any().optional(),
    name: z.string().min(2, "Contact name is required"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Minimum 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    accpetalltermsandcondition: z.boolean().refine((v) => v === true, {
      message: "You must accept the terms",
    }),
    category: z.literal("business"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SingUPFormSchema = z.infer<typeof signupSchema>;

const STEP_FIELDS: Record<number, (keyof SingUPFormSchema)[]> = {
  2: ["business_name", "phone_number"],
  3: ["business_type"],
  4: ["business_category"],
  5: ["city", "location"],
  6: [],
  7: [],
  8: [],
  9: [
    "name",
    "email",
    "password",
    "confirmPassword",
    "accpetalltermsandcondition",
  ],
};

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionHeader({
  tag,
  title,
  sub,
}: {
  tag?: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="mb-10">
      {tag && (
        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
          {tag}
        </p>
      )}
      <h2 className="text-2xl md:text-[32px] font-extrabold text-slate-900 mb-2.5 tracking-tight leading-tight">
        {title}
      </h2>
      <p className="text-[15px] text-slate-500 leading-relaxed">{sub}</p>
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <Label className="mb-1.5 block text-slate-900 font-semibold text-sm">
        {label}
      </Label>
      {children}
      {hint && (
        <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{hint}</p>
      )}
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BusinessSignupPage() {
  const router = useRouter();
  const { mutate, isPending } = useSingup();

  const [step, setStep] = useState(1);
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [selectedDay, setSelectedDay] = useState("mon");
  const [community, setCommunity] = useState<string[]>([]);
  const [venueImages, setVenueImages] = useState<File[]>([]);
  const [venuePreviews, setVenuePreviews] = useState<string[]>([]);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SingUPFormSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      business_name: "",
      phone_number: "",
      business_type: undefined as any,
      business_category: "",
      city: "",
      location: "",
      is24_7: false,
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      accpetalltermsandcondition: false,
      category: "business",
    },
    mode: "onChange",
  });

  const businessType = watch("business_type");
  const is24_7 = watch("is24_7");
  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  const goNext = async () => {
    const fields = STEP_FIELDS[step];
    if (fields?.length) {
      const ok = await trigger(fields);
      if (!ok) return;
    }
    if (step === 8) {
      if (venueImages.length < 3) {
        setImagesError("Please upload at least 3 images (up to 10)");
        return;
      }
      setImagesError(null);
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    if (step <= 1) {
      router.push("/auth/business/login");
      return;
    }
    setStep((s) => s - 1);
  };

  // ── Schedule helpers ────────────────────────────────────────────────────────
  const toggleDay = (key: string) =>
    setSchedule((p) => ({
      ...p,
      [key]: {
        open: !p[key].open,
        slots: !p[key].open ? [{ from: "09:00", to: "18:00" }] : [],
      },
    }));

  const addSlot = (key: string) => {
    if (schedule[key].slots.length >= 2) return;
    setSchedule((p) => ({
      ...p,
      [key]: {
        ...p[key],
        slots: [...p[key].slots, { from: "18:00", to: "21:00" }],
      },
    }));
  };

  const removeSlot = (key: string, i: number) =>
    setSchedule((p) => {
      const slots = p[key].slots.filter((_, j) => j !== i);
      return { ...p, [key]: { open: slots.length > 0, slots } };
    });

  const updateSlot = (key: string, i: number, f: "from" | "to", v: string) =>
    setSchedule((p) => {
      const slots = [...p[key].slots];
      slots[i] = { ...slots[i], [f]: v };
      return { ...p, [key]: { ...p[key], slots } };
    });

  // ── Image helpers ───────────────────────────────────────────────────────────
  const handleImages = (files: FileList | null) => {
    if (!files) return;
    const MAX_MB = 5 * 1024 * 1024;
    const valid: File[] = [];
    Array.from(files).forEach((f) => {
      if (f.size > MAX_MB) {
        toast.error(`"${f.name}" is larger than 5 MB — skipped`);
      } else {
        valid.push(f);
      }
    });
    const incoming = valid.slice(0, 10 - venueImages.length);
    if (!incoming.length) return;
    setVenueImages((p) => {
      const next = [...p, ...incoming];
      if (next.length >= 3) setImagesError(null);
      return next;
    });
    setVenuePreviews((p) => [
      ...p,
      ...incoming.map((f) => URL.createObjectURL(f)),
    ]);
    if (!venueImages.length && incoming.length) setValue("image", incoming[0]);
  };

  const removeImg = (i: number) => {
    setVenueImages((p) => {
      const next = p.filter((_, j) => j !== i);
      setValue("image", next[0] ?? null);
      if (next.length < 3) setImagesError("Please upload at least 3 images");
      return next;
    });
    setVenuePreviews((p) => p.filter((_, j) => j !== i));
  };

  const toggleCommunity = (c: string) =>
    setCommunity((p) =>
      p.includes(c) ? p.filter((x) => x !== c) : p.length < 3 ? [...p, c] : p,
    );

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = (data: SingUPFormSchema) => {
    const fd = new FormData();
    fd.append("business_name", data.business_name);
    fd.append("business_type", data.business_type);
    fd.append("business_category", data.business_category);
    if (data.city) {
      fd.append("city", data.city);
    }
    fd.append("email", data.email);
    fd.append("password", data.password);
    fd.append("category", "business");
    fd.append("name", data.name);
    if (data.phone_number) fd.append("phone_number", data.phone_number);
    if (data.location) fd.append("location", data.location);
    if (data.latitude) fd.append("latitude", String(data.latitude));
    if (data.longitude) fd.append("longitude", String(data.longitude));
    if (data.is24_7) fd.append("is24_7", "true");
    if (community.length) fd.append("community", JSON.stringify(community));
    fd.append("schedule", JSON.stringify(schedule));
    if (venueImages[0]) fd.append("image", venueImages[0]);
    venueImages
      .slice(1)
      .forEach((img, i) => fd.append(`venue_image_${i}`, img));

    mutate(fd as any, {
      onSuccess: () => {
        toast.success("Business registered successfully!");
        router.push("/auth/business/login");
      },
      onError: (err: any) => {
        toast.error(
          err?.response?.data?.message ||
            "Registration failed. Please try again.",
        );
      },
    });
  };

  const categoryList =
    businessType === "employee_based"
      ? EMPLOYEE_CATEGORIES
      : businessType === "item_based"
        ? ITEM_CATEGORIES
        : [];

  return (
    <div className="h-[70vh] sm:min-h-screen  bg-white">
      {/* Progress bar */}
      {step > 1 && (
        <div className="fixed top-0 left-0 right-0 h-0.75 z-50 bg-slate-100">
          <div
            className="h-full bg-linear-to-r from-primary to-[#3771db] transition-[width_.3s_ease]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Step 1: Intro */}
      {step === 1 && (
        <StepIntro
          onContinue={() => setStep(2)}
          onClose={() => router.push("/auth")}
        />
      )}

      {/* Steps 2–9 */}
      {step > 1 && (
        <>
          {/* Fixed top bar */}
          <div className="fixed top-0.75 left-0 right-0 h-15 z-40 bg-white border-b border-slate-100 flex items-center justify-between px-6">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-9 h-9"
              onClick={goBack}>
              <ChevronLeft size={18} />
            </Button>
            <span className="text-sm text-slate-400 font-medium">
              Step {step - 1} of {TOTAL_STEPS - 1}
            </span>
            {step < TOTAL_STEPS ? (
              <Button onClick={goNext} className="gap-2">
                Continue <ArrowRight size={15} />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={isPending}
                className="gap-2">
                {isPending ? "Submitting…" : "Complete setup"}
                {!isPending && <ArrowRight size={15} />}
              </Button>
            )}
          </div>

          {/* Scrollable content */}
          <div className="pt-20 min-h-screen">
            <div className="max-w-175 mx-auto px-6 py-10 pb-24">
              {step === 2 && (
                <StepEssentials register={register} errors={errors} />
              )}
              {step === 3 && (
                <StepBookingSystem control={control} errors={errors} />
              )}
              {step === 4 && (
                <StepCategory
                  control={control}
                  categoryList={categoryList}
                  businessType={businessType}
                  errors={errors}
                />
              )}
              {step === 5 && (
                <StepLocation
                  control={control}
                  errors={errors}
                  setValue={setValue}
                />
              )}
              {step === 6 && (
                <StepHours
                  schedule={schedule}
                  selectedDay={selectedDay}
                  setSelectedDay={setSelectedDay}
                  toggleDay={toggleDay}
                  addSlot={addSlot}
                  removeSlot={removeSlot}
                  updateSlot={updateSlot}
                  is24_7={!!is24_7}
                  setIs24_7={(v) => setValue("is24_7", v)}
                />
              )}
              {step === 7 && (
                <StepCommunity community={community} toggle={toggleCommunity} />
              )}
              {step === 8 && (
                <StepImages
                  previews={venuePreviews}
                  count={venueImages.length}
                  onUpload={handleImages}
                  onRemove={removeImg}
                  fileInputRef={fileInputRef}
                  error={imagesError}
                />
              )}
              {step === 9 && (
                <StepLogin
                  register={register}
                  errors={errors}
                  control={control}
                  showPw={showPw}
                  setShowPw={setShowPw}
                  showCpw={showCpw}
                  setShowCpw={setShowCpw}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Step 1: Intro ────────────────────────────────────────────────────────────

function StepIntro({
  onContinue,
  onClose,
}: {
  onContinue: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  return (
    <div className="min-h-screen flex">
      {/* Left: marketing */}
      <div style={{ marginBottom: 24 }}>
        <Button
          variant={"ghost"}
          className="cursor-pointer w-10 h-10 absolute top-10 left-2 sm:left-10 rounded-full!"
          onClick={() => router.back()}>
          <MoveLeft className="cursor-pointer" />
        </Button>
      </div>
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-16 bg-slate-50">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight max-w-xl tracking-tight">
          Get published on the{" "}
          <span className="text-primary">most popular marketplace</span> to grow
          your business
        </h1>
        <Button onClick={onContinue} className="md:hidden mt-9 w-fit gap-2">
          Get started <ArrowRight size={15} />
        </Button>
      </div>
      {/* Right: step list */}
      <div className="hidden md:flex w-[clamp(320px,42%,520px)] shrink-0 flex-col px-10 lg:px-16 py-16 border-l border-slate-100">
        <div className="flex justify-end gap-3 mb-16">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onContinue} className="gap-2">
            Continue <ArrowRight size={15} />
          </Button>
        </div>
        <div className="flex flex-col gap-9">
          {[
            {
              n: 1,
              t: "Tell us about your business",
              d: "Share some basic info, like your venue name, location and opening hours",
            },
            {
              n: 2,
              t: "Stand out online",
              d: "Add images of your location, select some venue highlights and craft a compelling description",
            },
            {
              n: 3,
              t: "Accept online bookings",
              d: "With a complete profile you're ready to start taking online bookings on the WHA marketplace",
            },
          ].map(({ n, t, d }) => (
            <div key={n} className="flex gap-4 items-start">
              <div className="w-9 h-9 rounded-full shrink-0 bg-primary/10 text-primary flex items-center justify-center font-bold text-[15px]">
                {n}
              </div>
              <div>
                <p className="font-bold text-base text-slate-900 mb-1">{t}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Venue Essentials ─────────────────────────────────────────────────

function StepEssentials({ register, errors }: any) {
  return (
    <div>
      <SectionHeader
        tag="Account setup"
        title="Venue essentials"
        sub="Add the display name you'd like to be known by and how clients can get in touch with you"
      />
      <Field
        label="Location display name"
        error={errors.business_name?.message}
        hint="Public name visible to your clients when booking online. E.g. Trendy Salon Sydney">
        <Input
          {...register("business_name")}
          placeholder="E.g. Trendy Salon Sydney"
          className="h-12 text-base"
          style={INPUT}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#0f172a")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
        />
      </Field>
      <Field
        label="Business phone number"
        error={errors.phone_number?.message}
        hint="The contact number provided for clients to call if there is a problem">
        <div className="flex gap-2.5">
          <div className="border border-slate-200 rounded-md w-24 shrink-0 flex items-center justify-center text-sm text-slate-500 font-semibold bg-slate-50">
            🇦🇺 +61
          </div>
          <Input
            {...register("phone_number")}
            type="tel"
            placeholder="4xx xxx xxx"
            className="flex-1 h-12 text-base"
            style={INPUT}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#0f172a")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
          />
        </div>
      </Field>
    </div>
  );
}

// ─── Step 3: Booking System ───────────────────────────────────────────────────

function StepBookingSystem({ control, errors }: any) {
  const TYPES = [
    {
      value: "employee_based",
      title: "Service Booking",
      badge: "Appointment-based · Staff performs the service",
      examples:
        "Hair Salon, Barber, Massage, Beauty, Physiotherapy, Personal Trainer, Tutor",
      icon: <Users size={28} strokeWidth={1.5} />,
    },
    {
      value: "item_based",
      title: "Resource Booking",
      badge: "Inventory-based · Customers reserve a resource",
      examples:
        "Hotel Rooms, Kayaks, Tennis Courts, Meeting Rooms, Cars, Boats",
      icon: <Package size={28} strokeWidth={1.5} />,
    },
  ];

  return (
    <div>
      <SectionHeader
        tag="Account setup"
        title="Select your booking system"
        sub="Choose how your customers interact with your business"
      />
      <Controller
        name="business_type"
        control={control}
        render={({ field }) => (
          <div className="flex flex-col gap-4">
            {TYPES.map((t) => {
              const active = field.value === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => field.onChange(t.value)}
                  className={cn(
                    "text-left w-full border-2 rounded-2xl p-6 cursor-pointer transition-all flex items-start gap-5",
                    active
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}>
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center",
                      active
                        ? "bg-primary/10 text-primary"
                        : "bg-slate-50 text-slate-500",
                    )}>
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[17px] font-bold text-slate-900">
                        {t.title}
                      </p>
                      {active && (
                        <div className="w-5.5 h-5.5 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Check
                            size={12}
                            className="text-white"
                            strokeWidth={3}
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-primary font-semibold mb-2">
                      {t.badge}
                    </p>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      <span className="font-semibold">Examples: </span>
                      {t.examples}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      />
      {errors.business_type && (
        <p className="text-sm text-red-500 mt-3">
          {errors.business_type.message}
        </p>
      )}
    </div>
  );
}

// ─── Step 4: Category ─────────────────────────────────────────────────────────

function StepCategory({ control, categoryList, businessType, errors }: any) {
  if (!businessType) {
    return (
      <div className="text-center py-20">
        <p className="text-base text-slate-400">
          Go back and select a booking system first
        </p>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        tag="Account setup"
        title="Select your business category"
        sub="Choose the category that best describes your business"
      />
      <Controller
        name="business_category"
        control={control}
        render={({ field }) => (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
            {categoryList.map((cat: any) => {
              const active = field.value === cat.value;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => field.onChange(cat.value)}
                  className={cn(
                    "border-2 rounded-2xl p-5 cursor-pointer transition-all flex flex-col items-center gap-2.5 text-center relative",
                    active
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}>
                  {active && (
                    <div className="absolute top-2 right-2 w-4.5 h-4.5 rounded-full bg-primary flex items-center justify-center">
                      <Check size={10} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                  <div
                    className={cn(active ? "text-primary" : "text-slate-500")}>
                    <Icon size={26} strokeWidth={1.5} />
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold leading-tight",
                      active ? "text-primary" : "text-slate-900",
                    )}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      />
      {errors.business_category && (
        <p className="text-sm text-red-500 mt-3">
          {errors.business_category.message}
        </p>
      )}
    </div>
  );
}

// ─── Step 5: Location & City ──────────────────────────────────────────────────

function StepLocation({
  control,
  errors,
  setValue,
}: {
  control: any;
  errors: any;
  setValue: any;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [locationPicked, setLocationPicked] = useState(false);
  const [touched, setTouched] = useState(false);
  const [markerLat, setMarkerLat] = useState<number | null>(null);
  const [markerLng, setMarkerLng] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const searchAddress = async (q: string) => {
    if (q.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&countrycodes=au&limit=6&addressdetails=1`,
        { headers: { "Accept-Language": "en" } },
      );
      const data: NominatimResult[] = await res.json();
      setSuggestions(data);
      setShowDropdown(data.length > 0);
    } catch {
      setSuggestions([]);
    }
    setIsSearching(false);
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    setLocationPicked(false);
    setTouched(true);
    setValue("location", "");
    setValue("latitude", undefined);
    setValue("longitude", undefined);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(() => searchAddress(v), 450);
  };

  const handleSelect = (s: NominatimResult) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setQuery(s.display_name);
    setValue("location", s.display_name);
    setValue("latitude", lat);
    setValue("longitude", lng);
    setMarkerLat(lat);
    setMarkerLng(lng);
    setLocationPicked(true);
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleMapDragEnd = async (lat: number, lng: number) => {
    setMarkerLat(lat);
    setMarkerLng(lng);
    setIsReverseGeocoding(true);
    setTouched(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await res.json();
      const address: string =
        data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setQuery(address);
      setValue("location", address);
      setValue("latitude", lat);
      setValue("longitude", lng);
      setLocationPicked(true);
    } catch {
      const address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setQuery(address);
      setValue("location", address);
      setValue("latitude", lat);
      setValue("longitude", lng);
      setLocationPicked(true);
    }
    setIsReverseGeocoding(false);
  };

  const clearLocation = () => {
    setQuery("");
    setValue("location", "");
    setValue("latitude", undefined);
    setValue("longitude", undefined);
    setMarkerLat(null);
    setMarkerLng(null);
    setLocationPicked(false);
    setTouched(false);
    setSuggestions([]);
  };

  const busy = isSearching || isReverseGeocoding;
  const showSearchError =
    (touched && query.trim().length > 0 && !locationPicked) ||
    (!locationPicked && !!errors.location?.message);

  return (
    <div>
      <SectionHeader
        title="Where is your business located?"
        sub="Search and select your address. Once selected, drag the pin on the map to fine-tune your exact location."
      />

      {/* Address autocomplete */}
      <Field
        label="Location address"
        hint={
          locationPicked
            ? undefined
            : "Search and select from the dropdown — Australia only."
        }
        error={
          showSearchError
            ? touched && query.trim().length > 0 && !locationPicked
              ? "Please select an address from the dropdown"
              : errors.location?.message
            : undefined
        }>
        <div className="relative">
          <Input
            value={query}
            onChange={handleQueryChange}
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true);
            }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
            placeholder="e.g. 115 George Street, Sydney NSW"
            style={INPUT}
          />

          {/* Right icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {busy && (
              <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-primary animate-spin" />
            )}
            {!busy && locationPicked && (
              <Check size={16} className="text-emerald-500" />
            )}
            {!busy && !locationPicked && query && (
              <button
                type="button"
                onClick={clearLocation}
                className="text-slate-400 hover:text-slate-600 transition-colors flex items-center">
                <X size={16} />
              </button>
            )}
          </div>

          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
              {suggestions.map((s, idx) => (
                <button
                  key={s.place_id}
                  type="button"
                  onMouseDown={() => handleSelect(s)}
                  className={cn(
                    "w-full text-left px-4 py-3 text-sm text-slate-900 leading-relaxed hover:bg-primary/5 transition-colors",
                    idx < suggestions.length - 1 && "border-b border-slate-100",
                  )}>
                  {s.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
      </Field>

      {markerLat !== null && markerLng !== null && (
        <div className="relative z-0 mb-7">
          <p className="text-sm text-slate-400 mb-2 -mt-2">
            {isReverseGeocoding
              ? "Looking up address…"
              : "Drag the pin to fine-tune your exact location"}
          </p>
          <LocationMap
            lat={markerLat}
            lng={markerLng}
            onDragEnd={handleMapDragEnd}
          />
        </div>
      )}

      {/* <Field label="City" error={errors.city?.message}>
        <Controller
          name="city"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Select your city" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field> */}
    </div>
  );
}

// ─── Step 6: Opening Hours ────────────────────────────────────────────────────
function StepHours({
  schedule,
  selectedDay,
  setSelectedDay,
  toggleDay,
  addSlot,
  removeSlot,
  updateSlot,
  is24_7,
  setIs24_7,
}: {
  schedule: WeekSchedule;
  selectedDay: string;
  setSelectedDay: (d: string) => void;
  toggleDay: (k: string) => void;
  addSlot: (k: string) => void;
  removeSlot: (k: string, i: number) => void;
  updateSlot: (k: string, i: number, f: "from" | "to", v: string) => void;
  is24_7: boolean;
  setIs24_7: (v: boolean) => void;
}) {
  const day = schedule[selectedDay];

  return (
    <div>
      <SectionHeader
        title="Add your opening hours"
        sub="Let clients know your standard opening hours. These will be displayed on your profile."
      />

      {/* 24/7 toggle */}
      <div
        className={cn(
          "flex items-center justify-between p-4 border-2 rounded-xl mb-7",
          is24_7
            ? "border-primary/30 bg-primary/5"
            : "border-slate-200 bg-white",
        )}>
        <div>
          <p className="font-bold text-slate-900 text-[15px]">Open 24/7</p>
          <p className="text-sm text-slate-500 mt-0.5">
            Your business is open all day, every day
          </p>
        </div>
        <Switch checked={is24_7} onCheckedChange={setIs24_7} />
      </div>

      {!is24_7 && (
        <>
          {/* Day tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {DAYS.map((d, i) => {
              const key = DAY_KEYS[i];
              const sel = selectedDay === key;
              const isOpen = schedule[key].open;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(key)}
                  className={cn(
                    "px-3.5 py-2 rounded-full border-2 text-sm font-bold transition-all",
                    sel
                      ? "border-primary bg-primary text-white"
                      : isOpen
                        ? "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
                        : "border-slate-200 bg-slate-50 text-slate-400",
                  )}>
                  {d}
                </button>
              );
            })}
          </div>

          {/* Selected day detail */}
          <div className="border-2 border-slate-200 rounded-2xl p-6">
            <div
              className={cn(
                "flex items-center justify-between",
                day.open ? "mb-5" : "mb-0",
              )}>
              <div>
                <p className="font-bold text-base text-slate-900">
                  {DAYS[DAY_KEYS.indexOf(selectedDay)]}
                </p>
                <p
                  className={cn(
                    "text-sm font-semibold mt-0.5",
                    day.open ? "text-emerald-500" : "text-slate-400",
                  )}>
                  {day.open ? "Open" : "Closed"}
                </p>
              </div>
              <Switch
                checked={day.open}
                onCheckedChange={() => toggleDay(selectedDay)}
              />
            </div>

            {day.open && (
              <div className="flex flex-col gap-3">
                {day.slots.map((slot, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <select
                      value={slot.from}
                      onChange={(e) =>
                        updateSlot(selectedDay, i, "from", e.target.value)
                      }
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-3 text-base md:text-sm text-slate-900 bg-white cursor-pointer focus:outline-none focus:border-primary transition-colors">
                      {TIME_OPTS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-slate-400 font-semibold shrink-0 text-sm">
                      To
                    </span>
                    <select
                      value={slot.to}
                      onChange={(e) =>
                        updateSlot(selectedDay, i, "to", e.target.value)
                      }
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-3 text-base md:text-sm text-slate-900 bg-white cursor-pointer focus:outline-none focus:border-primary transition-colors">
                      {TIME_OPTS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeSlot(selectedDay, i)}
                      className="text-slate-400 hover:text-slate-600 transition-colors p-1 shrink-0">
                      <X size={18} />
                    </button>
                  </div>
                ))}
                {day.slots.length < 2 && (
                  <button
                    type="button"
                    onClick={() => addSlot(selectedDay)}
                    className="flex items-center gap-2 text-primary font-semibold text-sm py-1.5 hover:opacity-80 transition-opacity">
                    <Plus size={16} /> Add another shift
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Step 7: Community ────────────────────────────────────────────────────────

function StepCommunity({
  community,
  toggle,
}: {
  community: string[];
  toggle: (c: string) => void;
}) {
  return (
    <div>
      <SectionHeader
        tag="WHA Communities"
        title="Select your community"
        sub="Help customers from your community find you. Select up to 3 communities."
      />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-2.5">
        {COMMUNITIES.map((c) => {
          const active = community.includes(c);
          const disabled = community.length >= 3 && !active;
          return (
            <button
              key={c}
              type="button"
              onClick={() => !disabled && toggle(c)}
              className={cn(
                "border-2 rounded-xl p-3.5 transition-all flex items-center justify-between gap-2",
                active
                  ? "border-primary bg-primary/5"
                  : "border-slate-200 bg-white hover:border-slate-300",
                disabled && "opacity-40 cursor-not-allowed",
              )}>
              <span
                className={cn(
                  "text-sm text-left",
                  active
                    ? "font-bold text-primary"
                    : "font-medium text-slate-900",
                )}>
                {c}
              </span>
              {active && (
                <div className="w-4.5 h-4.5 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Check size={10} className="text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-slate-400 mt-4">
        {community.length}/3 selected
      </p>
    </div>
  );
}

// ─── Step 8: Venue Images ─────────────────────────────────────────────────────

function StepImages({
  previews,
  count,
  onUpload,
  onRemove,
  fileInputRef,
  error,
}: {
  previews: string[];
  count: number;
  onUpload: (f: FileList | null) => void;
  onRemove: (i: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  error?: string | null;
}) {
  return (
    <div>
      <SectionHeader
        title="Add venue images"
        sub="Quality images help attract clients. Add at least 3 images (up to 10, max 5 MB each). The first image becomes your cover."
      />

      {/* Guidelines */}
      <div className="bg-slate-50 rounded-2xl p-5 mb-7 border border-slate-100">
        <p className="font-bold text-slate-900 mb-3.5 text-[15px]">
          Venue image guidelines
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          {[
            { ok: true, t: "Clear interior images of your space" },
            { ok: false, t: "Stock images" },
            { ok: true, t: "At least 3 images required (up to 10)" },
            { ok: false, t: "Logos and brand images" },
            { ok: true, t: "High resolution (916 × 500 px)" },
            { ok: false, t: "Max 5 MB per image" },
          ].map(({ ok, t }) => (
            <span
              key={t}
              className={cn(
                "text-sm flex items-center gap-1.5",
                ok ? "text-emerald-700" : "text-red-700",
              )}>
              {ok ? "✅" : "❌"} {t}
            </span>
          ))}
        </div>
      </div>

      {/* Count indicator */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={cn(
            "text-sm font-semibold",
            count === 0
              ? "text-slate-400"
              : count < 3
                ? "text-amber-500"
                : "text-emerald-500",
          )}>
          {count} / 10 images
          {count > 0 && count < 3 && ` — ${3 - count} more required`}
          {count >= 3 && " — minimum reached ✓"}
        </span>
        {count === 10 && (
          <span className="text-xs text-slate-400">Maximum reached</span>
        )}
      </div>
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {/* Upload area */}
      {count < 10 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onUpload(e.dataTransfer.files);
          }}
          className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center cursor-pointer mb-6 bg-slate-50 hover:border-primary hover:bg-primary/5 transition-all group">
          <Upload
            size={36}
            className="text-slate-400 group-hover:text-primary/60 mx-auto mb-3.5 transition-colors"
          />
          <p className="font-bold text-base text-slate-900 mb-1">
            Drag and drop your images here
          </p>
          <p className="text-sm text-slate-400 mb-4">Or click to browse</p>
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}>
            Choose a file
          </Button>
          <p className="text-xs text-slate-400 mt-3.5">
            File type: jpg, png · Min 916 × 500 px · Max 5 MB per image
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onUpload(e.target.files)}
          />
        </div>
      )}

      {/* Preview grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
          {previews.map((src, i) => (
            <div
              key={i}
              className="relative aspect-4/3 rounded-xl overflow-hidden border border-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/55 flex items-center justify-center">
                <X size={13} className="text-white" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1.5 left-1.5 bg-primary text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  Cover
                </span>
              )}
            </div>
          ))}
          {count < 10 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-4/3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-all">
              <Plus size={24} className="text-slate-400" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Step 9: Login Information ────────────────────────────────────────────────

function StepLogin({
  register,
  errors,
  control,
  showPw,
  setShowPw,
  showCpw,
  setShowCpw,
}: any) {
  return (
    <div>
      <SectionHeader
        tag="Almost done"
        title="Login information"
        sub="Set up your contact details and account credentials to complete registration"
      />

      <Field label="Contact name" error={errors.name?.message}>
        <Input
          {...register("name")}
          placeholder="Full name"
          className="h-12 text-base"
          style={INPUT}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#0f172a")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
        />
      </Field>

      <Field
        label="Email"
        error={errors.email?.message}
        hint="This will be your login email address">
        <Input
          {...register("email")}
          type="email"
          placeholder="your@email.com"
          className="h-12 text-base"
          style={INPUT}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#0f172a")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
        />
      </Field>

      <Field label="Password" error={errors.password?.message}>
        <div className="relative">
          <Input
            {...register("password")}
            type={showPw ? "text" : "password"}
            placeholder="Minimum 6 characters"
            className="h-12 text-base pr-12"
            style={INPUT}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#0f172a")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 text-slate-400 hover:text-slate-600">
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </Button>
        </div>
      </Field>

      <Field label="Confirm password" error={errors.confirmPassword?.message}>
        <div className="relative">
          <Input
            {...register("confirmPassword")}
            type={showCpw ? "text" : "password"}
            placeholder="Re-enter your password"
            className="h-12 text-base pr-12"
            style={INPUT}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#0f172a")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowCpw(!showCpw)}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 text-slate-400 hover:text-slate-600">
            {showCpw ? <EyeOff size={18} /> : <Eye size={18} />}
          </Button>
        </div>
      </Field>

      {/* Terms */}
      <Controller
        name="accpetalltermsandcondition"
        control={control}
        render={({ field }) => (
          <div className="flex items-start gap-3 mb-2">
            <Checkbox
              id="terms"
              checked={field.value}
              onCheckedChange={field.onChange}
              className="mt-0.5"
            />
            <Label
              htmlFor="terms"
              className="text-sm text-slate-500 leading-relaxed font-normal cursor-pointer">
              I agree to the{" "}
              <a
                href="/terms"
                className="text-primary font-semibold hover:underline">
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className="text-primary font-semibold hover:underline">
                Privacy Policy
              </a>
            </Label>
          </div>
        )}
      />
      {errors.accpetalltermsandcondition && (
        <p className="text-sm text-red-500 mb-4">
          {errors.accpetalltermsandcondition.message}
        </p>
      )}

      <p className="text-sm text-slate-400 mt-5 text-center">
        Already have an account?{" "}
        <a
          href="/auth/business/login"
          className="text-primary font-semibold hover:underline">
          Log in
        </a>
      </p>
    </div>
  );
}
