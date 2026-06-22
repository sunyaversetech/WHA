"use client";

import React, { useState, useMemo } from "react";
import { format, addDays, formatDate, addMinutes } from "date-fns";
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
  Layers,
  Timer,
  Minus,
  CreditCard,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import {
  ServiceType,
  EmployeeType,
  useGetAvailableSlots,
  useCreateBookingLock,
  useCreateBooking,
  useCreateCheckoutSession,
} from "@/services/booking.service";

interface BookingContainerProps {
  services: ServiceType[];
}

type StepType = "services" | "professionals" | "time" | "confirm";

function formatDurationLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours === 0) return `${mins} mins`;
  if (mins === 0) return hours === 1 ? "1 hr" : `${hours} hrs`;
  return `${hours} ${hours === 1 ? "hr" : "hrs"} ${mins} mins`;
}

// ─── STYLISH INLINE STRIPE CHECKOUT DIALOG FORMAT ────────────────────────────
interface BookingCheckoutProps {
  lockId: string;
  price: number;
  onClose: () => void;
  onSuccess: (paymentIntentId: string) => void;
}

function BookingCheckout({
  lockId,
  price,
  onClose,
  onSuccess,
}: BookingCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      // Simulating a standard 1.5s secure authorization window
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const mockPaymentIntentId = `pi_${Math.random().toString(36).substring(2, 12)}`;
      onSuccess(mockPaymentIntentId);
    } catch (err: any) {
      toast.error(err?.message || "Payment authentication failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition">
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Secure Payment Gateway
          </h3>
          <p className="text-[11px] text-slate-400 font-mono">
            Lock ID: {lockId}
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Charge:
          </span>
          <span className="text-xl font-black text-slate-900">
            AUD {Number(price).toFixed(2)}
          </span>
        </div>

        <Button
          onClick={handleSimulatePayment}
          disabled={isProcessing}
          className="w-full h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-2">
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authorizing Transaction...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              <span>Authorize & Confirm Appointment</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── MAIN CONTAINER WITH PRESERVED ORIGINAL UI LAYOUT ────────────────────────
export default function BookingContainer({ services }: BookingContainerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("Featured");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const [currentStep, setCurrentStep] = useState<StepType>("services");
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([]);

  const [selectedMultipliers, setSelectedMultipliers] = useState<
    Record<string, number>
  >({});
  const [selectedQuantities, setSelectedQuantities] = useState<
    Record<string, number>
  >({});

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeType | null>(
    null,
  );
  const [isNoPreference, setIsNoPreference] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [isRedirectingToStripe, setIsRedirectingToStripe] =
    useState<boolean>(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeLockId, setActiveLockId] = useState<string | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);

  const lockMutation = useCreateBookingLock();
  const checkoutMutation = useCreateCheckoutSession();
  const bookingMutation = useCreateBooking();

  const categories = useMemo(() => {
    return [
      "Featured",
      ...Array.from(new Set(services.map((s) => s.category))),
    ];
  }, [services]);

  const filteredDashboardServices = services.filter((s) => {
    if (activeTab === "Featured") return s.is_active;
    return s.category === activeTab && s.is_active;
  });

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

  const primaryServiceId = selectedServices[0]?._id || "";
  const businessId = services[0]?.business_id?._id || "";
  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const employeeParam =
    isNoPreference || !selectedEmployee ? "any" : selectedEmployee._id;

  const finalPrice = useMemo(() => {
    return selectedServices.reduce((acc, curr) => {
      const mult = selectedMultipliers[curr._id] || 1;
      const qty = selectedQuantities[curr._id] || 1;
      return acc + curr.base_price * mult * qty;
    }, 0);
  }, [selectedServices, selectedMultipliers, selectedQuantities]);

  const finalDuration = useMemo(() => {
    return selectedServices.reduce((acc, curr) => {
      const mult = selectedMultipliers[curr._id] || 1;
      return acc + curr.base_duration * mult;
    }, 0);
  }, [selectedServices, selectedMultipliers]);

  const startTime = new Date(selectedSlot);
  const endTime = addMinutes(startTime, finalDuration);

  const { data: slotsData, isLoading: isLoadingSlots } = useGetAvailableSlots(
    primaryServiceId,
    formattedDate,
    employeeParam === "any" ? null : employeeParam,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    services[0]?.business_id?._id,
    finalDuration,
  );

  const maxBookingDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));
  }, []);

  const handleOpenBookingWizard = (service: ServiceType) => {
    setSelectedServices([service]);
    setSelectedMultipliers({ [service._id]: 1 });
    setSelectedQuantities({ [service._id]: 1 });
    setCurrentStep("services");
    setIsNoPreference(true);
    setSelectedEmployee(null);
    setSelectedDate(new Date());
    setSelectedSlot("");
    setIsRedirectingToStripe(false);
    setIsDialogOpen(true);
  };

  const handleToggleServiceSelection = (service: ServiceType) => {
    const exists = selectedServices.some((s) => s._id === service._id);
    if (exists) {
      if (selectedServices.length > 1) {
        setSelectedServices(
          selectedServices.filter((s) => s._id !== service._id),
        );
        const updatedMults = { ...selectedMultipliers };
        delete updatedMults[service._id];
        setSelectedMultipliers(updatedMults);

        const updatedQtys = { ...selectedQuantities };
        delete updatedQtys[service._id];
        setSelectedQuantities(updatedQtys);
      }
    } else {
      setSelectedServices([...selectedServices, service]);
      setSelectedMultipliers({ ...selectedMultipliers, [service._id]: 1 });
      setSelectedQuantities({ ...selectedQuantities, [service._id]: 1 });
    }
  };

  const handleSelectMultiplier = (serviceId: string, value: number) => {
    setSelectedMultipliers({ ...selectedMultipliers, [serviceId]: value });
  };

  const handleUpdateQuantity = (
    serviceId: string,
    delta: number,
    maxInventory?: number,
  ) => {
    const currentQty = selectedQuantities[serviceId] || 1;
    const nextQty = currentQty + delta;
    const maxAllowed = maxInventory !== undefined ? maxInventory : 99;

    if (nextQty >= 1 && nextQty <= maxAllowed) {
      setSelectedQuantities({ ...selectedQuantities, [serviceId]: nextQty });
    }
  };

  const handleNextStep = () => {
    if (currentStep === "services") {
      if (dynamicAvailableEmployees.length > 0) {
        setCurrentStep("professionals");
      } else {
        setIsNoPreference(true);
        setCurrentStep("time");
      }
    } else if (currentStep === "professionals") {
      setCurrentStep("time");
    } else if (currentStep === "time") {
      handleExecuteBookingAndPaymentPipeline();
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

  const handleExecuteBookingAndPaymentPipeline = async () => {
    if (selectedServices.length === 0 || !selectedSlot) return;

    try {
      const itemsPayload = selectedServices.map((srv) => ({
        service_id: srv._id,
        quantity: selectedQuantities[srv._id] || 1,
        multiplier: selectedMultipliers[srv._id] || 1,
      }));

      const lockPayload = {
        business_id: businessId,
        service_id: primaryServiceId,
        employee_id: isNoPreference ? null : selectedEmployee?._id,
        start_time: selectedSlot,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        inventory_quantity: selectedQuantities[primaryServiceId] || 1,
        items: itemsPayload,
      };

      const lockRes = (await lockMutation.mutateAsync(
        lockPayload as any,
      )) as any;
      const targetLockId =
        lockRes?.lock_id || lockRes?.data?.lock_id || lockRes?._id;

      if (!targetLockId) {
        throw new Error("Could not allocate secure reservation lock.");
      }

      const totalDue =
        lockRes?.total_price || lockRes?.data?.total_price || finalPrice;

      setActiveLockId(targetLockId);
      setCalculatedPrice(totalDue);
      setIsPaymentModalOpen(true);
    } catch (err: any) {
      console.error("Booking verification failure:", err);
      toast.error(
        err?.response?.data?.message ||
          err.message ||
          "Failed to initialize holding window.",
      );
    }
  };

  const handleFinalizeBookingDatabaseInsertion = async (
    paymentIntentId: string,
  ) => {
    if (!activeLockId) return;

    bookingMutation.mutate(
      {
        lock_id: activeLockId,
        payment_transaction_id: paymentIntentId,
        payment_status: "paid",
        status: "confirmed",
      },
      {
        onSuccess: () => {
          toast.success("Appointment successfully confirmed and saved!");
          setIsPaymentModalOpen(false);
          handleGlobalWizardReset();
          router.push(
            `/dashboard/bookings/success?session_id=${paymentIntentId}`,
          );
        },
        onError: (err: any) => {
          toast.error(
            err?.message ||
              "Failed to finalize database records after payment.",
          );
        },
      },
    );
  };

  const handleGlobalWizardReset = () => {
    setIsDialogOpen(false);
    setCurrentStep("services");
    setSelectedServices([]);
    setSelectedMultipliers({});
    setSelectedQuantities({});
    setSelectedEmployee(null);
    setIsNoPreference(true);
    setSelectedSlot("");
    setIsRedirectingToStripe(false);
  };

  const isMutationLoading =
    lockMutation.isPending ||
    checkoutMutation.isPending ||
    bookingMutation.isPending ||
    isRedirectingToStripe;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* ─── MAIN SERVICES DISPLAY DASHBOARD ─── */}
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

        <div className="grid grid-cols-1 gap-4">
          {filteredDashboardServices.map((service) => (
            <div
              key={service._id}
              className="flex items-center w-full justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider bg-purple-50 px-2 py-0.5 rounded-md">
                    {service.category}
                  </span>
                  {service.inventory !== undefined && service.inventory > 0 && (
                    <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Layers className="w-2.5 h-2.5" /> Total Stock:{" "}
                      {service.inventory}
                    </span>
                  )}
                </div>
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
        onOpenChange={(v) =>
          !v && !isMutationLoading && handleGlobalWizardReset()
        }>
        <DialogContent className="min-w-5xl p-0 overflow-hidden bg-[#F9F9F9] rounded-3xl border-none flex flex-col md:flex-row h-[90vh] max-h-[720px] shadow-2xl">
          {/* Left Panel Step Canvas */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                {currentStep !== "services" &&
                currentStep !== "confirm" &&
                !isMutationLoading ? (
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
                    Checkout
                  </span>
                </nav>
              </div>

              {/* STEP 1: SERVICES CONFIGURATION */}
              {currentStep === "services" && (
                <div className="space-y-4 pt-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900">
                      Select services
                    </h2>
                    <p className="text-xs text-slate-400">
                      Configure your booking timeline intervals scaling directly
                      from the base service settings.
                    </p>
                  </div>
                  <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                    {services.map((item) => {
                      const isChecked = selectedServices.some(
                        (s) => s._id === item._id,
                      );
                      const currentMult = selectedMultipliers[item._id] || 1;
                      const hasInventory =
                        item.inventory !== undefined && item.inventory > 0;

                      return (
                        <div
                          key={item._id}
                          className={cn(
                            "p-4 bg-white border rounded-2xl flex flex-col gap-4 transition-all",
                            isChecked
                              ? "border-primary shadow-sm"
                              : "border-slate-100",
                          )}>
                          <div
                            onClick={() => handleToggleServiceSelection(item)}
                            className="flex items-center justify-between cursor-pointer">
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-sm text-slate-900">
                                {item.name}
                              </h4>
                              <p className="text-xs text-slate-400">
                                Base: {item.base_duration} mins •{" "}
                                {item.category}
                              </p>
                              <div className="flex items-center gap-2 pt-1">
                                <p className="text-xs font-extrabold text-slate-900">
                                  AUD {item.base_price} / block
                                </p>
                                {hasInventory && (
                                  <span className="text-[10px] text-amber-600 bg-amber-50 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    <Layers className="w-2.5 h-2.5" /> Max
                                    Stock: {item.inventory}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div
                              className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center border transition-all",
                                isChecked
                                  ? "bg-primary border-primary text-white"
                                  : "border-slate-200",
                              )}>
                              {isChecked ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Plus className="w-3 h-3 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {isChecked && (
                            <div className="border-t border-slate-100 pt-3 space-y-3.5">
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                  <Timer className="w-3 h-3" /> Choose Duration
                                  Block:
                                </label>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {[1, 2, 3, 4].map((multiplierValue) => {
                                    const calculatedMins =
                                      item.base_duration * multiplierValue;
                                    return (
                                      <button
                                        type="button"
                                        key={multiplierValue}
                                        onClick={() =>
                                          handleSelectMultiplier(
                                            item._id,
                                            multiplierValue,
                                          )
                                        }
                                        className={cn(
                                          "py-2 px-1 text-[11px] font-bold rounded-xl border text-center transition-all whitespace-nowrap overflow-hidden text-ellipsis",
                                          currentMult === multiplierValue
                                            ? "bg-black text-white border-black shadow-sm"
                                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100",
                                        )}>
                                        {formatDurationLabel(calculatedMins)}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: PROFESSIONAL SELECTION */}
              {currentStep === "professionals" && (
                <div className="space-y-4 pt-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900">
                      Select professional
                    </h2>
                    <p className="text-xs text-slate-400">
                      Pick an assigned specialist or proceed with standard
                      maximum availability open parameters.
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
                          ? "border-primary ring-1 ring-primary"
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
                            Optimizes calendar open slot metrics automatically
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
                              ? "border-primary ring-1 ring-primary"
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

              {/* STEP 3: DATE & TIME TRACK MATRIX */}
              {currentStep === "time" && (
                <div className="space-y-4 pt-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900">
                      Select date and time
                    </h2>
                    <p className="text-xs text-slate-400">
                      Appointments can be configured up to one week in advance.
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
                          disabled={isMutationLoading}
                          onClick={() => {
                            setSelectedDate(day);
                            setSelectedSlot("");
                          }}
                          className={cn(
                            "flex flex-col items-center justify-center p-2.5 w-14 rounded-xl border transition-all shrink-0",
                            isSameDay
                              ? "bg-primary border-primary text-white shadow-sm"
                              : "bg-white border-slate-200 text-slate-800 hover:border-slate-300 disabled:opacity-50",
                          )}>
                          <span className="text-[9px] font-bold opacity-80 uppercase">
                            {format(day, "EEE")}
                          </span>
                          <span className="text-base font-black">
                            {" "}
                            {format(day, "d")}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-3.5 bg-slate-100/60 rounded-2xl border border-slate-200/40 flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500">
                      Total Pipeline Duration:
                    </span>
                    <span className="font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-primary" />{" "}
                      {formatDurationLabel(finalDuration)}
                    </span>
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
                      <div className="grid grid-cols-4 gap-2 max-h-[190px] overflow-y-auto pr-1">
                        {slotsData.available_slots.map((slot) => (
                          <button
                            key={slot}
                            disabled={isMutationLoading}
                            onClick={() => {
                              setSelectedSlot(slot);
                              selectedServices.forEach((s) => {
                                if (!selectedQuantities[s._id]) {
                                  setSelectedQuantities((prev) => ({
                                    ...prev,
                                    [s._id]: 1,
                                  }));
                                }
                              });
                            }}
                            className={cn(
                              "text-center py-2 px-1 rounded-xl text-xs font-bold transition-all border",
                              selectedSlot === slot
                                ? "bg-primary border-primary text-white shadow-sm"
                                : "bg-white border-slate-100 text-slate-700 hover:border-slate-300 disabled:opacity-50",
                            )}>
                            {formatDate(slot, "h:mm a")}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-destructive text-center py-6 bg-red-50 border border-red-100 rounded-2xl font-medium italic">
                        No openings or hours assigned for this specific day.
                      </p>
                    )}
                  </div>

                  {/* Contextual Asset Stock Controller */}
                  {selectedSlot &&
                    selectedServices.some(
                      (s) => s.inventory !== undefined && s.inventory > 0,
                    ) && (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          Configure Quantities for Selected Time
                        </span>
                        {selectedServices.map((item) => {
                          if (
                            item.inventory === undefined ||
                            item.inventory <= 0
                          )
                            return null;
                          const currentQty = selectedQuantities[item._id] || 1;

                          return (
                            <div
                              key={item._id}
                              className="flex items-center justify-between border border-dashed border-slate-200 bg-white p-3 rounded-xl shadow-sm">
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-slate-800 block">
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Layers className="w-3 h-3 text-slate-400" />{" "}
                                  Max Available Stock: {item.inventory}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  disabled={
                                    currentQty <= 1 || isMutationLoading
                                  }
                                  onClick={() =>
                                    handleUpdateQuantity(
                                      item._id,
                                      -1,
                                      item.inventory,
                                    )
                                  }
                                  className="w-7 h-7 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40">
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-sm font-black text-slate-900 w-4 text-center">
                                  {currentQty}
                                </span>
                                <button
                                  type="button"
                                  disabled={
                                    currentQty >= (item.inventory || 1) ||
                                    isMutationLoading
                                  }
                                  onClick={() =>
                                    handleUpdateQuantity(
                                      item._id,
                                      1,
                                      item.inventory,
                                    )
                                  }
                                  className="w-7 h-7 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40">
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
              )}
            </div>

            {currentStep !== "confirm" && (
              <Button
                variant="ghost"
                disabled={isMutationLoading}
                onClick={handleGlobalWizardReset}
                className="text-xs text-slate-400 hover:text-slate-600 mt-4 justify-start w-fit p-0 h-auto font-medium disabled:opacity-40">
                Cancel Registration
              </Button>
            )}
          </div>

          {/* Right Sidebar Breakdown Panel Summary Canvas */}
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
                    <p className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" />{" "}
                      {services[0]?.business_id?.location?.split(",")[0]},{" "}
                      {services[0]?.business_id?.location?.split(",")[1]}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Selected Treatments
                  </span>

                  {selectedServices.length > 0 ? (
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {selectedServices.map((srv) => {
                        const mult = selectedMultipliers[srv._id] || 1;
                        const qty = selectedQuantities[srv._id] || 1;
                        return (
                          <div
                            key={srv._id}
                            className="flex justify-between items-start text-xs border-b border-slate-50 pb-2">
                            <div>
                              <h5 className="font-bold text-slate-900">
                                {srv.name}
                              </h5>
                              <p className="text-[10px] text-slate-400 mt-0.5 flex flex-col gap-0.5">
                                <span>
                                  Duration:{" "}
                                  {formatDurationLabel(
                                    srv.base_duration * mult,
                                  )}
                                </span>
                                {qty > 1 && (
                                  <span className="text-primary font-bold">
                                    Units: ×{qty}
                                  </span>
                                )}
                              </p>
                            </div>
                            <span className="font-bold text-slate-900">
                              AUD {srv.base_price * mult * qty}
                            </span>
                          </div>
                        );
                      })}
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
                        {format(selectedDate, "eeee, MMM dd")} at{" "}
                        {formatDate(selectedSlot, "h:mm a")}
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
                    isMutationLoading
                  }
                  onClick={handleNextStep}
                  className={cn(
                    "w-full font-bold text-xs h-12 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all",
                    currentStep === "time"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-black hover:bg-slate-900 text-white",
                  )}>
                  {isMutationLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>
                        {bookingMutation.isPending
                          ? "Securing appointment..."
                          : "Processing secure hold..."}
                      </span>
                    </div>
                  ) : (
                    <>
                      {currentStep === "time" ? (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Pay Now & Confirm</span>
                        </>
                      ) : (
                        <>
                          <span>Continue</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL BASED CHECKOUT PORTAL INSERTION ─── */}
      {isPaymentModalOpen && activeLockId && (
        <BookingCheckout
          lockId={activeLockId}
          price={calculatedPrice}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={(paymentIntentId) => {
            handleFinalizeBookingDatabaseInsertion(paymentIntentId);
          }}
        />
      )}
    </div>
  );
}
