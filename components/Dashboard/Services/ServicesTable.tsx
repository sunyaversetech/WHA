"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Trash2,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useGetServices,
  useDeleteServices,
  useToggleServiceActive,
} from "@/services/services.service";
import { Switch } from "@/components/ui/switch";
import {
  useGetCategories,
  useCreateCategory,
  useDeleteCategory,
  ICategory,
} from "@/services/category.service";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CATEGORY_COLORS } from "./Form/schema";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  name: z.string().min(1, "Name is required").max(100),
  color: z.string().min(1),
  description: z.string().max(255).optional(),
});
type CategoryFormValues = z.infer<typeof categorySchema>;

function AddCategoryDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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
  const descValue = useWatch({ control, name: "description" }) ?? "";

  const onSubmit = (data: CategoryFormValues) => {
    createCategory(
      { name: data.name, color: data.color, description: data.description },
      {
        onSuccess: (res: any) => {
          if (res?.success) {
            toast.success("Category added");
            onClose();
          } else toast.error(res?.error ?? "Failed to create category");
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
            <h2 className="text-xl font-bold text-[#051e3a]">Add category</h2>
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
                  placeholder="e.g. Hair Services"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#051e3a] placeholder:text-gray-400 outline-none focus:border-[#051e3a] transition-colors"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-semibold text-[#051e3a] block mb-1.5">
                  Appointment color
                </label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5">
                  <ColorDot color={selectedColor} />
                  <select
                    {...register("color")}
                    className="flex-1 bg-transparent text-sm text-[#051e3a] outline-none appearance-none cursor-pointer">
                    {CATEGORY_COLORS.map((c) => (
                      <option key={c.label} value={c.label}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="text-gray-400 pointer-events-none shrink-0"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-[#051e3a]">
                  Description
                </label>
                <span className="text-xs text-gray-400">
                  {descValue.length}/255
                </span>
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

// ─── Service 3-dot menu ───────────────────────────────────────────────────────

function ServiceMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
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
            onClick={() => {
              onEdit();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm text-[#051e3a] hover:bg-gray-50 transition-colors">
            <Pencil size={13} /> Edit
          </button>
          <button
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
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
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-sm font-semibold text-[#051e3a] hover:bg-gray-50 transition-colors">
        Actions {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 min-w-[160px]">
          <button
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 transition-colors">
            <Trash2 size={13} /> Delete category
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Add dropdown ─────────────────────────────────────────────────────────────

function AddDropdown({
  onCategory,
  onSingleService,
}: {
  onCategory: () => void;
  onSingleService: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#051e3a] text-white text-sm font-bold hover:bg-[#082040] transition-colors">
        Add <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 min-w-[160px]">
          {[
            {
              label: "Single service",
              action: () => {
                onSingleService();
                setOpen(false);
              },
            },
            {
              label: "Category",
              action: () => {
                onCategory();
                setOpen(false);
              },
            },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              className="w-full text-left px-4 py-2.5 text-sm text-[#051e3a] hover:bg-gray-50 transition-colors">
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ServicesTable() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: servicesData, isLoading: loadingServices } = useGetServices();
  const { data: categoriesData, isLoading: loadingCategories } =
    useGetCategories();
  const { mutate: deleteService } = useDeleteServices();
  const { mutate: deleteCategory } = useDeleteCategory();
  const { mutate: toggleActive } = useToggleServiceActive();

  const allServices = useMemo<any[]>(
    () => (servicesData as any)?.data ?? [],
    [servicesData],
  );
  const allCategories = useMemo<ICategory[] | null>(
    () => categoriesData?.data ?? [],
    [categoriesData],
  );

  const [search, setSearch] = useState("");
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredServices = useMemo(() => {
    let list = [...allServices];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q),
      );
    }
    if (selectedCatId) {
      list = list.filter((s) => s.category_id === selectedCatId);
    }
    return list;
  }, [allServices, search, selectedCatId]);

  const grouped = useMemo<
    { category: ICategory | null; services: any[] }[]
  >(() => {
    if (selectedCatId) {
      const cat = allCategories?.find((c) => c._id === selectedCatId) ?? null;
      return [{ category: cat, services: filteredServices }];
    }
    const uncategorised = filteredServices.filter(
      (s) =>
        !s.category_id || !allCategories?.find((c) => c._id === s.category_id),
    );
    const byCat = allCategories
      ?.map((cat) => ({
        category: cat,
        services: filteredServices.filter((s) => s.category_id === cat._id),
      }))
      .filter((g) => g.services.length > 0);

    const result: { category: ICategory | null; services: any[] }[] = byCat
      ? [...byCat]
      : [];
    if (uncategorised.length > 0)
      result.unshift({ category: null, services: uncategorised });
    return result;
  }, [filteredServices, allCategories, selectedCatId]);

  const handleDeleteService = (id: string) => {
    deleteService(
      { id },
      {
        onSuccess: (res: any) => {
          if (res?.success) {
            toast.success("Service deleted");
            qc.invalidateQueries({ queryKey: ["services"] });
          } else toast.error(res?.error ?? "Failed to delete");
        },
        onError: () => toast.error("Failed to delete service"),
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

  const handleToggleActive = (id: string, next_active: boolean) => {
    toggleActive(
      { id, is_active: next_active },
      {
        onSuccess: (res: any) => {
          if (res?.success) {
            toast.success(
              next_active ? "Service activated" : "Service deactivated",
            );
            qc.invalidateQueries({ queryKey: ["services"] });
          } else toast.error(res?.error ?? "Failed to update service");
        },
        onError: () => toast.error("Failed to update service"),
      },
    );
  };

  const loading = loadingServices || loadingCategories;

  return (
    <div className="min-h-screen ">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-5 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-[#051e3a]">
            Service menu
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 hidden sm:block">
            View and manage the services offered by your business.{" "}
            <span className="text-[#051e3a] font-medium cursor-pointer hover:underline">
              Learn more
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <AddDropdown
            onCategory={() => setAddCatOpen(true)}
            onSingleService={() => router.push("/dashboard/services/add")}
          />
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search service name"
            className="w-full bg-white border border-gray-200 text-[#051e3a] text-sm rounded-full pl-9 pr-4 py-2 outline-none placeholder:text-gray-400 focus:border-[#051e3a] transition-colors"
          />
        </div>

        <button className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 text-sm font-semibold text-[#051e3a] hover:bg-gray-50 transition-colors shrink-0">
          <ArrowUpDown size={13} className="text-gray-400" />
          <span className="hidden sm:inline">Manage order</span>
        </button>
      </div>

      {/* ── Mobile: category tabs (horizontal scroll) ── */}
      <div className="md:hidden -mx-4 px-4 overflow-x-auto mb-4" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-2 pb-1" style={{ width: "max-content" }}>
          <button
            onClick={() => setSelectedCatId(null)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border transition-colors",
              !selectedCatId
                ? "bg-[#051e3a] text-white border-[#051e3a]"
                : "text-[#051e3a] border-gray-200 bg-white hover:bg-gray-50",
            )}>
            All
            <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded-full", !selectedCatId ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500")}>
              {allServices.length}
            </span>
          </button>
          {allCategories?.map((cat) => {
            const count = allServices.filter((s) => s.category_id === cat._id).length;
            const active = selectedCatId === cat._id;
            return (
              <button
                key={cat._id}
                onClick={() => setSelectedCatId(cat._id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border transition-colors",
                  active
                    ? "bg-[#051e3a] text-white border-[#051e3a]"
                    : "text-[#051e3a] border-gray-200 bg-white hover:bg-gray-50",
                )}>
                {cat.name}
                <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded-full", active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500")}>
                  {count}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => setAddCatOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border border-dashed border-gray-300 text-gray-400 hover:text-[#051e3a] hover:border-gray-400 transition-colors">
            <Plus size={12} /> New
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col md:flex-row gap-5 md:gap-7 items-start">
        {/* Categories sidebar — desktop only */}
        <div className="hidden md:block w-52 shrink-0 bg-white border border-gray-200 rounded-2xl p-4">
          <h2 className="text-base font-bold text-[#051e3a] mb-3">
            Categories
          </h2>
          <div className="space-y-0.5">
            <button
              onClick={() => setSelectedCatId(null)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                !selectedCatId
                  ? "bg-[#051e3a] text-white"
                  : "text-[#051e3a] hover:bg-gray-50",
              )}>
              <span>All categories</span>
              <span
                className={cn(
                  "text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center",
                  !selectedCatId
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500",
                )}>
                {allServices.length}
              </span>
            </button>

            {allCategories?.map((cat) => {
              const count = allServices.filter(
                (s) => s.category_id === cat._id,
              ).length;
              const active = selectedCatId === cat._id;
              return (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCatId(cat._id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? "bg-[#051e3a] text-white"
                      : "text-[#051e3a] hover:bg-gray-50",
                  )}>
                  <span className="truncate text-left">{cat.name}</span>
                  <span
                    className={cn(
                      "text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 ml-1",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-500",
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

        {/* Services list */}
        <div className="flex-1 min-w-0 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
              <div className="w-6 h-6 rounded-full border-2 border-[#051e3a] border-t-transparent animate-spin mr-2" />
              Loading…
            </div>
          ) : grouped.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center">
              <p className="text-gray-400 text-sm">
                {search
                  ? `No services matching "${search}"`
                  : "No services yet."}
              </p>
              <button
                onClick={() => router.push("/dashboard/services/add")}
                className="mt-4 px-5 py-2 rounded-full bg-[#051e3a] text-white text-sm font-bold hover:bg-[#082040] transition-colors">
                Add service
              </button>
            </div>
          ) : (
            grouped.map((group) => {
              const catColor = group.category
                ? colorHex(group.category.color)
                : "#94a3b8";
              return (
                <div key={group.category?._id ?? "uncategorised"}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {group.category && (
                        <ColorDot color={group.category.color} size={10} />
                      )}
                      <h2 className="text-base font-bold text-[#051e3a]">
                        {group.category?.name ?? "Uncategorised"}
                      </h2>
                    </div>
                    {group.category && (
                      <CategoryActions
                        onDelete={() =>
                          handleDeleteCategory(group.category!._id)
                        }
                      />
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    {group.services.map((svc, si) => (
                      <div
                        key={svc._id}
                        className={cn(
                          "flex items-stretch hover:bg-gray-50 transition-colors",
                          si < group.services.length - 1 &&
                            "border-b border-gray-100",
                        )}>
                        <div
                          className="w-1 shrink-0"
                          style={{ background: catColor }}
                        />
                        <div className="flex-1 flex items-center justify-between px-3 md:px-4 py-3 md:py-4 min-w-0 gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-[#051e3a] truncate">
                              {svc.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              {fmtDuration(svc.base_duration)}
                              {svc.buffer_time > 0 &&
                                ` · +${fmtDuration(svc.buffer_time)} buffer`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs md:text-sm font-bold text-[#051e3a] whitespace-nowrap">
                              {svc.price_type === "Free"
                                ? "Free"
                                : svc.price_type === "Custom"
                                  ? "Custom"
                                  : `NPR ${Number(svc.base_price ?? 0).toFixed(0)}`}
                            </span>
                            <Switch
                              checked={svc.is_active ?? true}
                              onCheckedChange={(checked) =>
                                handleToggleActive(svc._id, checked)
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                            <ServiceMenu
                              onEdit={() =>
                                router.push(
                                  `/dashboard/services/edit/${svc._id}`,
                                )
                              }
                              onDelete={() => setDeleteConfirmId(svc._id)}
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
      <AddCategoryDialog
        open={addCatOpen}
        onClose={() => setAddCatOpen(false)}
      />

      {deleteConfirmId && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
            <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-[#051e3a] mb-2">
                Delete service?
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-5 py-2 rounded-full border border-gray-200 text-[#051e3a] text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteService(deleteConfirmId)}
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
