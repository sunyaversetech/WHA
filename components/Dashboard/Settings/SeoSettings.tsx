"use client";

import { useState, KeyboardEvent } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetSingleDashboardBusiness } from "@/services/business.service";

const MAX_KEYWORDS = 10;
const MAX_DESCRIPTION = 200;

export default function SeoSettings() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { data: bizData, isLoading } = useGetSingleDashboardBusiness(
    session?.user?.id || "",
  );

  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [seededFor, setSeededFor] = useState<string | null>(null);

  const biz = bizData?.data;
  if (biz && seededFor !== (biz._id ?? "")) {
    setSeededFor(biz._id ?? "");
    setKeywords(biz.seo_keywords ?? []);
    setDescription(biz.seo_description ?? "");
  }

  const addKeyword = () => {
    const value = keywordDraft.trim();
    if (!value || keywords.length >= MAX_KEYWORDS) return;
    if (keywords.some((k) => k.toLowerCase() === value.toLowerCase())) {
      setKeywordDraft("");
      return;
    }
    setKeywords((prev) => [...prev, value]);
    setKeywordDraft("");
  };

  const removeKeyword = (value: string) =>
    setKeywords((prev) => prev.filter((k) => k !== value));

  const onKeywordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword();
    } else if (e.key === "Backspace" && !keywordDraft && keywords.length > 0) {
      removeKeyword(keywords[keywords.length - 1]);
    }
  };

  const onSubmit = async () => {
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("seo_keywords", JSON.stringify(keywords));
      fd.append("seo_description", description);

      const res = await fetch("/api/business/settings", {
        method: "PATCH",
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("SEO settings updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["getbusiness", session?.user?.id],
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to update SEO settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <Skeleton className="h-4 w-40 rounded" />
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* ── Keywords ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-[#051e3a]">
            Search keywords
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Add up to {MAX_KEYWORDS} keywords customers might search for to
            help them find your business in the marketplace.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {keywords.map((k) => (
            <span
              key={k}
              className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium rounded-full pl-3 pr-2 py-1">
              {k}
              <button
                type="button"
                onClick={() => removeKeyword(k)}
                className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={13} />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={keywordDraft}
            onChange={(e) => setKeywordDraft(e.target.value)}
            onKeyDown={onKeywordKeyDown}
            disabled={keywords.length >= MAX_KEYWORDS}
            placeholder={
              keywords.length >= MAX_KEYWORDS
                ? "Maximum keywords reached"
                : "Type a keyword and press Enter"
            }
            className="border-gray-200 focus-visible:ring-0 focus-visible:border-[#051e3a] text-[#051e3a] placeholder:text-gray-400"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addKeyword}
            disabled={!keywordDraft.trim() || keywords.length >= MAX_KEYWORDS}>
            Add
          </Button>
        </div>
        <p className="text-xs text-gray-400">
          {keywords.length} / {MAX_KEYWORDS} keywords
        </p>
      </div>

      {/* ── Description ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-[#051e3a]">
            SEO description
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            A short summary shown to help customers and search engines
            understand what your business offers.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="seo_description"
            className="text-sm font-medium text-gray-700">
            Description
          </Label>
          <Textarea
            id="seo_description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value.slice(0, MAX_DESCRIPTION))
            }
            maxLength={MAX_DESCRIPTION}
            rows={4}
            placeholder="Tell customers what makes your business worth booking..."
            className="border-gray-200 focus-visible:ring-0 focus-visible:border-[#051e3a] text-[#051e3a] placeholder:text-gray-400 resize-none"
          />
          <p
            className={cn(
              "text-xs text-right",
              description.length >= MAX_DESCRIPTION
                ? "text-red-500"
                : "text-gray-400",
            )}>
            {description.length} / {MAX_DESCRIPTION}
          </p>
        </div>
      </div>

      {/* ── Save ── */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSaving}
          className="bg-[#051e3a] hover:bg-[#0a3060] text-white px-8">
          {isSaving && <Loader2 size={14} className="mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
