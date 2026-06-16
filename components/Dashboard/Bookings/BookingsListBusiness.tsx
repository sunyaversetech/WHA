import React, { useState } from "react";
import {
  Eye,
  Calendar,
  Clock,
  DollarSign,
  User,
  ShieldCheck,
} from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  payment_status: "pending" | "paid" | "failed";
  status: "confirmed" | "pending" | "cancelled";
  is_reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  __v: number;
}

interface BookingsTableProps {
  bookings: Booking[];
}

export default function BookingsTable({ bookings }: BookingsTableProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Helper to format ISO strings cleanly
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
            {bookings.map((booking) => {
              const startInfo = formatDateTime(booking.start_time);
              return (
                <TableRow
                  key={booking._id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                    {booking.service_id.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage
                          src={booking.employee_id.employee_photo}
                          alt={booking.employee_id.full_name}
                        />
                        <AvatarFallback className="text-xs uppercase">
                          {booking.employee_id.full_name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="capitalize text-sm">
                        {booking.employee_id.full_name}
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
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
                        booking.status === "confirmed"
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900"
                          : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-900"
                      }`}>
                      {booking.status}
                    </span>
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
            })}
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
              {/* Main Service Banner */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex justify-between items-start">
                <div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {selectedBooking.service_id.category}
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-slate-50 mt-1.5">
                    {selectedBooking.service_id.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 italic">
                    {selectedBooking.service_id.description}
                  </p>
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

              {/* Data Specifics Grid */}
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

              {/* Identity Details */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Assignment Profile
                </h5>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={selectedBooking.employee_id.employee_photo}
                      />
                      <AvatarFallback className="uppercase font-bold">
                        {selectedBooking.employee_id.full_name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-bold capitalize text-slate-900 dark:text-slate-100">
                        {selectedBooking.employee_id.full_name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {selectedBooking.employee_id.email}
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
                        {selectedBooking.user_id.slice(-6)}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      Reminders:{" "}
                      <span className="font-semibold">
                        {selectedBooking.is_reminder_sent ? "Sent" : "Inactive"}
                      </span>
                    </span>
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
