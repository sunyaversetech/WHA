"use client";

import { useEffect, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

function LightDayButton({
  day,
  modifiers,
  className,
  ...props
}: React.ComponentProps<typeof CalendarDayButton>) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex w-full items-center justify-center rounded-full text-sm font-normal transition-colors",
        "aspect-square min-w-8 p-0",
        "text-[#051e3a] hover:bg-gray-100",
        modifiers.today && !modifiers.selected && "ring-1 ring-[#051e3a]",
        modifiers.outside && "text-gray-400 opacity-50",
        modifiers.disabled && "cursor-not-allowed text-gray-300 opacity-30",
        modifiers.selected &&
          "bg-[#051e3a] text-white hover:bg-[#051e3a]/90",
        className,
      )}
      {...props}
    />
  );
}

export function DatePickerField({
  value,
  onChange,
  placeholder = "Select date",
  className,
}: {
  value: Date | null;
  onChange: (d: Date | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const formatted = value
    ? value.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative", className)}>
        <PopoverTrigger asChild>
          <input
            readOnly
            value={formatted}
            placeholder={placeholder}
            className="h-11 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 pr-10 text-base text-[#051e3a] outline-none placeholder:text-gray-400 focus:border-[#051e3a] md:text-sm"
          />
        </PopoverTrigger>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-gray-400 transition-colors hover:text-[#051e3a]">
            <X size={14} />
          </button>
        )}
      </div>

      <PopoverContent
        className="w-auto border border-gray-200 bg-white p-0 shadow-lg"
        align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(d) => {
            onChange(d ?? null);
            setOpen(false);
          }}
          className="bg-transparent text-[#051e3a]"
          components={{ DayButton: LightDayButton }}
          classNames={{
            caption_label: "text-sm font-semibold text-[#051e3a]",
            weekday: "text-[0.75rem] font-normal text-gray-400",
            today: "rounded-full",
            button_previous:
              "inline-flex size-8 items-center justify-center rounded-full p-0 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#051e3a] aria-disabled:opacity-30",
            button_next:
              "inline-flex size-8 items-center justify-center rounded-full p-0 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#051e3a] aria-disabled:opacity-30",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
