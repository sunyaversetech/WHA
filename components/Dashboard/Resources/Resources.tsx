"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  MoreVertical,
  Plus,
  Search,
  SlidersHorizontal,
  Pencil,
  Trash2,
  Users,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetResources, useDeleteResource, useToggleResourceActive } from "@/services/resource.service";
import { Switch } from "@/components/ui/switch";
import {
  useGetCategories,
  useCreateCategory,
  useDeleteCategory,
  ICategory,
} from "@/services/category.service";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CATEGORY_COLORS } from "@/components/Dashboard/Services/Form/schema";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(mins: number): string {
  if (!mins) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  return m > 0 ? `${h} hr, ${m} min` : `${h} hr`;
}

function colorHex(colorLabel: string): string {
  return CATEGORY_COLORS.find((c) => c.label === colorLabel)?.hex ?? "#14b8a6";
}

function ColorDot({ color, size = 14 }: { color: string; size?: number }) {
  const hex = colorHex(color);
  return (
    <span
      className="inline-block rounded-full shrink-0"
      style={{ width: size, height: size, background: hex }}
    />
  );
}

// ─── Add Category Dialog ──────────────────────────────────────────────────────

const categorySchema = z.object({
  name:        z.string().min(1, "Name is required").max(100),
  color:       z.string().min(1),
  description: z.string().max(255).optional(),
});
type CategoryFormValues = z.infer<typeof categorySchema>;

function AddCategoryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mutate: createCategory, isPending } = useCreateCategory();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", color: "Blue", description: "" },
  });
  const selectedColor = useWatch({ control, name: "color" }) ?? "Blue";
  const descValue     = useWatch({ control, name: "description" }) ?? "";

  const onSubmit = (data: CategoryFormValues) => {
    createCategory(
      { name: data.name, color: data.color, description: data.description, type: "resource" },
      {
        onSuccess: (res: any) => {
          if (res?.success) { toast.success("Category added"); onClose(); }
          else toast.error(res?.error ?? "Failed to create category");
        },
        onError: () => toast.error("Failed to create category"),
      },
    );
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#051e3a]">Add resource category</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-[#051e3a] block mb-1.5">
                  Category name
                </label>
                <input
                  {...register("name")}
                  placeholder="e.g. Treatment Rooms"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#051e3a] placeholder:text-gray-400 outline-none focus:border-[#051e3a] transition-colors"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-semibold text-[#051e3a] block mb-1.5">
                  Color
                </label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5">
                  <ColorDot color={selectedColor} />
                  <select
                    {...register("color")}
                    className="flex-1 bg-transparent text-sm text-[#051e3a] outline-none appearance-none cursor-pointer">
                    {CATEGORY_COLORS.map((c) => (
                      <option key={c.label} value={c.label}>{c.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="text-gray-400 pointer-events-none shrink-0" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-[#051e3a]">Description</label>
                <span className="text-xs text-gray-400">{descValue.length}/255</span>
              </div>
              <textarea
                {...register("description")}
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#051e3a] placeholder:text-gray-400 outline-none focus:border-[#051e3a] transition-colors resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-full border border-gray-200 text-[#051e3a] text-sm font-semibold hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 rounded-full bg-[#051e3a] text-white text-sm font-bold hover:bg-[#082040] disabled:opacity-60 transition-colors">
                {isPending ? "Adding…" : "Add"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Resource 3-dot menu ──────────────────────────────────────────────────────

function ResourceMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-[#051e3a] transition-colors">
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 min-w-[150px]">
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm text-[#051e3a] hover:bg-gray-50 transition-colors">
            <Pencil size={13} /> Edit
          </button>
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 transition-colors">
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Category actions dropdown ────────────────────────────────────────────────

function CategoryActions({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-sm font-semibold text-[#051e3a] hover:bg-gray-50 transition-colors">
        Actions <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 min-w-40">
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 transition-colors">
            <Trash2 size={13} /> Delete category
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Resources() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: resourcesData, isLoading: loadingResources } = useGetResources();
  const { data: categoriesData, isLoading: loadingCategories } = useGetCategories("resource");
  const { mutate: deleteResource } = useDeleteResource();
  const { mutate: deleteCategory } = useDeleteCategory();
  const { mutate: toggleActive }   = useToggleResourceActive();

  const allResources  = useMemo<any[]>(() => (resourcesData as any)?.data ?? [], [resourcesData]);
  const allCategories = useMemo<ICategory[]>(() => categoriesData?.data ?? [], [categoriesData]);

  const [search, setSearch]               = useState("");
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [addCatOpen, setAddCatOpen]       = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...allResources];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) => r.name?.toLowerCase().includes(q) || r.category?.toLowerCase().includes(q),
      );
    }
    if (selectedCatId) {
      list = list.filter((r) => r.category_id === selectedCatId);
    }
    return list;
  }, [allResources, search, selectedCatId]);

  const grouped = useMemo<{ category: ICategory | null; resources: any[] }[]>(() => {
    if (selectedCatId) {
      const cat = allCategories.find((c) => c._id === selectedCatId) ?? null;
      return [{ category: cat, resources: filtered }];
    }
    const uncategorised = filtered.filter(
      (r) => !r.category_id || !allCategories.find((c) => c._id === r.category_id),
    );
    const byCat = allCategories
      .map((cat) => ({
        category: cat,
        resources: filtered.filter((r) => r.category_id === cat._id),
      }))
      .filter((g) => g.resources.length > 0);

    const result: { category: ICategory | null; resources: any[] }[] = [...byCat];
    if (uncategorised.length > 0) result.unshift({ category: null, resources: uncategorised });
    return result;
  }, [filtered, allCategories, selectedCatId]);

  const handleDelete = (id: string) => {
    deleteResource(
      { id },
      {
        onSuccess: (res: any) => {
          if (res?.success) toast.success("Resource deleted");
          else toast.error(res?.error ?? "Failed to delete");
        },
        onError: () => toast.error("Failed to delete resource"),
      },
    );
    setDeleteConfirmId(null);
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id, {
      onSuccess: (res: any) => {
        if (res?.success) toast.success("Category deleted");
        else toast.error(res?.error ?? "Failed to delete category");
      },
      onError: () => toast.error("Failed to delete category"),
    });
  };

  const handleToggleActive = (id: string, next: boolean) => {
    toggleActive(
      { id, is_active: next },
      {
        onSuccess: (res: any) => {
          if (res?.success) {
            toast.success(next ? "Resource activated" : "Resource deactivated");
            qc.invalidateQueries({ queryKey: ["resources"] });
          } else toast.error(res?.error ?? "Failed to update resource");
        },
        onError: () => toast.error("Failed to update resource"),
      },
    );
  };

  const loading = loadingResources || loadingCategories;

  return (
    <div className="min-h-screen">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#051e3a]">Resources</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage the bookable resources available in your business.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/resources/add")}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#051e3a] text-white text-sm font-bold hover:bg-[#082040] transition-colors">
          <Plus size={14} /> Add resource
        </button>
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources"
            className="w-full bg-white border border-gray-200 text-[#051e3a] text-sm rounded-full pl-9 pr-4 py-2 outline-none placeholder:text-gray-400 focus:border-[#051e3a] transition-colors"
          />
        </div>
        <button className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold text-[#051e3a] hover:bg-gray-50 transition-colors">
          <SlidersHorizontal size={13} className="text-gray-400" />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col md:flex-row gap-5 md:gap-7 items-start">
        {/* Categories sidebar */}
        <div className="w-full md:w-52 shrink-0 bg-white border border-gray-200 rounded-2xl p-4">
          <h2 className="text-base font-bold text-[#051e3a] mb-3">Categories</h2>
          <div className="space-y-0.5">
            <button
              onClick={() => setSelectedCatId(null)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                !selectedCatId ? "bg-[#051e3a] text-white" : "text-[#051e3a] hover:bg-gray-50",
              )}>
              <span>All categories</span>
              <span
                className={cn(
                  "text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center",
                  !selectedCatId ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500",
                )}>
                {allResources.length}
              </span>
            </button>

            {allCategories.map((cat) => {
              const count  = allResources.filter((r) => r.category_id === cat._id).length;
              const active = selectedCatId === cat._id;
              return (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCatId(cat._id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    active ? "bg-[#051e3a] text-white" : "text-[#051e3a] hover:bg-gray-50",
                  )}>
                  <span className="truncate text-left">{cat.name}</span>
                  <span
                    className={cn(
                      "text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 ml-1",
                      active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500",
                    )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setAddCatOpen(true)}
            className="mt-3 w-full text-left px-3 py-2 text-sm font-semibold text-[#051e3a] hover:text-[#082040] transition-colors flex items-center gap-1.5">
            <Plus size={13} /> Add category
          </button>
        </div>

        {/* Resources list */}
        <div className="flex-1 min-w-0 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
              <div className="w-6 h-6 rounded-full border-2 border-[#051e3a] border-t-transparent animate-spin mr-2" />
              Loading…
            </div>
          ) : grouped.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center">
              <p className="text-gray-400 text-sm">
                {search ? `No resources matching "${search}"` : "No resources yet."}
              </p>
              <button
                onClick={() => router.push("/dashboard/resources/add")}
                className="mt-4 px-5 py-2 rounded-full bg-[#051e3a] text-white text-sm font-bold hover:bg-[#082040] transition-colors">
                Add resource
              </button>
            </div>
          ) : (
            grouped.map((group) => {
              const catColor = group.category ? colorHex(group.category.color) : "#94a3b8";
              return (
                <div key={group.category?._id ?? "uncategorised"}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {group.category && <ColorDot color={group.category.color} size={10} />}
                      <h2 className="text-base font-bold text-[#051e3a]">
                        {group.category?.name ?? "Uncategorised"}
                      </h2>
                    </div>
                    {group.category && (
                      <CategoryActions
                        onDelete={() => handleDeleteCategory(group.category!._id)}
                      />
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    {group.resources.map((res, ri) => (
                      <div
                        key={res._id}
                        className={cn(
                          "flex items-stretch hover:bg-gray-50 transition-colors",
                          ri < group.resources.length - 1 && "border-b border-gray-100",
                        )}>
                        <div className="w-1 shrink-0" style={{ background: catColor }} />
                        <div className="flex-1 flex items-center justify-between px-4 py-4 min-w-0">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#051e3a] truncate">{res.name}</p>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              <p className="text-xs text-gray-400">
                                {fmtDuration(res.base_duration)}
                                {res.buffer_time > 0 && ` · +${fmtDuration(res.buffer_time)} buffer`}
                              </p>
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                {res.allow_multiple_bookings ? (
                                  <>
                                    <Users size={11} />
                                    Up to {res.max_concurrent_bookings} at once
                                  </>
                                ) : (
                                  <>
                                    <User size={11} />
                                    1 at a time
                                  </>
                                )}
                              </span>
                              {res.availability_type === "always" ? (
                                <span className="text-xs text-green-600 font-medium">Always available</span>
                              ) : (
                                <span className="text-xs text-amber-600 font-medium">Specific days</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-4">
                            <span className="text-sm font-bold text-[#051e3a] whitespace-nowrap">
                              {res.price_type === "Free"
                                ? "Free"
                                : res.price_type === "Custom"
                                  ? "Custom"
                                  : `NPR ${Number(res.base_price ?? 0).toFixed(0)}`}
                            </span>
                            <Switch
                              checked={res.is_active ?? true}
                              onCheckedChange={(checked) => handleToggleActive(res._id, checked)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <ResourceMenu
                              onEdit={() => router.push(`/dashboard/resources/edit/${res._id}`)}
                              onDelete={() => setDeleteConfirmId(res._id)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Dialogs ── */}
      <AddCategoryDialog open={addCatOpen} onClose={() => setAddCatOpen(false)} />

      {deleteConfirmId && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
            <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-[#051e3a] mb-2">Delete resource?</h2>
              <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-5 py-2 rounded-full border border-gray-200 text-[#051e3a] text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="px-5 py-2 rounded-full bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
