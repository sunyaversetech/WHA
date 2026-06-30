"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronLeft, Eye, EyeOff, Camera } from "lucide-react";
import { EMPLOYEE_CATEGORIES, ITEM_CATEGORIES } from "@/lib/data/business-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useSingup } from "@/services/Auth/auth.service";
import { useRouter } from "next/navigation";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────
   Schema — only fields collected on this simple form are
   required; everything else is optional so the service
   type stays compatible and can be filled post-signup.
───────────────────────────────────────────────────────── */
export const signupSchema = z
  .object({
    // required on this form
    business_name: z.string().min(2, "Business name is required"),
    business_type: z.string().min(1, "Select a service model"),
    business_category: z.string().min(1, "Select a category"),
    email: z.email().min(1, "Email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    accpetalltermsandcondition: z.boolean().refine((v) => v === true, {
      message: "You must accept the Terms & Privacy Policy",
    }),
    category: z.literal("business"),
    image: z
      .any()
      .refine((f) => f instanceof File, "Logo is required")
      .refine((f) => f && f.size <= 3 * 1024 * 1024, "Max 3 MB")
      .refine(
        (f) => f && ["image/jpeg", "image/jpg", "image/png"].includes(f.type),
        "PNG or JPG only",
      ),
    // filled later in dashboard onboarding — optional here
    name: z.string().optional(),
    phone_number: z.string().optional(),
    community: z.string().optional(),
    community_name: z.string().optional(),
    city: z.string().optional(),
    city_name: z.string().optional(),
    location: z.string().optional(),
    longitude: z.number().optional(),
    latitude: z.number().optional(),
    is24_7: z.boolean().optional(),
    schedule: z.array(z.any()).optional(),
    business_type_extra: z.string().optional(),
    _id: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SingUPFormSchema = z.infer<typeof signupSchema>;

export default function BusinessSignup() {
  const router = useRouter();
  const { mutate, isPending } = useSingup();
  const [showPw, setShowPw] = useState(false);
  const [showCp, setShowCp] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<SingUPFormSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      category: "business",
      accpetalltermsandcondition: false,
    },
  });

  const businessType = useWatch({ control, name: "business_type" });
  const selectedCategory = useWatch({ control, name: "business_category" });

  const categoryList =
    businessType === "employee_based"
      ? EMPLOYEE_CATEGORIES
      : businessType === "item_based"
        ? ITEM_CATEGORIES
        : [];

  // Reset category whenever the model changes
  useEffect(() => {
    setValue("business_category", "" as any, { shouldValidate: false });
  }, [businessType, setValue]);

  const onSubmit = (values: SingUPFormSchema) => {
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (v instanceof File) {
        fd.append(k, v);
        return;
      }
      fd.append(k, String(v));
    });
    mutate(fd, {
      onSuccess: () => {
        toast.success("Business registered! Please log in.");
        router.push("/auth?tab=login");
      },
      onError: (err: any) => {
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Registration failed.",
        );
      },
    });
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* ── Left panel ── */}
      <div className="flex flex-1 flex-col overflow-y-auto px-6">
        {/* Back */}

        {/* Form area */}
        <div className="flex flex-1 items-start justify-center py-8">
          <div className="w-full max-w-[440px]">
            <div className="pt-6 mt-10">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex h-9 w-9 cursor-pointer mb-5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition">
                <ChevronLeft size={18} />
              </button>
            </div>
            <h1 className="mb-1.5 text-[28px] font-extrabold tracking-tight text-slate-900">
              WH Australia for businesses
            </h1>
            <p className="mb-8 text-sm leading-relaxed text-slate-500">
              Create a business account to promote your services and reach
              customers across Australia.
            </p>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-5">
              {/* Business name */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="business_name"
                  className="text-sm font-semibold text-slate-900">
                  Business name
                </Label>
                <Input
                  id="business_name"
                  {...register("business_name")}
                  placeholder="e.g. Sydney Surf Co."
                  className="h-12 rounded-xl border-slate-200 text-[15px] focus-visible:ring-slate-900"
                />
                {errors.business_name && (
                  <p className="text-xs text-red-500">
                    {errors.business_name.message}
                  </p>
                )}
              </div>

              {/* Service model */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-900">
                  Service operational model
                </Label>
                <Select
                  onValueChange={(v) =>
                    setValue("business_type", v, { shouldValidate: true })
                  }>
                  <SelectTrigger className="h-12 p-6 px-3 rounded-xl border-slate-200 text-[15px] w-full ">
                    <SelectValue placeholder="How do you deliver your service?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee_based">
                      Staff / Employee based (e.g. haircut, massage, consulting)
                    </SelectItem>
                    <SelectItem value="item_based">
                      Item / Inventory based (e.g. kayak, boat, surfboard
                      rental)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.business_type && (
                  <p className="text-xs text-red-500">
                    {errors.business_type.message}
                  </p>
                )}
              </div>

              {/* Category grid — shown only after model is selected */}
              {businessType && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-900">
                  Category
                </Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {categoryList.map(({ label, value, icon: Icon }) => {
                    const active = selectedCategory === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setValue("business_category", value, {
                            shouldValidate: true,
                          })
                        }
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center text-xs font-semibold transition
                          ${
                            active
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                          }`}>
                        <Icon size={18} />
                        <span className="leading-tight">{label}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.business_category && (
                  <p className="text-xs text-red-500">
                    {errors.business_category.message}
                  </p>
                )}
              </div>
              )}

              {/* Logo upload */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-900">
                  Business logo
                </Label>
                <label
                  className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition
                  ${errors.image ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"}
                  ${preview ? "h-40" : "h-32"}`}>
                  {preview ? (
                    <div className="relative h-full w-full overflow-hidden rounded-xl">
                      <Image
                        src={preview}
                        alt="logo preview"
                        fill
                        unoptimized
                        className="object-contain p-2"
                      />
                      <span className="absolute inset-x-0 bottom-2 text-center text-[11px] font-medium text-slate-500">
                        Click to change
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                        <Camera size={18} className="text-slate-600" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        Upload logo
                      </p>
                      <p className="text-xs text-slate-400">
                        PNG or JPG · max 3 MB
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 3 * 1024 * 1024) {
                        toast.error("Max file size is 3 MB");
                        return;
                      }
                      if (
                        !["image/png", "image/jpeg", "image/jpg"].includes(
                          file.type,
                        )
                      ) {
                        toast.error("Use PNG or JPG only");
                        return;
                      }
                      setPreview(URL.createObjectURL(file));
                      setValue("image", file, { shouldValidate: true });
                    }}
                  />
                </label>
                {errors.image && (
                  <p className="text-xs text-red-500">
                    {errors.image.message as string}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-sm font-semibold text-slate-900">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="business@email.com"
                  className="h-12 rounded-xl border-slate-200 text-[15px] focus-visible:ring-slate-900"
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold text-slate-900">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    {...register("password")}
                    placeholder="••••••••"
                    className="h-12 rounded-xl border-slate-200 pr-11 text-[15px] focus-visible:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-semibold text-slate-900">
                  Confirm password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showCp ? "text" : "password"}
                    {...register("confirmPassword")}
                    placeholder="••••••••"
                    className="h-12 rounded-xl border-slate-200 pr-11 text-[15px] focus-visible:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCp((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showCp ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Terms */}
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  {...register("accpetalltermsandcondition")}
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-slate-900"
                />
                <span className="text-[13px] leading-relaxed text-slate-500">
                  I agree to the{" "}
                  <a
                    href="/privacy"
                    className="font-medium text-blue-500 hover:underline">
                    Privacy Policy
                  </a>
                  ,{" "}
                  <a
                    href="/privacy"
                    className="font-medium text-blue-500 hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy"
                    className="font-medium text-blue-500 hover:underline">
                    Terms of Business
                  </a>
                </span>
              </label>
              {errors.accpetalltermsandcondition && (
                <p className="text-xs text-red-500">
                  {errors.accpetalltermsandcondition.message}
                </p>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isPending}
                className="h-12 w-full rounded-full bg-slate-900 text-[16px] font-bold hover:bg-slate-800">
                {isPending ? "Creating account…" : "Create business account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <a
                href="/auth?tab=login"
                className="font-semibold text-blue-500 hover:underline">
                Log in
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* ── Right image panel ── */}
      <div className="sticky top-0 hidden h-screen w-[46%] shrink-0 md:block">
        <div className="relative h-full w-full">
          <Image
            src="/wha/wha-auth.png"
            alt="WH Australia"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}
