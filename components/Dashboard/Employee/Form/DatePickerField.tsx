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

// ─── Dark-themed day button ───────────────────────────────────────────────────

function DarkDayButton({
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
        "inline-flex w-full items-center justify-center rounded-full text-sm font-normal text-white transition-colors",
        "aspect-square min-w-8 p-0",
        "hover:bg-[#2a2a2a]",
        modifiers.today && !modifiers.selected && "ring-1 ring-[#555]",
        modifiers.outside && "text-gray-600 opacity-40",
        modifiers.disabled && "cursor-not-allowed text-gray-600 opacity-30",
        modifiers.selected &&
          "bg-[#6B5CE7] text-white hover:bg-[#5b4dd6]",
        className,
      )}
      {...props}
    />
  );
}

// ─── DatePickerField ──────────────────────────────────────────────────────────

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
            className="h-11 w-full cursor-pointer rounded-lg border border-[#2a2a2a] bg-[#1c1c1c] px-3 pr-10 text-base text-white outline-none placeholder:text-gray-600 focus:border-[#444] md:text-sm"
          />
        </PopoverTrigger>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-gray-400 transition-colors hover:text-white">
            <X size={14} />
          </button>
        )}
      </div>

      <PopoverContent
        className="w-auto border border-[#2a2a2a] bg-[#1a1a1a] p-0 shadow-2xl"
        align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(d) => {
            onChange(d ?? null);
            setOpen(false);
          }}
          className="bg-transparent text-white"
          components={{ DayButton: DarkDayButton }}
          classNames={{
            caption_label: "text-sm font-semibold text-white",
            weekday: "text-[0.75rem] font-normal text-gray-500",
            today: "rounded-full",
            button_previous:
              "inline-flex size-8 items-center justify-center rounded-full p-0 text-gray-400 transition-colors hover:bg-[#2a2a2a] hover:text-white aria-disabled:opacity-30",
            button_next:
              "inline-flex size-8 items-center justify-center rounded-full p-0 text-gray-400 transition-colors hover:bg-[#2a2a2a] hover:text-white aria-disabled:opacity-30",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
