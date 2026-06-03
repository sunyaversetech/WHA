"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthModal } from "@/components/Auth/DialogLogin/use-auth-model";
import {
  useGetServices,
  useGetAvailableSlots,
  useCreateBookingLock,
  useCreateBooking,
  ServiceType,
  EmployeeType,
} from "@/services/booking.service";
import { useGetALLBusiness } from "@/services/business.service";
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  MapPin,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Info,
  Sparkles,
  DollarSign,
  Briefcase,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function BookingWizard() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { onOpen: openAuthModal } = useAuthModal();
  const queryClient = useQueryClient();

  const businessIdFromUrl = searchParams.get("business_id");

  // ─── Step State ────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ─── Booking Selection State ────────────────────────────────────────────────
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeType | "any">("any");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // ─── Lock State ────────────────────────────────────────────────────────────
  const [lockId, setLockId] = useState<string>("");
  const [lockExpiry, setLockExpiry] = useState<number | null>(null);
  const [lockTimerText, setLockTimerText] = useState<string>("");

  // ─── Fetching Data ─────────────────────────────────────────────────────────
  const { data: businessesResponse, isLoading: loadingBusinesses } = useGetALLBusiness();
  const { data: servicesResponse, isLoading: loadingServices } = useGetServices(selectedBusinessId || undefined);

  // Timezone resolution
  const userTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  // Fetch Slots
  const { data: slotsResponse, isLoading: loadingSlots } = useGetAvailableSlots(
    selectedService?._id || "",
    selectedDate,
    selectedEmployee === "any" ? null : selectedEmployee?._id,
    userTimezone
  );

  // Mutations
  const lockMutation = useCreateBookingLock();
  const bookingMutation = useCreateBooking();

  // ─── Pre-selection effect ──────────────────────────────────────────────────
  useEffect(() => {
    if (businessIdFromUrl) {
      setSelectedBusinessId(businessIdFromUrl);
    }
  }, [businessIdFromUrl]);

  // Set today as default date on mount
  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    setSelectedDate(todayStr);
  }, []);

  // ─── List of next 14 days for horizontal selector ──────────────────────────
  const daysList = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum = d.getDate();
      list.push({ dateStr, weekday, dayNum });
    }
    return list;
  }, []);

  // Find business details
  const selectedBusiness = useMemo(() => {
    if (!businessesResponse?.data) return null;
    return businessesResponse.data.find((b) => b._id === selectedBusinessId) || null;
  }, [businessesResponse, selectedBusinessId]);

  // Lock Timer countdown effect
  useEffect(() => {
    if (!lockExpiry) return;

    const interval = setInterval(() => {
      const remaining = lockExpiry - Date.now();
      if (remaining <= 0) {
        clearInterval(interval);
        setLockId("");
        setLockExpiry(null);
        setSelectedSlot("");
        setLockTimerText("");
        toast.warning("Your time slot lock has expired. Please select a slot again.");
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setLockTimerText(`${mins}:${secs.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockExpiry]);

  // Handle Slot Selection and Trigger Lock
  const handleSlotSelect = async (slotIso: string) => {
    if (!session) {
      toast.error("Please login to reserve a booking slot.");
      openAuthModal();
      return;
    }

    if (!selectedService) return;

    setSelectedSlot(slotIso);

    // Call API to Lock Slot
    toast.promise(
      lockMutation.mutateAsync({
        service_id: selectedService._id,
        employee_id: selectedEmployee === "any" ? null : selectedEmployee._id,
        start_time: slotIso,
        timezone: userTimezone,
      }),
      {
        loading: "Reserving slot temporarily...",
        success: (res) => {
          setLockId(res.lock_id);
          // Set expiry 5 mins from now
          setLockExpiry(Date.now() + 5 * 60 * 1000);
          return "Slot reserved for 5 minutes!";
        },
        error: (err: any) => {
          setSelectedSlot("");
          return err.message || "Slot is no longer available. Please select another slot.";
        },
      }
    );
  };

  // Complete Booking
  const handleConfirmBooking = async () => {
    if (!session) {
      openAuthModal();
      return;
    }

    if (!selectedService || !selectedSlot || !lockId) {
      toast.error("Invalid booking request. Please re-select details.");
      return;
    }

    const payload = {
      service_id: selectedService._id,
      employee_id: selectedEmployee === "any" ? null : selectedEmployee._id,
      start_time: selectedSlot,
      lock_id: lockId,
      idempotency_key: crypto.randomUUID(), // Client generated idempotency key
    };

    toast.promise(
      bookingMutation.mutateAsync(payload),
      {
        loading: "Finalizing your booking...",
        success: (res) => {
          queryClient.invalidateQueries({ queryKey: ["userbookings"] });
          setStep(5); // Success step
          return "Booking confirmed successfully!";
        },
        error: (err: any) => {
          return err.message || "Booking failed. Please try again.";
        },
      }
    );
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedBusinessId) {
        toast.error("Please select a business first.");
        return;
      }
      if (!selectedService) {
        toast.error("Please select a service first.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedService?.require_employee_selection && selectedEmployee === "any") {
        toast.error("This service requires you to select a professional.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!selectedSlot || !lockId) {
        toast.error("Please select an available time slot.");
        return;
      }
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    if (step > 1 && step < 5) {
      // Clear lock if going back from step 4 or 3
      if (step === 4) {
        setLockId("");
        setLockExpiry(null);
        setSelectedSlot("");
      }
      setStep(step - 1);
    }
  };

  // Format date/time helper
  const formatDateTime = (isoString: string) => {
    if (!isoString) return "";
    const dateObj = new Date(isoString);
    return dateObj.toLocaleString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: userTimezone,
    });
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen py-10 px-4 md:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Luxury Header Banner */}
        <div className="bg-[#051e3a] text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-wha-label-sm text-[#3771db] font-bold tracking-widest mb-1 block">
              Luxury Beauty & Wellness
            </span>
            <h1 className="text-wha-h2 text-white font-normal font-marcellus">
              {step === 5 ? "Booking Confirmed" : "Book an Appointment"}
            </h1>
            <p className="text-slate-300 text-xs md:text-sm mt-1">
              {selectedBusiness ? `${selectedBusiness.business_name} • ${selectedBusiness.city_name}` : "Select a service provider to start"}
            </p>
          </div>

          {step < 5 && (
            <div className="flex items-center gap-1.5 bg-white/10 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3771db] animate-pulse"></span>
              Step {step} of 4
            </div>
          )}
        </div>

        {/* Step Indicator Bar */}
        {step < 5 && (
          <div className="flex border-b border-slate-100 text-xs md:text-sm text-slate-500 bg-slate-50 overflow-x-auto scrollbar-hide">
            {[
              { num: 1, label: "Service" },
              { num: 2, label: "Professional" },
              { num: 3, label: "Date & Time" },
              { num: 4, label: "Confirm" },
            ].map((s) => (
              <div
                key={s.num}
                className={`flex-1 flex items-center justify-center gap-2 py-4 px-3 border-b-2 font-medium transition-all ${
                  step === s.num
                    ? "border-[#051e3a] text-[#051e3a] bg-white font-bold"
                    : step > s.num
                    ? "border-[#3771db] text-[#3771db]"
                    : "border-transparent text-slate-400"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step >= s.num ? "bg-[#051e3a] text-white" : "bg-slate-200 text-slate-500"
                }`}>
                  {s.num}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Wizard Main Content */}
        <div className="p-6 md:p-8 min-h-[350px]">
          
          {/* STEP 1: Select Business & Service */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Business Select dropdown */}
              {!businessIdFromUrl ? (
                <div>
                  <label className="label-wha flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#3771db]" /> Choose a Location / Salon
                  </label>
                  {loadingBusinesses ? (
                    <div className="h-12 bg-slate-100 animate-pulse rounded-lg" />
                  ) : (
                    <select
                      className="select-wha bg-white"
                      value={selectedBusinessId}
                      onChange={(e) => {
                        setSelectedBusinessId(e.target.value);
                        setSelectedService(null);
                        setSelectedEmployee("any");
                      }}
                    >
                      <option value="">-- Choose location --</option>
                      {businessesResponse?.data?.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.business_name} ({b.city_name})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#3771db]" />
                  <div>
                    <h3 className="font-semibold text-slate-800">{selectedBusiness?.business_name}</h3>
                    <p className="text-xs text-slate-500">{selectedBusiness?.location}</p>
                  </div>
                </div>
              )}

              {/* Service Selection */}
              {selectedBusinessId ? (
                <div className="space-y-4">
                  <h3 className="label-wha flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#3771db]" /> Select a Treatment
                  </h3>
                  
                  {loadingServices ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="h-28 bg-slate-100 animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : servicesResponse?.data && servicesResponse.data.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {servicesResponse.data.map((srv) => {
                        const isSelected = selectedService?._id === srv._id;
                        return (
                          <div
                            key={srv._id}
                            onClick={() => {
                              setSelectedService(srv);
                              setSelectedEmployee("any");
                            }}
                            className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between hover-wha-lift ${
                              isSelected
                                ? "border-[#051e3a] bg-slate-50/50 shadow-md"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="font-bold text-slate-800 font-montserrat">{srv.name}</h4>
                                <span className="font-semibold text-[#051e3a] text-sm shrink-0">
                                  ${srv.base_price.toFixed(2)}
                                </span>
                              </div>
                              {srv.description && (
                                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                                  {srv.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3 mt-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-[#3771db]" /> {srv.base_duration} min
                              </span>
                              {srv.require_employee_selection && (
                                <span className="text-xs font-semibold text-[#3771db] bg-blue-50 px-2 py-0.5 rounded-full">
                                  Select Professional Required
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 border border-dashed rounded-xl bg-slate-50 text-slate-500">
                      No treatments or services found for this business.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-xl border text-slate-500 text-sm">
                  Please choose a salon location to view the available treatment menu.
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Select Employee */}
          {step === 2 && selectedService && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="label-wha flex items-center gap-2">
                <User className="w-4 h-4 text-[#3771db]" /> Choose a Service Professional
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Any Professional option (only if not required selection) */}
                {!selectedService.require_employee_selection && (
                  <div
                    onClick={() => setSelectedEmployee("any")}
                    className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 hover-wha-lift ${
                      selectedEmployee === "any"
                        ? "border-[#051e3a] bg-slate-50/50 shadow-md"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#051e3a]/10 flex items-center justify-center text-[#051e3a]">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Any Available Professional</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Select this option for maximum time availability.
                      </p>
                    </div>
                  </div>
                )}

                {/* Service assigned employees */}
                {selectedService.assigned_employees && selectedService.assigned_employees.length > 0 ? (
                  selectedService.assigned_employees.map((emp) => {
                    const isSelected = selectedEmployee !== "any" && selectedEmployee?._id === emp._id;
                    return (
                      <div
                        key={emp._id}
                        onClick={() => setSelectedEmployee(emp)}
                        className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 hover-wha-lift ${
                          isSelected
                            ? "border-[#051e3a] bg-slate-50/50 shadow-md"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-[#3771db]/10 flex items-center justify-center text-[#3771db] font-semibold text-lg uppercase">
                          {emp.full_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{emp.full_name}</h4>
                          {emp.bio ? (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{emp.bio}</p>
                          ) : (
                            <p className="text-xs text-slate-500 mt-1">Professional Therapist</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-10 bg-slate-50 border rounded-xl text-slate-500">
                    No individual staff members assigned to this treatment.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Select Date & Time Slot */}
          {step === 3 && selectedService && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Date Input */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <h3 className="label-wha flex items-center gap-2 mb-0">
                  <Calendar className="w-4 h-4 text-[#3771db]" /> Pick a Date & Time
                </h3>
                
                <input
                  type="date"
                  className="input-wha-sm max-w-[200px]"
                  min={new Date().toISOString().split("T")[0]}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot("");
                    setLockId("");
                    setLockExpiry(null);
                  }}
                />
              </div>

              {/* Horizontal Day Selector */}
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                {daysList.map((day) => {
                  const isSelected = selectedDate === day.dateStr;
                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      onClick={() => {
                        setSelectedDate(day.dateStr);
                        setSelectedSlot("");
                        setLockId("");
                        setLockExpiry(null);
                      }}
                      className={`flex flex-col items-center justify-center px-4 py-3 rounded-lg border min-w-[70px] transition-all ${
                        isSelected
                          ? "bg-[#051e3a] text-white border-[#051e3a]"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold opacity-75">{day.weekday}</span>
                      <span className="text-lg font-bold mt-1 font-montserrat">{day.dayNum}</span>
                    </button>
                  );
                })}
              </div>

              <hr className="border-slate-100" />

              {/* Available Slots */}
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#3771db]" /> Available Times
                </h4>

                {loadingSlots ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <div key={n} className="h-10 bg-slate-100 animate-pulse rounded-md" />
                    ))}
                  </div>
                ) : slotsResponse?.available_slots && slotsResponse.available_slots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {slotsResponse.available_slots.map((slotIso) => {
                      const dateObj = new Date(slotIso);
                      const timeStr = dateObj.toLocaleTimeString("en-AU", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                        timeZone: userTimezone,
                      });
                      const isSelected = selectedSlot === slotIso;

                      return (
                        <button
                          key={slotIso}
                          type="button"
                          onClick={() => handleSlotSelect(slotIso)}
                          className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                            isSelected
                              ? "bg-[#3771db] text-white border-[#3771db] ring-2 ring-[#3771db] ring-offset-2"
                              : "bg-white text-slate-800 border-slate-200 hover:border-[#3771db] hover:text-[#3771db]"
                          }`}
                        >
                          {timeStr}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 border border-dashed rounded-xl text-slate-500 text-sm">
                    No available time slots found for the selected date and professional. Try picking a different day.
                  </div>
                )}
              </div>

              {/* Locked countdown timer display */}
              {lockId && lockExpiry && (
                <div className="alert-wha-info flex items-center justify-between mt-6">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-[#3771db]" />
                    <span className="text-xs sm:text-sm text-blue-900 font-medium">
                      Your slot is temporarily secured. Complete the checkout within the remaining time.
                    </span>
                  </div>
                  <span className="bg-[#3771db] text-white text-xs font-bold px-3 py-1 rounded-full font-mono shrink-0 ml-2">
                    {lockTimerText}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Confirm Booking details */}
          {step === 4 && selectedService && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="label-wha">Review & Complete Booking</h3>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 uppercase text-[10px] font-bold block mb-1">
                      Salon & Location
                    </span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#3771db]" /> {selectedBusiness?.business_name}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 uppercase text-[10px] font-bold block mb-1">
                      Treatment / Service
                    </span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-[#3771db]" /> {selectedService.name}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 uppercase text-[10px] font-bold block mb-1">
                      Date & Time
                    </span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#3771db]" /> {formatDateTime(selectedSlot)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 uppercase text-[10px] font-bold block mb-1">
                      Professional Specialist
                    </span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[#3771db]" />{" "}
                      {selectedEmployee === "any" ? "Any Professional" : selectedEmployee.full_name}
                    </span>
                  </div>
                </div>

                <hr className="border-slate-200" />

                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Pricing Details</span>
                    <h4 className="text-slate-800 font-bold text-sm">Duration: {selectedService.base_duration} min</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Total Due</span>
                    <span className="text-2xl font-bold text-[#051e3a] font-marcellus">
                      ${selectedService.base_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="label-wha">Appointment Notes (Optional)</label>
                <textarea
                  className="textarea-wha bg-white"
                  rows={3}
                  placeholder="Add any specific requests or instructions for your specialist..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Countdown timer reminder */}
              {lockExpiry && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Your slot reservation expires in <strong className="font-mono">{lockTimerText}</strong>. Please confirm before this time.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Success Screen */}
          {step === 5 && selectedService && (
            <div className="text-center py-10 space-y-6 animate-scale-in">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto border-2 border-green-200">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h2 className="text-wha-h2 text-slate-800 font-normal font-marcellus">
                  Your appointment is locked in!
                </h2>
                <p className="text-slate-500 text-sm">
                  We have successfully confirmed your booking. A confirmation email and reminder details will be sent shortly.
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border max-w-md mx-auto text-left text-sm space-y-2.5">
                <p className="text-slate-700">
                  <strong>Location:</strong> {selectedBusiness?.business_name}
                </p>
                <p className="text-slate-700">
                  <strong>Treatment:</strong> {selectedService.name} (${selectedService.base_price.toFixed(2)})
                </p>
                <p className="text-slate-700">
                  <strong>Specialist:</strong> {selectedEmployee === "any" ? "Any Professional" : selectedEmployee.full_name}
                </p>
                <p className="text-slate-700">
                  <strong>Time:</strong> {formatDateTime(selectedSlot)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  // Reset wizard and switch to list tab
                  window.location.reload(); // Reload or callback
                }}
                className="btn-wha-primary"
              >
                Go to My Bookings
              </button>
            </div>
          )}

        </div>

        {/* Navigation Actions Footer */}
        {step < 5 && (
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
            
            {/* Back Button */}
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="btn-wha-outline-sm flex items-center gap-1.5 py-2.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {/* Next / Confirm Button */}
            {step === 4 ? (
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={bookingMutation.isPending}
                className="btn-wha-primary-sm flex items-center gap-1.5 py-2.5 bg-green-700 hover:bg-green-800 active:bg-green-950 border-none text-white shadow-md"
              >
                {bookingMutation.isPending ? "Confirming..." : "Confirm Booking"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextStep}
                className="btn-wha-primary-sm flex items-center gap-1.5 py-2.5"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
