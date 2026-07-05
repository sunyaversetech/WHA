"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useGetEmployees,
  useDeleteEmployees,
} from "@/services/employee.service";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  "Custom order",
  "Name (A-Z)",
  "Name (Z-A)",
  "Surname (A-Z)",
  "Surname (Z-A)",
  "Started at (oldest first)",
  "Started at (newest first)",
  "Rating (highest first)",
  "Rating (lowest first)",
  "Updated at (oldest first)",
  "Updated at (newest first)",
];

const STATUS_OPTIONS = ["All team members", "Active", "Archived"] as const;
const TYPE_OPTIONS = ["Bookable", "Non-bookable"] as const;

const AVATAR_COLORS = [
  "bg-teal-600",
  "bg-purple-600",
  "bg-blue-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-emerald-600",
  "bg-pink-600",
  "bg-indigo-600",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function EmpAvatar({ emp, idx }: { emp: any; idx: number }) {
  if (emp.employee_photo) {
    return (
      <div
        className="w-10 h-10 rounded-full overflow-hidden shrink-0"
        style={{ boxShadow: `0 0 0 2px ${emp.calendar_color ?? "#4DD0E1"}44` }}>
        <Image
          src={emp.employee_photo}
          alt={emp.full_name}
          width={40}
          height={40}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-black text-sm font-bold",
        AVATAR_COLORS[idx % AVATAR_COLORS.length],
      )}
      style={{ boxShadow: `0 0 0 2px ${emp.calendar_color ?? "#4DD0E1"}44` }}>
      {initials(emp.full_name)}
    </div>
  );
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "w-[18px] h-[18px] rounded border flex items-center justify-center shrink-0 transition-colors",
        checked
          ? "bg-[#6B5CE7] border-[#6B5CE7]"
          : "border-[#3a3a3a] hover:border-[#555]",
      )}>
      {checked && <Check size={10} className="text-black" />}
    </button>
  );
}

// ─── Actions Dropdown ─────────────────────────────────────────────────────────

