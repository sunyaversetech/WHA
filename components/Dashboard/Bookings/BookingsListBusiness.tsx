"use client";

import React, { useState } from "react";
import {
  Eye,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// Shadcn UI components mapping
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Import your booking status mutation hook
import {
  BookingType,
  useUpdateBookingStatus,
} from "@/services/booking.service";

export interface ServiceId {
  _id: string;
  business_id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  base_duration: number;
  assigned_employees: string[];
  is_active: boolean;
  buffer_time: number;
  created_at: string;
  updated_at: string;
  __v: number;
}

export interface AvailabilitySchedule {
  day_of_week: string;
  is_working: boolean;
  shift_start: string;
  shift_end: string;
  _id: string;
}

export interface ServiceOverride {
  service_id: string;
  _id: string;
}

export interface EmployeeId {
  _id: string;
  business_id: string;
  full_name: string;
  email: string;
  service_overrides: ServiceOverride[];
  availability_schedule: AvailabilitySchedule[];
  employee_photo: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  __v: number;
}

export interface Booking {
  _id: string;
  business_id: string;
  user_id: string;
  service_id: ServiceId;
  employee_id: EmployeeId;
  start_time: string;
  end_time: string;
  duration: number;
  total_price: number;
  currency: string;
  payment_status: "unpaid" | "pending" | "paid" | "refunded" | "failed";
  status:
    | "pending"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "no_show"
    | "refunded";
  is_reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  __v: number;
}

interface BookingsTableProps {
  bookings: Booking[];
}

export default function BookingsTable({
  bookings,
}: {
  bookings: BookingType[];
}) {
  const [selectedBooking, setSelectedBooking] = useState<BookingType | null>(
    null,
  );
  const queryClient = useQueryClient();

  const { mutate: updateStatus, isPending: isUpdating } =
    useUpdateBookingStatus();

  const statusStyles: Record<string, string> = {
    pending:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
    confirmed:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
    completed:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900",
    cancelled:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900",
    no_show:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900",
    refunded:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-900",
  };

  const handleStatusChange = (bookingId: string, newStatus: string) => {
    updateStatus(
      {
        bookingId: bookingId,
        newStatus: newStatus,
        notes: "Status updated from dashboard table viewport.",
      },
      {
        onSuccess: (response: any) => {
          toast.success(`Booking status changed to ${newStatus}`);
          queryClient.invalidateQueries({ queryKey: ["businessbookings"] });

          if (selectedBooking?._id === bookingId) {
            setSelectedBooking((prev) =>
              prev ? { ...prev, status: newStatus as any } : null,
            );
          }
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message ||
              "Failed to alter state machine entry",
          );
        },
      },
    );
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  return (
    <div className="w-full space-y-4">
      <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Service</TableHead>
              <TableHead className="font-semibold">Employee</TableHead>
              <TableHead className="font-semibold">Date & Time</TableHead>
              <TableHead className="font-semibold">Duration</TableHead>
              <TableHead className="font-semibold">Price</TableHead>
              <TableHead className="font-semibold">Payment</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-right font-semibold">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground">
                  No business configuration bookings located.
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => {
                const startInfo = formatDateTime(booking.start_time);
                return (
                  <TableRow
                    key={booking._id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                      {booking.service_id?.name || "Deleted Service"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage
                            src={booking?.employee_id?.employee_photo}
                            alt={booking?.employee_id?.full_name}
                          />
                          <AvatarFallback className="text-xs uppercase">
                            {booking?.employee_id?.full_name
                              ? booking?.employee_id?.full_name.slice(0, 2)
                              : "N/A"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="capitalize text-sm font-semibold">
                          {booking?.employee_id?.full_name ?? "Unassigned"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                      <div>{startInfo.date}</div>
                      <div className="text-xs text-slate-400">
                        {startInfo.time}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {booking.duration} mins
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {booking.currency} {booking.total_price}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
                          booking.payment_status === "paid"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900"
                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900"
                        }`}>
                        {booking.payment_status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {/* Interactive Dropdown State Picker */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isUpdating}
                            className={`h-7 px-2 text-xs font-medium border rounded-full capitalize gap-1 ${
                              statusStyles[booking.status] ||
                              statusStyles.pending
                            }`}>
                            {isUpdating ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                {booking.status}
                                <ChevronDown className="h-3 w-3 opacity-50" />
                              </>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(booking._id, "pending")
                            }>
                            Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(booking._id, "confirmed")
                            }>
                            Confirmed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(booking._id, "completed")
                            }>
                            Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(booking._id, "cancelled")
                            }>
                            Cancelled
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(booking._id, "no_show")
                            }>
                            No Show
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(booking._id, "refunded")
                            }>
                            Refunded
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                        onClick={() => setSelectedBooking(booking)}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View Details</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog Modals */}
      <Dialog
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}>
        {selectedBooking && (
          <DialogContent className="sm:max-w-[480px] p-6 gap-6">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight">
                Booking Specifications
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 font-mono">
                ID: {selectedBooking._id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex justify-between items-start">
                <div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {selectedBooking.service_id?.category || "N/A"}
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-slate-50 mt-1.5">
                    {selectedBooking.service_id?.name ||
                      "Deleted Configuration"}
                  </h4>
                  {selectedBooking.service_id?.description && (
                    <p className="text-xs text-slate-400 mt-1 italic">
                      {selectedBooking.service_id.description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 uppercase tracking-wide">
                    Total Price
                  </div>
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                    {selectedBooking.currency} {selectedBooking.total_price}
                  </div>
                </div>
              </div>

              {/* Status State Row Inside Modal */}
              <div className="flex items-center justify-between text-sm px-1">
                <span className="text-slate-400 font-medium">
                  Lifecycle Status
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                    statusStyles[selectedBooking.status] || statusStyles.pending
                  }`}>
                  {selectedBooking.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Calendar className="h-3.5 w-3.5" /> Appointment Date
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDateTime(selectedBooking.start_time).date}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Clock className="h-3.5 w-3.5" /> Allocation Window
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDateTime(selectedBooking.start_time).time} -{" "}
                    {formatDateTime(selectedBooking.end_time).time}
                  </div>
                  <div className="text-xs text-slate-400">
                    ({selectedBooking.duration} minutes)
                  </div>
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Assignment Profile
                </h5>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={selectedBooking?.employee_id?.employee_photo}
                      />
                      <AvatarFallback className="uppercase font-bold">
                        {selectedBooking?.employee_id?.full_name?.slice(0, 2) ||
                          "NA"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-bold capitalize text-slate-900 dark:text-slate-100">
                        {selectedBooking?.employee_id?.full_name ||
                          "Unassigned"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {selectedBooking?.employee_id?.email ||
                          "No email profile"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      Client ID:{" "}
                      <span className="font-mono bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded">
                        {selectedBooking.user_id
                          ? selectedBooking.user_id.slice(-6)
                          : "N/A"}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                    {/* <span>
                      Reminders:{" "}
                      <span className="font-semibold">
                        {selectedBooking.is_reminder_sent ? "Sent" : "Inactive"}
                      </span>
                    </span> */}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
