"use client";

import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Check,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  User,
  X,
} from "lucide-react";
import { DatePickerField } from "./DatePickerField";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import { EmployeeFormValues, employeeSchema, IEmployee } from "./schema";
import { useCreateOrUpdateEmployee } from "@/services/employee.service";
import { useGetServices } from "@/services/services.service";

// ─── Constants ────────────────────────────────────────────────────────────────

const CALENDAR_COLORS = [
  "#4DD0E1",
  "#4DB6AC",
  "#81B3D2",
  "#9FA8DA",
  "#CE93D8",
  "#BA68C8",
  "#F48FB1",
  "#F06292",
  "#EF9A9A",
  "#FFAB40",
  "#FF8A65",
  "#FFB74D",
  "#FFF176",
  "#C5E1A5",
  "#A5D6A7",
  "#80DEEA",
  "#4DD0E1",
];

const COUNTRY_CODES = ["+977", "+61", "+1", "+44", "+91", "+64"];

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

// ─── Shared styles ────────────────────────────────────────────────────────────

const INP =
  "bg-white border-gray-200 text-[#051e3a] placeholder:text-gray-400 " +
  "focus-visible:ring-0 focus-visible:border-[#051e3a] h-11 rounded-lg text-base md:text-sm";

const LBL = "text-sm font-medium text-[#051e3a] mb-1.5 block";

