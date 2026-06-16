import React, { useState, useMemo } from "react";
import { format, addDays, formatDate } from "date-fns";
import {
  Clock,
  ChevronRight,
  Check,
  Shuffle,
  Loader2,
  User,
  ChevronLeft,
  Plus,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

// UI Imports (Modify paths based on your design system framework template)
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import {
  ServiceType,
  EmployeeType,
  useGetAvailableSlots,
  useCreateBookingLock,
  useCreateBooking,
} from "@/services/booking.service";

interface BookingContainerProps {
  services: ServiceType[];
}

type StepType = "services" | "professionals" | "time" | "confirm";

export default function BookingContainer({ services }: BookingContainerProps) {
  const [activeTab, setActiveTab] = useState<string>("Featured");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const [currentStep, setCurrentStep] = useState<StepType>("services");
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeType | null>(
    null,
  );
  const [isNoPreference, setIsNoPreference] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [multiplier, setMultiplier] = useState<number>(1);

  // Dynamic Categories Tab Array Construction
  const categories = useMemo(() => {
    return [
      "Featured",
      ...Array.from(new Set(services.map((s) => s.category))),
    ];
  }, [services]);

  // Main Dashboard Services Filter
  const filteredDashboardServices = services.filter((s) => {
    if (activeTab === "Featured") return s.is_active;
    return s.category === activeTab && s.is_active;
  });

  // Extract all unique assigned employees across ALL currently checked services combined
  const dynamicAvailableEmployees = useMemo(() => {
    const empMap = new Map<string, EmployeeType>();
    selectedServices.forEach((srv) => {
      if (Array.isArray(srv.assigned_employees)) {
        srv.assigned_employees.forEach((emp) => {
          if (emp && emp._id) empMap.set(emp._id, emp);
        });
      }
    });
    return Array.from(empMap.values());
  }, [selectedServices]);

  // --- API Sync Parameters & Pricing Formulas ---
  const primaryServiceId = selectedServices[0]?._id || "";
  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const employeeParam =
    isNoPreference || !selectedEmployee ? "any" : selectedEmployee._id;

  const { data: slotsData, isLoading: isLoadingSlots } = useGetAvailableSlots(
    primaryServiceId,
    formattedDate,
    employeeParam === "any" ? null : employeeParam,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );

  const lockMutation = useCreateBookingLock();
  const bookingMutation = useCreateBooking();

  const totalBasePrice = selectedServices.reduce(
    (acc, curr) => acc + curr.base_price,
    0,
  );
  const totalBaseDuration = selectedServices.reduce(
    (acc, curr) => acc + curr.base_duration,
    0,
  );
  const finalPrice = totalBasePrice * multiplier;
  const finalDuration = totalBaseDuration * multiplier;

  const maxBookingDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));
  }, []);

  // Open Dialog Action Handler
  const handleOpenBookingWizard = (service: ServiceType) => {
    setSelectedServices([service]);
    setCurrentStep("services");
    setIsNoPreference(true);
    setSelectedEmployee(null);
    setSelectedDate(new Date());
    setSelectedSlot("");
    setMultiplier(1);
    setIsDialogOpen(true);
  };

  const handleToggleServiceSelection = (service: ServiceType) => {
    const exists = selectedServices.some((s) => s._id === service._id);
    if (exists) {
      if (selectedServices.length > 1) {
        setSelectedServices(
          selectedServices.filter((s) => s._id !== service._id),
        );
      }
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  // ─── REFIXED STEP NAVIGATION FLOW BUSINESS LOGIC ───
  const handleNextStep = () => {
    if (currentStep === "services") {
      // If there are employees nested inside the service data, route cleanly to Step 2
      if (dynamicAvailableEmployees.length > 0) {
        setCurrentStep("professionals");
      } else {
        // Fallback safety if no employees exist in arrays
        setIsNoPreference(true);
        setCurrentStep("time");
      }
    } else if (currentStep === "professionals") {
      setCurrentStep("time");
    } else if (currentStep === "time") {
      handleExecuteBookingPipeline();
    }
  };

  const handleBackStep = () => {
    if (currentStep === "professionals") setCurrentStep("services");
    if (currentStep === "time") {
      if (dynamicAvailableEmployees.length > 0) {
        setCurrentStep("professionals");
      } else {
        setCurrentStep("services");
      }
    }
  };

  const handleExecuteBookingPipeline = async () => {
    if (selectedServices.length === 0 || !selectedSlot) return;

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Clean, absolute standard ISO string execution fallback safety
      const startTimeISO = new Date(selectedSlot).toISOString();

      const lockPayload = {
        service_id: primaryServiceId,
        employee_id: isNoPreference ? null : selectedEmployee?._id,
        start_time: startTimeISO,
        timezone,
      };

      const lockRes = await lockMutation.mutateAsync(lockPayload);

      if (lockRes.success) {
        const bookingPayload = {
          service_id: primaryServiceId,
          employee_id:
            lockRes.employee_id ||
            (isNoPreference ? null : selectedEmployee?._id),
          start_time: startTimeISO,
          lock_id: lockRes.lock_id,
        };

        await bookingMutation.mutateAsync(bookingPayload);
        setCurrentStep("confirm");
      }
    } catch (err) {
      console.error("Booking state pipeline submission failure:", err);
    }
  };

  const handleGlobalWizardReset = () => {
    setIsDialogOpen(false);
    setCurrentStep("services");
    setSelectedServices([]);
    setSelectedEmployee(null);
    setIsNoPreference(true);
    setSelectedSlot("");
    setMultiplier(1);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* ─── MAIN SERVICES BACKEND DISPLAY OVERVIEW DASHBOARD ─── */}
      <div className="space-y-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={cn(
                "px-5 py-2 text-sm font-medium rounded-full border transition-all whitespace-nowrap",
                activeTab === cat
                  ? "bg-black text-white border-black"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
              )}>
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          {filteredDashboardServices.map((service) => (
            <div
              key={service._id}
              className="flex items-center w-full justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="space-y-1 pr-4">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider bg-purple-50 px-2 py-0.5 rounded-md">
                  {service.category}
                </span>
                <h3 className="font-bold text-base text-slate-900 pt-1">
                  {service.name}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {service.base_duration} mins
                </p>
                <p className="text-sm font-extrabold text-slate-900 pt-1">
                  AUD {service.base_price}
                </p>
              </div>
              <Button
                onClick={() => handleOpenBookingWizard(service)}
                className="px-5 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold"
                variant="outline">
                Book
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* ─── BOOKING WORKFLOW MULTI-STEP DIALOG ─── */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(v) => !v && handleGlobalWizardReset()}>
        <DialogContent className="min-w-5xl p-0 overflow-hidden bg-[#F9F9F9] rounded-3xl border-none flex flex-col md:flex-row h-[90vh] max-h-[720px] shadow-2xl">
          {/* Left Panel Step Canvas */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                {currentStep !== "services" && currentStep !== "confirm" ? (
                  <button
                    onClick={handleBackStep}
                    className="flex items-center gap-1 text-xs font-semibold uppercase text-slate-400 hover:text-black transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                ) : (
                  <div />
                )}

                <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span
                    className={cn(
                      currentStep === "services" &&
                        "text-primary font-extrabold",
                    )}>
                    Services
                  </span>
                  {dynamicAvailableEmployees.length > 0 && (
                    <>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                      <span
                        className={cn(
                          currentStep === "professionals" &&
                            "text-primary font-extrabold",
                        )}>
                        Professional
                      </span>
                    </>
                  )}
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <span
                    className={cn(
                      currentStep === "time" && "text-primary font-extrabold",
                    )}>
                    Time
                  </span>
                </nav>
              </div>

              {/* STEP 1: INNER MODAL MULTI-SELECT COMPLEMENTARY SERVICES */}
              {currentStep === "services" && (
                <div className="space-y-4 pt-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900">
                      Select services
                    </h2>
                    <p className="text-xs text-slate-400">
                      Add or manage treatments for your visit sequence today.
                    </p>
                  </div>
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {services.map((item) => {
                      const isChecked = selectedServices.some(
                        (s) => s._id === item._id,
                      );
                      return (
                        <div
                          key={item._id}
                          onClick={() => handleToggleServiceSelection(item)}
                          className={cn(
                            "p-4 bg-white border rounded-2xl cursor-pointer flex items-center justify-between transition-all",
                            isChecked
                              ? "border-primary "
                              : "border-slate-100 hover:border-slate-200",
                          )}>
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-sm text-slate-900">
                              {item.name}
                            </h4>
                            <p className="text-xs text-slate-400">
                              {item.base_duration} mins • {item.category}
                            </p>
                            <p className="text-xs font-extrabold text-slate-900 pt-1">
                              AUD {item.base_price}
                            </p>
                          </div>
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center border transition-all",
                              isChecked
                                ? "bg-primary border-primary-600 text-white"
                                : "border-slate-200",
                            )}>
                            {isChecked ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Plus className="w-3 h-3 text-slate-400" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: PROFESSIONAL SELECTION (PROCESSED DIRECTLY FROM NESTED KEY DATA) */}
              {currentStep === "professionals" && (
                <div className="space-y-4 pt-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900">
                      Select professional
                    </h2>
                    <p className="text-xs text-slate-400">
                      Pick an assigned stylist or proceed with standard maximum
                      availability.
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    <div
                      onClick={() => {
                        setIsNoPreference(true);
                        setSelectedEmployee(null);
                      }}
                      className={cn(
                        "p-4 bg-white border rounded-2xl cursor-pointer flex items-center justify-between transition-all",
                        isNoPreference
                          ? "border-primary-600 ring-2 ring-primary"
                          : "border-slate-100",
                      )}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <Shuffle className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">
                            Any Employee Available
                          </h4>
                          <p className="text-xs text-slate-400">
                            Optimizes calendar open slot metrics
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={isNoPreference ? "default" : "outline"}
                        size="sm"
                        className="rounded-full px-4 text-xs h-8">
                        {isNoPreference ? "Selected" : "Select"}
                      </Button>
                    </div>

                    {dynamicAvailableEmployees.map((emp) => {
                      const isSelected =
                        selectedEmployee?._id === emp._id && !isNoPreference;
                      return (
                        <div
                          key={emp._id}
                          onClick={() => {
                            setIsNoPreference(false);
                            setSelectedEmployee(emp);
                          }}
                          className={cn(
                            "p-4 bg-white border rounded-2xl cursor-pointer flex items-center justify-between transition-all",
                            isSelected
                              ? "border-primary-600 ring-2 ring-primary"
                              : "border-slate-100",
                          )}>
                          <div className="flex items-center gap-3">
                            {emp.employee_photo ? (
                              <img
                                src={emp.employee_photo}
                                alt={emp.full_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <User className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">
                                {emp.full_name}
                              </h4>
                              <p className="text-xs text-slate-400">
                                Assigned Treatment Specialist
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className="rounded-full px-4 text-xs h-8">
                            {isSelected ? "Selected" : "Select"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: DATE & TIME TRACK MATRIX (STRICT 7-DAY CAP) */}
              {currentStep === "time" && (
                <div className="space-y-4 pt-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900">
                      Select date and time
                    </h2>
                    <p className="text-xs text-slate-400">
                      Appointments can be configured up to one week in advance
                      maximum.
                    </p>
                  </div>

                  {/* 7-Day Slider Ribbon */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                    {maxBookingDays.map((day) => {
                      const isSameDay =
                        format(selectedDate, "yyyy-MM-dd") ===
                        format(day, "yyyy-MM-dd");
                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => {
                            setSelectedDate(day);
                            setSelectedSlot("");
                          }}
                          className={cn(
                            "flex flex-col items-center justify-center p-2.5 w-14 rounded-xl border transition-all shrink-0",
                            isSameDay
                              ? "bg-primary border-primary-600 text-white shadow-sm"
                              : "bg-white border-slate-200 text-slate-800 hover:border-slate-300",
                          )}>
                          <span className="text-[9px] font-bold opacity-80 uppercase">
                            {format(day, "EEE")}
                          </span>
                          <span className="text-base font-black">
                            {format(day, "d")}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Session Extender Blocks */}
                  <div className="space-y-2 bg-white p-4 border border-slate-100 rounded-2xl">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Duration Multiplier:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((m) => (
                        <button
                          key={m}
                          onClick={() => setMultiplier(m)}
                          className={cn(
                            "py-2 px-3 border text-xs rounded-xl font-bold transition-all",
                            multiplier === m
                              ? "bg-black text-white border-black"
                              : "bg-slate-50 border-slate-200 hover:bg-slate-100",
                          )}>
                          {m}x Slots ({totalBaseDuration * m}m)
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Open Slots Panel */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Available Openings
                    </span>
                    {isLoadingSlots ? (
                      <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />{" "}
                        Computing open timelines...
                      </div>
                    ) : slotsData?.available_slots &&
                      slotsData.available_slots.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2 max-h-[160px] overflow-y-auto pr-1">
                        {slotsData.available_slots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={cn(
                              "text-center py-2 px-1 rounded-xl text-xs font-bold transition-all border",
                              selectedSlot === slot
                                ? "bg-primary border-primary-600 text-white shadow-sm"
                                : "bg-white border-slate-100 text-slate-700 hover:border-slate-300",
                            )}>
                            {formatDate(slot, "h:mm a")}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-6 bg-white border rounded-2xl italic">
                        No free open times or hours assigned for this specific
                        day.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4: TRANSACTION SUCCESS VIEW */}
              {currentStep === "confirm" && (
                <div className="text-center py-12 space-y-4 max-w-sm mx-auto">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">
                    Appointment Secured!
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Your appointment details have successfully matching log
                    values. Check confirmation overview logs for updates.
                  </p>
                  <Button
                    onClick={handleGlobalWizardReset}
                    className="w-full mt-2 bg-black text-white rounded-xl text-xs h-11 font-bold">
                    Close Window
                  </Button>
                </div>
              )}
            </div>

            {currentStep !== "confirm" && (
              <Button
                variant="ghost"
                onClick={handleGlobalWizardReset}
                className="text-xs text-slate-400 hover:text-slate-600 mt-4 justify-start w-fit p-0 h-auto font-medium">
                Cancel Registration
              </Button>
            )}
          </div>

          {currentStep !== "confirm" && (
            <div className="w-full md:w-[340px] bg-white border-t md:border-t-0 md:border-l border-slate-100 p-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex gap-3 items-center pb-4 border-b border-slate-100">
                  <div
                    className="w-11 h-11 rounded-xl bg-slate-900 bg-cover bg-center"
                    style={{
                      backgroundImage: `url('https://wha-sunya-my-uploads.s3.ap-southeast-2.amazonaws.com/profile_1780979383458.jpeg')`,
                    }}
                  />
                  <div>
                    <h4 className="font-black text-slate-900 text-xs">
                      {services[0]?.business_id?.business_name}
                    </h4>
                    {/* <p className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                      ★ {services[0]?.business_id?.rating}
                      <span className="text-slate-400 font-normal">
                        {services[0]?.business_id?.rating}
                      </span>
                    </p> */}
                    <p className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" />{" "}
                      {services[0]?.business_id?.location.split(",")[0]},{" "}
                      {services[0]?.business_id?.location.split(",")[1]}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Selected Treatments
                  </span>

                  {selectedServices.length > 0 ? (
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {selectedServices.map((srv) => (
                        <div
                          key={srv._id}
                          className="flex justify-between items-start text-xs border-b border-slate-50 pb-2">
                          <div>
                            <h5 className="font-bold text-slate-900">
                              {srv.name}
                            </h5>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {srv.base_duration * multiplier} mins
                            </p>
                          </div>
                          <span className="font-bold text-slate-900">
                            AUD {srv.base_price * multiplier}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-2">
                      No selections registered.
                    </p>
                  )}

                  {(selectedEmployee || isNoPreference) &&
                    selectedServices.length > 0 && (
                      <div className="pt-2 flex items-center gap-2 text-[11px] font-bold text-slate-600">
                        <User className="w-3.5 h-3.5 text-primary" />
                        <span>
                          Professional:{" "}
                          <span className="text-slate-900">
                            {isNoPreference
                              ? "Any Employee Available"
                              : selectedEmployee?.full_name}
                          </span>
                        </span>
                      </div>
                    )}

                  {selectedSlot && (
                    <div className="bg-purple-50/70 p-3 rounded-xl flex items-center gap-2 text-xs font-bold text-primary">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>
                        {format(selectedDate, "eeee, MMM dd")} at {selectedSlot}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3.5 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center px-1">
                  <span className="font-bold text-xs text-slate-900">
                    Subtotal Balance
                  </span>
                  <span className="font-black text-xl text-slate-900">
                    AUD {finalPrice}
                  </span>
                </div>

                <Button
                  disabled={
                    selectedServices.length === 0 ||
                    (currentStep === "time" && !selectedSlot) ||
                    lockMutation.isPending ||
                    bookingMutation.isPending
                  }
                  onClick={handleNextStep}
                  className="w-full bg-black hover:bg-slate-900 text-white font-bold text-xs h-12 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all">
                  {lockMutation.isPending || bookingMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <span>
                        {currentStep === "time"
                          ? "Confirm Appointment"
                          : "Continue"}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
