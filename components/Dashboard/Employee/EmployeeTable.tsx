"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileText,
  MapPin,
  MoreVertical,
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
  "#0e7490",
  "#7c3aed",
  "#1d4ed8",
  "#be123c",
  "#b45309",
  "#047857",
  "#db2777",
  "#4338ca",
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
  const color = emp.calendar_color ?? AVATAR_COLORS[idx % AVATAR_COLORS.length];
  if (emp.employee_photo) {
    return (
      <div
        className="w-10 h-10 rounded-full overflow-hidden shrink-0"
        style={{ boxShadow: `0 0 0 2px ${color}55` }}>
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
      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
      style={{ background: color, boxShadow: `0 0 0 2px ${color}55` }}>
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
          ? "bg-[#051e3a] border-[#051e3a]"
          : "border-gray-300 hover:border-[#051e3a]",
      )}>
      {checked && <Check size={10} className="text-white" />}
    </button>
  );
}

// ─── Mobile Actions Bottom Sheet ──────────────────────────────────────────────

function MobileActionsSheet({
  open,
  onClose,
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl pb-safe">
        <div className="flex items-center justify-end px-5 py-4 border-b border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            <X size={16} />
          </button>
        </div>
        {[
          {
            label: "Edit",
            action: () => {
              onEdit();
              onClose();
            },
          },
          { label: "View calendar", action: onClose },
          { label: "View scheduled shifts", action: onClose },
          { label: "Add time off", action: onClose },
        ].map(({ label, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            className="w-full text-left px-5 py-4 text-base font-medium text-[#051e3a] border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
            {label}
          </button>
        ))}
        <div className="h-6" />
      </div>
    </>
  );
}

// ─── Desktop Actions Dropdown ─────────────────────────────────────────────────

function ActionsDropdown({ emp, onEdit }: { emp: any; onEdit: () => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    }
    setOpen((v) => !v);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 text-[#051e3a] text-sm font-medium hover:bg-gray-50 transition-colors">
        Actions
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: pos.top,
              right: pos.right,
              zIndex: 9999,
            }}
            className="bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 max-w-50">
            {[
              {
                label: "Edit",
                action: () => {
                  onEdit();
                  setOpen(false);
                },
              },
              { label: "View calendar", action: () => setOpen(false) },
              { label: "View scheduled shifts", action: () => setOpen(false) },
              { label: "Add time off", action: () => setOpen(false) },
            ].map(({ label, action }) => (
              <button
                key={label}
                onClick={action}
                className="w-full text-left px-4 py-2.5 text-sm text-[#051e3a] hover:bg-gray-50 transition-colors">
                {label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

// ─── Options Dropdown ─────────────────────────────────────────────────────────

function OptionsDropdown({ employees }: { employees: any[] }) {
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

  const handleExcel = () => {
    const headers = ["Name", "Email", "Phone", "Job Title", "Status"];
    const rows = employees.map((e) => [
      e.full_name ?? "",
      e.email ?? "",
      e.phone_number ?? "",
      e.job_title ?? "",
      e.is_active !== false ? "Active" : "Archived",
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "team-members.csv";
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const handlePDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Team Members", 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Exported ${new Date().toLocaleDateString()}`, 14, 22);
    autoTable(doc, {
      head: [["Name", "Email", "Phone", "Job Title", "Status"]],
      body: employees.map((e) => [
        e.full_name ?? "",
        e.email ?? "",
        e.phone_number ?? "",
        e.job_title ?? "",
        e.is_active !== false ? "Active" : "Archived",
      ]),
      startY: 27,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [5, 30, 58] },
    });
    doc.save("team-members.pdf");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-[#051e3a] text-sm font-semibold hover:bg-gray-50 transition-colors">
        Options
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 min-w-[168px]">
          <p className="px-4 pt-1.5 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Export
          </p>
          <button
            onClick={handleExcel}
            className="w-full text-left px-4 py-2.5 text-sm text-[#051e3a] hover:bg-gray-50 transition-colors flex items-center gap-2.5">
            <FileSpreadsheet size={14} className="text-green-600 shrink-0" />
            Excel (.csv)
          </button>
          <button
            onClick={handlePDF}
            className="w-full text-left px-4 py-2.5 text-sm text-[#051e3a] hover:bg-gray-50 transition-colors flex items-center gap-2.5">
            <FileText size={14} className="text-red-500 shrink-0" />
            PDF
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
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-[#051e3a] text-sm font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap">
        <svg
          viewBox="0 0 16 16"
          className="w-3.5 h-3.5 text-[#051e3a]"
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
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 min-w-[220px]">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors",
                opt === value
                  ? "text-[#051e3a] font-semibold"
                  : "text-gray-600",
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
        <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      )}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-80 z-50 bg-white border-l border-gray-200 overflow-y-auto transition-transform duration-300 ease-in-out shadow-2xl",
          open ? "translate-x-0" : "translate-x-full",
        )}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-[#051e3a]">All filters</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#051e3a] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Locations */}
        <div className="border-b border-gray-100">
          <button
            onClick={() => setLocOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2.5">
              <MapPin size={15} className="text-gray-400" />
              <span className="text-sm font-semibold text-[#051e3a]">
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
                <div className="w-[18px] h-[18px] rounded border border-gray-300 shrink-0" />
                <span className="text-sm text-gray-600">Select all</span>
              </label>
              <p className="text-xs text-gray-400 italic pl-[30px]">
                No locations configured.
              </p>
            </div>
          )}
        </div>

        {/* Type */}
        <div className="border-b border-gray-100">
          <button
            onClick={() => setTypeOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
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
              <span className="text-sm font-semibold text-[#051e3a]">Type</span>
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
                        ? "bg-[#051e3a] border-[#051e3a]"
                        : "bg-white border-gray-300",
                    )}>
                    {selectedTypes.has(type) && (
                      <Check size={10} className="text-white" />
                    )}
                  </div>
                  <span className="text-sm text-[#051e3a]">{type}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <button
            onClick={() => setStatusOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
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
              <span className="text-sm font-semibold text-[#051e3a]">
                Status
              </span>
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
                  className="w-full flex items-center justify-between py-2.5 text-sm text-[#051e3a] hover:text-[#051e3a]/70 transition-colors">
                  <span>{s}</span>
                  {selectedStatus === s && (
                    <Check size={14} className="text-[#051e3a]" />
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
  const [mobileSheetEmp, setMobileSheetEmp] = useState<any | null>(null);

  const allEmployees = useMemo<any[]>(() => empData?.data ?? [], [empData]);

  const filteredEmployees = useMemo(() => {
    let list = [...allEmployees];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.full_name?.toLowerCase().includes(q) ||
          e.email?.toLowerCase().includes(q) ||
          e.phone_number?.includes(q),
      );
    }
    if (selectedStatus === "Active")
      list = list.filter((e) => e.is_active !== false);
    else if (selectedStatus === "Archived")
      list = list.filter((e) => e.is_active === false);
    if (sort === "Name (A-Z)")
      list.sort((a, b) => a.full_name.localeCompare(b.full_name));
    else if (sort === "Name (Z-A)")
      list.sort((a, b) => b.full_name.localeCompare(a.full_name));
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
    return list;
  }, [allEmployees, search, selectedStatus, sort]);

  const allSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((e) => selectedIds.has(e._id));
  const toggleSelectAll = () =>
    setSelectedIds(
      allSelected ? new Set() : new Set(filteredEmployees.map((e) => e._id)),
    );
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleType = (type: string) =>
    setSelectedTypes((prev) => {
      const n = new Set(prev);
      n.has(type) ? n.delete(type) : n.add(type);
      return n;
    });
  const activeFilterCount =
    (selectedStatus !== "All team members" ? 1 : 0) + selectedTypes.size;

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl md:text-2xl font-bold text-[#051e3a]">
            Team members
          </h1>
          <span className="inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-[#051e3a]/10 text-xs font-bold text-[#051e3a]">
            {allEmployees.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <OptionsDropdown />
          </div>
          <Link href="/dashboard/employees/add">
            <button className="px-4 md:px-5 py-2 rounded-full bg-[#051e3a] text-white text-sm font-bold hover:bg-[#082040] transition-colors">
              Add
            </button>
          </Link>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center gap-2 md:gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search team members"
            className="w-full bg-white border border-gray-200 text-[#051e3a] text-sm rounded-full pl-9 pr-4 py-2 outline-none placeholder:text-gray-400 focus:border-[#051e3a] transition-colors"
          />
        </div>

        {/* Filters */}
        <button
          onClick={() => setFilterOpen(true)}
          className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold text-[#051e3a] hover:bg-gray-50 transition-colors shrink-0">
          <SlidersHorizontal size={14} className="text-gray-400" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#051e3a] text-[10px] font-bold flex items-center justify-center text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort */}
        <div className="hidden md:block ml-auto">
          <SortDropdown value={sort} onChange={setSort} />
        </div>
      </div>

      {/* ── Desktop Table ── */}
      <div className="hidden md:block border border-gray-200 rounded-2xl overflow-hidden bg-white">
        {/* Header row */}
        <div className="grid grid-cols-[44px_1fr_1fr_1fr_160px] px-4 py-3 border-b border-gray-100 bg-gray-50/60">
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
              className="w-2.5 h-2.5 text-gray-400"
              fill="currentColor">
              <path d="M5 0L9.33 5H0.67L5 0Z" />
              <path d="M5 14L0.67 9H9.33L5 14Z" />
            </svg>
          </button>
          <span className="text-xs font-semibold text-gray-400">Contact</span>

          <div />
        </div>

        {/* Rows */}
        {isLoading ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            Loading…
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            {search
              ? `No team members matching "${search}"`
              : "No team members found."}
          </div>
        ) : (
          filteredEmployees.map((emp, idx) => (
            <div
              key={emp._id}
              className={cn(
                "grid grid-cols-[44px_1fr_1fr_1fr_160px] px-4 py-4 items-center hover:bg-gray-50 transition-colors",
                idx < filteredEmployees.length - 1 &&
                  "border-b border-gray-100",
              )}>
              <div className="flex items-center">
                <Checkbox
                  checked={selectedIds.has(emp._id)}
                  onChange={() => toggleSelect(emp._id)}
                />
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <EmpAvatar emp={emp} idx={idx} />
                <span className="text-sm font-semibold text-[#051e3a] truncate flex flex-col">
                  {emp.full_name}
                  <span className="text-xs font-semibold text-gray-500 truncate">
                    {emp.job_title}
                  </span>
                </span>
              </div>
              <div className="text-sm text-gray-500 space-y-0.5 min-w-0">
                {emp.email && <p className="truncate">{emp.email}</p>}
                {emp.phone_number && <p>{emp.phone_number}</p>}
              </div>

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

      <div className="md:hidden bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            Loading…
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            {search ? `No results for "${search}"` : "No team members found."}
          </div>
        ) : (
          filteredEmployees.map((emp, idx) => (
            <div
              key={emp._id}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5",
                idx < filteredEmployees.length - 1 &&
                  "border-b border-gray-100",
              )}>
              <EmpAvatar emp={emp} idx={idx} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#051e3a] truncate">
                  {emp.full_name}
                </p>
                {emp.email && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {emp.email}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileSheetEmp(emp)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-[#051e3a] transition-colors shrink-0">
                <MoreVertical size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* ── Mobile Bottom Sheet ── */}
      <MobileActionsSheet
        open={!!mobileSheetEmp}
        onClose={() => setMobileSheetEmp(null)}
        onEdit={() => {
          if (mobileSheetEmp)
            router.push(`/dashboard/employees/edit/${mobileSheetEmp._id}`);
        }}
      />

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
