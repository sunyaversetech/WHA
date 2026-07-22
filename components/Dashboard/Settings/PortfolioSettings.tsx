"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { toast } from "sonner";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useGetSingleDashboardBusiness } from "@/services/business.service";
import { Skeleton } from "@/components/ui/skeleton";

const MAX_IMAGES = 20;
const MAX_SIZE_MB = 3;

export default function PortfolioSettings() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { data: bizData, isLoading } = useGetSingleDashboardBusiness(
    session?.user?.id || "",
  );

  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const originalUrlCount = bizData?.data?.portfolio_images?.length ?? 0;

  useEffect(() => {
    const biz = bizData?.data;
    if (!biz) return;
    setTimeout(() => {
      setExistingUrls(biz.portfolio_images ?? []);
    }, 0);
  }, [bizData]);

  const totalCount = existingUrls.length + newFiles.length;
  const hasChanges =
    newFiles.length > 0 || existingUrls.length !== originalUrlCount;

  const onFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid: File[] = [];
    for (const f of files) {
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`"${f.name}" exceeds ${MAX_SIZE_MB} MB and was skipped`);
        continue;
      }
      if (totalCount + valid.length >= MAX_IMAGES) {
        toast.error(`Maximum ${MAX_IMAGES} images allowed`);
        break;
      }
      valid.push(f);
    }
    if (!valid.length) return;
    setNewFiles((p) => [...p, ...valid]);
    setNewPreviews((p) => [...p, ...valid.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeExisting = (idx: number) =>
    setExistingUrls((p) => p.filter((_, i) => i !== idx));

  const removeNew = (idx: number) => {
    setNewFiles((p) => p.filter((_, i) => i !== idx));
    setNewPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const onSave = async () => {
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("existing_portfolio", JSON.stringify(existingUrls));
      newFiles.forEach((f, i) => fd.append(`portfolio_image_${i}`, f));

      const res = await fetch("/api/business/settings", {
        method: "PATCH",
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Portfolio updated successfully");
      setNewFiles([]);
      setNewPreviews([]);
      queryClient.invalidateQueries({
        queryKey: ["getbusiness", session?.user?.id],
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to update portfolio");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-3 w-64 rounded" />
          </div>
          <Skeleton className="h-7 w-14 rounded-full shrink-0" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-xl" />
          ))}
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-[#051e3a]">
              Portfolio Photos
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Upload up to {MAX_IMAGES} photos · Max {MAX_SIZE_MB} MB each ·
              Hover a photo to remove it
            </p>
          </div>
          <span
            className={cn(
              "text-sm font-semibold px-3 py-1 rounded-full shrink-0",
              totalCount >= MAX_IMAGES
                ? "bg-red-50 text-red-600"
                : totalCount >= 3
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700",
            )}>
            {totalCount} / {MAX_IMAGES}
          </span>
        </div>

        {/* Empty state */}
        {totalCount === 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full py-12 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center gap-3 text-gray-400 hover:border-[#051e3a] hover:text-[#051e3a] transition-colors">
            <Upload size={32} />
            <div className="text-center">
              <p className="text-sm font-semibold">
                Click to upload portfolio photos
              </p>
              <p className="text-xs mt-1">
                PNG, JPG, WebP — up to {MAX_SIZE_MB} MB each
              </p>
            </div>
          </button>
        )}

        {/* Image grid */}
        {totalCount > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {existingUrls.map((url, i) => (
              <div
                key={`ex-${i}`}
                className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group bg-gray-50">
                <Image
                  src={url}
                  alt={`Portfolio ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeExisting(i)}
                    className="opacity-0 group-hover:opacity-100 w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg transition-opacity hover:bg-red-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}

            {newPreviews.map((src, i) => (
              <div
                key={`new-${i}`}
                className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-[#051e3a]/40 group bg-gray-50">
                <Image
                  src={src}
                  alt={`New ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-[#051e3a] text-white text-[10px] font-bold leading-none">
                  NEW
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeNew(i)}
                    className="opacity-0 group-hover:opacity-100 w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg transition-opacity hover:bg-red-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}

            {totalCount < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-[#051e3a] transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-[#051e3a]">
                <ImagePlus size={22} />
                <span className="text-xs font-semibold">Add photo</span>
              </button>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onFilesChange}
        />

        {totalCount > 0 && totalCount < 3 && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-4 py-2.5">
            Add at least 3 photos to showcase your work effectively.
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onSave}
          disabled={isSaving || !hasChanges}
          className="bg-[#051e3a] hover:bg-[#0a3060] text-white px-8">
          {isSaving && <Loader2 size={14} className="mr-2 animate-spin" />}
          {isSaving ? "Saving…" : "Save Portfolio"}
        </Button>
      </div>
    </div>
  );
}
