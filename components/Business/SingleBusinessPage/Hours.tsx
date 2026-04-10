import React, { useState } from "react";
import { ChevronDown, ChevronUp, Clock } from "lucide-react"; // Assuming lucide-react for icons

interface ScheduleEntry {
  day: string;
  isOpen: boolean;
  openTime: string; // Format "HH:mm"
  closeTime: string; // Format "HH:mm"
  _id: string;
}

export interface BusinessHoursData {
  is24_7: boolean;
  schedule: ScheduleEntry[];
}

interface BusinessHoursProps {
  hours?: BusinessHoursData;
  className?: string;
  open?: boolean;
}

const formatTime = (time: string): string => {
  const [hourStr, minute] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
};

const BusinessHours: React.FC<BusinessHoursProps> = ({
  hours,
  className,
  open,
}) => {
  const [isOpen, setIsOpen] = useState(open ? open : false);

  if (!hours || !hours.schedule || hours.schedule.length === 0) {
    return <p className={className}>Hours not available</p>;
  }

  const dayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const todayName = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(new Date());
  const todayEntry = hours.schedule.find((s) => s.day === todayName);

  const getStatusMessage = () => {
    if (hours.is24_7)
      return <span className="text-green-600 font-medium">Open 24/7</span>;
    if (!todayEntry || !todayEntry.isOpen)
      return <span className="text-red-600 font-medium">Closed today</span>;

    const now = new Date();
    const [openH, openM] = todayEntry.openTime.split(":").map(Number);
    const [closeH, closeM] = todayEntry.closeTime.split(":").map(Number);

    const openDate = new Date();
    openDate.setHours(openH, openM, 0);

    const closeDate = new Date();
    closeDate.setHours(closeH, closeM, 0);

    if (now < openDate) {
      return (
        <span className="text-orange-700 font-medium">
          Closed{" "}
          <span className="text-gray-500 font-normal">
            — opens soon at {formatTime(todayEntry.openTime)}
          </span>
        </span>
      );
    } else if (now >= openDate && now < closeDate) {
      return (
        <span className="text-green-600 font-medium">
          Open now{" "}
          <span className="text-gray-500 font-normal">
            — closes at {formatTime(todayEntry.closeTime)}
          </span>
        </span>
      );
    } else {
      return <span className="text-red-600 font-medium">Closed</span>;
    }
  };

  return (
    <div className={`max-w-sm ${className}`}>
      <button
        disabled={open}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full hover:bg-gray-50 p-1 rounded-md transition-colors">
        <Clock className="w-5 h-5 text-gray-700" />
        <div className="flex-1 text-left text-sm">{getStatusMessage()}</div>
        {isOpen && !open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3 pl-1">
          {dayOrder.map((day) => {
            const entry = hours.schedule.find((s) => s.day === day);
            const isToday = day === todayName;

            return (
              <div
                key={day}
                className={`flex items-center justify-between text-sm ${isToday ? "font-bold text-gray-900" : "text-gray-700"}`}>
                <div className="flex items-center gap-3">
                  {/* Status Dot */}
                  <div
                    className={`w-3 h-3 rounded-full ${entry?.isOpen ? "bg-green-500" : "bg-gray-200"}`}
                  />
                  <span className="w-24">{day}</span>
                </div>

                <div className="flex-1 text-right tabular-nums">
                  {entry?.isOpen
                    ? `${formatTime(entry.openTime)} – ${formatTime(entry.closeTime)}`
                    : "Closed"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BusinessHours;
