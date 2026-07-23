"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

import { useQueryClient } from "@tanstack/react-query";
import { useGetSingleDashboardBusiness } from "@/services/business.service";
import { BUSINESS_CATEGORIES } from "@/lib/data/business-categories";
import { Skeleton } from "@/components/ui/skeleton";

const COMMUNITIES = [
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

const profileSchema = z.object({
  phone_number: z.string().optional(),
  business_category: z.string().min(1, "Please select a category"),
  community: z.array(z.string()),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfileSettings() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { data: bizData, isLoading } = useGetSingleDashboardBusiness(
    session?.user?.id || "",
  );

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const avatarRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone_number: "",
      business_category: "",
      community: [],
    },
  });

  const selectedCommunity = watch("community");

  useEffect(() => {
    const biz = bizData?.data;
    if (!biz) return;
    setValue("phone_number", (biz as any).phone_number ?? "");
    setValue("business_category", biz.business_category ?? "");
    setValue("community", biz.community ?? []);
    setAvatarPreview(biz.image ?? null);
  }, [bizData, setValue]);

  const toggleCommunity = (c: string) => {
    const cur = selectedCommunity ?? [];
    if (cur.includes(c)) {
      setValue("community", cur.filter((x) => x !== c), { shouldDirty: true });
    } else if (cur.length < 3) {
      setValue("community", [...cur, c], { shouldDirty: true });
    }
  };

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile photo must be under 5 MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (values: ProfileForm) => {
    setIsSaving(true);
    try {
      const fd = new FormData();
      if (values.phone_number) fd.append("phone_number", values.phone_number);
      fd.append("business_category", values.business_category);
      fd.append("community", JSON.stringify(values.community));
      if (avatarFile) fd.append("image", avatarFile);

      const res = await fetch("/api/business/settings", {
        method: "PATCH",
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Profile updated successfully");
      setAvatarFile(null);
      queryClient.invalidateQueries({ queryKey: ["getbusiness", session?.user?.id] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <Skeleton className="h-4 w-28 rounded mb-4" />
        <div className="flex items-center gap-5">
          <Skeleton className="w-20 h-20 rounded-full shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-3 w-44 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <Skeleton className="h-4 w-32 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
        <div className="space-y-1">
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-3 w-56 rounded" />
        </div>
        <Skeleton className="h-9 w-full sm:max-w-xs rounded-md" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
        <div className="space-y-1">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-3 w-48 rounded" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[...Array(11)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
    </div>
  );

  const biz = bizData?.data;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ── Avatar ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-[#051e3a] mb-4">
          Profile Photo
        </h3>
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Profile"
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-400 select-none">
                  {biz?.business_name?.[0]?.toUpperCase() ?? "B"}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#051e3a] text-white flex items-center justify-center shadow-md hover:bg-[#0a3060] transition-colors">
              <Camera size={13} />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {biz?.business_name ?? "Your business"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              JPG, PNG or WebP · Max 5 MB
            </p>
            <button
              type="button"
              onClick={() => avatarRef.current?.click()}
              className="mt-2 text-xs font-semibold text-[#051e3a] hover:underline">
              Change photo
            </button>
          </div>
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onAvatarChange}
          />
        </div>
      </div>

      {/* ── Contact Details ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-semibold text-[#051e3a]">
          Contact Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              value={bizData?.data?.email ?? ""}
              disabled
              readOnly
              className="bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400">
              Email address cannot be changed
            </p>
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="phone"
              className="text-sm font-medium text-gray-700">
              Phone number
            </Label>
            <Input
              id="phone"
              type="tel"
              {...register("phone_number")}
              placeholder="+61 4XX XXX XXX"
              className="border-gray-200 focus-visible:ring-0 focus-visible:border-[#051e3a] text-[#051e3a] placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* ── Business Category ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-[#051e3a]">
            Business Category
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            The type of service your business offers
          </p>
        </div>
        <Controller
          name="business_category"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full sm:max-w-xs border-gray-200 focus-visible:ring-0 focus-visible:border-[#051e3a] text-[#051e3a]">
                <SelectValue placeholder="Select a category…" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.business_category && (
          <p className="text-xs text-red-500">
            {errors.business_category.message}
          </p>
        )}
      </div>

      {/* ── Community ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-[#051e3a]">Community</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Select up to 3 communities you serve
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {COMMUNITIES.map((c) => {
            const selected = selectedCommunity?.includes(c);
            const atMax = !selected && (selectedCommunity?.length ?? 0) >= 3;
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCommunity(c)}
                disabled={atMax}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors",
                  selected
                    ? "bg-[#051e3a] text-white border-[#051e3a]"
                    : atMax
                      ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300",
                )}>
                {c}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400">
          {selectedCommunity?.length ?? 0} / 3 selected
        </p>
      </div>

      {/* ── Save ── */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-[#051e3a] hover:bg-[#0a3060] text-white px-8">
          {isSaving && <Loader2 size={14} className="mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