const SEL =
  "bg-white border border-gray-200 text-[#051e3a] rounded-lg px-3 h-11 " +
  "text-base md:text-sm focus:outline-none focus:border-[#051e3a] appearance-none";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab =
  | "profile"
  | "addresses"
  | "emergency"
  | "services"
  | "locations"
  | "settings";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(min: number) {
  if (!min) return "";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} hr, ${m} min` : `${h} hr`;
}

// ─── Sub-components (must live outside parent to satisfy React Compiler) ──────

function NavItem({
  label,
  tab,
  count,
  activeTab,
  onSelect,
}: {
  label: string;
  tab: Tab;
  count?: number;
  activeTab: Tab;
  onSelect: (t: Tab) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(tab)}
      className={cn(
        "w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between",
        activeTab === tab
          ? "bg-[#051e3a] text-white"
          : "text-gray-500 hover:text-[#051e3a] hover:bg-gray-100",
      )}>
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "text-xs rounded-full w-5 h-5 flex items-center justify-center",
            activeTab === tab
              ? "bg-white/20 text-white"
              : "bg-gray-100 text-gray-500",
          )}>
          {count}
        </span>
      )}
    </button>
  );
}

type Address = { name: string; address: string };

function AddressDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (a: Address) => void;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  if (!open) return null;

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), address: address.trim() });
    setName("");
    setAddress("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[#051e3a]">Add address</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-[#051e3a] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium text-[#051e3a] mb-1.5 block">
            Address name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            autoFocus
            className="w-full bg-white border border-gray-200 text-[#051e3a] rounded-lg px-4 h-11 text-base md:text-sm focus:outline-none focus:border-[#051e3a] placeholder:text-gray-400"
          />
        </div>

        <div className="mb-8">
          <label className="text-sm font-medium text-[#051e3a] mb-1.5 block">
            Address
          </label>
          <div className="relative">
            <MapPin
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="w-full bg-white border border-gray-200 text-[#051e3a] rounded-lg pl-10 pr-4 h-11 text-base md:text-sm focus:outline-none focus:border-[#051e3a] placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!name.trim()}
            className="flex-1 py-3 rounded-full bg-[#051e3a] text-white text-sm font-bold hover:bg-[#082040] transition-colors disabled:opacity-40">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

type EmergencyContact = { name: string; relation: string; phone: string };

function EmergencyContactDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (c: EmergencyContact) => void;
}) {
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [phone, setPhone] = useState("");

  if (!open) return null;

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      relation: relation.trim(),
      phone: phone.trim(),
    });
    setName("");
    setRelation("");
    setPhone("");
    onClose();
  };

  const inputCls =
    "w-full bg-white border border-gray-200 text-[#051e3a] rounded-lg px-4 h-11 " +
    "text-base md:text-sm focus:outline-none focus:border-[#051e3a] placeholder:text-gray-400";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[#051e3a]">
            Add emergency contact
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-[#051e3a] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium text-[#051e3a] mb-1.5 block">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="e.g. Jane Doe"
            className={inputCls}
          />
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium text-[#051e3a] mb-1.5 block">
            Relationship
          </label>
          <input
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            placeholder="e.g. Spouse, Parent, Sibling"
            className={inputCls}
          />
        </div>

        <div className="mb-8">
          <label className="text-sm font-medium text-[#051e3a] mb-1.5 block">
            Phone number
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            type="tel"
            placeholder="e.g. +61 4xx xxx xxx"
            className={inputCls}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!name.trim()}
            className="flex-1 py-3 rounded-full bg-[#051e3a] text-white text-sm font-bold hover:bg-[#082040] transition-colors disabled:opacity-40">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function ChkBox({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors",
        checked
          ? "bg-[#051e3a]"
          : "border border-gray-300 hover:border-[#051e3a]",
      )}>
      {checked && <Check size={11} className="text-white" />}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface EmployeeFormProps {
  initialData?: IEmployee | null;
}

export function EmployeeForm({ initialData }: EmployeeFormProps) {
  const router = useRouter();
  const { mutate, isPending } = useCreateOrUpdateEmployee();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── UI state ──
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [previewUrl, setPreviewUrl] = useState(
    initialData?.employee_photo || "",
  );
  const [calendarColor, setCalendarColor] = useState(CALENDAR_COLORS[0]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [allowBookings, setAllowBookings] = useState(true);
  const [noteLen, setNoteLen] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<
    EmergencyContact[]
  >([]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [workStartDate, setWorkStartDate] = useState<Date | null>(null);
  const [workEndDate, setWorkEndDate] = useState<Date | null>(null);

  const { data: servicesData } = useGetServices();
  const allServices = useMemo(
    () => (servicesData?.data ?? []) as any[],
    [servicesData],
  );

  console.log("allServices", allServices, servicesData);

  const filteredByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    const q = serviceSearch.toLowerCase();
    for (const s of allServices) {
      if (q && !s.name?.toLowerCase().includes(q)) continue;
      const cat = s.category || "Other";
      (grouped[cat] ??= []).push(s);
    }
    return grouped;
  }, [allServices, serviceSearch]);

  const toggleService = (id: string) =>
    setSelectedServices((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  const toggleCategory = (ids: string[]) => {
    const allSel = ids.every((id) => selectedServices.includes(id));
    setSelectedServices((p) =>
      allSel
        ? p.filter((id) => !ids.includes(id))
        : [...new Set([...p, ...ids])],
    );
  };

  const toggleAll = () =>
    setSelectedServices((p) =>
      p.length === allServices.length ? [] : allServices.map((s) => s._id),
    );

  // ── Form ──
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: initialData
      ? {
          _id: initialData._id,
          full_name: initialData.full_name,
          email: initialData.email || "",
          phone_number: initialData.phone_number || "",
          bio: initialData.bio || "",
          employee_photo: initialData.employee_photo || "",
          is_active: initialData.is_active,
          availability_schedule: initialData.availability_schedule || [],
          service_overrides: initialData.service_overrides || [],
        }
      : {
          full_name: "",
          email: "",
          phone_number: "",
          bio: "",
          employee_photo: "",
          is_active: true,
          availability_schedule: DAYS_OF_WEEK.map((day) => ({
            day_of_week: day,
            is_working: true,
            shift_start: "09:00",
            shift_end: "17:00",
          })),
          service_overrides: [],
        },
  });

  async function onSubmit(data: EmployeeFormValues) {
    const fd = new FormData();
    if (data._id) fd.append("_id", data._id);

    fd.append("full_name", data.full_name);
    if (data.email) fd.append("email", data.email);
    fd.append("phone_number", data.phone_number || "");
    fd.append("additional_phone_number", data.additional_phone_number || "");
    fd.append("country", data.country || "");
    fd.append("bio", data.bio || "");

    if (birthday) {
      const dd = String(birthday.getDate()).padStart(2, "0");
      const mm = String(birthday.getMonth() + 1).padStart(2, "0");
      fd.append("birthday", `${dd}/${mm}`);
    }

    fd.append("job_title", data.job_title || "");
    fd.append("employment_type", data.employment_type || "");
    fd.append("employee_id", data.employee_id || "");

    if (workStartDate) {
      const dd = String(workStartDate.getDate()).padStart(2, "0");
      const mm = String(workStartDate.getMonth() + 1).padStart(2, "0");
      fd.append("employment_start_date", `${dd}/${mm}`);
    }
    if (workEndDate) {
      const dd = String(workEndDate.getDate()).padStart(2, "0");
      const mm = String(workEndDate.getMonth() + 1).padStart(2, "0");
      fd.append("employment_end_date", `${dd}/${mm}`);
    }

    fd.append("calendar_color", calendarColor);
    fd.append("is_active", String(allowBookings));
    fd.append("addresses", JSON.stringify(addresses));
    fd.append("emergency_contacts", JSON.stringify(emergencyContacts));
    fd.append(
      "availability_schedule",
      JSON.stringify(data.availability_schedule),
    );
    fd.append(
      "service_overrides",
      JSON.stringify(selectedServices.map((id) => ({ service_id: id }))),
    );

    if (data.employee_photo instanceof File) {
      fd.append("employee_photo", data.employee_photo);
    }

    mutate(fd as any, {
      onSuccess: () => router.push("/dashboard/employees"),
      onError: (err) => console.error(err),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white text-[#051e3a] flex flex-col">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-gray-100 shrink-0">
        <h1 className="text-xl md:text-2xl font-bold text-[#051e3a]">
          {initialData ? "Edit team member" : "Add team member"}
        </h1>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Close
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isPending}
            className="px-5 py-2 rounded-full bg-[#051e3a] text-white text-sm font-bold hover:bg-[#082040] transition-colors disabled:opacity-50 flex items-center gap-2">
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {initialData ? "Save" : "Add"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden px-4 md:px-10 py-6 md:py-8 gap-8">
        {/* ── Sidebar ── */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-2 space-y-0.5">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-3 py-2">
              Personal
            </p>
            <NavItem
              label="Profile"
              tab="profile"
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
            <NavItem
              label="Addresses"
              tab="addresses"
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
            <NavItem
              label="Emergency contacts"
              tab="emergency"
              activeTab={activeTab}
              onSelect={setActiveTab}
            />

            <div className="border-t border-gray-200 mx-2 my-1.5" />

            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-3 py-2">
              Workspace
            </p>
            <NavItem
              label="Services"
              tab="services"
              count={selectedServices.length || allServices.length}
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
            <NavItem
              label="Settings"
              tab="settings"
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
          </div>
        </aside>

        {/* ── Mobile tab pills ── */}
        <div className="md:hidden flex gap-2 overflow-x-auto [scrollbar-width:none] shrink-0 absolute left-0 right-0 px-4 pt-2">
          {(
            [
              ["profile", "Profile"],
              ["addresses", "Addresses"],
              ["emergency", "Emergency"],
              ["services", "Services"],
              ["locations", "Locations"],
              ["settings", "Settings"],
            ] as [Tab, string][]
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border shrink-0 transition-colors",
                activeTab === tab
                  ? "bg-[#051e3a] text-white border-[#051e3a]"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50",
              )}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto max-w-2xl space-y-8 pb-12 mt-12 md:mt-0">
          {/* ══ Profile ══ */}
          {activeTab === "profile" && (
            <>
              <div>
                <h2 className="text-xl font-bold text-[#051e3a]">Profile</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your team member&apos;s personal profile
                </p>
              </div>

              {/* Avatar */}
              <div className="relative w-24 h-24">
                <div className="w-24 h-24 rounded-full bg-[#e8edf5] flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="Avatar"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={40} className="text-[#051e3a]/40" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
                  <Pencil size={12} className="text-[#051e3a]" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setValue("employee_photo", f);
                      setPreviewUrl(URL.createObjectURL(f));
                    }
                  }}
                />
              </div>

              {/* Full name */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={LBL}>
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input {...register("full_name")} className={INP} />
                  {errors.full_name && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.full_name.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Email / Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input {...register("email")} type="email" className={INP} />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className={LBL}>Phone number</label>
                  <div className="flex gap-2">
                    <select className={cn(SEL, "w-24 shrink-0")}>
                      {COUNTRY_CODES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <Input
                      {...register("phone_number")}
                      className={cn(INP, "flex-1")}
                    />
                  </div>
                </div>
              </div>

              {/* Additional phone / Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>Additional phone number</label>
                  <div className="flex gap-2">
                    <select className={cn(SEL, "w-24 shrink-0")}>
                      {COUNTRY_CODES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <Input className={cn(INP, "flex-1")} />
                  </div>
                </div>
                <div>
                  <label className={LBL}>Country</label>
                  <select className={cn(SEL, "w-full text-gray-400")}>
                    <option value="">Select country</option>
                    <option>Australia</option>
                    <option>Nepal</option>
                    <option>India</option>
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>New Zealand</option>
                  </select>
                </div>
              </div>

              {/* Birthday / Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>Birthday</label>
                  <DatePickerField
                    value={birthday}
                    onChange={setBirthday}
                    placeholder="Day and month"
                  />
                </div>
                <div>
                  <label className={LBL}>Year</label>
                  <Input placeholder="Year" className={INP} />
                </div>
              </div>

              {/* Calendar color */}
              <div>
                <label className={LBL}>Calendar color</label>
                <div className="flex flex-wrap gap-2">
                  {CALENDAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCalendarColor(color)}
                      className={cn(
                        "w-9 h-9 rounded-full transition-all",
                        calendarColor === color &&
                          "ring-2 ring-[#051e3a] ring-offset-2 ring-offset-white",
                      )}
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Job title */}
              <div>
                <label className={LBL}>Job title</label>
                <Input className={INP} />
                <p className="text-xs text-gray-400 mt-1.5">
                  Visible to clients online
                </p>
              </div>

              <div className="border-t border-gray-100" />

              {/* Work details */}
              <div>
                <h2 className="text-xl font-bold text-[#051e3a]">
                  Work details
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your team member&apos;s start date, and employment
                  details
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>Start date</label>
                  <DatePickerField
                    value={workStartDate}
                    onChange={setWorkStartDate}
                    placeholder="Day and month"
                  />
                </div>
                <div>
                  <label className={LBL}>Year</label>
                  <Input placeholder="Year" className={INP} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>End date</label>
                  <DatePickerField
                    value={workEndDate}
                    onChange={setWorkEndDate}
                    placeholder="Day and month"
                  />
                </div>
                <div>
                  <label className={LBL}>Year</label>
                  <Input placeholder="Year" className={INP} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>Employment type</label>
                  <select className={cn(SEL, "w-full text-gray-400")}>
                    <option value="">Select an option</option>
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Casual</option>
                    <option>Contractor</option>
                  </select>
                </div>
                <div>
                  <label className={LBL}>Team member ID</label>
                  <Input className={INP} />
                  <p className="text-xs text-gray-400 mt-1.5">
                    An identifier used for external systems like payroll
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-[#051e3a]">
                    Notes
                  </label>
                  <span className="text-xs text-gray-400">{noteLen}/1000</span>
                </div>
                <Textarea
                  {...register("bio", {
                    onChange: (e) => setNoteLen(e.target.value.length),
                  })}
                  maxLength={1000}
                  placeholder="Add a private note only viewable in the team member list"
                  className="bg-white border-gray-200 text-[#051e3a] placeholder:text-gray-400 focus-visible:ring-0 focus-visible:border-[#051e3a] rounded-lg min-h-30 resize-none text-sm"
                />
              </div>
            </>
          )}

          {/* ══ Addresses ══ */}
          {activeTab === "addresses" && (
            <>
              <div>
                <h2 className="text-xl font-bold text-[#051e3a]">Addresses</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your team member&apos;s correspondence addresses.
                </p>
              </div>

              {addresses.map((addr, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between bg-gray-50 rounded-xl px-4 py-3.5 border border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-[#051e3a]">
                      {addr.name}
                    </p>
                    {addr.address && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {addr.address}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setAddresses((p) => p.filter((_, j) => j !== i))
                    }
                    className="text-[#051e3a] text-sm font-semibold hover:opacity-60 transition-opacity shrink-0 ml-4">
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setShowAddressModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-[#051e3a] hover:bg-gray-50 transition-colors">
                <Plus size={16} />
                Add an address
              </button>

              <AddressDialog
                open={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                onAdd={(a) => setAddresses((p) => [...p, a])}
              />
            </>
          )}

          {/* ══ Emergency contacts ══ */}
          {activeTab === "emergency" && (
            <>
              <div>
                <h2 className="text-xl font-bold text-[#051e3a]">
                  Emergency Contacts
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your team members&apos; emergency contacts.
                </p>
              </div>

              {emergencyContacts.map((c, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between bg-gray-50 rounded-xl px-4 py-3.5 border border-gray-100">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-[#051e3a]">
                      {c.name}
                    </p>
                    {c.relation && (
                      <p className="text-xs text-gray-500">{c.relation}</p>
                    )}
                    {c.phone && (
                      <p className="text-xs text-gray-400">{c.phone}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEmergencyContacts((p) => p.filter((_, j) => j !== i))
                    }
                    className="text-[#051e3a] text-sm font-semibold hover:opacity-60 transition-opacity shrink-0 ml-4">
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setShowEmergencyModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-[#051e3a] hover:bg-gray-50 transition-colors">
                <Plus size={16} />
                Add an emergency contact
              </button>

              <EmergencyContactDialog
                open={showEmergencyModal}
                onClose={() => setShowEmergencyModal(false)}
                onAdd={(c) => setEmergencyContacts((p) => [...p, c])}
              />
            </>
          )}

          {/* ══ Services ══ */}
          {activeTab === "services" && (
            <>
              <div>
                <h2 className="text-xl font-bold text-[#051e3a]">Services</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Choose the services this team member provides
                </p>
              </div>

              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <Input
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  placeholder="Search services"
                  className={cn(INP, "pl-10")}
                />
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="w-full flex items-center gap-3 py-3 px-2 hover:bg-gray-50 rounded-xl transition-colors">
                  <ChkBox
                    checked={
                      allServices.length > 0 &&
                      selectedServices.length === allServices.length
                    }
                    onToggle={toggleAll}
                  />
                  <span className="font-semibold text-[#051e3a]">
                    All services
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                    {allServices.length}
                  </span>
                </button>

                {Object.entries(filteredByCategory).map(([cat, svcs]) => {
                  const catIds = svcs.map((s) => s._id);
                  const catAllSel = catIds.every((id) =>
                    selectedServices.includes(id),
                  );
                  return (
                    <div key={cat}>
                      <button
                        type="button"
                        onClick={() => toggleCategory(catIds)}
                        className="w-full flex items-center gap-3 py-2.5 px-2 hover:bg-gray-50 rounded-xl transition-colors mt-1">
                        <ChkBox
                          checked={catAllSel}
                          onToggle={() => toggleCategory(catIds)}
                        />
                        <span className="font-semibold text-[#051e3a] capitalize">
                          {cat}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                          {svcs.length}
                        </span>
                      </button>

                      {svcs.map((svc) => (
                        <button
                          key={svc._id}
                          type="button"
                          onClick={() => toggleService(svc._id)}
                          className="w-full flex items-center gap-3 py-3 pl-10 pr-2 hover:bg-gray-50 rounded-xl transition-colors">
                          <ChkBox
                            checked={selectedServices.includes(svc._id)}
                            onToggle={() => toggleService(svc._id)}
                          />
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-[#051e3a]">
                              {svc.name}
                            </p>
                            {svc.base_duration > 0 && (
                              <p className="text-xs text-gray-400">
                                {fmtDuration(svc.base_duration)}
                              </p>
                            )}
                          </div>
                          {svc.base_price > 0 && (
                            <span className="text-sm text-gray-500 shrink-0">
                              NPR {svc.base_price}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  );
                })}

                {allServices.length === 0 && (
                  <p className="text-sm text-gray-400 px-2 py-4">
                    No services found.
                  </p>
                )}
              </div>
            </>
          )}

          {/* ══ Locations ══ */}
          {activeTab === "locations" && (
            <>
              <div>
                <h2 className="text-xl font-bold text-[#051e3a]">Locations</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Choose the locations this team member works at
                </p>
              </div>
              <p className="text-sm text-gray-400">
                No locations configured yet.
              </p>
            </>
          )}

          {/* ══ Settings ══ */}
          {activeTab === "settings" && (
            <>
              <div>
                <h2 className="text-xl font-bold text-[#051e3a]">
                  Appointment settings
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Choose if this team member is bookable on the calendar
                </p>
              </div>

              <div className="flex items-start gap-3 py-1">
                <Checkbox
                  id="allowBookings"
                  checked={allowBookings}
                  onCheckedChange={(v) => setAllowBookings(!!v)}
                  className="border-gray-300 data-[state=checked]:bg-[#051e3a] data-[state=checked]:border-[#051e3a] mt-0.5"
                />
                <div>
                  <label
                    htmlFor="allowBookings"
                    className="text-sm font-semibold text-[#051e3a] cursor-pointer">
                    Allow calendar bookings
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Allow this team member to receive bookings on the calendar
                  </p>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
