import React from "react";

interface ScheduleEntry {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  _id: string;
}

export interface BusinessHoursData {
  is24_7: boolean;
  schedule: ScheduleEntry[];
}

interface BusinessHoursProps {
  hours?: BusinessHoursData;
  className?: string;
}

const formatTime = (time: string): string => {
  const [hourStr, minute] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return minute === "00" ? `${hour} ${ampm}` : `${hour}:${minute} ${ampm}`;
};

const formatBusinessHours = (hoursData?: BusinessHoursData): string[] => {
  if (hoursData?.is24_7) {
    return ["Open 24 hours"];
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

  const scheduleMap = new Map<string, ScheduleEntry>();
  hoursData?.schedule.forEach((entry) => {
    scheduleMap.set(entry.day, entry);
  });

  const groups: Array<{
    startDay: string;
    endDay: string;
    open: string;
    close: string;
  }> = [];
  let currentGroup: null | {
    startDay: string;
    endDay: string;
    open: string;
    close: string;
  } = null;

  for (const day of dayOrder) {
    const entry = scheduleMap.get(day);

    if (entry && entry.isOpen) {
      const open = entry.openTime;
      const close = entry.closeTime;
      const timesKey = `${open}-${close}`;

      if (
        currentGroup &&
        currentGroup.open === open &&
        currentGroup.close === close
      ) {
        currentGroup.endDay = day;
      } else {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = { startDay: day, endDay: day, open, close };
      }
    } else {
      if (currentGroup) {
        groups.push(currentGroup);
        currentGroup = null;
      }
    }
  }

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups.map((group) => {
    const openFormatted = formatTime(group.open);
    const closeFormatted = formatTime(group.close);
    const days =
      group.startDay === group.endDay
        ? group.startDay
        : `${group.startDay} – ${group.endDay}`;
    return `${days}: ${openFormatted} – ${closeFormatted}`;
  });
};

const BusinessHours: React.FC<BusinessHoursProps> = ({ hours, className }) => {
  const formattedHours = formatBusinessHours(hours);

  if (formattedHours.length === 0) {
    return <p className={className}>Hours not available</p>;
  }

  return (
    <div className={className}>
      {formattedHours.map((line, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "4px",
          }}>
          <span style={{ minWidth: "140px", fontWeight: 500 }}>
            {line.split(":")[0]}:
          </span>
          <span>{line.split(":").slice(1).join(":").trim()}</span>
        </div>
      ))}
    </div>
  );
};

export default BusinessHours;