function ActionsDropdown({ emp, onEdit }: { emp: any; onEdit: () => void }) {
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
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-300 text-gray-800 text-sm font-medium hover:bg-gray-50 transition-colors">
        Actions
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-999 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 min-w-45">
          <button
            onClick={() => {
              onEdit();
              setOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Edit
          </button>
          <button
            onClick={() => setOpen(false)}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            View calendar
          </button>
          <Link
            href="/dashboard/employees/schedule"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            View scheduled shifts
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Add time off
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Options Dropdown ─────────────────────────────────────────────────────────

function OptionsDropdown() {
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
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#2a2a2a] text-black text-sm font-semibold hover: transition-colors">
        Options
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5  border border-[#2a2a2a] rounded-xl shadow-2xl py-1.5 z-50 min-w-[160px]">
          <button className="w-full text-left px-4 py-2.5 text-sm text-black hover:bg-[#252525] transition-colors">
            Export
          </button>
          <button className="w-full text-left px-4 py-2.5 text-sm text-black hover:bg-[#252525] transition-colors">
            Import
          </button>
          <button className="w-full text-left px-4 py-2.5 text-sm text-black hover:bg-[#252525] transition-colors">
            Archive all
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sort Dropdown ────────────────────────────────────────────────────────────

function SortDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
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
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#2a2a2a]  text-sm font-semibold text-black hover:bg-[#222] transition-colors">
        <svg
          viewBox="0 0 16 16"
          className="w-3.5 h-3.5 text-gray-400"
          fill="currentColor">
          <path
            d="M2 4h12M4 8h8M6 12h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        {value}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5  border border-[#2a2a2a] rounded-xl shadow-2xl py-1.5 z-50 min-w-[220px]">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 text-sm hover:bg-[#252525] transition-colors",
                opt === value ? "text-[#6B5CE7]" : "text-black",
              )}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────

function FilterPanel({
  open,
  onClose,
  selectedStatus,
  onStatusChange,
  selectedTypes,
  onTypeToggle,
}: {
  open: boolean;
  onClose: () => void;
  selectedStatus: string;
  onStatusChange: (s: string) => void;
  selectedTypes: Set<string>;
  onTypeToggle: (t: string) => void;
}) {
  const [locOpen, setLocOpen] = useState(true);
  const [typeOpen, setTypeOpen] = useState(true);
  const [statusOpen, setStatusOpen] = useState(true);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      )}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-80 z-50 bg-[#0e0e0e] border-l border-[#2a2a2a] overflow-y-auto transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
        )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2a2a2a]">
          <h2 className="text-xl font-bold text-black">All filters</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Locations */}
        <div className="border-b border-[#1e1e1e]">
          <button
            onClick={() => setLocOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2.5">
              <MapPin size={15} className="text-gray-400" />
              <span className="text-sm font-semibold text-black">
                Locations
              </span>
            </div>
            {locOpen ? (
              <ChevronUp size={14} className="text-gray-400" />
            ) : (
              <ChevronDown size={14} className="text-gray-400" />
            )}
          </button>
          {locOpen && (
            <div className="px-6 pb-5 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="w-[18px] h-[18px] rounded border border-[#3a3a3a] bg-[#1c1c1c] shrink-0" />
                <span className="text-sm text-black">Select all</span>
              </label>
              <p className="text-xs text-gray-600 italic pl-[30px]">
                No locations configured.
              </p>
            </div>
          )}
        </div>

        {/* Type */}
        <div className="border-b border-[#1e1e1e]">
          <button
            onClick={() => setTypeOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2.5">
              <svg
                className="w-4 h-4 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <span className="text-sm font-semibold text-black">Type</span>
            </div>
            {typeOpen ? (
              <ChevronUp size={14} className="text-gray-400" />
            ) : (
              <ChevronDown size={14} className="text-gray-400" />
            )}
          </button>
          {typeOpen && (
            <div className="px-6 pb-5 space-y-3">
              {TYPE_OPTIONS.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => onTypeToggle(type)}>
                  <div
                    className={cn(
                      "w-[18px] h-[18px] rounded border flex items-center justify-center shrink-0 transition-colors",
                      selectedTypes.has(type)
                        ? "bg-[#6B5CE7] border-[#6B5CE7]"
                        : "bg-[#1c1c1c] border-[#3a3a3a]",
                    )}>
                    {selectedTypes.has(type) && (
                      <Check size={10} className="text-black" />
                    )}
                  </div>
                  <span className="text-sm text-black">{type}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <button
            onClick={() => setStatusOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2.5">
              <svg
                className="w-4 h-4 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5">
                <path
                  d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-sm font-semibold text-black">Status</span>
            </div>
            {statusOpen ? (
              <ChevronUp size={14} className="text-gray-400" />
            ) : (
              <ChevronDown size={14} className="text-gray-400" />
            )}
          </button>
          {statusOpen && (
            <div className="px-6 pb-5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className="w-full flex items-center justify-between py-2.5 text-sm text-black hover:text-[#6B5CE7] transition-colors">
                  <span>{s}</span>
                  {selectedStatus === s && (
                    <Check size={14} className="text-[#6B5CE7]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EmployeeTable() {
  const router = useRouter();
  const { data: empData, isLoading } = useGetEmployees();
  const { mutate: deleteEmp } = useDeleteEmployees();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Custom order");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("Active");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allEmployees = useMemo<any[]>(() => empData?.data ?? [], [empData]);

  const filteredEmployees = useMemo(() => {
    let list = [...allEmployees];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.full_name?.toLowerCase().includes(q) ||
          e.email?.toLowerCase().includes(q) ||
          e.phone_number?.includes(q),
      );
    }

    // Status
    if (selectedStatus === "Active")
      list = list.filter((e) => e.is_active !== false);
    else if (selectedStatus === "Archived")
      list = list.filter((e) => e.is_active === false);

    // Sort
    if (sort === "Name (A-Z)")
      list.sort((a, b) => a.full_name.localeCompare(b.full_name));
    else if (sort === "Name (Z-A)")
      list.sort((a, b) => b.full_name.localeCompare(a.full_name));
    else if (sort === "Surname (A-Z)")
      list.sort((a, b) =>
        (
          a.last_name ??
          a.full_name.split(" ").slice(-1)[0] ??
          ""
        ).localeCompare(
          b.last_name ?? b.full_name.split(" ").slice(-1)[0] ?? "",
        ),
      );
    else if (sort === "Surname (Z-A)")
      list.sort((a, b) =>
        (
          b.last_name ??
          b.full_name.split(" ").slice(-1)[0] ??
          ""
        ).localeCompare(
          a.last_name ?? a.full_name.split(" ").slice(-1)[0] ?? "",
        ),
      );
    else if (sort === "Started at (oldest first)")
      list.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    else if (sort === "Started at (newest first)")
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    else if (sort === "Updated at (oldest first)")
      list.sort(
        (a, b) =>
          new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
      );
    else if (sort === "Updated at (newest first)")
      list.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );

    return list;
  }, [allEmployees, search, selectedStatus, sort]);

  const allSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((e) => selectedIds.has(e._id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEmployees.map((e) => e._id)));
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const toggleType = (type: string) =>
    setSelectedTypes((prev) => {
      const n = new Set(prev);
      if (n.has(type)) n.delete(type);
      else n.add(type);
      return n;
    });

  const activeFilterCount =
    (selectedStatus !== "All team members" ? 1 : 0) + selectedTypes.size;

  return (
    <div className="min-h-screen   p-6 md:p-8">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-black">Team members</h1>
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#1e1e1e] border border-[#2a2a2a] text-xs font-semibold text-gray-300">
            {allEmployees.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <OptionsDropdown />
          <Link href="/dashboard/employees/add">
            <button className="px-5 py-2 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-100 transition-colors">
              Add
            </button>
          </Link>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search team members"
            className="w-full  border border-[#2a2a2a] text-black text-sm rounded-full pl-9 pr-4 py-2 outline-none placeholder:text-gray-500 focus:border-[#444] transition-colors"
          />
        </div>

        {/* Filters */}
        <button
          onClick={() => setFilterOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#2a2a2a]  text-sm font-semibold text-black hover:bg-[#222] transition-colors">
          <SlidersHorizontal size={14} className="text-gray-400" />
          Filters
          {activeFilterCount > 0 && (
            <span
              className="w-4 h-4 rounded-full bg-[#051e3a] text-[10px] font-bold 
            flex items-center justify-center text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort */}
        <div className="ml-auto">
          <SortDropdown value={sort} onChange={setSort} />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="border border-[#2a2a2a] rounded-2xl z-10">
        {/* Header row */}
        <div className="grid grid-cols-[44px_1fr_1fr_1fr_140px] px-4 py-3 border-b border-[#2a2a2a] ">
          <div className="flex items-center">
            <Checkbox checked={allSelected} onChange={toggleSelectAll} />
          </div>
          <button
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 text-left"
            onClick={() =>
              setSort(sort === "Name (A-Z)" ? "Name (Z-A)" : "Name (A-Z)")
            }>
            Name
            <svg
              viewBox="0 0 10 14"
              className="w-2.5 h-2.5 text-gray-500"
              fill="currentColor">
              <path d="M5 0L9.33 5H0.67L5 0Z" />
              <path d="M5 14L0.67 9H9.33L5 14Z" />
            </svg>
          </button>
          <span className="text-xs font-semibold text-gray-400">Contact</span>
          <span className="text-xs font-semibold text-gray-400">
            Permission role
          </span>
          <div />
        </div>

        {/* Rows */}
        {isLoading ? (
          <div className="px-6 py-10 text-center text-gray-500 text-sm">
            Loading...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500 text-sm">
            {search
              ? `No team members matching "${search}"`
              : "No team members found."}
          </div>
        ) : (
          filteredEmployees.map((emp, idx) => (
            <div
              key={emp._id}
              className={cn(
                "grid grid-cols-[44px_1fr_1fr_1fr_140px] px-4 py-4 items-center hover:bg-[#161616] transition-colors",
                idx < filteredEmployees.length - 1 &&
                  "border-b border-[#1e1e1e]",
              )}>
              {/* Checkbox */}
              <div className="flex items-center">
                <Checkbox
                  checked={selectedIds.has(emp._id)}
                  onChange={() => toggleSelect(emp._id)}
                />
              </div>

              {/* Name + Avatar */}
              <div className="flex items-center gap-3 min-w-0">
                <EmpAvatar emp={emp} idx={idx} />
                <span className="text-sm font-semibold text-black truncate">
                  {emp.full_name}
                </span>
              </div>

              {/* Contact */}
              <div className="text-sm text-gray-400 space-y-0.5 min-w-0">
                {emp.email && <p className="truncate">{emp.email}</p>}
                {emp.phone_number && <p>{emp.phone_number}</p>}
              </div>

              {/* Permission role */}
              <span className="text-sm text-gray-400">
                {emp.is_active ? "No access" : "Archived"}
              </span>

              {/* Actions */}
              <div className="flex justify-end">
                <ActionsDropdown
                  emp={emp}
                  onEdit={() =>
                    router.push(`/dashboard/employees/edit/${emp._id}`)
                  }
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Filter Panel ── */}
      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedTypes={selectedTypes}
        onTypeToggle={toggleType}
      />
    </div>
  );
}
