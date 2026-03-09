"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ja, enUS } from "date-fns/locale";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Calendar } from "./calendar";

interface DatePickerProps {
  name: string;
  locale: string;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  name,
  locale,
  placeholder = "Select a date",
  className = "",
}: DatePickerProps) {
  const [date, setDate] = useState<Date | undefined>();
  const [open, setOpen] = useState(false);

  const dateLocale = locale === "ja" ? ja : enUS;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex w-full items-center rounded-[1rem] border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_48%,transparent)] px-4 py-3 text-left transition-colors focus:border-[var(--accent-amber1)] focus:outline-none ${className}`}
        >
          <span className={date ? "text-[var(--text-base)]" : "text-[var(--text-base-30)]"}>
            {date ? format(date, "PPP", { locale: dateLocale }) : placeholder}
          </span>
          <svg
            className="ml-auto h-4 w-4 text-[var(--text-base-40)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            setDate(d);
            setOpen(false);
          }}
          locale={dateLocale}
          disabled={{ before: new Date() }}
        />
      </PopoverContent>
      <input
        type="hidden"
        name={name}
        value={date ? date.toISOString().split("T")[0] : ""}
      />
    </Popover>
  );
}
